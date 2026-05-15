#!/bin/bash
# WhaleRadar AI - Persistent dev server startup

cd /home/z/my-project

# Kill any existing processes
pkill -f "next dev -p 3000" 2>/dev/null
sleep 1

# Start Next.js dev server
node ./node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
echo "Next.js started with PID $!"

# Start WebSocket service
cd /home/z/my-project/mini-services/realtime-service
pkill -f "bun --hot index.ts" 2>/dev/null
sleep 1
bun --hot index.ts >> /home/z/my-project/mini-services/realtime-service/log.txt 2>&1 &
echo "WS service started with PID $!"

echo "Both services started"
