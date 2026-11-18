# LOOP: Lofi Out Of Patience

A yeti snowball battle high in the Himalayas, for desktop browsers. Built for the CLAY (Code Like A Yeti) hackathon by Lofi the Yeti on Sui.

- One file: `index.html` (hand-written WebGL2, no libraries, no build step)
- 8 yetis (Lofi, Momo, Tenzing, Meru, Chai, Blizzard, Kangri, Beats), 4 Himalayan maps (Base Camp, Tengboche Monastery, Khumbu Icefall, Lofi's Ice Tomb)
- Modes: free for all, teams, capture the crystal, 1 v 1; practice against bots; online rooms with bots filling empty seats
- Snowballs, ice bombs, a snow leopard at a 4 streak and an avalanche at 7
- Desktop only: phones and tablets see a "play on a computer" screen
- Controls: WASD, mouse, click to throw, right click to aim, Shift to sprint, Space to jump, G for an ice bomb, V for yeti eyes view

## Run locally
`python3 -m http.server 8766` in this folder, then open http://localhost:8766

## Online server
`server/` runs the same `index.html` in Node (`server.js` + `room_ctx.js`). Deploy with `tools/deploy_server.sh` (LOOP only: /opt/loop, service `loop`, port 8090, public at wss://43-165-5-114.sslip.io/loop/ws).

## Release the web
`tools/release.sh`
