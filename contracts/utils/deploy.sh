source .env && forge create --rpc-url https://base.llamarpc.com \
    --constructor-args $KEEPER_ADDRESS \
    --private-key $PRIVATE_KEY \
    --etherscan-api-key $BASESCAN_API_KEY \
    --verify \
    src/VaultFactory.sol