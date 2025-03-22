// script/DeployVaultFactory.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {VaultFactory} from "../src/VaultFactory.sol";

contract DeployVaultFactory is Script {
    function run() external {
        vm.startBroadcast();
        new VaultFactory(vm.envAddress("KEEPER_ADDRESS"));
        vm.stopBroadcast();
    }
}
