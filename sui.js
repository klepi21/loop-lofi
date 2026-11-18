// LOOP wallet on Sui devnet. Two ways in: Google through zkLogin (a real Sui address from your Google account, no seed phrase),
// or a guest wallet kept in this browser. Every transaction is built and paid for by the LOOP game server (sponsored gas),
// the player only signs. Talks to the game through window.LOOPSUI and a 'loopsui' event.
import { Ed25519Keypair } from 'https://esm.sh/@mysten/sui@2.39.1/keypairs/ed25519';
import { generateNonce, generateRandomness, getExtendedEphemeralPublicKey, jwtToAddress, getZkLoginSignature, genAddressSeed, decodeJwt } from 'https://esm.sh/@mysten/sui@2.39.1/zklogin';
import { fromBase64 } from 'https://esm.sh/@mysten/sui@2.39.1/utils';

const q = new URLSearchParams(location.search);
const SRV = (q.get('srv') ? q.get('srv').replace(/^ws/, 'http').replace(/\/ws$/, '') : 'https://43-165-5-114.sslip.io/loop') + '/sui/';
const REDIR = location.origin + (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '/index.html' : '/game');
const KEY = 'loop_wallet', ZK = 'loop_zk_pending';
const get = (p) => fetch(SRV + p, { cache: 'no-store' }).then((r) => r.json()).then((d) => { if (d && d.err) throw new Error(d.err); return d; });
const post = (p, b) => fetch(SRV + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then((r) => r.json()).then((d) => { if (d && d.err) throw new Error(d.err); return d; });
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

let CFG = null, W = store.get(KEY), KP = null, busy = '';
const st = { ready: false, addr: '', kind: '', name: '', data: null, busy: '', err: '', cfg: null };
const emit = () => { st.busy = busy; window.dispatchEvent(new CustomEvent('loopsui', { detail: st })); };
function load() {
  if (!W) { KP = null; st.addr = ''; st.kind = ''; st.name = ''; return; }
  try { KP = Ed25519Keypair.fromSecretKey(W.sk); st.addr = W.addr; st.kind = W.kind; st.name = W.name || ''; } catch (e) { W = null; store.set(KEY, null); KP = null; st.addr = ''; }
}
async function refresh() { if (!st.addr) { st.data = null; emit(); return; } try { st.data = await get('wallet?a=' + st.addr); st.err = ''; } catch (e) { st.err = e.message; } emit(); return st.data; }

async function signIn() {
  CFG = CFG || await get('config');
  if (!CFG.googleClientId) throw new Error('Google sign in is not switched on yet. Use a guest wallet for now');
  const kp = new Ed25519Keypair(), { epoch } = await get('epoch'), maxEpoch = Number(epoch) + 2, randomness = generateRandomness();
  const nonce = generateNonce(kp.getPublicKey(), maxEpoch, randomness);
  store.set(ZK, { sk: kp.getSecretKey(), maxEpoch, randomness, t: Date.now() });
  location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: CFG.googleClientId, redirect_uri: REDIR, response_type: 'id_token', scope: 'openid profile', nonce, prompt: 'select_account', state: 'loopzk' });
}
async function finishSignIn(jwt) {
  const pend = store.get(ZK); store.set(ZK, null); history.replaceState(null, '', location.pathname + location.search);
  if (!pend) throw new Error('Sign in started in another tab, try again');
  busy = 'Creating your Sui wallet...'; emit();
  const s = await post('salt', { jwt }), addr = jwtToAddress(jwt, s.salt, false);
  const kp = Ed25519Keypair.fromSecretKey(pend.sk);
  const r = await fetch(CFG.prover, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jwt, extendedEphemeralPublicKey: getExtendedEphemeralPublicKey(kp.getPublicKey()), maxEpoch: String(pend.maxEpoch), jwtRandomness: String(pend.randomness), salt: s.salt, keyClaimName: 'sub' }) });
  if (!r.ok) throw new Error('The zkLogin prover said no (' + r.status + ')');
  const proof = await r.json(), d = decodeJwt(jwt);
  const seed = genAddressSeed(BigInt(s.salt), 'sub', d.sub, Array.isArray(d.aud) ? d.aud[0] : d.aud).toString();
  W = { kind: 'zk', sk: pend.sk, addr, name: s.name || '', maxEpoch: pend.maxEpoch, proof, seed }; store.set(KEY, W); load();
}
function useGuest() { const kp = new Ed25519Keypair(); W = { kind: 'guest', sk: kp.getSecretKey(), addr: kp.toSuiAddress(), name: '' }; store.set(KEY, W); load(); refresh(); }
function signOut() { W = null; store.set(KEY, null); load(); st.data = null; emit(); }

