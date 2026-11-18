# LOOP: Lofi Out Of Patience

**Chill vibes. Cold hits.** A free yeti snowball battle high in the Himalayas, built for **CLAY (Code Like A Yeti)**, the Lofi the Yeti hackathon on Sui.

- Play: https://loop-lofi.vercel.app (desktop browser, keyboard and mouse)
- Game: https://loop-lofi.vercel.app/game
- Sui package (devnet): `0xcf6bea687cb7c47f0cf5e27df27f2b849223bec37a9fe91b23e2f310029b1e9a` ([Suiscan](https://suiscan.xyz/devnet/object/0xcf6bea687cb7c47f0cf5e27df27f2b849223bec37a9fe91b23e2f310029b1e9a))

## The game
- 8 player arena battles, 3 minute matches: free for all, teams 4 v 4, capture the crystal, 1 v 1. Bots fill empty seats, online rooms with codes and invite links.
- 8 yetis (Lofi, Momo, Tenzing, Meru, Chai, Blizzard, Kangri, Beats), 6 Himalayan maps (Base Camp, Tengboche Monastery, Khumbu Icefall, Lofi's Ice Tomb, The Summit, Namche Bazaar).
- Snowballs, ice bombs, a snow leopard at a 4 streak and an avalanche at 7. Golden snow, ice armor and hot momos.
- Locker with hats, outfits and ice bomb styles. The rarest ones unlock only with a Yeti NFT, and the very best when your NFT levels up.
- Hand written WebGL2 in one file (`index.html`), no engine, no build step.

## On Sui
| Feature | How it works |
|---|---|
| zkLogin | Sign in with Google and get a Sui address, no seed phrase and no extension. Salt from the server after it verifies the Google token, proof from the Mysten prover. A guest wallet is also offered. |
| Sponsored gas | The game server builds every transaction and pays the gas. Players only sign, they never need SUI. |
| Yeti NFTs | `yeti::Yeti` stores kills, deaths, wins, matches, xp and level on chain. Online match results are signed (ed25519) by the game server and verified in Move by `record_match`, with a sequence number against replays. Kiosk transfer policy included. |
| Tournaments | `tournament::Tournament` holds a SUI prize pot. Free entry, the admin funds it, payout to the top 3 of the week by score. |
| Walrus | Best kill clips (video) are stored on Walrus testnet and minted as `clip::Clip` NFTs. |

Code: `move/` (Move package and scripts), `server/sui.mjs` (sponsor, signer, zkLogin salt, admin), `sui.js` (browser wallet), `admin/` (owner dashboard, Google sign in).

## Run it
- Game locally: `python3 -m http.server 8766`, open http://localhost:8766
- Online server: `server/` runs the same `index.html` in Node (`server.js`, `room_ctx.js`, `sui.mjs`). Secrets come from environment variables, never from the repo.
- Move: see `move/README.md` (`publish.sh` republishes after a devnet reset).

## Credits
Music by Kevin MacLeod (incompetech.com), licensed under Creative Commons Attribution 4.0. Made in the spirit of Lofi the Yeti (lofitheyeti.com) for the CLAY hackathon. See `CREDITS.md`.
