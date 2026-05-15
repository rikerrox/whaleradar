#!/bin/bash
# Persistent Next.js dev server with auto-restart
LOGFILE="/home/z/my-project/dev.log"

while true; do
  echo "[$(date)] Starting Next.js dev server..." >> "$LOGFILE"
  cd /home/z/my-project
  ./node_modules/.bin/next dev -p 3000 >> "$LOGFILE" 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> "$LOGFILE"
  sleep 3
done
