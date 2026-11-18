// End-to-end check of every format the LOOP game server will use, against devnet.
// Usage: node e2e.mjs   (needs ../../.secrets/devnet.env and ../../sui.config.json)
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { bcs } from '@mysten/sui/bcs';
import { loadEnv, loadConfig, makeClient, keypair, run, runSponsored, created, matchMessage } from './lib.mjs';

const env = loadEnv();
const cfg = loadConfig();
const client = makeClient(cfg.rpc);
const game = keypair(env.LOOP_GAME_KEY); // sponsor + result signer + GameCap holder
const signer = keypair(env.LOOP_GAME_SIGN_KEY);
const user = new Ed25519Keypair(); // fresh throwaway player with 0 SUI
const P = cfg.packageId;
const log = (...a) => console.log('[e2e]', ...a);

const YetiBcs = bcs.struct('Yeti', {
  id: bcs.Address,
  name: bcs.string(),
  skin: bcs.u8(),
  kills: bcs.u64(),
  deaths: bcs.u64(),
  wins: bcs.u64(),
  matches: bcs.u64(),
  xp: bcs.u64(),
  level: bcs.u64(),
  seq: bcs.u64(),
  image_url: bcs.string(),
});
const TournamentBcs = bcs.struct('Tournament', {
  id: bcs.Address,
  name: bcs.string(),
  pot: bcs.u64(), // Balance<SUI> is a struct { value: u64 }
  starts_ms: bcs.u64(),
  ends_ms: bcs.u64(),
  entrants: bcs.vector(bcs.Address),
  paid: bcs.bool(),
});

const readYeti = async (id) => {
  const { object } = await client.getObject({ objectId: id, include: { content: true, display: true } });
  return { ...YetiBcs.parse(object.content), owner: object.owner, display: object.display };
};

log('user', user.toSuiAddress(), '(no SUI, every user tx is sponsored by loop-game)');
log('sponsor balance before', (await client.getBalance({ owner: game.toSuiAddress() })).balance.balance, 'MIST');

// 1. Sponsored mint.
let tx = new Transaction();
tx.moveCall({ target: `${P}::yeti::mint`, arguments: [tx.object(cfg.registryId), tx.pure.string('Λόφι'), tx.pure.u8(3)] });
let t = await runSponsored(client, tx, user, game, 'mint');
const yetiId = created(t, '::yeti::Yeti')[0].id;
log('minted Yeti', yetiId, 'digest', t.digest);

// 2. Game server signs a match result; user submits it (sponsored).
const result = { yetiId, kills: 7, deaths: 2, won: true, xp: 420, seq: 1 };
const msg = matchMessage(result);
const sig = await signer.sign(msg);
log('signed message', Buffer.from(msg).toString('hex'), `(${msg.length} bytes)`);
tx = new Transaction();
tx.moveCall({
  target: `${P}::yeti::record_match`,
  arguments: [
    tx.object(cfg.registryId),
    tx.object(yetiId),
    tx.pure.u64(result.kills),
    tx.pure.u64(result.deaths),
    tx.pure.bool(result.won),
    tx.pure.u64(result.xp),
    tx.pure.u64(result.seq),
    tx.pure.vector('u8', sig),
  ],
});
t = await runSponsored(client, tx, user, game, 'record_match');
log('record_match digest', t.digest);

// 2b. Replay of the same signed result must be rejected (seq not increasing).
let replayRejected = false;
try {
  tx = new Transaction();
  tx.moveCall({
    target: `${P}::yeti::record_match`,
    arguments: [tx.object(cfg.registryId), tx.object(yetiId), tx.pure.u64(7), tx.pure.u64(2), tx.pure.bool(true), tx.pure.u64(420), tx.pure.u64(1), tx.pure.vector('u8', sig)],
  });
  await runSponsored(client, tx, user, game, 'replay');
} catch (e) {
  replayRejected = true;
  log('replay rejected as expected:', String(e.message).slice(0, 120));
}
if (!replayRejected) throw new Error('replay was accepted');

const y = await readYeti(yetiId);
log('Yeti stats', { name: y.name, skin: y.skin, kills: y.kills, deaths: y.deaths, wins: y.wins, matches: y.matches, xp: y.xp, level: y.level, seq: y.seq, image_url: y.image_url });
log('Yeti display', y.display?.output ?? y.display);
if (y.kills !== '7' || y.wins !== '1' || y.level !== '2' || y.seq !== '1') throw new Error('unexpected yeti stats');

// 3. Tournament: admin creates, loop-game funds 0.1 SUI, user joins (sponsored), loop-game pays out via GameCap.
const admin = keypair(env.LOOP_ADMIN_KEY);
const now = Date.now();
tx = new Transaction();
tx.moveCall({
  target: `${P}::tournament::create`,
  arguments: [tx.object(cfg.adminCapId), tx.pure.string('E2E Cup ' + new Date(now).toISOString()), tx.pure.u64(now - 60_000), tx.pure.u64(now + 3_600_000)],
});
t = await run(client, tx, admin, 'tournament create');
const tournamentId = created(t, '::tournament::Tournament')[0].id;
log('tournament', tournamentId);

tx = new Transaction();
tx.moveCall({ target: `${P}::tournament::fund`, arguments: [tx.object(tournamentId), coinWithBalance({ balance: 100_000_000n })] });
t = await run(client, tx, game, 'fund');
log('funded 0.1 SUI, digest', t.digest);

tx = new Transaction();
tx.moveCall({ target: `${P}::tournament::join`, arguments: [tx.object(tournamentId), tx.object.clock()] });
t = await runSponsored(client, tx, user, game, 'join');
log('user joined, digest', t.digest);

tx = new Transaction();
tx.moveCall({
  target: `${P}::tournament::payout`,
  arguments: [tx.object(cfg.gameCapId), tx.object(tournamentId), tx.pure.vector('address', [user.toSuiAddress()]), tx.pure.vector('u64', [100_000_000n])],
});
t = await run(client, tx, game, 'payout');
log('payout digest', t.digest);
const { object: tobj } = await client.getObject({ objectId: tournamentId, include: { content: true } });
const tour = TournamentBcs.parse(tobj.content);
log('tournament state', { pot: tour.pot, entrants: tour.entrants, paid: tour.paid });
const userBal = await client.getBalance({ owner: user.toSuiAddress() });
log('user SUI after payout', userBal.balance.balance, 'MIST');
if (!tour.paid || tour.pot !== '0') throw new Error('tournament not paid');

// 4. Clip (sponsored).
tx = new Transaction();
tx.moveCall({
  target: `${P}::clip::mint_clip`,
  arguments: [tx.pure.string('e2e-dummy-blob-' + now), tx.pure.string('Triple snowball'), tx.pure.u64(3), tx.pure.string('Frost Peak'), tx.object.clock()],
});
t = await runSponsored(client, tx, user, game, 'mint_clip');
const clipId = created(t, '::clip::Clip')[0].id;
const { object: cobj } = await client.getObject({ objectId: clipId, include: { json: true, display: true } });
log('clip', clipId, cobj.json, 'display', cobj.display?.output ?? cobj.display);

log('sponsor balance after', (await client.getBalance({ owner: game.toSuiAddress() })).balance.balance, 'MIST');
log('ALL PASSED');
