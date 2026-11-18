// LOOP on Sui devnet: the game server sponsors gas, signs real online match results, verifies Google sign in for zkLogin,
// and runs the admin side of tournaments. Secrets come from the environment (/opt/loop/loop.env, never from the repo).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHmac, createPublicKey, createVerify } from 'node:crypto';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction, coinWithBalance } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { fromBase64, toBase64 } from '@mysten/sui/utils';

const here = new URL('.', import.meta.url).pathname;
const CFG = JSON.parse(readFileSync(process.env.SUI_CONFIG || here + 'sui.config.json', 'utf8'));
const P = CFG.packageId;
const client = new SuiGrpcClient({ network: 'devnet', baseUrl: CFG.rpc });
const game = process.env.LOOP_GAME_KEY ? Ed25519Keypair.fromSecretKey(process.env.LOOP_GAME_KEY) : null;
const admin = process.env.LOOP_ADMIN_KEY ? Ed25519Keypair.fromSecretKey(process.env.LOOP_ADMIN_KEY) : null;
const GCID = process.env.LOOP_GOOGLE_CLIENT_ID || '';
const SALT = process.env.LOOP_SALT_SECRET || '';
const ADMIN_TOKEN = process.env.LOOP_ADMIN_TOKEN || '';
const DATA = process.env.LOOP_DATA || here + 'sui-data.json';

const YetiBcs = bcs.struct('Yeti', { id: bcs.Address, name: bcs.string(), skin: bcs.u8(), kills: bcs.u64(), deaths: bcs.u64(), wins: bcs.u64(), matches: bcs.u64(), xp: bcs.u64(), level: bcs.u64(), seq: bcs.u64(), image_url: bcs.string() });
const ClipBcs = bcs.struct('Clip', { id: bcs.Address, blob_id: bcs.string(), title: bcs.string(), kills: bcs.u64(), map: bcs.string(), created_ms: bcs.u64() });
const TourBcs = bcs.struct('Tournament', { id: bcs.Address, name: bcs.string(), pot: bcs.u64(), starts_ms: bcs.u64(), ends_ms: bcs.u64(), entrants: bcs.vector(bcs.Address), paid: bcs.bool() });
const RegBcs = bcs.struct('Registry', { id: bcs.Address, minted: bcs.u64(), game_pubkey: bcs.vector(bcs.u8()), base_image: bcs.string() });
const MatchResult = bcs.struct('MatchResult', { yeti: bcs.Address, kills: bcs.u64(), deaths: bcs.u64(), won: bcs.bool(), xp: bcs.u64(), seq: bcs.u64() });

// small persistent store: tournaments we created, pending online results, scores per address, a short log
let D = { tours: [], pending: {}, scores: {}, log: [], week: '' };
try { if (existsSync(DATA)) D = Object.assign(D, JSON.parse(readFileSync(DATA, 'utf8'))); } catch (e) {}
let dirty = false; const save = () => { dirty = true; };
setInterval(() => { if (!dirty) return; dirty = false; try { writeFileSync(DATA, JSON.stringify(D)); } catch (e) {} }, 5000);
const logIt = (k, o) => { D.log.unshift(Object.assign({ t: Date.now(), k }, o)); D.log.length = Math.min(D.log.length, 200); save(); };
const weekKey = () => { const d = new Date(); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day); return d.toISOString().slice(0, 10); };

const isAddr = (a) => typeof a === 'string' && /^0x[0-9a-f]{64}$/.test(a);

/* ---------- online results: the room tells us what each signed in player did ---------- */
export function recordResult(addr, r) {
  if (!isAddr(addr)) return;
  const xp = 50 + r.kills * 25 + (r.won ? 100 : 0);
  D.pending[addr] = { kills: r.kills | 0, deaths: r.deaths | 0, won: !!r.won, xp, t: Date.now(), map: r.map || '' };
  const wk = weekKey(); if (D.week !== wk) { D.week = wk; D.scores = {}; }
  const s = D.scores[addr] || (D.scores[addr] = { name: r.name || '', xp: 0, kills: 0, wins: 0, matches: 0 });
  s.name = r.name || s.name; s.xp += xp; s.kills += r.kills | 0; s.wins += r.won ? 1 : 0; s.matches++;
  save();
}

