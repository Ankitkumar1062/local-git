#!/bin/bash

# Exit on error
set -e

echo "Starting local-git frontend and backend..."

# Load NVM if it's available to ensure Node environment is loaded
if ! command -v npm &> /dev/null; then
    export NVM_DIR="$HOME/.nvm"
    set +e
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    set -e
fi

# Defaults
PORT=${1:-3000}
REPOS_DIR=${2:-./repos}

echo "Creating repositories directory at $REPOS_DIR if it doesn't exist..."
mkdir -p "$REPOS_DIR"

echo "Starting backend server (npm run dev)..."
# We start the backend in the background and pass the repo/port args
npm run dev -- --port "$PORT" --repos "$REPOS_DIR" &
BACKEND_PID=$!

echo "Starting frontend web UI (npm run dev:web)..."
# We start the frontend in the background
npm run dev:web &
FRONTEND_PID=$!

# Ensure background processes are cleaned up when the script is stopped
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT SIGINT SIGTERM

echo "Both frontend and backend dev servers are starting up!"
echo "Press Ctrl+C to stop the servers."

# Wait indefinitely so the script doesn't exit until interrupted
wait
