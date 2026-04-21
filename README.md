<div align="center">

# myvcs

**Git that understands your code.**

A Git implementation with AI woven into the workflow — not bolted on.


</div>

---

## Installation & Setup Guide

Welcome to the step-by-step setup and installation guide for `myvcs`! 

We provide utility scripts to get you up and running quickly: `build.sh` for installation and `run.sh` to start the development servers. Alternatively, you can walk through the manual setup.

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (version >= 22.13.0)
- **Git**
- **PostgreSQL** (if you want local database functionality for tracking PRs, issues, or self-hosting)
- Base build tools (e.g., `curl`, `build-essential`)

### Option 1: Automated Setup (Recommended)

You can run the included `build.sh` script to automate all the setup including installing dependencies, setting up the Node version via `nvm`, building the project, generating the `.env` file, and setting up the PostgreSQL database schema locally.

```bash
# 1. Clone the repository
git clone https://github.com/Ankitkumar1062/local-git.git
cd local-git

# 2. Run the build setup script
./build.sh
```

### Option 2: Manual Step-by-Step Setup

If you prefer to set up manually or the script fails, follow these steps:

#### Step 1: Clone the Repository

Clone the project to your local machine:

```bash
git clone https://github.com/Ankitkumar1062/local-git.git
cd local-git
```

#### Step 2: Ensure Correct Node Version

The project uses a strict Node.js version. It is highly recommended to use `nvm` (Node Version Manager) to set it automatically:

```bash
nvm use || nvm install
```

#### Step 3: Install Dependencies

Install all required npm packages cleanly:

```bash
npm ci    # If package-lock.json exists, otherwise flutter back to `npm install`
```

#### Step 4: Configure Environment Variables

The project requires several `.env` files across different parts of the workspace to function (for the API server, database connection, web app, etc.).

For the root workspace:

```bash
cp .env.example .env
```
*Note: Inside your root `.env`, you may need to configure the `DATABASE_URL` (defaults to `postgresql://myvcs:myvcs@localhost:5432/myvcs`), your `BETTER_AUTH_SECRET`, and any AI API keys you wish to use (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `WIT_AI_MODEL` etc).*

For the web frontend:
```bash
cp apps/web/.env.example apps/web/.env
```

For the admin panel:
```bash
cp apps/admin/.env.example apps/admin/.env
```

#### Step 5: Database Setup

If you are running the project locally, set up the database using Drizzle ORM:

```bash
# Push the schema structure to your database
npx drizzle-kit push --force

# (Optional) Seed the database with initial dev data
npm run db:seed
```

#### Step 6: Build the Project & Link CLI

Run the build script to compile TypeScript for both the engine and UI.

```bash
npm run build
```

Link the package globally so you can use your newly built `myvcs` CLI tool globally on your machine:

```bash
npm link
```

Test it by running:
```bash
myvcs --help
```

---

## Running the Servers Locally

The project includes both a backend Git engine server and a frontend web application. 

### Automated Start

To spin up both the frontend UI and the backend backend quickly, use the run script provided:

```bash
./run.sh
```
This starts the backend dev server on `http://localhost:3000` and the web frontend on `http://localhost:5173`. 

### Manual Start 

Alternatively, using NPM commands manually:

```bash
# Start the full stack using defined npm dev commands
npm run dev

# For the CLI server mode alone
npm run serve
```

---

## Using `myvcs`

Now you can start using `myvcs` as a drop-in replacement for or alongside standard git in any directory. 

```bash
# Initialize a new repository
mkdir my-project && cd my-project
myvcs init

# Add files
myvcs add .
myvcs commit -m "Initial commit"

# Or use the AI natively to read the git diff and write the commit message!
myvcs ai commit -a -x
```

*For standard commands,  run `myvcs help` for in-terminal guides.*

---

## Troubleshooting & Common Bug Fixes

During setup, you might encounter some common environmental issues—especially related to background services, binary permissions, and database configurations. If things aren't working as expected, refer to these known fixes.

### 1. Zig Compiler Missing
Some dependencies (like UI modules) require the Zig compiler. If you see errors related to `zig` missing:

**Option 1: The Snap Method (The Quick Way)**
If your Linux environment has snap enabled:
```bash
sudo snap install zig --classic
```
*Note: If you get a "System has not been booted with systemd" error, Snap is not running on your machine. Use Option 2.*

**Option 2: Manual Archive Download**
```bash
# 1. Download the Zig archive
wget https://ziglang.org/download/0.13.0/zig-linux-x86_64-0.13.0.tar.xz

# 2. Extract the downloaded file
tar -xf zig-linux-x86_64-0.13.0.tar.xz

# 3. Move it to a permanent system directory
sudo mv zig-linux-x86_64-0.13.0 /usr/local/zig

# 4. Add Zig to your system $PATH
echo 'export PATH="$PATH:/usr/local/zig"' >> ~/.bashrc

# 5. Reload your terminal configuration
source ~/.bashrc
```
Check it installed correctly by running `zig version`.

### 2. Manual PostgreSQL Setup Fails
If `build.sh` couldn't automate setting up your local database:

```bash
# Install PostgreSQL
sudo apt-get update && sudo apt-get install -y postgresql postgresql-client

# Start PostgreSQL service
sudo systemctl start postgresql && sudo systemctl enable postgresql

# Create DB and user manually
sudo -u postgres psql -c "CREATE USER myvcs WITH PASSWORD 'myvcs' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE myvcs OWNER myvcs;"

# Push schema directly
npx drizzle-kit push
```
*(Make sure your `.env` contains: `DATABASE_URL=postgresql://myvcs:myvcs@localhost:5432/myvcs`)*

### 3. Drizzle Connection Hanging (`pg_hba.conf` issue)
Sometimes, PostgreSQL restricts password-based connection to local TCP ports due to an `md5` configuration.

```bash
# 1. Remove the bad md5 rule from pg_hba.conf (adjust '16' to your PostgreSQL version)
sudo sed -i '/^host    all    all    127\.0\.0\.1\/32    md5$/d' /etc/postgresql/16/main/pg_hba.conf

# 2. Reload PostgreSQL
sudo systemctl reload postgresql
```

### 4. Database Name Contains a Hidden Carriage Return (`\r`)
If you created your `.env` file from a Windows machine, the `\r` (carriage return) might bleed into your database creation, causing Drizzle to fail saying the database `"myvcs"` doesn't exist (because it's actually named `"myvcs\r"`).

```bash
# List all databases to confirm your databse name has a weird suffix
sudo -u postgres psql -l

# Drop the bad one (the $'' syntax helps bash target the hidden \r character)
sudo -u postgres psql -c $'DROP DATABASE "myvcs\r";'

# Recreate the correct one and assign the right owner
sudo -u postgres psql -c "CREATE DATABASE myvcs OWNER myvcs;"
```

### 5. CLI Binary Lacks "Execute" Permissions
If running the `myvcs` global command throws a "permission denied" error after `npm link`, you'll need to make the bin executable:

```bash
# Find where nvm/npm linked your binary, e.g., ~/.nvm/versions/node/v22.13.0/bin/myvcs
# Ensure it is executable:
chmod +x $(which myvcs)

# (Or specify the direct path if the above isn't resolving:)
chmod +x ~/.nvm/versions/node/v22.13.0/bin/myvcs
```
