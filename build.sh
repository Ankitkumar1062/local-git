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
set +e

export NVM_DIR="$HOME/.nvm"
# Try to load existing nvm silently
if ! command -v nvm &> /dev/null && [ -s "$NVM_DIR/nvm.sh" ]; then
    echo "Loading NVM environment..."
    \. "$NVM_DIR/nvm.sh"
fi

if command -v nvm &> /dev/null; then
    echo "NVM found. Syncing Node.js version..."
    nvm install >/dev/null 2>&1 || nvm use >/dev/null 2>&1
else
    echo "NVM is missing. Installing specifically for this environment..."
    if command -v curl &> /dev/null; then
        curl -s -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash >/dev/null 2>&1
        source ~/.bashrc 2>/dev/null || true
        \. "$NVM_DIR/nvm.sh"
        echo "NVM installed successfully. Bootstrapping Node.js..."
        nvm install >/dev/null 2>&1 || nvm use >/dev/null 2>&1
    else
        echo "Error: curl is required but not installed."
        exit 1
    fi
fi

# Final safeguard check before continuing
if ! command -v npm &> /dev/null; then
    echo "NVM initialization failed. Falling back to native system installation of Node.js 22.x..."
    if command -v apt &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - >/dev/null 2>&1
        sudo apt install -y nodejs >/dev/null 2>&1
    else
        echo "FATAL: Could not install Node.js automatically."
        exit 1
    fi
fi

# Absolute final check
if ! command -v npm &> /dev/null; then
    echo "FATAL: Completely failed to install Node.js."
    exit 1
fi

# Re-enable strict error checking
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
