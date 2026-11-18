#!/bin/bash
# LOOP only: copies the game and the server to /opt/loop on the Frankfurt box and restarts the loop service (port 8090).
# It never touches /opt/chick or the chick service (that is COOP).
set -e
cd "$(dirname "$0")/.."
K=${LOOP_KEY:-$HOME/Desktop/Nodes/dinosclaw.pem}; H=${LOOP_HOST:-ubuntu@43.165.5.114}
scp -q -i $K index.html server/server.js server/room_ctx.js server/package.json $H:/opt/loop/
ssh -i $K -o BatchMode=yes $H 'cd /opt/loop && npm i --omit=dev --silent 2>&1 | tail -1; sudo systemctl restart loop && sleep 2 && systemctl is-active loop && curl -s localhost:8090/status'
