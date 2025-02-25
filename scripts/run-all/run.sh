#!/bin/bash

# Get the local IP address using ifconfig or ip command
if [[ "$OSTYPE" == "darwin"* ]]; then
  # MacOS
  IP_ADDRESS=$(ipconfig getifaddr en0)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  IP_ADDRESS=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Git Bash on Windows
  IP_ADDRESS=$(ipconfig | grep -A 5 'Wireless LAN adapter Wi-Fi' | grep 'IPv4' | awk '{print $NF}')
else
  echo "Unsupported OS."
  exit 1
fi

NEXTAUTH_URL="http://$IP_ADDRESS:3000"


# Navigate to the backend folder and run `npm run dev`
cd backend || { echo "Backend folder not found!"; exit 1; }
echo "Pulling backend..."
git pull
echo "Installing backend..."
npm i
echo "Starting backend..."
npm run dev &  # Run in the background

# Navigate to the dashboard folder and run `npm run dev`
cd ../dashboard || { echo "Dashboard folder not found!"; exit 1; }
# Remove the current env
sed -i '/^NEXTAUTH_URL=/d' .env
# Set new env of next auth
echo "NEXTAUTH_URL=$NEXTAUTH_URL" >> .env
echo "Local IP Address set in the .env"
echo "Pulling dashboard..."
git pull
echo "Installing dashboard..."
npm i
echo "Starting dashboard..."
npm run dev &  # Run in the background

# Move to the root directory
cd ../

echo "App running at $NEXTAUTH_URL"
# Wait for both processes to complete
wait