/* ---------- Google sign in for zkLogin: verify the id token, then hand out a stable salt ---------- */
let JWKS = { t: 0, keys: [] };
async function googleKey(kid) {
  if (Date.now() - JWKS.t > 3600e3 || !JWKS.keys.find((k) => k.kid === kid)) {
    const r = await fetch('https://www.googleapis.com/oauth2/v3/certs'); JWKS = { t: Date.now(), keys: (await r.json()).keys || [] };
  }
  return JWKS.keys.find((k) => k.kid === kid);
}
const b64u = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
export async function salt(jwt) {
  if (!GCID || !SALT) throw new Error('zkLogin is not configured on the server');
  const [h, p, sg] = String(jwt).split('.'); if (!sg) throw new Error('bad token');
  const head = JSON.parse(b64u(h)), pay = JSON.parse(b64u(p));
  const jwk = await googleKey(head.kid); if (!jwk) throw new Error('unknown key');
  const v = createVerify('RSA-SHA256'); v.update(h + '.' + p);
  if (!v.verify(createPublicKey({ key: jwk, format: 'jwk' }), b64u(sg))) throw new Error('bad signature');
  if (pay.aud !== GCID) throw new Error('wrong audience');
  if (!/^(https:\/\/)?accounts\.google\.com$/.test(pay.iss)) throw new Error('wrong issuer');
  if (pay.exp * 1000 < Date.now() - 60e3) throw new Error('token expired');
  const hex = createHmac('sha256', SALT).update(pay.iss + '|' + pay.aud + '|' + pay.sub).digest('hex').slice(0, 30);
  return { salt: BigInt('0x' + hex).toString(), name: (pay.given_name || pay.name || '').slice(0, 14), sub: pay.sub };
}

/* ---------- sponsored transactions: the server builds them, pays gas, and the player only signs ---------- */
const RL = new Map();
function limit(key, n, ms) { const now = Date.now(), q = (RL.get(key) || []).filter((t) => now - t < ms); if (q.length >= n) return false; q.push(now); RL.set(key, q); return true; }
setInterval(() => { const now = Date.now(); for (const [k, q] of RL) if (!q.length || now - q[q.length - 1] > 3600e3) RL.delete(k); }, 600e3);

async function ownedYetis(owner) {
  const out = []; let cursor = null;
  for (let i = 0; i < 5; i++) {
    const r = await client.listOwnedObjects({ owner, type: `${P}::yeti::Yeti`, include: { content: true }, cursor, limit: 50 });
    for (const o of r.objects) { const y = YetiBcs.parse(o.content); out.push({ id: o.objectId, name: y.name, skin: y.skin, kills: +y.kills, deaths: +y.deaths, wins: +y.wins, matches: +y.matches, xp: +y.xp, level: +y.level, seq: +y.seq, image: y.image_url }); }
    if (!r.hasNextPage) break; cursor = r.cursor;
  }
  return out;
}
async function ownedClips(owner) {
  const r = await client.listOwnedObjects({ owner, type: `${P}::clip::Clip`, include: { content: true }, limit: 50 });
  return r.objects.map((o) => { const c = ClipBcs.parse(o.content); return { id: o.objectId, blob: c.blob_id, title: c.title, kills: +c.kills, map: c.map, t: +c.created_ms }; });
}

