# LOOP on Sui (devnet)

Move package for **LOOP, Lofi Out Of Patience**, the yeti snowball battle game.
It runs on Sui **devnet**. All public IDs live in `../sui.config.json`, and the keys are in `../.secrets/devnet.env` (gitignored).

The package is named `lofi_loop`, not `loop`, because `loop` is a reserved keyword in Move and cannot be used as an address name.
Modules are referenced as `<packageId>::yeti`, `<packageId>::tournament` and `<packageId>::clip`.

## Toolchain

| What | Value |
| --- | --- |
| CLI | `sui-devnet` = Sui `devnet-v1.84.0` release binary at `~/.local/share/sui-devnet-v1.84.0/sui`, symlinked as `~/.local/bin/sui-devnet`. The cargo `sui` 1.47 is left untouched. 1.47 cannot talk to devnet because public fullnodes no longer serve JSON-RPC. |
| CLI config | `../.secrets/sui/client.yaml` with its own keystore (aliases `loop-admin`, `loop-game`). Always pass `--client.config`. The global `~/.sui` is never used. |
| Framework | implicit system deps resolved by the 1.84 package manager (rev `05ad86a3`, see `Move.lock`). `[environments] devnet = "<chain id>"` in `Move.toml` |
| RPC | `https://fullnode.devnet.sui.io:443` over **gRPC-web** (`SuiGrpcClient`). GraphQL: `https://graphql.devnet.sui.io/graphql`. JSON-RPC (`SuiClient` / `SuiJsonRpcClient`) does **not** work on public fullnodes. |
| JS SDK | `@mysten/sui@2.39.1` (pinned exactly in `scripts/package.json`) |
| Gas | the faucet now credits **address balances**, not `Coin` objects. SDK 2.x pays gas from the address balance automatically. Publishing costs about 1.13 SUI because devnet has a publish charge. |

```bash
alias S='sui-devnet client --client.config ~/Desktop/loop/.secrets/sui/client.yaml'
sui-devnet move test --build-env devnet      # 20 unit tests
cd scripts && ./publish.sh && node e2e.mjs   # full redeploy + live check
```

## Modules

### `yeti`

Objects created at publish: shared `Registry`, shared `TransferPolicy<Yeti>`, and for the publisher `TransferPolicyCap<Yeti>`, `AdminCap`, `GameCap`, `Publisher` and `UpgradeCap`.
`publish.sh` then moves `GameCap` to loop-game, sets the game pubkey and creates the Display objects.

```move
public struct Yeti has key, store { id, name: String, skin: u8, kills: u64, deaths: u64, wins: u64,
                                    matches: u64, xp: u64, level: u64, seq: u64, image_url: String }
public struct Registry has key { id, minted: u64, game_pubkey: vector<u8>, base_image: String }
public struct AdminCap has key, store { id }
public struct GameCap  has key, store { id }

public fun mint(reg: &mut Registry, name: String, skin: u8, ctx: &mut TxContext)        // free, to sender
public fun mint_yeti(reg: &mut Registry, name: String, skin: u8, ctx: &mut TxContext): Yeti // same, returns it (PTB/kiosk)
public fun record_match(reg: &Registry, y: &mut Yeti, kills: u64, deaths: u64, won: bool,
                        xp: u64, seq: u64, sig: vector<u8>)
public fun match_message(yeti_id: address, kills: u64, deaths: u64, won: bool, xp: u64, seq: u64): vector<u8>
public fun level_for(xp: u64): u64                                                   // 1 + xp/300, max 100
public fun set_game_pubkey(_: &AdminCap, reg: &mut Registry, pubkey: vector<u8>)      // 32 raw bytes
public fun set_base_image(_: &AdminCap, reg: &mut Registry, base_image: String)
public fun create_display(_: &AdminCap, registry: &mut DisplayRegistry /* 0xd */, ctx: &mut TxContext)
// getters: name skin kills deaths wins matches xp level seq image_url minted game_pubkey base_image
```

