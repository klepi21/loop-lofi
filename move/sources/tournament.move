/// Free-entry LOOP tournaments with a SUI prize pot.
#[allow(lint(share_owned, self_transfer))]
module lofi_loop::tournament;

use lofi_loop::yeti::{AdminCap, GameCap};
use std::string::String;
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::event;
use sui::sui::SUI;

const EBadWindow: u64 = 1;
const ENotOpen: u64 = 2;
const EAlreadyJoined: u64 = 3;
const EFull: u64 = 4;
const EAlreadyPaid: u64 = 5;
const ELengthMismatch: u64 = 6;
const EPotTooSmall: u64 = 7;
const ENoWinners: u64 = 8;

const MAX_ENTRANTS: u64 = 128;

public struct Tournament has key {
    id: UID,
    name: String,
    pot: Balance<SUI>,
    starts_ms: u64,
    ends_ms: u64,
    entrants: vector<address>,
    paid: bool,
}

public struct TournamentCreated has copy, drop { tournament_id: ID, name: String, starts_ms: u64, ends_ms: u64 }
public struct TournamentFunded has copy, drop { tournament_id: ID, from: address, amount: u64, pot: u64 }
public struct TournamentJoined has copy, drop { tournament_id: ID, player: address, entrants: u64 }
public struct TournamentPaid has copy, drop { tournament_id: ID, winners: vector<address>, amounts: vector<u64>, remaining: u64 }

public fun create(_: &AdminCap, name: String, starts_ms: u64, ends_ms: u64, ctx: &mut TxContext) {
    assert!(ends_ms > starts_ms, EBadWindow);
    let t = Tournament {
        id: object::new(ctx),
        name,
        pot: balance::zero(),
        starts_ms,
        ends_ms,
        entrants: vector[],
        paid: false,
    };
    event::emit(TournamentCreated { tournament_id: object::id(&t), name, starts_ms, ends_ms });
    transfer::share_object(t);
}

/// Anyone can add SUI to the pot.
public fun fund(t: &mut Tournament, c: Coin<SUI>, ctx: &TxContext) {
    let amount = c.value();
    t.pot.join(c.into_balance());
    event::emit(TournamentFunded { tournament_id: object::id(t), from: ctx.sender(), amount, pot: t.pot.value() });
}

/// Free entry while starts_ms <= now < ends_ms and not yet paid.
public fun join(t: &mut Tournament, clock: &Clock, ctx: &TxContext) {
    let now = clock.timestamp_ms();
    assert!(!t.paid && now >= t.starts_ms && now < t.ends_ms, ENotOpen);
    let me = ctx.sender();
    assert!(!t.entrants.contains(&me), EAlreadyJoined);
    assert!(t.entrants.length() < MAX_ENTRANTS, EFull);
    t.entrants.push_back(me);
    event::emit(TournamentJoined { tournament_id: object::id(t), player: me, entrants: t.entrants.length() });
}

/// Game server payout (loop-game holds GameCap).
public fun payout(_: &GameCap, t: &mut Tournament, winners: vector<address>, amounts: vector<u64>, ctx: &mut TxContext) {
    do_payout(t, winners, amounts, ctx)
}

/// Admin payout (loop-admin holds AdminCap).
public fun payout_admin(_: &AdminCap, t: &mut Tournament, winners: vector<address>, amounts: vector<u64>, ctx: &mut TxContext) {
    do_payout(t, winners, amounts, ctx)
}

/// Admin reclaims whatever is left in the pot (e.g. after payout or a cancelled event).
public fun sweep(_: &AdminCap, t: &mut Tournament, ctx: &mut TxContext) {
    let v = t.pot.value();
    if (v > 0) transfer::public_transfer(coin::take(&mut t.pot, v, ctx), ctx.sender());
}

fun do_payout(t: &mut Tournament, winners: vector<address>, amounts: vector<u64>, ctx: &mut TxContext) {
    assert!(!t.paid, EAlreadyPaid);
    let n = winners.length();
    assert!(n > 0, ENoWinners);
    assert!(n == amounts.length(), ELengthMismatch);
    let mut total = 0;
    let mut i = 0;
    while (i < n) { total = total + amounts[i]; i = i + 1; };
    assert!(total <= t.pot.value(), EPotTooSmall);
    i = 0;
    while (i < n) {
        let a = amounts[i];
        if (a > 0) transfer::public_transfer(coin::take(&mut t.pot, a, ctx), winners[i]);
        i = i + 1;
    };
    t.paid = true;
    event::emit(TournamentPaid { tournament_id: object::id(t), winners, amounts, remaining: t.pot.value() });
}

// === Getters ===
public fun name(t: &Tournament): String { t.name }
public fun pot_value(t: &Tournament): u64 { t.pot.value() }
public fun starts_ms(t: &Tournament): u64 { t.starts_ms }
public fun ends_ms(t: &Tournament): u64 { t.ends_ms }
public fun entrants(t: &Tournament): vector<address> { t.entrants }
public fun is_paid(t: &Tournament): bool { t.paid }
