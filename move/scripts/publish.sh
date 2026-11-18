#!/usr/bin/env bash
# Re-publishes the LOOP Move package to Sui devnet end to end and rewrites ../../sui.config.json.
# Devnet is wiped periodically: after a wipe just run this again (keys in .secrets stay valid).
#
#   cd ~/Desktop/loop/move/scripts && ./publish.sh
#
# Uses a dedicated CLI config in ~/Desktop/loop/.secrets/sui so the global ~/.sui config is never touched.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MOVE_DIR="$(cd "$HERE/.." && pwd)"
ROOT="$(cd "$MOVE_DIR/.." && pwd)"
CLIENT_CFG="$ROOT/.secrets/sui/client.yaml"
SUI_BIN="${SUI_BIN:-$(command -v sui-devnet || echo "$HOME/.local/bin/sui-devnet")}"
GAS_BUDGET="${GAS_BUDGET:-2000000000}"   # publish costs ~1.13 SUI on devnet (publish charge)
MIN_BALANCE=3000000000                   # top up below 3 SUI

S() { "$SUI_BIN" client --client.config "$CLIENT_CFG" "$@"; }

echo "== CLI: $("$SUI_BIN" --version)"
S switch --env devnet >/dev/null

CHAIN_ID="$(S chain-identifier | sed -n 's/^Hex: //p')"
[ -n "$CHAIN_ID" ] || { echo "could not read chain id"; exit 1; }
echo "== devnet chain id: $CHAIN_ID"

# Point Move.toml at the current devnet chain id and forget any previous devnet publication.
sed -i.bak -E "s/^devnet = \"[0-9a-f]+\"/devnet = \"$CHAIN_ID\"/" "$MOVE_DIR/Move.toml" && rm -f "$MOVE_DIR/Move.toml.bak"
rm -f "$MOVE_DIR/Published.toml"

balance_of() {
  S balance "$1" --json 2>/dev/null | python3 -c '
import sys, json
d = json.load(sys.stdin)
rows = d[0] if d and isinstance(d[0], list) else []
print(sum(int(r["balance"]["balance"]) for r in rows if r.get("balance", {}).get("coinType", "").endswith("::sui::SUI")))
' 2>/dev/null || echo 0
}

for who in loop-admin loop-game; do
  bal="$(balance_of "$who")"
  echo "== $who balance: $bal MIST"
  if [ "${bal:-0}" -lt "$MIN_BALANCE" ]; then
    for i in 1 2 3 4 5; do
      if S faucet --address "$who"; then break; fi
      echo "faucet retry $i"; sleep 10
    done
    sleep 3
  fi
done

S switch --address loop-admin >/dev/null
OUT="$HERE/.last-publish.json"
echo "== publishing (budget $GAS_BUDGET MIST)"
(cd "$MOVE_DIR" && S publish --gas-budget "$GAS_BUDGET" --json) > "$OUT"
echo "== publish digest: $(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["digest"])' "$OUT")"

echo "== wiring: GameCap -> loop-game, set_game_pubkey, Display V2 for Yeti and Clip"
(cd "$HERE" && [ -d node_modules ] || npm ci --silent)
node "$HERE/post-publish.mjs" "$OUT"
echo "== wrote $ROOT/sui.config.json"
echo "== run 'node e2e.mjs' to verify"
