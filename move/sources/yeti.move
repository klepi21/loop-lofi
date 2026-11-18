/// LOOP (Lofi Out Of Patience) yeti NFTs with server-signed match stats.
#[allow(lint(share_owned, self_transfer))]
module lofi_loop::yeti;

use std::internal;
use std::string::{Self, String};
use sui::bcs;
use sui::display_registry::{Self, DisplayRegistry};
use sui::ed25519;
use sui::event;
use sui::package;
use sui::transfer_policy;

// === Errors ===
const EBadSkin: u64 = 1;
const EBadName: u64 = 2;
const EBadSignature: u64 = 3;
const EStaleSeq: u64 = 4;
const ENoGameKey: u64 = 5;
const EBadPubkey: u64 = 6;

// === Constants ===
const MAX_SKIN: u8 = 7;
const MAX_NAME_CHARS: u64 = 14;
const XP_PER_LEVEL: u64 = 300;
const MAX_LEVEL: u64 = 100;

/// One-time witness.
public struct YETI has drop {}

/// Held by the publisher (loop-admin).
public struct AdminCap has key, store { id: UID }

/// Held by the game server (loop-game). Lets it pay out tournaments.
public struct GameCap has key, store { id: UID }

public struct Registry has key {
    id: UID,
    minted: u64,
    /// Raw 32-byte ed25519 public key of the game server.
    game_pubkey: vector<u8>,
    base_image: String,
}

public struct Yeti has key, store {
    id: UID,
    name: String,
    skin: u8,
    kills: u64,
    deaths: u64,
    wins: u64,
    matches: u64,
    xp: u64,
    level: u64,
    seq: u64,
    image_url: String,
}

// === Events ===
public struct Minted has copy, drop {
    yeti_id: ID,
    owner: address,
    name: String,
    skin: u8,
    number: u64,
}

public struct MatchRecorded has copy, drop {
    yeti_id: ID,
    kills: u64,
    deaths: u64,
    won: bool,
    xp: u64,
    seq: u64,
    total_xp: u64,
    level: u64,
}

fun init(otw: YETI, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);

    let (policy, policy_cap) = transfer_policy::new<Yeti>(&publisher, ctx);
    transfer::public_share_object(policy);
    transfer::public_transfer(policy_cap, ctx.sender());

    transfer::share_object(Registry {
        id: object::new(ctx),
        minted: 0,
        game_pubkey: vector[],
        base_image: b"https://loop-lofi.vercel.app/nft/".to_string(),
    });

    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    transfer::transfer(GameCap { id: object::new(ctx) }, ctx.sender());
    transfer::public_transfer(publisher, ctx.sender());
}

/// Display V2 (sui::display_registry). Display V1 creation is disabled on current networks and
/// the DisplayRegistry (shared object 0xd) cannot be passed to init, so this runs once right after
/// publish. Aborts if the Display<Yeti> already exists. The DisplayCap goes to the sender.
public fun create_display(_: &AdminCap, registry: &mut DisplayRegistry, ctx: &mut TxContext) {
    let (mut d, cap) = display_registry::new(registry, internal::permit<Yeti>(), ctx);
    d.set(&cap, b"name".to_string(), b"{name}".to_string());
    d.set(
        &cap,
        b"description".to_string(),
        b"A LOOP yeti. Level {level}, {wins} wins, {kills} snowball hits. Lofi Out Of Patience.".to_string(),
    );
    d.set(&cap, b"image_url".to_string(), b"{image_url}".to_string());
    d.set(&cap, b"project_url".to_string(), b"https://loop-lofi.vercel.app".to_string());
    d.set(&cap, b"link".to_string(), b"https://loop-lofi.vercel.app/game".to_string());
    d.share();
    transfer::public_transfer(cap, ctx.sender());
}

/// Free mint to the sender. skin 0..7, name 1..14 characters (UTF-8 aware).
public fun mint(reg: &mut Registry, name: String, skin: u8, ctx: &mut TxContext) {
    let y = new_yeti(reg, name, skin, ctx);
    transfer::public_transfer(y, ctx.sender());
}

/// Same as mint but returns the Yeti so a PTB can place it (e.g. into a Kiosk).
public fun mint_yeti(reg: &mut Registry, name: String, skin: u8, ctx: &mut TxContext): Yeti {
    new_yeti(reg, name, skin, ctx)
}

