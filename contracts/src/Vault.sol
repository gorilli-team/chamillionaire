// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract Vault is Ownable {
    address public keeper;

    modifier onlyKeeper() {
        require(msg.sender == keeper, "Only keeper can call this function");
        _;
    }

    constructor(address _owner, address _keeper) Ownable(_owner) {
        keeper = _keeper;
    }

    function deposit(address token, uint256 amount) external onlyOwner {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }

    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyKeeper {
        (bool success, ) = target.call{value: value}(data);
        require(success, "Failed to execute call");
    }
}
