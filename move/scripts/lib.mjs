// Shared helpers for LOOP Sui scripts (also a reference for the game server).
import { bcs } from '@mysten/sui/bcs';

// Exact byte layout signed by the game server and checked by yeti::record_match:
//   yeti object id (address, 32 bytes) || kills u64 LE || deaths u64 LE || won bool (1 byte) || xp u64 LE || seq u64 LE
// Total 65 bytes. Signature is raw ed25519 over these bytes (no intent prefix, no hashing).
export const MatchResult = bcs.struct('MatchResult', {
  yeti: bcs.Address,
  kills: bcs.u64(),
  deaths: bcs.u64(),
  won: bcs.bool(),
  xp: bcs.u64(),
  seq: bcs.u64(),
});

export function matchMessage({ yetiId, kills, deaths, won, xp, seq }) {
  return MatchResult.serialize({ yeti: yetiId, kills: BigInt(kills), deaths: BigInt(deaths), won, xp: BigInt(xp), seq: BigInt(seq) }).toBytes();
}

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '../..'); // ~/Desktop/loop
export const SECRETS = resolve(ROOT, '.secrets/devnet.env');
export const CONFIG = resolve(ROOT, 'sui.config.json');

export function loadEnv(path = SECRETS) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

export function loadConfig() {
  if (!existsSync(CONFIG)) throw new Error('sui.config.json missing, run publish.sh first');
  return JSON.parse(readFileSync(CONFIG, 'utf8'));
}

// Public fullnodes no longer serve JSON-RPC; the SDK talks gRPC-web to the same URL.
export function makeClient(rpc = 'https://fullnode.devnet.sui.io:443') {
  return new SuiGrpcClient({ network: 'devnet', baseUrl: rpc });
}

export const keypair = (suiprivkey) => Ed25519Keypair.fromSecretKey(suiprivkey);

/** Throws if the transaction failed; returns the Transaction payload. */
export function ok(result, label = 'tx') {
  if (result.$kind !== 'Transaction') {
    const f = result.FailedTransaction;
    throw new Error(`${label} failed: ${JSON.stringify(f?.status?.error ?? f?.status ?? result)}`);
  }
  return result.Transaction;
}

export const TX_INCLUDE = { effects: true, objectTypes: true, events: true };

/** Sign and execute with one signer, then wait until it is indexed. */
export async function run(client, tx, signer, label) {
  const r = await client.signAndExecuteTransaction({ transaction: tx, signer, include: TX_INCLUDE });
  const t = ok(r, label);
  await client.waitForTransaction({ digest: t.digest });
  return t;
}

/**
 * Sponsored transaction: `user` is the sender, `sponsor` (loop-game) pays gas.
 * Both sign the same bytes; the node gets [userSig, sponsorSig].
 */
export async function runSponsored(client, tx, user, sponsor, label) {
  tx.setSender(user.toSuiAddress());
  tx.setGasOwner(sponsor.toSuiAddress());
  const bytes = await tx.build({ client });
  const { signature: userSig } = await user.signTransaction(bytes);
  const { signature: sponsorSig } = await sponsor.signTransaction(bytes);
  const r = await client.executeTransaction({ transaction: bytes, signatures: [userSig, sponsorSig], include: TX_INCLUDE });
  const t = ok(r, label);
  await client.waitForTransaction({ digest: t.digest });
  return t;
}

/** Created object ids from a transaction, optionally filtered by a type substring. */
export function created(t, typeIncludes) {
  return t.effects.changedObjects
    .filter((o) => o.idOperation === 'Created')
    .map((o) => ({ id: o.objectId, type: t.objectTypes?.[o.objectId] ?? '' }))
    .filter((o) => !typeIncludes || o.type.includes(typeIncludes));
}
