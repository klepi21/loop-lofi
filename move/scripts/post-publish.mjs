// Runs after `sui client publish --json`: wires the package up and writes ../../sui.config.json.
// Usage: node post-publish.mjs <publish-output.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { Transaction } from '@mysten/sui/transactions';
import { loadEnv, makeClient, keypair, run, created, CONFIG } from './lib.mjs';

const pub = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const env = loadEnv();
const client = makeClient(env.SUI_RPC);
const admin = keypair(env.LOOP_ADMIN_KEY);
const game = keypair(env.LOOP_GAME_KEY);
if (admin.toSuiAddress() !== env.LOOP_ADMIN_ADDRESS || game.toSuiAddress() !== env.LOOP_GAME_ADDRESS) throw new Error('key/address mismatch in devnet.env');

const changes = pub.objectChanges;
const packageId = changes.find((c) => c.type === 'published').packageId;
const byType = (suffix) => {
  const c = changes.find((c) => c.type === 'created' && c.objectType.endsWith(suffix));
  if (!c) throw new Error('missing created object ' + suffix);
  return c.objectId;
};
const ids = {
  registryId: byType('::yeti::Registry'),
  adminCapId: byType('::yeti::AdminCap'),
  gameCapId: byType('::yeti::GameCap'),
  policyId: byType(`::transfer_policy::TransferPolicy<${packageId}::yeti::Yeti>`),
  policyCapId: byType(`::transfer_policy::TransferPolicyCap<${packageId}::yeti::Yeti>`),
  upgradeCapId: byType('::package::UpgradeCap'),
  publisherIds: changes.filter((c) => c.type === 'created' && c.objectType.endsWith('::package::Publisher')).map((c) => c.objectId),
};

// One PTB: GameCap -> loop-game, set game pubkey, create Display V2 for Yeti and Clip.
const pubkeyHex = env.LOOP_GAME_PUBKEY_HEX;
if (Buffer.from(game.getPublicKey().toRawBytes()).toString('hex') !== pubkeyHex) throw new Error('LOOP_GAME_PUBKEY_HEX mismatch');
const tx = new Transaction();
tx.setSender(admin.toSuiAddress());
tx.transferObjects([tx.object(ids.gameCapId)], game.toSuiAddress());
tx.moveCall({
  target: `${packageId}::yeti::set_game_pubkey`,
  arguments: [tx.object(ids.adminCapId), tx.object(ids.registryId), tx.pure.vector('u8', Buffer.from(pubkeyHex, 'hex'))],
});
tx.moveCall({ target: `${packageId}::yeti::create_display`, arguments: [tx.object(ids.adminCapId), tx.object('0xd')] });
tx.moveCall({ target: `${packageId}::clip::create_display`, arguments: [tx.object(ids.adminCapId), tx.object('0xd')] });
const t = await run(client, tx, admin, 'setup');

const displays = created(t, '::display_registry::Display<');
const displayCaps = created(t, '::display_registry::DisplayCap<');
const pick = (list, mod) => list.find((o) => o.type.includes(`::${mod}`))?.id;

const config = {
  network: 'devnet',
  rpc: env.SUI_RPC,
  rpcProtocol: 'gRPC-web (JSON-RPC is disabled on public fullnodes); GraphQL: https://graphql.devnet.sui.io/graphql',
  chainId: (await client.core.getChainIdentifier()).chainIdentifier,
  packageId,
  registryId: ids.registryId,
  policyId: ids.policyId,
  policyCapId: ids.policyCapId,
  displayIds: { yeti: pick(displays, 'yeti::Yeti'), clip: pick(displays, 'clip::Clip') },
  displayCapIds: { yeti: pick(displayCaps, 'yeti::Yeti'), clip: pick(displayCaps, 'clip::Clip') },
  displayRegistryId: '0xd',
  publisherIds: ids.publisherIds,
  adminCapId: ids.adminCapId,
  gameCapId: ids.gameCapId,
  upgradeCapId: ids.upgradeCapId,
  adminAddress: admin.toSuiAddress(),
  gameAddress: game.toSuiAddress(),
  gamePubkeyHex: pubkeyHex,
  clockId: '0x6',
  publishDigest: pub.digest,
  setupDigest: t.digest,
  publishedAt: new Date().toISOString(),
};
writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');
console.log(JSON.stringify(config, null, 2));
