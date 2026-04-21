#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log() {
    echo "[build.sh] $*"
}

warn() {
    echo "[build.sh] WARNING: $*"
}

install_base_tools_if_possible() {
    if command -v apt >/dev/null 2>&1; then
        log "Ensuring base tools are present (curl, build-essential, git)..."
        sudo apt update || true
        sudo apt install -y curl build-essential git
    fi
}

load_or_install_nvm() {
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

    # nvm.sh internally uses unset variables, which crashes under `set -u`.
    # Temporarily relax nounset for all nvm operations.
    set +u

    if [ -s "$NVM_DIR/nvm.sh" ]; then
        # shellcheck source=/dev/null
        . "$NVM_DIR/nvm.sh"
        set -u
        return
    fi

    if ! command -v curl >/dev/null 2>&1; then
        set -u
        warn "curl is missing; cannot auto-install nvm."
        return
    fi

    log "nvm not found, installing nvm v0.39.7..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

    if [ -s "$NVM_DIR/nvm.sh" ]; then
        # shellcheck source=/dev/null
        . "$NVM_DIR/nvm.sh"
    fi

    set -u
}

ensure_node_version() {
    load_or_install_nvm

    # nvm is a shell function, not a binary — use `type` instead of `command -v`.
    # Also disable nounset around nvm calls since nvm uses unset variables.
    set +u
    if type nvm >/dev/null 2>&1; then
        log "Installing/using Node version from .nvmrc..."
        nvm install
        nvm use
    else
        warn "nvm is unavailable. Ensure Node >= 22.13.0 is installed manually."
    fi
    set -u

    if ! command -v node >/dev/null 2>&1; then
        echo "Node.js is required but not installed."
        exit 1
    fi

    log "Using Node $(node -v) and npm $(npm -v)"
}

install_dependencies() {
    if [ -f package-lock.json ]; then
        log "package-lock.json found, running npm ci..."
        npm ci
    else
        log "package-lock.json not found, running npm install..."
        npm install
    fi
}

ensure_env_file() {
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            log "Creating .env from .env.example..."
            cp .env.example .env
        else
            warn ".env.example missing, creating minimal .env..."
            cat > .env <<'EOF'
DATABASE_URL=postgresql://wit:wit@localhost:5432/wit
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
REPOS_DIR=./repos
EOF
        fi
    else
        log ".env already exists, keeping existing values."
    fi

    if grep -q '^BETTER_AUTH_SECRET=your-secret-key-here-change-in-production' .env; then
        log "Generating BETTER_AUTH_SECRET for local development..."
        if command -v openssl >/dev/null 2>&1; then
            secret="$(openssl rand -base64 32 | tr -d '\n')"
            sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=${secret}|" .env
        else
            warn "openssl not found; please set BETTER_AUTH_SECRET manually in .env"
        fi
    fi
}

ensure_frontend_env_files() {
    if [ -f apps/web/.env.example ] && [ ! -f apps/web/.env ]; then
        log "Creating apps/web/.env from example..."
        cp apps/web/.env.example apps/web/.env
    fi

    if [ -f apps/admin/.env.example ] && [ ! -f apps/admin/.env ]; then
        log "Creating apps/admin/.env from example..."
        cp apps/admin/.env.example apps/admin/.env
    fi
}

extract_database_settings() {
    local db_url
    db_url="$(grep -E '^DATABASE_URL=' .env | head -n 1 | cut -d '=' -f2- || true)"

    if [ -z "${db_url}" ]; then
        db_url='postgresql://wit:wit@localhost:5432/wit'
        echo "DATABASE_URL=${db_url}" >> .env
    fi

    if [[ "$db_url" =~ ^postgres(ql)?://([^:/@]+)(:([^@/]*))?@([^:/]+)(:([0-9]+))?/([^?]+) ]]; then
        DB_USER="${BASH_REMATCH[2]}"
        DB_PASSWORD="${BASH_REMATCH[4]}"
        DB_HOST="${BASH_REMATCH[5]}"
        DB_PORT="${BASH_REMATCH[7]:-5432}"
        DB_NAME="${BASH_REMATCH[8]}"
    else
        warn "Could not parse DATABASE_URL. Skipping automatic DB role/database creation."
        DB_USER=""
        DB_PASSWORD=""
        DB_HOST=""
        DB_PORT=""
        DB_NAME=""
    fi
}

run_psql_query() {
    local query="$1"
    if command -v sudo >/dev/null 2>&1; then
        sudo -u postgres psql -tAc "$query"
    else
        psql -U postgres -tAc "$query"
    fi
}

run_psql_command() {
    local query="$1"
    if command -v sudo >/dev/null 2>&1; then
        sudo -u postgres psql -c "$query"
    else
        psql -U postgres -c "$query"
    fi
}

ensure_postgres_installed() {
    if command -v psql >/dev/null 2>&1; then
        return
    fi

    if command -v apt >/dev/null 2>&1; then
        log "Installing PostgreSQL..."
        sudo apt update || true
        sudo apt install -y postgresql postgresql-client postgresql-contrib
    else
        warn "psql is missing and apt is not available. Install PostgreSQL manually."
        return
    fi
}

start_postgres_if_possible() {
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl start postgresql || true
        sudo systemctl enable postgresql || true
    elif command -v service >/dev/null 2>&1; then
        sudo service postgresql start || true
    fi
}

setup_local_database_if_localhost() {
    extract_database_settings

    if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
        return
    fi

    if [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "127.0.0.1" ]; then
        log "DATABASE_URL points to non-local host ($DB_HOST). Skipping DB user/database creation."
        return
    fi

    ensure_postgres_installed
    if ! command -v psql >/dev/null 2>&1; then
        return
    fi

    start_postgres_if_possible

    local role_exists db_exists escaped_password
    role_exists="$(run_psql_query "SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}';" | tr -d '[:space:]' || true)"
    if [ "$role_exists" != "1" ]; then
        escaped_password="${DB_PASSWORD//\'/\'\'}"
        run_psql_command "CREATE ROLE \"${DB_USER}\" LOGIN PASSWORD '${escaped_password}';"
    else
        log "Role ${DB_USER} already exists."
    fi

    db_exists="$(run_psql_query "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}';" | tr -d '[:space:]' || true)"
    if [ "$db_exists" != "1" ]; then
        run_psql_command "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"
    else
        log "Database ${DB_NAME} already exists."
    fi
}

run_database_migrations() {
    # db:generate can become interactive (rename detection) and block first-time setup.
    # Keep local bootstrap deterministic; allow opt-in migration generation when needed.
    if [ "${RUN_DB_GENERATE:-0}" = "1" ]; then
        log "Generating database migrations (RUN_DB_GENERATE=1)..."
        npm run db:generate
    else
        log "Skipping db:generate for non-interactive local setup (set RUN_DB_GENERATE=1 to enable)."
    fi

    log "Pushing schema to database..."
    npm run db:push

    log "Seeding database (best-effort)..."
    npm run db:seed || warn "db:seed failed; continue if your setup does not require seed data."
}

main() {
    log "Starting post-clone setup for wit/local-git..."

    install_base_tools_if_possible
    ensure_node_version
    install_dependencies

    log "Building project..."
    npm run build

    log "Linking CLI globally..."
    npm link

    ensure_env_file
    ensure_frontend_env_files
    setup_local_database_if_localhost
    run_database_migrations

    log "Setup complete."
    log "You can now run ./run.sh to start backend + web dev servers."
}

main "$@"
