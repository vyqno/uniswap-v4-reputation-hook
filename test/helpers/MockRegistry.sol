// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";

/// @title MockRegistry
/// @notice Mock implementation of IReputationRegistry for testing
/// @dev Allows setting arbitrary reputation ages and simulating failures
contract MockRegistry is IReputationRegistry {
    mapping(address => uint256) public mockReputationAge;
    mapping(address => bool) public mockIsRegistered;
    mapping(address => uint256) public mockRegistrationTime;
    mapping(address => bool) public mockIsActive;

    bool public shouldRevert;
    string public revertMessage;

    uint256 public bondAmount = 0.001 ether;
    uint256 public delay = 1 days;
    uint256 public registered;
    bool public isPaused;

    // ============ Mock Control Functions ============

    function setReputationAge(address user, uint256 age) external {
        mockReputationAge[user] = age;
        mockIsRegistered[user] = true;
        mockIsActive[user] = true;
    }

    function setRegistered(address user, bool status) external {
        mockIsRegistered[user] = status;
    }

    function setActive(address user, bool status) external {
        mockIsActive[user] = status;
    }

    function setRegistrationTime(address user, uint256 time) external {
        mockRegistrationTime[user] = time;
        mockIsRegistered[user] = true;
    }

    function setShouldRevert(bool _shouldRevert, string memory _message) external {
        shouldRevert = _shouldRevert;
        revertMessage = _message;
    }

    function setBondAmount(uint256 _amount) external {
        bondAmount = _amount;
    }

    function setActivationDelay(uint256 _delay) external {
        delay = _delay;
    }

    function setTotalRegistered(uint256 _registered) external {
        registered = _registered;
    }

    function setPaused(bool _paused) external {
        isPaused = _paused;
    }

    // ============ IReputationRegistry Implementation ============

    function register() external payable returns (uint256) {
        if (shouldRevert) revert(revertMessage);
        mockIsRegistered[msg.sender] = true;
        mockRegistrationTime[msg.sender] = block.timestamp;
        registered++;
        emit UserRegistered(msg.sender, block.timestamp, bondAmount);
        return block.timestamp;
    }

    function withdrawBond() external {
        if (shouldRevert) revert(revertMessage);
        emit BondWithdrawn(msg.sender, bondAmount);
    }

    function getReputationAge(address user) external view returns (uint256) {
        if (shouldRevert) {
            revert(revertMessage);
        }
        return mockReputationAge[user];
    }

    function isReputationActive(address user) external view returns (bool) {
        if (shouldRevert) revert(revertMessage);
        return mockIsActive[user];
    }

    function isRegistered(address user) external view returns (bool) {
        return mockIsRegistered[user];
    }

    function getRegistrationTime(address user) external view returns (uint256) {
        return mockRegistrationTime[user];
    }

    function registrationBond() external view returns (uint256) {
        return bondAmount;
    }

    function activationDelay() external view returns (uint256) {
        return delay;
    }

    function totalRegistered() external view returns (uint256) {
        return registered;
    }

    function paused() external view returns (bool) {
        return isPaused;
    }
}
