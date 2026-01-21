// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {TestHelper} from "../helpers/TestHelper.sol";
import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title ReputationRegistryTest
/// @notice Comprehensive unit tests for ReputationRegistry contract
/// @dev Tests registration, bond management, reputation age, pause functionality, and upgrades
contract ReputationRegistryTest is TestHelper {
    // ============ Registration Tests ============

    /// @notice Test successful registration with exact bond amount
    function test_Register_Success() public {
        uint256 balanceBefore = user1.balance;
        uint256 contractBalanceBefore = address(registry).balance;

        vm.expectEmit(true, false, false, true);
        emit UserRegistered(user1, block.timestamp, REGISTRATION_BOND);

        vm.prank(user1);
        uint256 regTime = registry.register{value: REGISTRATION_BOND}();

        // Verify registration time
        assertEq(regTime, block.timestamp, "Registration time should be current block timestamp");

        // Verify user balance decreased by bond amount
        assertEq(user1.balance, balanceBefore - REGISTRATION_BOND, "User balance should decrease by bond");

        // Verify contract balance increased
        assertEq(address(registry).balance, contractBalanceBefore + REGISTRATION_BOND, "Contract should hold bond");

        // Verify user is registered
        assertTrue(registry.isRegistered(user1), "User should be registered");

        // Verify total registered count
        assertEq(registry.totalRegistered(), 1, "Total registered should be 1");
    }

    /// @notice Test registration with excess ETH returns refund
    function test_Register_ExcessEthRefunded() public {
        uint256 excessAmount = 0.01 ether;
        uint256 totalSent = REGISTRATION_BOND + excessAmount;
        uint256 balanceBefore = user1.balance;

        vm.prank(user1);
        registry.register{value: totalSent}();

        // User should only lose the bond amount, excess refunded
        assertEq(user1.balance, balanceBefore - REGISTRATION_BOND, "Excess ETH should be refunded");
    }

    /// @notice Test registration fails with insufficient bond
    function test_Register_InsufficientBond_Reverts() public {
        vm.prank(user1);
        vm.expectRevert(IReputationRegistry.InsufficientBond.selector);
        registry.register{value: 0.0001 ether}();
    }

    /// @notice Test registration fails with zero ETH
    function test_Register_ZeroValue_Reverts() public {
        vm.prank(user1);
        vm.expectRevert(IReputationRegistry.InsufficientBond.selector);
        registry.register{value: 0}();
    }

    /// @notice Test cannot register twice
    function test_Register_CannotRegisterTwice_Reverts() public {
        _registerUser(user1);

        vm.prank(user1);
        vm.expectRevert(IReputationRegistry.AlreadyRegistered.selector);
        registry.register{value: REGISTRATION_BOND}();
    }

    /// @notice Test registration fails when paused
    function test_Register_WhenPaused_Reverts() public {
        vm.prank(owner);
        registry.pause();

        vm.prank(user1);
        vm.expectRevert(IReputationRegistry.RegistrationIsPaused.selector);
        registry.register{value: REGISTRATION_BOND}();
    }

    /// @notice Test multiple users can register
    function test_Register_MultipleUsers() public {
        _registerUser(user1);
        _registerUser(user2);
        _registerUser(user3);

        assertTrue(registry.isRegistered(user1), "User1 should be registered");
        assertTrue(registry.isRegistered(user2), "User2 should be registered");
        assertTrue(registry.isRegistered(user3), "User3 should be registered");
        assertEq(registry.totalRegistered(), 3, "Total registered should be 3");
    }

    // ============ Reputation Age Tests ============

    /// @notice Test reputation age is 0 for unregistered user
    function test_GetReputationAge_Unregistered_ReturnsZero() public view {
        uint256 age = registry.getReputationAge(user1);
        assertEq(age, 0, "Unregistered user should have 0 reputation age");
    }

    /// @notice Test reputation age is 0 before activation delay
    function test_GetReputationAge_BeforeActivation_ReturnsZero() public {
        _registerUser(user1);

        // Immediately after registration
        uint256 age = registry.getReputationAge(user1);
        assertEq(age, 0, "Age should be 0 before activation delay");

        // Still before activation
        vm.warp(block.timestamp + ACTIVATION_DELAY - 1);
        age = registry.getReputationAge(user1);
        assertEq(age, 0, "Age should still be 0 just before activation");
    }

    /// @notice Test reputation age starts counting after activation delay
    function test_GetReputationAge_AfterActivation() public {
        _registerUser(user1);

        // Advance past activation delay
        uint256 daysAfterActivation = 10 days;
        vm.warp(block.timestamp + ACTIVATION_DELAY + daysAfterActivation);

        uint256 age = registry.getReputationAge(user1);
        assertEq(age, daysAfterActivation, "Age should equal time after activation");
    }

    /// @notice Test reputation age is exactly at activation boundary
    function test_GetReputationAge_AtExactActivationTime() public {
        _registerUser(user1);

        // Advance exactly to activation time
        vm.warp(block.timestamp + ACTIVATION_DELAY);

        uint256 age = registry.getReputationAge(user1);
        assertEq(age, 0, "Age should be 0 at exact activation time");

        // One second after
        vm.warp(block.timestamp + 1);
        age = registry.getReputationAge(user1);
        assertEq(age, 1, "Age should be 1 second after activation");
    }

    /// @notice Test isReputationActive returns correct values
    function test_IsReputationActive() public {
        // Before registration
        assertFalse(registry.isReputationActive(user1), "Should be inactive before registration");

        // After registration, before activation
        _registerUser(user1);
        assertFalse(registry.isReputationActive(user1), "Should be inactive before activation delay");

        // After activation
        vm.warp(block.timestamp + ACTIVATION_DELAY);
        assertTrue(registry.isReputationActive(user1), "Should be active after activation delay");
    }

    // ============ Bond Withdrawal Tests ============

    /// @notice Test successful bond withdrawal after cooldown
    function test_WithdrawBond_Success() public {
        _registerUser(user1);

        // Advance past cooldown
        vm.warp(block.timestamp + BOND_COOLDOWN);

        uint256 balanceBefore = user1.balance;

        vm.expectEmit(true, false, false, true);
        emit BondWithdrawn(user1, REGISTRATION_BOND);

        vm.prank(user1);
        registry.withdrawBond();

        // Verify balance increased
        assertEq(user1.balance, balanceBefore + REGISTRATION_BOND, "Should receive bond back");

        // Verify bond marked as withdrawn
        assertTrue(registry.hasBondWithdrawn(user1), "Bond should be marked as withdrawn");
    }

    /// @notice Test withdrawal fails before cooldown completes
    function test_WithdrawBond_BeforeCooldown_Reverts() public {
        _registerUser(user1);

        // Try immediately after registration
        vm.prank(user1);
        vm.expectRevert(IReputationRegistry.CooldownNotComplete.selector);
        registry.withdrawBond();

        // Try just before cooldown completes
        vm.warp(block.timestamp + BOND_COOLDOWN - 1);
        vm.prank(user1);
        vm.expectRevert(IReputationRegistry.CooldownNotComplete.selector);
        registry.withdrawBond();
    }

    /// @notice Test cannot withdraw bond twice
    function test_WithdrawBond_Twice_Reverts() public {
        _registerUser(user1);
        vm.warp(block.timestamp + BOND_COOLDOWN);

        vm.prank(user1);
        registry.withdrawBond();

        // Try withdrawing again
        vm.prank(user1);
        vm.expectRevert(IReputationRegistry.BondAlreadyWithdrawn.selector);
        registry.withdrawBond();
    }

    /// @notice Test unregistered user cannot withdraw
    function test_WithdrawBond_NotRegistered_Reverts() public {
        vm.prank(user1);
        vm.expectRevert(IReputationRegistry.NotRegistered.selector);
        registry.withdrawBond();
    }

    /// @notice Test reputation remains active after bond withdrawal
    function test_WithdrawBond_ReputationRemainsActive() public {
        _registerUser(user1);
        vm.warp(block.timestamp + BOND_COOLDOWN);

        vm.prank(user1);
        registry.withdrawBond();

        // Reputation should still be active
        assertTrue(registry.isReputationActive(user1), "Reputation should remain active");
        assertTrue(registry.isRegistered(user1), "Should still be registered");
        assertGt(registry.getReputationAge(user1), 0, "Should have reputation age");
    }

    // ============ Pause/Unpause Tests ============

    /// @notice Test owner can pause registration
    function test_Pause_ByOwner() public {
        vm.expectEmit(false, false, false, true);
        emit RegistrationPaused(block.timestamp);

        vm.prank(owner);
        registry.pause();

        assertTrue(registry.paused(), "Should be paused");
    }

    /// @notice Test non-owner cannot pause
    function test_Pause_ByNonOwner_Reverts() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(ReputationRegistry.OwnableUnauthorizedAccount.selector, attacker));
        registry.pause();
    }

    /// @notice Test owner can unpause
    function test_Unpause_ByOwner() public {
        vm.prank(owner);
        registry.pause();

        vm.expectEmit(false, false, false, true);
        emit RegistrationUnpaused(block.timestamp);

        vm.prank(owner);
        registry.unpause();

        assertFalse(registry.paused(), "Should be unpaused");
    }

    /// @notice Test non-owner cannot unpause
    function test_Unpause_ByNonOwner_Reverts() public {
        vm.prank(owner);
        registry.pause();

        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(ReputationRegistry.OwnableUnauthorizedAccount.selector, attacker));
        registry.unpause();
    }

    /// @notice Test existing users unaffected by pause
    function test_Pause_ExistingUsersUnaffected() public {
        // Register user before pause
        _registerUser(user1);
        vm.warp(block.timestamp + ACTIVATION_DELAY + 10 days);

        vm.prank(owner);
        registry.pause();

        // Existing user can still check reputation
        assertTrue(registry.isReputationActive(user1), "Existing user reputation should work");
        assertGt(registry.getReputationAge(user1), 0, "Should have reputation age");

        // Existing user can still withdraw bond
        vm.warp(block.timestamp + BOND_COOLDOWN);
        vm.prank(user1);
        registry.withdrawBond();
    }

    // ============ Ownership Tests ============

    /// @notice Test ownership transfer
    function test_TransferOwnership() public {
        address newOwner = makeAddr("newOwner");

        vm.expectEmit(true, true, false, true);
        emit OwnershipTransferred(owner, newOwner);

        vm.prank(owner);
        registry.transferOwnership(newOwner);

        assertEq(registry.owner(), newOwner, "Owner should be updated");

        // Old owner can no longer pause
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ReputationRegistry.OwnableUnauthorizedAccount.selector, owner));
        registry.pause();

        // New owner can pause
        vm.prank(newOwner);
        registry.pause();
        assertTrue(registry.paused(), "New owner should be able to pause");
    }

    /// @notice Test cannot transfer ownership to zero address
    function test_TransferOwnership_ToZeroAddress_Reverts() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(ReputationRegistry.OwnableInvalidOwner.selector, address(0)));
        registry.transferOwnership(address(0));
    }

    /// @notice Test non-owner cannot transfer ownership
    function test_TransferOwnership_ByNonOwner_Reverts() public {
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(ReputationRegistry.OwnableUnauthorizedAccount.selector, attacker));
        registry.transferOwnership(attacker);
    }

    // ============ View Function Tests ============

    /// @notice Test getRegistrationTime returns correct value
    function test_GetRegistrationTime() public {
        uint256 expectedTime = block.timestamp;
        _registerUser(user1);

        assertEq(registry.getRegistrationTime(user1), expectedTime, "Registration time should match");
        assertEq(registry.getRegistrationTime(user2), 0, "Unregistered should have 0");
    }

    /// @notice Test configuration getters
    function test_ConfigurationGetters() public view {
        assertEq(registry.registrationBond(), REGISTRATION_BOND, "Bond should match");
        assertEq(registry.activationDelay(), ACTIVATION_DELAY, "Delay should match");
        assertEq(registry.owner(), owner, "Owner should match");
        assertFalse(registry.paused(), "Should not be paused initially");
        assertEq(registry.totalRegistered(), 0, "No users initially");
    }

    // ============ Fuzz Tests ============

    /// @notice Fuzz test: random users can register
    function testFuzz_Register_RandomUsers(address user) public {
        // Skip zero address and contracts
        vm.assume(user != address(0));
        vm.assume(user.code.length == 0);
        vm.assume(user != owner); // Owner already has funds used in setup

        vm.deal(user, 1 ether);

        vm.prank(user);
        registry.register{value: REGISTRATION_BOND}();

        assertTrue(registry.isRegistered(user), "Random user should be registered");
    }

    /// @notice Fuzz test: reputation age calculation
    function testFuzz_ReputationAge_Calculation(uint32 timeAfterActivation) public {
        _registerUser(user1);

        // Warp to activation + random time
        uint256 warpTo = block.timestamp + ACTIVATION_DELAY + uint256(timeAfterActivation);
        vm.warp(warpTo);

        uint256 age = registry.getReputationAge(user1);
        assertEq(age, timeAfterActivation, "Age should match time after activation");
    }

    /// @notice Fuzz test: excess ETH refund
    function testFuzz_Register_ExcessRefund(uint128 excessAmount) public {
        vm.assume(excessAmount > 0);
        vm.assume(excessAmount < 100 ether);

        uint256 totalSent = REGISTRATION_BOND + excessAmount;
        vm.deal(user1, totalSent);

        uint256 balanceBefore = user1.balance;

        vm.prank(user1);
        registry.register{value: totalSent}();

        assertEq(user1.balance, balanceBefore - REGISTRATION_BOND, "Only bond should be taken");
    }

    // ============ Edge Case Tests ============

    /// @notice Test maximum time values don't overflow
    function test_ReputationAge_NoOverflow() public {
        _registerUser(user1);

        // Warp to far future (100 years)
        vm.warp(block.timestamp + 100 * 365 days);

        // Should not overflow
        uint256 age = registry.getReputationAge(user1);
        assertGt(age, 0, "Should have large age without overflow");
    }

    /// @notice Test contract receives and holds ETH correctly
    function test_ContractBalance() public {
        _registerUser(user1);
        assertEq(address(registry).balance, REGISTRATION_BOND, "Should hold one bond");

        _registerUser(user2);
        assertEq(address(registry).balance, 2 * REGISTRATION_BOND, "Should hold two bonds");

        // After withdrawal
        vm.warp(block.timestamp + BOND_COOLDOWN);
        vm.prank(user1);
        registry.withdrawBond();

        assertEq(address(registry).balance, REGISTRATION_BOND, "Should hold one bond after withdrawal");
    }
}
