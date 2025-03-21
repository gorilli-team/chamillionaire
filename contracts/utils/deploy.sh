#!/bin/bash

set -e  # Exit on error

# Load environment variables
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

source .env

# Check required env vars
REQUIRED_VARS=("KEEPER_ADDRESS" "PRIVATE_KEY" "BASESCAN_API_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Environment variable '$var' is not set."
        exit 1
    fi
done

# Deploy the contract
echo "🚀 Deploying VaultFactory to Base..."
forge create src/VaultFactory.sol:VaultFactory \
    --rpc-url https://base.llamarpc.com \
    --constructor-args "$KEEPER_ADDRESS" \
    --private-key "$PRIVATE_KEY" \
    --etherscan-api-key "$BASESCAN_API_KEY" \
    --verify \
    --legacy