fun new_yeti(reg: &mut Registry, name: String, skin: u8, ctx: &mut TxContext): Yeti {
    assert!(skin <= MAX_SKIN, EBadSkin);
    let chars = utf8_char_count(name.as_bytes());
    assert!(chars >= 1 && chars <= MAX_NAME_CHARS, EBadName);

    let mut image_url = reg.base_image;
    image_url.append(u8_to_string(skin));
    image_url.append(b".png".to_string());

    reg.minted = reg.minted + 1;
    let y = Yeti {
        id: object::new(ctx),
        name,
        skin,
        kills: 0,
        deaths: 0,
        wins: 0,
        matches: 0,
        xp: 0,
        level: 1,
        seq: 0,
        image_url,
    };
    event::emit(Minted {
        yeti_id: object::id(&y),
        owner: ctx.sender(),
        name: y.name,
        skin,
        number: reg.minted,
    });
    y
}

/// Apply a match result signed by the game server.
/// `xp` is the xp gained in this match; `seq` must be strictly greater than the yeti's last seq.
public fun record_match(
    reg: &Registry,
    y: &mut Yeti,
    kills: u64,
    deaths: u64,
    won: bool,
    xp: u64,
    seq: u64,
    sig: vector<u8>,
) {
    assert!(reg.game_pubkey.length() == 32, ENoGameKey);
    assert!(seq > y.seq, EStaleSeq);
    let msg = match_message(object::id(y).to_address(), kills, deaths, won, xp, seq);
    assert!(ed25519::ed25519_verify(&sig, &reg.game_pubkey, &msg), EBadSignature);

    y.kills = y.kills + kills;
    y.deaths = y.deaths + deaths;
    if (won) y.wins = y.wins + 1;
    y.matches = y.matches + 1;
    y.xp = y.xp + xp;
    y.level = level_for(y.xp);
    y.seq = seq;

    event::emit(MatchRecorded {
        yeti_id: object::id(y),
        kills,
        deaths,
        won,
        xp,
        seq,
        total_xp: y.xp,
        level: y.level,
    });
}

/// The exact bytes the game server signs (65 bytes):
/// yeti id (32) || kills u64 LE || deaths u64 LE || won bool (1) || xp u64 LE || seq u64 LE
public fun match_message(
    yeti_id: address,
    kills: u64,
    deaths: u64,
    won: bool,
    xp: u64,
    seq: u64,
): vector<u8> {
    let mut msg = bcs::to_bytes(&yeti_id);
    msg.append(bcs::to_bytes(&kills));
    msg.append(bcs::to_bytes(&deaths));
    msg.append(bcs::to_bytes(&won));
    msg.append(bcs::to_bytes(&xp));
    msg.append(bcs::to_bytes(&seq));
    msg
}

public fun level_for(xp: u64): u64 {
    let l = 1 + xp / XP_PER_LEVEL;
    if (l > MAX_LEVEL) MAX_LEVEL else l
}

// === Admin ===
public fun set_game_pubkey(_: &AdminCap, reg: &mut Registry, pubkey: vector<u8>) {
    assert!(pubkey.length() == 32, EBadPubkey);
    reg.game_pubkey = pubkey;
}

public fun set_base_image(_: &AdminCap, reg: &mut Registry, base_image: String) {
    reg.base_image = base_image;
}

// === Getters ===
public fun name(y: &Yeti): String { y.name }
public fun skin(y: &Yeti): u8 { y.skin }
public fun kills(y: &Yeti): u64 { y.kills }
public fun deaths(y: &Yeti): u64 { y.deaths }
public fun wins(y: &Yeti): u64 { y.wins }
public fun matches(y: &Yeti): u64 { y.matches }
public fun xp(y: &Yeti): u64 { y.xp }
public fun level(y: &Yeti): u64 { y.level }
public fun seq(y: &Yeti): u64 { y.seq }
public fun image_url(y: &Yeti): String { y.image_url }
public fun minted(reg: &Registry): u64 { reg.minted }
public fun game_pubkey(reg: &Registry): vector<u8> { reg.game_pubkey }
public fun base_image(reg: &Registry): String { reg.base_image }

// === Internal ===
fun utf8_char_count(bytes: &vector<u8>): u64 {
    let mut n = 0;
    let mut i = 0;
    let len = bytes.length();
    while (i < len) {
        // Count every byte that is not a UTF-8 continuation byte (10xxxxxx).
        if ((bytes[i] & 0xC0) != 0x80) n = n + 1;
        i = i + 1;
    };
    n
}

fun u8_to_string(v: u8): String {
    if (v == 0) return b"0".to_string();
    let mut digits = vector[];
    let mut x = v;
    while (x > 0) {
        digits.push_back(48 + x % 10);
        x = x / 10;
    };
    digits.reverse();
    string::utf8(digits)
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) { init(YETI {}, ctx) }

#[test_only]
public fun set_seq_for_testing(y: &mut Yeti, seq: u64) { y.seq = seq }