* `skin` must be 0..7. `name` must be 1..14 **characters**; UTF-8 is counted per character, so Greek names work.
* `image_url = base_image + skin + ".png"`, with the default `https://loop-lofi.vercel.app/nft/`, so mints point at `/nft/0.png` through `/nft/7.png`.
* `record_match` aborts on these errors:
  * `ENoGameKey` (5) if no pubkey is set
  * `EStaleSeq` (4) unless `seq > y.seq`, which is the replay guard
  * `EBadSignature` (3) if the signature does not verify
* `record_match` adds `kills`, `deaths`, `+1 win` if won, `+1 match`, and `xp` (the xp gained this match). It then recomputes `level` and stores `seq`.
* Events: `Minted { yeti_id, owner, name, skin, number }` and `MatchRecorded { yeti_id, kills, deaths, won, xp, seq, total_xp, level }`.

**Display:** Display V1 (`sui::display::new*`) now aborts on devnet with `ENoLongerSupported`.
This package uses **Display V2** (`sui::display_registry`). Its `Display<T>` objects are derived from the system `DisplayRegistry` at `0xd`.
`0xd` cannot be passed to `init`, so `create_display` runs once right after publish, and the `DisplayCap`s go to the admin.
Yeti fields:
* name `{name}`
* description "A LOOP yeti. Level {level}, {wins} wins, {kills} snowball hits..."
* image_url `{image_url}`
* project_url `https://loop-lofi.vercel.app`
* link `https://loop-lofi.vercel.app/game`

### `tournament`

```move
public struct Tournament has key { id, name: String, pot: Balance<SUI>, starts_ms: u64, ends_ms: u64,
                                   entrants: vector<address> /* max 128 */, paid: bool }

public fun create(_: &AdminCap, name: String, starts_ms: u64, ends_ms: u64, ctx: &mut TxContext) // shares it
public fun fund(t: &mut Tournament, c: Coin<SUI>, ctx: &TxContext)                    // anyone
public fun join(t: &mut Tournament, clock: &Clock /* 0x6 */, ctx: &TxContext)        // free, starts<=now<ends, once
public fun payout(_: &GameCap, t: &mut Tournament, winners: vector<address>, amounts: vector<u64>, ctx: &mut TxContext)
public fun payout_admin(_: &AdminCap, t: &mut Tournament, winners: vector<address>, amounts: vector<u64>, ctx: &mut TxContext)
public fun sweep(_: &AdminCap, t: &mut Tournament, ctx: &mut TxContext)              // leftover pot to admin
// getters: name pot_value starts_ms ends_ms entrants is_paid
```

Payout rules:
* Payout happens once: `EAlreadyPaid` (5).
* `winners` and `amounts` must have the same length: `ELengthMismatch` (6).
* The amounts must add up to no more than the pot: `EPotTooSmall` (7).
* There must be at least one winner: `ENoWinners` (8).

Move has no "AdminCap or GameCap" parameter type, so there are two entry points over one internal function.
Events: `TournamentCreated`, `TournamentFunded`, `TournamentJoined` and `TournamentPaid`.

### `clip`

```move
public struct Clip has key, store { id, blob_id: String, title: String, kills: u64, map: String, created_ms: u64 }
public fun mint_clip(blob_id: String, title: String, kills: u64, map: String, clock: &Clock, ctx: &mut TxContext) // to sender
public fun create_display(_: &AdminCap, registry: &mut DisplayRegistry, ctx: &mut TxContext)
```

* `blob_id` must be 1..128 bytes and `title` 1..96 bytes.
* Display V2 fields:
  * name `{title}`
  * link `https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blob_id}`
  * image_url `https://loop-lofi.vercel.app/nft/clip.png`
* Event: `ClipMinted`.

## Signed match result: exact byte layout

The game server signs **raw ed25519 over exactly these 65 bytes**. There is no intent prefix and no hashing.
Use `keypair.sign(bytes)`, **not** `signPersonalMessage`. `sui keytool sign` also adds an intent, so it cannot be used either.

| offset | size | field | encoding |
| --- | --- | --- | --- |
| 0 | 32 | yeti object id | address bytes, big-endian as displayed (`0x…` hex) |
| 32 | 8 | kills | u64 little-endian |
| 40 | 8 | deaths | u64 little-endian |
| 48 | 1 | won | bool, `0x01` or `0x00` |
| 49 | 8 | xp (gained this match) | u64 little-endian |
| 57 | 8 | seq | u64 little-endian, must be greater than the yeti's current `seq` |

