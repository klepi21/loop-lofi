/// Kill-clip NFTs pointing at a Walrus blob.
#[allow(lint(share_owned, self_transfer))]
module lofi_loop::clip;

use lofi_loop::yeti::AdminCap;
use std::internal;
use std::string::String;
use sui::clock::Clock;
use sui::display_registry::{Self, DisplayRegistry};
use sui::event;
use sui::package;

const EBadBlob: u64 = 1;
const EBadTitle: u64 = 2;

public struct CLIP has drop {}

public struct Clip has key, store {
    id: UID,
    blob_id: String,
    title: String,
    kills: u64,
    map: String,
    created_ms: u64,
}

public struct ClipMinted has copy, drop { clip_id: ID, owner: address, blob_id: String, kills: u64 }

fun init(otw: CLIP, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);
    transfer::public_transfer(publisher, ctx.sender());
}

/// Display V2 for Clip, run once after publish (see yeti::create_display).
public fun create_display(_: &AdminCap, registry: &mut DisplayRegistry, ctx: &mut TxContext) {
    let (mut d, cap) = display_registry::new(registry, internal::permit<Clip>(), ctx);
    d.set(&cap, b"name".to_string(), b"{title}".to_string());
    d.set(&cap, b"description".to_string(), b"A LOOP kill clip: {kills} hits on {map}. Video stored on Walrus.".to_string());
    d.set(&cap, b"link".to_string(), b"https://aggregator.walrus-testnet.walrus.space/v1/blobs/{blob_id}".to_string());
    d.set(&cap, b"image_url".to_string(), b"https://loop-lofi.vercel.app/nft/clip.png".to_string());
    d.set(&cap, b"project_url".to_string(), b"https://loop-lofi.vercel.app".to_string());
    d.share();
    transfer::public_transfer(cap, ctx.sender());
}

public fun mint_clip(blob_id: String, title: String, kills: u64, map: String, clock: &Clock, ctx: &mut TxContext) {
    assert!(blob_id.length() > 0 && blob_id.length() <= 128, EBadBlob);
    assert!(title.length() > 0 && title.length() <= 96, EBadTitle);
    let c = Clip { id: object::new(ctx), blob_id, title, kills, map, created_ms: clock.timestamp_ms() };
    event::emit(ClipMinted { clip_id: object::id(&c), owner: ctx.sender(), blob_id, kills });
    transfer::public_transfer(c, ctx.sender());
}

public fun blob_id(c: &Clip): String { c.blob_id }
public fun title(c: &Clip): String { c.title }
public fun kills(c: &Clip): u64 { c.kills }
public fun map(c: &Clip): String { c.map }
public fun created_ms(c: &Clip): u64 { c.created_ms }

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) { init(CLIP {}, ctx) }
