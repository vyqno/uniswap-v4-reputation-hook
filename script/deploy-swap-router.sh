#!/bin/bash
# Deploy PoolSwapTest using pre-compiled bytecode (avoids full project recompilation)
# Usage: ./script/deploy-swap-router.sh
#
# Requires: PRIVATE_KEY env variable set

set -e

POOL_MANAGER="0xE03A1074c86CFeDd5C142C4F04F1a1536e203543"
RPC_URL="${RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
ARTIFACT="out/PoolSwapTest.sol/PoolSwapTest.json"

if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: PRIVATE_KEY environment variable not set"
  echo "Usage: PRIVATE_KEY=0x... ./script/deploy-swap-router.sh"
  exit 1
fi

if [ ! -f "$ARTIFACT" ]; then
  echo "Error: Compiled artifact not found at $ARTIFACT"
  echo "Run 'forge build' first (with --skip flags if needed)"
  exit 1
fi

echo "=== Deploy PoolSwapTest ==="
echo "PoolManager: $POOL_MANAGER"
echo "RPC: $RPC_URL"
echo ""

# Get bytecode from compiled artifact
BYTECODE=$(python3 -c "
import json
with open('$ARTIFACT') as f:
    data = json.load(f)
print(data['bytecode']['object'])
")

# Encode constructor arg: constructor(IPoolManager _manager)
ENCODED_ARGS=$(cast abi-encode "constructor(address)" "$POOL_MANAGER")
# Remove 0x prefix from args
ENCODED_ARGS="${ENCODED_ARGS#0x}"

# Deploy
echo "Deploying..."
RESULT=$(cast send \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --json \
  --create "${BYTECODE}${ENCODED_ARGS}")

CONTRACT_ADDRESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['contractAddress'])")
TX_HASH=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['transactionHash'])")

echo ""
echo "=== SUCCESS ==="
echo "PoolSwapTest deployed at: $CONTRACT_ADDRESS"
echo "Transaction: $TX_HASH"
echo "Etherscan: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Update frontend/src/lib/constants.ts:"
echo "   swapRouter: \"$CONTRACT_ADDRESS\" as const,"
echo ""
echo "2. Update deployments/sepolia.json to add:"
echo "   \"swapRouter\": \"$CONTRACT_ADDRESS\""
