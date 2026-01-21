// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title TestHelper
/// @notice Base test helper with common setup and utilities
/// @dev Provides reusable functions for testing ReputationRegistry
abstract contract TestHelper is Test {
    // ============ Constants ============

    uint256 public constant REGISTRATION_BOND = 0.001 ether;
    uint256 public constant ACTIVATION_DELAY = 1 days;
    uint256 public constant BOND_COOLDOWN = 30 days;

    // ============ Test Addresses ============

    address public owner;
    address public user1;
    address public user2;
    address public user3;
    address public attacker;

    // ============ Contracts ============

    ReputationRegistry public registryImpl;
    ReputationRegistry public registry;
    ERC1967Proxy public registryProxy;

    // ============ Events (for expectEmit) ============

    event UserRegistered(address indexed user, uint256 timestamp, uint256 bondAmount);
    event BondWithdrawn(address indexed user, uint256 bondAmount);
    event RegistrationPaused(uint256 timestamp);
    event RegistrationUnpaused(uint256 timestamp);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Setup ============

    function setUp() public virtual {
        // Create test addresses
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        attacker = makeAddr("attacker");

        // Fund test addresses
        vm.deal(owner, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
        vm.deal(attacker, 100 ether);

        // Deploy registry with proxy
        _deployRegistry();
    }

    // ============ Internal Helpers ============

    /// @notice Deploy registry implementation and proxy
    function _deployRegistry() internal {
        vm.startPrank(owner);

        // Deploy implementation
        registryImpl = new ReputationRegistry();

        // Prepare initialization data
        bytes memory initData =
            abi.encodeWithSelector(ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, owner);

        // Deploy proxy
        registryProxy = new ERC1967Proxy(address(registryImpl), initData);
        registry = ReputationRegistry(address(registryProxy));

        vm.stopPrank();
    }

    /// @notice Register a user with default bond
    /// @param user The user to register
    function _registerUser(address user) internal {
        vm.prank(user);
        registry.register{value: REGISTRATION_BOND}();
    }

    /// @notice Register a user and advance time past activation
    /// @param user The user to register
    function _registerAndActivate(address user) internal {
        _registerUser(user);
        vm.warp(block.timestamp + ACTIVATION_DELAY + 1);
    }

    /// @notice Register a user and advance to a specific reputation age
    /// @param user The user to register
    /// @param ageAfterActivation Time in seconds after activation
    function _registerWithAge(address user, uint256 ageAfterActivation) internal {
        _registerUser(user);
        vm.warp(block.timestamp + ACTIVATION_DELAY + ageAfterActivation);
    }

    /// @notice Calculate expected fee for a given reputation age
    /// @param reputationAge The reputation age in seconds
    /// @return fee The expected fee in hundredths of bps
    function _calculateExpectedFee(uint256 reputationAge) internal pure returns (uint24) {
        uint256 discountBps;

        if (reputationAge >= 180 days) {
            discountBps = 7500; // 75%
        } else if (reputationAge >= 90 days) {
            discountBps = 5000; // 50%
        } else if (reputationAge >= 30 days) {
            discountBps = 2500; // 25%
        } else {
            discountBps = 0; // 0%
        }

        uint256 baseFee = 3000;
        uint256 minFee = 500;
        uint256 discountedFee = (baseFee * (10000 - discountBps)) / 10000;

        return discountedFee < minFee ? uint24(minFee) : uint24(discountedFee);
    }
}