This is identical to BCS of the struct `(address, u64, u64, bool, u64, u64)` and to `yeti::match_message`.

```js
import { bcs } from '@mysten/sui/bcs';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const MatchResult = bcs.struct('MatchResult', {
  yeti: bcs.Address, kills: bcs.u64(), deaths: bcs.u64(), won: bcs.bool(), xp: bcs.u64(), seq: bcs.u64(),
});
const gameKey = Ed25519Keypair.fromSecretKey(process.env.LOOP_GAME_SIGN_KEY); // suiprivkey1...
const msg = MatchResult.serialize({ yeti: yetiId, kills: 7n, deaths: 2n, won: true, xp: 420n, seq: 1n }).toBytes();
const sig = await gameKey.sign(msg); // 64-byte Uint8Array -> pass as vector<u8>

tx.moveCall({
  target: `${cfg.packageId}::yeti::record_match`,
  arguments: [tx.object(cfg.registryId), tx.object(yetiId), tx.pure.u64(7), tx.pure.u64(2),
              tx.pure.bool(true), tx.pure.u64(420), tx.pure.u64(1), tx.pure.vector('u8', sig)],
});
```

The server must hand out a strictly increasing `seq` per yeti. Read `y.seq` on chain and use `seq + 1`, or use a monotonic counter such as a millisecond timestamp.
The public key on chain is `Registry.game_pubkey`, which equals `gamePubkeyHex` in `sui.config.json` (the raw 32 bytes, without the `0x00` scheme flag).

Test vector, hardcoded in `tests/loop_tests.move` and regenerated by `scripts/gen-vector.mjs`:
* key seed: 32 bytes of `0x07` (throwaway)
* message: yeti id `0xa11ce`, 12 kills, 3 deaths, won, 450 xp, seq 1

```
pubkey  ea4a6c63e29c520abef5507b132ec5f9954776aebebe7b92421eea691446d22c
message 00000000000000000000000000000000000000000000000000000000000a11ce0c00000000000000030000000000000001c2010000000000000100000000000000
sig     ccf93de5ae4e5070f7128fb935920269db5d40659987d9b825053f0e14c0379e52db6189be2875cd4cbbfb4ac57d55b97a4304cc71f61fddc77b39bee566fd03
```

## Sponsored transactions (players never need SUI)

The player is the **sender** and `loop-game` is the **gas owner**. Both sign the same transaction bytes:

```js
tx.setSender(user.toSuiAddress());
tx.setGasOwner(gameKeypair.toSuiAddress());          // gas comes from loop-game's address balance
const bytes = await tx.build({ client });            // client = new SuiGrpcClient({ network: 'devnet', baseUrl: cfg.rpc })
const { signature: userSig } = await user.signTransaction(bytes);        // in the browser wallet
const { signature: sponsorSig } = await gameKeypair.signTransaction(bytes); // on the game server
await client.executeTransaction({ transaction: bytes, signatures: [userSig, sponsorSig], include: { effects: true } });
```

A typical browser flow:
1. The client builds the transaction kind, or the server builds the full transaction.
2. The server sets sender and gas owner, builds it, and returns the bytes.
3. The wallet signs.
4. The server adds the sponsor signature and executes.

The server should only sponsor calls to this package. Check `tx.getData().commands` before co-signing.
When the gas owner pays from its address balance, the SDK sets a `ValidDuring` expiration of the current epoch plus one, so build the transaction and sign it promptly.
Error handling: a Move abort, such as `EStaleSeq` on a replayed result or `EBadSignature`, usually surfaces as an **exception thrown by `tx.build()`**, because the SDK simulates during resolution. It does not come back as a `FailedTransaction` result. Server code must catch build errors and also check `result.$kind`.

See `scripts/lib.mjs` (`runSponsored`) and `scripts/e2e.mjs`.

## Current devnet deployment

From `../sui.config.json`, published 2026-11-18:

