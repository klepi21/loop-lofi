// Generates the hardcoded ed25519 test vector used in tests/yeti_tests.move.
// Seed is a throwaway constant (32 bytes of 0x07); never use it for anything real.
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { bcs } from '@mysten/sui/bcs';
import { matchMessage } from './lib.mjs';

const kp = Ed25519Keypair.fromSecretKey(new Uint8Array(32).fill(7));
const msg = matchMessage({ yetiId: '0xa11ce', kills: 12, deaths: 3, won: true, xp: 450, seq: 1 });
const sig = await kp.sign(msg);
const hex = (u) => Buffer.from(u).toString('hex');
console.log('pubkey ', hex(kp.getPublicKey().toRawBytes()));
console.log('message', hex(msg));
console.log('sig    ', hex(sig));
