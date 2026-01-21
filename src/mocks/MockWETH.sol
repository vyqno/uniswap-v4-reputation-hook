// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockWETH
/// @notice Mock Wrapped Ether token for testing with 18 decimals
/// @dev Anyone can mint tokens for testing purposes
contract MockWETH is ERC20 {
    /// @notice Deploy the mock token and mint initial supply to deployer
    constructor() ERC20("Mock Wrapped Ether", "WETH") {
        _mint(msg.sender, 1000 * 10 ** 18); // 1000 WETH
    }

    /// @notice Mint tokens to any address (for testing)
    /// @param to The recipient address
    /// @param amount The amount to mint (in wei)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Burn tokens from caller's balance
    /// @param amount The amount to burn
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice Deposit ETH and receive WETH (like real WETH)
    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    /// @notice Withdraw WETH and receive ETH (like real WETH)
    /// @param amount The amount of WETH to withdraw
    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    /// @notice Receive ETH and mint WETH
    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}
