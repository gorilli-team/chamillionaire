// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {Vault} from "./Vault.sol";

contract VaultFactory is Ownable {
    address public keeper;
    mapping(address owner => address vault) public vaults;

    constructor(address _keeper) Ownable(msg.sender) {
        keeper = _keeper;
    }

    function setKeeper(address _keeper) external onlyOwner {
        keeper = _keeper;
    }

    function createVault() external returns (address) {
        require(vaults[msg.sender] == address(0), "Vault already exists");

        Vault vault = new Vault(msg.sender, keeper);
        vaults[msg.sender] = address(vault);
        return address(vault);
    }
}