export async function prepare(body, ip) {
  if (!game) throw new Error('sponsor wallet is not configured');
  const sender = String(body.sender || '').toLowerCase(); if (!isAddr(sender)) throw new Error('bad address');
  if (!limit('s' + sender, 40, 3600e3) || !limit('i' + ip, 120, 3600e3)) throw new Error('Too many requests, try again later');
  const tx = new Transaction(); const a = body.action, x = body.args || {};
  if (a === 'mint') {
    const name = String(x.name || 'Yeti').replace(/[^\p{L}\p{N}_ ]/gu, '').slice(0, 14) || 'Yeti', skin = Math.max(0, Math.min(7, x.skin | 0));
    if ((await ownedYetis(sender)).length >= 8) throw new Error('You already own 8 yetis');
    tx.moveCall({ target: `${P}::yeti::mint`, arguments: [tx.object(CFG.registryId), tx.pure.string(name), tx.pure.u8(skin)] });
  } else if (a === 'record') {
    const pr = D.pending[sender]; if (!pr) throw new Error('No online match to record yet. Finish an online match first');
    const yid = String(x.yeti || ''); const mine = (await ownedYetis(sender)).find((y) => y.id === yid); if (!mine) throw new Error('That yeti is not in your wallet');
    const seq = Math.max(mine.seq + 1, Date.now());
    const msg = MatchResult.serialize({ yeti: yid, kills: BigInt(pr.kills), deaths: BigInt(pr.deaths), won: pr.won, xp: BigInt(pr.xp), seq: BigInt(seq) }).toBytes();
    const sig = await game.sign(msg);
    tx.moveCall({ target: `${P}::yeti::record_match`, arguments: [tx.object(CFG.registryId), tx.object(yid), tx.pure.u64(pr.kills), tx.pure.u64(pr.deaths), tx.pure.bool(pr.won), tx.pure.u64(pr.xp), tx.pure.u64(seq), tx.pure.vector('u8', sig)] });
  } else if (a === 'join') {
    const id = String(x.tour || ''); if (!D.tours.find((t) => t.id === id)) throw new Error('Unknown tournament');
    tx.moveCall({ target: `${P}::tournament::join`, arguments: [tx.object(id), tx.object.clock()] });
  } else if (a === 'clip') {
    const blob = String(x.blob || '').slice(0, 120); if (!/^[A-Za-z0-9_-]{20,}$/.test(blob)) throw new Error('bad blob id');
    tx.moveCall({ target: `${P}::clip::mint_clip`, arguments: [tx.pure.string(blob), tx.pure.string(String(x.title || 'Best kill').slice(0, 40)), tx.pure.u64(Math.max(0, x.kills | 0)), tx.pure.string(String(x.map || '').slice(0, 30)), tx.object.clock()] });
  } else throw new Error('unknown action');
  tx.setSender(sender); tx.setGasOwner(game.toSuiAddress()); tx.setGasBudget(60_000_000);
  let bytes;
  try { bytes = await tx.build({ client }); } catch (e) { throw new Error('Could not build: ' + String(e.message || e).slice(0, 160)); }
  const { signature } = await game.signTransaction(bytes);
  return { bytes: toBase64(bytes), sponsorSig: signature, action: a };
}

export async function execute(body) {
  const bytes = fromBase64(String(body.bytes || '')); const sigs = body.signatures;
  if (!Array.isArray(sigs) || sigs.length !== 2) throw new Error('need two signatures');
  const r = await client.executeTransaction({ transaction: bytes, signatures: sigs, include: { effects: true, objectTypes: true } });
  if (r.$kind !== 'Transaction') throw new Error('Transaction failed: ' + JSON.stringify(r.FailedTransaction?.status?.error ?? r.FailedTransaction?.status ?? r).slice(0, 200));
  const t = r.Transaction; await client.waitForTransaction({ digest: t.digest });
  const created = t.effects.changedObjects.filter((o) => o.idOperation === 'Created').map((o) => ({ id: o.objectId, type: t.objectTypes?.[o.objectId] || '' }));
  if (body.action === 'record' && body.sender) { delete D.pending[String(body.sender).toLowerCase()]; save(); }
  logIt(body.action || 'tx', { sender: body.sender, digest: t.digest });
  return { digest: t.digest, created };
}

/* ---------- reads for the game ---------- */
export async function wallet(addr) {
  if (!isAddr(addr)) throw new Error('bad address');
  const [yetis, clips, bal] = await Promise.all([ownedYetis(addr), ownedClips(addr), client.getBalance({ owner: addr }).catch(() => null)]);
  return { addr, yetis, clips, balance: bal ? bal.balance.balance : '0', pending: D.pending[addr] || null, score: D.scores[addr] || null, network: 'devnet', packageId: P };
}
async function tourInfo(id) {
  const { object } = await client.getObject({ objectId: id, include: { content: true } }); const t = TourBcs.parse(object.content);
  return { id, name: t.name, pot: t.pot, starts: +t.starts_ms, ends: +t.ends_ms, entrants: t.entrants, paid: t.paid };
}
export async function tournaments() { const out = []; for (const t of D.tours.slice(0, 12)) { try { out.push(await tourInfo(t.id)); } catch (e) {} } return out; }
export function leaderboard() { return Object.entries(D.scores).map(([addr, s]) => Object.assign({ addr }, s)).sort((a, b) => b.xp - a.xp).slice(0, 50); }
export async function epoch() { const r = await client.getCurrentSystemState(); return { epoch: String(r.systemState.epoch) }; }
export function config() { return { network: 'devnet', packageId: P, registryId: CFG.registryId, googleClientId: GCID, prover: 'https://prover-dev.mystenlabs.com/v1', rpc: CFG.rpc, walrusPublisher: 'https://publisher.walrus-testnet.walrus.space', walrusAggregator: 'https://aggregator.walrus-testnet.walrus.space' }; }

