#!/bin/bash

# Exit on error
set -e

echo "Starting build process for local-git..."

echo "0. Installing base system dependencies..."
if command -v apt &> /dev/null; then
    sudo apt update || true
    sudo apt install -y curl build-essential git
fi

# NVM functionality is highly incompatible with set -e strict mode.
# We turn off strict error checking during NVM sourcing and execution.
set +e

# Try to load nvm to ensure the correct Node version
if ! command -v nvm &> /dev/null; then
    echo "nvm not found in PATH. Attempting to load from ~/.nvm/nvm.sh"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

if command -v nvm &> /dev/null; then
    echo "Ensuring correct Node.js version using nvm..."
    # 'nvm install' automatically respects the .nvmrc or .node-version file
    nvm install || nvm use
else
    echo "nvm is not installed. Attempting to install nvm via curl..."
    if command -v curl &> /dev/null; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        echo "nvm installed. Reloading environment..."
        source ~/.bashrc
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

        echo "Ensuring correct Node.js version using newly installed nvm..."
        nvm install || nvm use
    else
        echo "Error: curl is not installed. Cannot automatically install nvm. Please install curl or install nvm manually."
        exit 1
    fi
fi

# Re-enable strict error checking for the rest of the build script
set -e

echo "1. Installing dependencies..."
npm install

echo "2. Building the project..."
npm run build

echo "3. Linking package globally..."
npm link

echo "4. Setting up Environment Variables..."
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Note: A default .env has been created. Please update DATABASE_URL if you are not using a local default Postgres."
else
    echo ".env file already exists, skipping creation."
fi

echo "5. Performing Database Setup..."

# Automatically install PostgreSQL via apt if missing
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Attempting to install via apt..."
    if command -v apt &> /dev/null; then
        sudo apt update || true
        sudo apt install -y postgresql postgresql-contrib
    else
        echo "Error: apt package manager not found. Cannot auto-install PostgreSQL on this OS."
        exit 1
    fi
else
    echo "PostgreSQL is already installed."
fi

echo "Starting PostgreSQL service..."
# Try multiple common start commands just in case (WSL vs native Ubuntu)
sudo service postgresql start || sudo systemctl start postgresql || echo "Warning: Could not start postgres automatically."

echo "Configuring database 'wit' and user 'wit'..."
# Create the user and db required by the default .env configuration
sudo -u postgres psql -c "CREATE USER wit WITH PASSWORD 'wit';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE wit OWNER wit;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER wit CREATEDB;" 2>/dev/null || true
echo "Generating Drizzle database schema..."
npm run db:generate

echo "Pushing schema to the database (Make sure your database is running!)..."
npm run db:push || echo "Warning: db:push failed. Ensure your database is running and DATABASE_URL in .env is correct."

echo "Seeding the database..."
npm run db:seed || echo "Warning: db:seed failed or not necessary."

echo "Build and setup completed successfully!"
