#!/bin/bash

# Set script directory as working directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/" || exit 1

# Log file setup
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/startup_$(date +%Y%m%d).log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Start logging
echo "=== Script started at $(date -u "+%Y-%m-%d %H:%M:%S") UTC ===" >> "$LOG_FILE"

# Function to check if a command exists
check_command() {
    command -v "$1" >/dev/null 2>&1 || { echo "Error: $1 is required but not installed." | tee -a "$LOG_FILE"; exit 1; }
}

# Check for required commands
check_command "node"
check_command "npm"
check_command "git"

# Cleanup function
cleanup() {
    echo "Shutting down servers..." | tee -a "$LOG_FILE"
    pkill -f "npm run dev"
    exit
}

trap cleanup SIGINT SIGTERM

# Get the local IP address
IP_ADDRESS=$(ipconfig getifaddr en0)
if [ -z "$IP_ADDRESS" ]; then
    IP_ADDRESS=$(ipconfig getifaddr en1)
fi

if [ -z "$IP_ADDRESS" ]; then
    echo "Could not determine IP address. Using localhost." | tee -a "$LOG_FILE"
    IP_ADDRESS="localhost"
fi

NEXTAUTH_URL="http://$IP_ADDRESS:3000"
echo "Setting NEXTAUTH_URL to: $NEXTAUTH_URL" | tee -a "$LOG_FILE"

# Start backend
if [ ! -d "backend" ]; then
    echo "Error: Backend folder not found!" | tee -a "$LOG_FILE"
    exit 1
fi

cd backend || exit 1
echo "Pulling backend..." | tee -a "$LOG_FILE"
git pull
echo "Installing backend dependencies..." | tee -a "$LOG_FILE"
npm i
echo "Starting backend server..." | tee -a "$LOG_FILE"
npm run dev &

# Start dashboard
cd ../dashboard || { echo "Error: Dashboard folder not found!" | tee -a "$LOG_FILE"; exit 1; }

# Update .env file
sed -i '' '/^NEXTAUTH_URL=/d' .env 2>/dev/null || true
echo "NEXTAUTH_URL=$NEXTAUTH_URL" >> .env

echo "Pulling dashboard..." | tee -a "$LOG_FILE"
git pull
echo "Installing dashboard dependencies..." | tee -a "$LOG_FILE"
npm i
echo "Starting dashboard server..." | tee -a "$LOG_FILE"
npm run dev &

cd ..
echo "App running at $NEXTAUTH_URL" | tee -a "$LOG_FILE"
wait