/* ---------- admin: token gated ---------- */
function adminOk(tok) { return ADMIN_TOKEN && typeof tok === 'string' && tok.length === ADMIN_TOKEN.length && createHmac('sha256', 'k').update(tok).digest('hex') === createHmac('sha256', 'k').update(ADMIN_TOKEN).digest('hex'); }
async function run(tx, signer) {
  const r = await client.signAndExecuteTransaction({ transaction: tx, signer, include: { effects: true, objectTypes: true } });
  if (r.$kind !== 'Transaction') throw new Error('failed: ' + JSON.stringify(r.FailedTransaction?.status?.error ?? r).slice(0, 200));
  await client.waitForTransaction({ digest: r.Transaction.digest }); return r.Transaction;
}
export async function adminCall(body) {
  if (!adminOk(body.token)) throw new Error('not allowed');
  const a = body.action, x = body.args || {};
  if (a === 'stats') {
    const { object } = await client.getObject({ objectId: CFG.registryId, include: { content: true } }); const reg = RegBcs.parse(object.content);
    const [gb, ab] = await Promise.all([client.getBalance({ owner: game.toSuiAddress() }), client.getBalance({ owner: admin.toSuiAddress() })]);
    return { minted: +reg.minted, gameAddress: game.toSuiAddress(), gameBalance: gb.balance.balance, adminAddress: admin.toSuiAddress(), adminBalance: ab.balance.balance, packageId: P, registryId: CFG.registryId, tours: await tournaments(), leaderboard: leaderboard(), log: D.log.slice(0, 60), pending: Object.keys(D.pending).length };
  }
  if (a === 'create') {
    const name = String(x.name || 'Weekly Cup').slice(0, 40), starts = +x.starts || Date.now(), ends = +x.ends || Date.now() + 7 * 86400e3;
    const tx = new Transaction(); tx.moveCall({ target: `${P}::tournament::create`, arguments: [tx.object(CFG.adminCapId), tx.pure.string(name), tx.pure.u64(starts), tx.pure.u64(ends)] });
    const t = await run(tx, admin); const id = t.effects.changedObjects.filter((o) => o.idOperation === 'Created').map((o) => o.objectId).find((oid) => (t.objectTypes?.[oid] || '').includes('::tournament::Tournament'));
    D.tours.unshift({ id, name, t: Date.now() }); logIt('create', { id, name }); save(); return { id, digest: t.digest };
  }
  if (a === 'fund') {
    const mist = BigInt(Math.round((+x.sui || 0) * 1e9)); if (mist <= 0n || mist > 50_000_000_000n) throw new Error('amount 0 to 50 SUI');
    const tx = new Transaction(); tx.moveCall({ target: `${P}::tournament::fund`, arguments: [tx.object(String(x.tour)), coinWithBalance({ balance: mist })] });
    const t = await run(tx, game); logIt('fund', { tour: x.tour, sui: +x.sui }); return { digest: t.digest };
  }
  if (a === 'payout') {
    const info = await tourInfo(String(x.tour)); if (info.paid) throw new Error('already paid');
    const pot = BigInt(info.pot); if (pot <= 0n) throw new Error('empty pot');
    // winners: entrants ranked by this week's score, 50 / 30 / 20 percent
    const ranked = info.entrants.map((ad) => ({ ad, xp: (D.scores[ad] || {}).xp || 0 })).sort((p, q) => q.xp - p.xp).slice(0, 3);
    if (!ranked.length) throw new Error('nobody joined');
    const cut = [50n, 30n, 20n].slice(0, ranked.length), tot = cut.reduce((s, v) => s + v, 0n);
    const amounts = cut.map((c) => (pot * c) / tot); amounts[0] += pot - amounts.reduce((s, v) => s + v, 0n);
    const tx = new Transaction(); tx.moveCall({ target: `${P}::tournament::payout`, arguments: [tx.object(CFG.gameCapId), tx.object(info.id), tx.pure.vector('address', ranked.map((r) => r.ad)), tx.pure.vector('u64', amounts)] });
    const t = await run(tx, game); logIt('payout', { tour: info.id, winners: ranked.map((r) => r.ad) }); return { digest: t.digest, winners: ranked.map((r, i) => ({ addr: r.ad, mist: String(amounts[i]) })) };
  }
  throw new Error('unknown admin action');
}
