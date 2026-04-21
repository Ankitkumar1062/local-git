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