| | id |
| --- | --- |
| packageId | `0xcf6bea687cb7c47f0cf5e27df27f2b849223bec37a9fe91b23e2f310029b1e9a` |
| registryId | `0x3821ca55c4b224abbce059c22299ce6fcd2325229381e234b9caf4d5454cd1be` |
| policyId (TransferPolicy&lt;Yeti&gt;) | `0x013b55ca1bbf870d43052763d20979c2702bdfea928d556a94b18c92bb0f6908` |
| Display&lt;Yeti&gt; | `0x58eb38228058a789303422c7cf7d36fd5c321323c4eb4c8c70f9ad535eebdd2f` |
| Display&lt;Clip&gt; | `0x65e8ac2a37d6a31b54513db1fbc46ae3e36a9e7261a953ab39740e9a4c47c37e` |
| adminCapId (loop-admin) | `0x744c638a70da2f35be939ac6a491df510b09c63507ee8d49e95f5b191a93d8b4` |
| gameCapId (loop-game) | `0xe28a2eaea9a79ccc210951d1126017604eca9f165b91a342ceaf9152c8c9b428` |
| upgradeCapId | `0xcb86002bf9aecbb5dfc983bf97ada24c3ce1cfa116c530be6169e5ccaa677e1e` |
| loop-admin | `0xd596027832e522109c8ec87253186c4cb097d9fe898f78dd141a4bb4a2d34fc6` |
| loop-game | `0xf33120a613b69ff8e008d9793daa99db73c13ff2f2d17373745399e2492fd37c` |
| game pubkey | `2a0860f4a115066bcbbc58630599882ed71629357d4075f2d95c78d963a8b7b2` |

The game should always read IDs from `sui.config.json` instead of hardcoding them.

## Devnet resets and `publish.sh`

Devnet is wiped on each devnet release, about every two weeks. Recent devnet tags were Sep 14, Sep 28, Oct 12, Oct 26 and Nov 9 2026, so the next wipe is likely around Nov 23 2026.
A wipe deletes every object, package, balance and **every player Yeti**. The keypairs in `.secrets` stay valid.
After republishing, the game must re-read `sui.config.json` because every ID changes.
A new devnet release usually needs a matching CLI as well. If `publish.sh` fails on protocol or RPC errors, download that `devnet-vX` tag and set `SUI_BIN`.
After a wipe, or whenever you want a fresh deployment:

```bash
cd ~/Desktop/loop/move/scripts
./publish.sh      # about 1 minute
node e2e.mjs      # proves mint, signed record_match, tournament and clip on the new package
```

`publish.sh` takes these steps:
1. Reads the current devnet chain id and writes it into `Move.toml` `[environments]`.
2. Deletes `Published.toml`.
3. Requests faucet funds for `loop-admin` and `loop-game` if either holds less than 3 SUI.
4. Publishes as `loop-admin` with `--json`, saving the output to `scripts/.last-publish.json`.
5. Runs `post-publish.mjs`, which:
   * moves `GameCap` to loop-game
   * calls `set_game_pubkey`
   * calls `yeti::create_display` and `clip::create_display`
   * rewrites `../sui.config.json`

Overrides: `SUI_BIN=/path/to/sui` and `GAS_BUDGET=...`.
If devnet upgrades past the CLI's protocol, install the matching `devnet-vX` release from github.com/MystenLabs/sui/releases and point `SUI_BIN` at it.

## Files

```
move/
  Move.toml  Move.lock  Published.toml
  sources/yeti.move  sources/tournament.move  sources/clip.move
  tests/loop_tests.move              20 unit tests
  scripts/package.json               @mysten/sui 2.39.1
  scripts/lib.mjs                    client, env loading, sponsored exec, matchMessage()
  scripts/publish.sh  scripts/post-publish.mjs
  scripts/e2e.mjs                    live devnet check
  scripts/gen-vector.mjs             regenerates the signature test vector
../.secrets/devnet.env               LOOP_ADMIN_KEY, LOOP_GAME_KEY, LOOP_GAME_SIGN_KEY, addresses (never commit)
../.secrets/sui/                     dedicated CLI config + keystore
../sui.config.json                   public IDs for the game
```