// the server builds the transaction and signs as gas sponsor, we add the player's signature and send both back
async function act(action, args, label) {
  if (!KP) throw new Error('Connect a wallet first');
  busy = label || 'Working on Sui...'; st.err = ''; emit();
  try {
    const pr = await post('prepare', { sender: st.addr, action, args });
    const bytes = fromBase64(pr.bytes); let { signature } = await KP.signTransaction(bytes);
    if (W.kind === 'zk') signature = getZkLoginSignature({ inputs: Object.assign({}, W.proof, { addressSeed: W.seed }), maxEpoch: W.maxEpoch, userSignature: signature });
    const ex = await post('exec', { bytes: pr.bytes, signatures: [signature, pr.sponsorSig], action, sender: st.addr });
    busy = ''; await refresh(); return ex;
  } catch (e) {
    busy = ''; st.err = String(e.message || e);
    if (W && W.kind === 'zk' && /epoch|expired|zklogin/i.test(st.err)) st.err = 'Your Google session for Sui ran out. Sign in again';
    emit(); throw e;
  }
}
// best kill clip to Walrus (testnet storage), returns the blob id
async function uploadClip(blob) {
  CFG = CFG || await get('config'); busy = 'Uploading your clip to Walrus...'; emit();
  try {
    const r = await fetch(CFG.walrusPublisher + '/v1/blobs?epochs=5', { method: 'PUT', body: blob });
    if (!r.ok) throw new Error('Walrus upload failed (' + r.status + ')');
    const d = await r.json(), id = (d.newlyCreated && d.newlyCreated.blobObject && d.newlyCreated.blobObject.blobId) || (d.alreadyCertified && d.alreadyCertified.blobId);
    if (!id) throw new Error('Walrus gave no blob id'); busy = ''; emit(); return id;
  } catch (e) { busy = ''; st.err = e.message; emit(); throw e; }
}

window.LOOPSUI = {
  st, refresh, signIn: () => signIn().catch((e) => { st.err = e.message; emit(); }), useGuest, signOut,
  mint: (skin, name) => act('mint', { skin, name }, 'Minting your Yeti NFT...'),
  record: (yeti) => act('record', { yeti }, 'Writing your match on chain...'),
  join: (tour) => act('join', { tour }, 'Joining the tournament...'),
  clip: async (blob, meta) => { const id = await uploadClip(blob); return act('clip', Object.assign({ blob: id }, meta), 'Minting your Clip NFT...').then((x) => Object.assign({ blob: id }, x)); },
  tours: () => get('tours'), board: () => get('board'), config: async () => (CFG = CFG || await get('config')),
  explorer: (a) => 'https://suiscan.xyz/devnet/' + (a && a.length > 60 && a.startsWith('0x') ? 'object/' : 'account/') + a,
  walrus: (b) => 'https://aggregator.walrus-testnet.walrus.space/v1/blobs/' + b,
};

(async () => {
  load();
  try { CFG = await get('config'); st.cfg = CFG; } catch (e) { st.err = 'Sui server not reachable'; }
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('id_token') && h.get('state') === 'loopzk') { try { await finishSignIn(h.get('id_token')); } catch (e) { st.err = e.message; } busy = ''; }
  st.ready = true; emit(); refresh();
})();
