// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockWETH} from "../src/mocks/MockWETH.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title TestBasicFlow
/// @notice Basic deployment and registration test that works on LIVE chains
/// @dev No time manipulation - safe to broadcast
contract TestBasicFlow is Script {
    uint256 constant REGISTRATION_BOND = 0.001 ether;
    uint256 constant ACTIVATION_DELAY = 1 days;

    function run() external {
        console2.log("============================================");
        console2.log("   BASIC FLOW TEST (Live Chain Safe)");
        console2.log("============================================\n");

        uint256 deployerPk =
            vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPk);

        console2.log("Deployer:", deployer);
        console2.log("Deployer Balance:", deployer.balance);

        vm.startBroadcast(deployerPk);

        // 1. Deploy tokens
        console2.log("\n--- Step 1: Deploy Tokens ---");
        MockUSDC usdc = new MockUSDC();
        MockWETH weth = new MockWETH();
        console2.log("MockUSDC:", address(usdc));
        console2.log("MockWETH:", address(weth));

        // 2. Deploy registry
        console2.log("\n--- Step 2: Deploy Registry ---");
        ReputationRegistry impl = new ReputationRegistry();
        bytes memory initData = abi.encodeWithSelector(
            ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, deployer
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        ReputationRegistry registry = ReputationRegistry(address(proxy));
        console2.log("Registry:", address(registry));

        // 3. Register deployer
        console2.log("\n--- Step 3: Register Deployer ---");
        registry.register{value: REGISTRATION_BOND}();
        console2.log("Registered! Time:", registry.getRegistrationTime(deployer));

        // 4. Check status
        console2.log("\n--- Step 4: Check Status ---");
        console2.log("Is Registered:", registry.isRegistered(deployer));
        console2.log("Reputation Age:", registry.getReputationAge(deployer));
        console2.log("Is Active:", registry.isReputationActive(deployer));
        console2.log("Total Registered:", registry.totalRegistered());

        // 5. Mint some tokens
        console2.log("\n--- Step 5: Mint Test Tokens ---");
        usdc.mint(deployer, 10000 * 10 ** 6);
        weth.mint(deployer, 10 ether);
        console2.log("USDC Balance:", usdc.balanceOf(deployer));
        console2.log("WETH Balance:", weth.balanceOf(deployer));

        vm.stopBroadcast();

        console2.log("\n============================================");
        console2.log("   BASIC FLOW TEST PASSED!");
        console2.log("============================================");
        console2.log("\nNote: Reputation will activate after 1 day.");
        console2.log("Note: Bond can be withdrawn after 30 days.");
    }
}

/// @title TestFullFlow
/// @notice Complete user flow test with time manipulation (SIMULATION ONLY)
/// @dev Uses vm.warp() - DO NOT use with --broadcast
contract TestFullFlow is Script {
    // Constants
    uint256 constant REGISTRATION_BOND = 0.001 ether;
    uint256 constant ACTIVATION_DELAY = 1 days;

    // Deployed contracts
    MockUSDC public usdc;
    MockWETH public weth;
    ReputationRegistry public registry;

    // Test users (Anvil default accounts)
    address constant USER1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Account 1
    address constant USER2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Account 2
    address constant USER3 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906; // Account 3

    // Private keys for Anvil accounts
    uint256 constant USER1_PK = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 constant USER2_PK = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 constant USER3_PK = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;

    function run() external {
        console2.log("============================================");
        console2.log("   FULL USER FLOW TEST ON ANVIL");
        console2.log("============================================\n");

        // Step 1: Deploy all contracts
        _step1_deploy();

        // Step 2: Register users
        _step2_registerUsers();

        // Step 3: Check reputation before activation
        _step3_checkReputationBeforeActivation();

        // Step 4: Warp time past activation delay
        _step4_warpPastActivation();

        // Step 5: Check reputation after activation (Tier 1)
        _step5_checkTier1();

        // Step 6: Warp to Tier 2 (30+ days)
        _step6_warpToTier2();

        // Step 7: Warp to Tier 3 (90+ days)
        _step7_warpToTier3();

        // Step 8: Warp to Tier 4 (180+ days)
        _step8_warpToTier4();

        // Step 9: Test bond withdrawal
        _step9_withdrawBond();

        // Step 10: Test pause/unpause
        _step10_testPause();

        console2.log("\n============================================");
        console2.log("   ALL TESTS PASSED!");
        console2.log("============================================");
    }

    function _step1_deploy() internal {
        console2.log("STEP 1: Deploying Contracts");
        console2.log("-------------------------------------------");

        uint256 deployerPk =
            vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPk);

        vm.startBroadcast(deployerPk);

        // Deploy tokens
        usdc = new MockUSDC();
        weth = new MockWETH();
        console2.log("  MockUSDC:", address(usdc));
        console2.log("  MockWETH:", address(weth));

        // Deploy registry
        ReputationRegistry impl = new ReputationRegistry();
        bytes memory initData = abi.encodeWithSelector(
            ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, deployer
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        registry = ReputationRegistry(address(proxy));
        console2.log("  Registry:", address(registry));

        // Mint tokens to test users
        usdc.mint(USER1, 10000 * 10 ** 6);
        usdc.mint(USER2, 10000 * 10 ** 6);
        usdc.mint(USER3, 10000 * 10 ** 6);
        weth.mint(USER1, 10 ether);
        weth.mint(USER2, 10 ether);
        weth.mint(USER3, 10 ether);

        vm.stopBroadcast();

        // Deal ETH to test users for registration bond
        vm.deal(USER1, 10 ether);
        vm.deal(USER2, 10 ether);
        vm.deal(USER3, 10 ether);

        // Verify deployment
        require(registry.registrationBond() == REGISTRATION_BOND, "Wrong bond");
        require(registry.activationDelay() == ACTIVATION_DELAY, "Wrong delay");
        console2.log("  Deployment verified!\n");
    }

    function _step2_registerUsers() internal {
        console2.log("STEP 2: Registering Users");
        console2.log("-------------------------------------------");

        // Register User 1
        vm.broadcast(USER1_PK);
        registry.register{value: REGISTRATION_BOND}();
        console2.log("  User1 registered:", USER1);
        console2.log("    Registration time:", registry.getRegistrationTime(USER1));

        // Register User 2
        vm.broadcast(USER2_PK);
        registry.register{value: REGISTRATION_BOND}();
        console2.log("  User2 registered:", USER2);

        // Verify registrations
        require(registry.isRegistered(USER1), "User1 not registered");
        require(registry.isRegistered(USER2), "User2 not registered");
        require(!registry.isRegistered(USER3), "User3 should not be registered");
        require(registry.totalRegistered() == 2, "Wrong total registered");
        console2.log("  Total registered:", registry.totalRegistered());
        console2.log("");
    }

    function _step3_checkReputationBeforeActivation() internal {
        console2.log("STEP 3: Check Reputation Before Activation");
        console2.log("-------------------------------------------");

        uint256 age1 = registry.getReputationAge(USER1);
        uint256 age3 = registry.getReputationAge(USER3); // Unregistered

        console2.log("  User1 reputation age:", age1, "(should be 0)");
        console2.log("  User3 reputation age:", age3, "(unregistered, should be 0)");
        console2.log("  User1 reputation active:", registry.isReputationActive(USER1));

        require(age1 == 0, "Age should be 0 before activation");
        require(age3 == 0, "Unregistered user age should be 0");
        require(!registry.isReputationActive(USER1), "Should not be active yet");
        console2.log("  Verified: No reputation before activation delay\n");
    }

    function _step4_warpPastActivation() internal {
        console2.log("STEP 4: Warp Time Past Activation Delay");
        console2.log("-------------------------------------------");

        uint256 timeBefore = block.timestamp;
        vm.warp(block.timestamp + ACTIVATION_DELAY + 1);
        uint256 timeAfter = block.timestamp;

        console2.log("  Time before:", timeBefore);
        console2.log("  Time after:", timeAfter);
        console2.log("  Warped:", timeAfter - timeBefore, "seconds");
        console2.log("");
    }

    function _step5_checkTier1() internal {
        console2.log("STEP 5: Check Tier 1 (0-30 days)");
        console2.log("-------------------------------------------");

        uint256 age1 = registry.getReputationAge(USER1);
        bool isActive = registry.isReputationActive(USER1);

        console2.log("  User1 reputation age:", age1, "seconds");
        console2.log("  User1 reputation active:", isActive);
        console2.log("  Expected tier: 1 (0% discount, 0.30% fee)");

        require(isActive, "Should be active now");
        require(age1 > 0, "Age should be > 0");
        require(age1 < 30 days, "Should be in Tier 1");
        console2.log("  Verified: Tier 1 active\n");
    }

    function _step6_warpToTier2() internal {
        console2.log("STEP 6: Warp to Tier 2 (30+ days)");
        console2.log("-------------------------------------------");

        // Warp to 31 days after registration
        vm.warp(block.timestamp + 30 days);

        uint256 age1 = registry.getReputationAge(USER1);
        console2.log("  User1 reputation age:", age1 / 1 days, "days");
        console2.log("  Expected tier: 2 (25% discount, 0.225% fee)");

        require(age1 >= 30 days, "Should be >= 30 days");
        require(age1 < 90 days, "Should be < 90 days");
        console2.log("  Verified: Tier 2 active\n");
    }

    function _step7_warpToTier3() internal {
        console2.log("STEP 7: Warp to Tier 3 (90+ days)");
        console2.log("-------------------------------------------");

        // Warp to 91 days
        vm.warp(block.timestamp + 60 days);

        uint256 age1 = registry.getReputationAge(USER1);
        console2.log("  User1 reputation age:", age1 / 1 days, "days");
        console2.log("  Expected tier: 3 (50% discount, 0.15% fee)");

        require(age1 >= 90 days, "Should be >= 90 days");
        require(age1 < 180 days, "Should be < 180 days");
        console2.log("  Verified: Tier 3 active\n");
    }

    function _step8_warpToTier4() internal {
        console2.log("STEP 8: Warp to Tier 4 (180+ days)");
        console2.log("-------------------------------------------");

        // Warp to 181 days
        vm.warp(block.timestamp + 90 days);

        uint256 age1 = registry.getReputationAge(USER1);
        console2.log("  User1 reputation age:", age1 / 1 days, "days");
        console2.log("  Expected tier: 4 (75% discount, 0.075% fee)");

        require(age1 >= 180 days, "Should be >= 180 days");
        console2.log("  Verified: Tier 4 active (max discount!)\n");
    }

    function _step9_withdrawBond() internal {
        console2.log("STEP 9: Withdraw Registration Bond");
        console2.log("-------------------------------------------");

        // We're now past 30 days, so bond withdrawal should work
        uint256 balanceBefore = USER1.balance;

        vm.broadcast(USER1_PK);
        registry.withdrawBond();

        uint256 balanceAfter = USER1.balance;
        uint256 recovered = balanceAfter - balanceBefore;

        console2.log("  User1 balance before:", balanceBefore);
        console2.log("  User1 balance after:", balanceAfter);
        console2.log("  Bond recovered:", recovered);

        // Check reputation is still active after withdrawal
        uint256 age = registry.getReputationAge(USER1);
        console2.log("  Reputation age after withdrawal:", age / 1 days, "days");

        require(recovered == REGISTRATION_BOND, "Wrong bond amount");
        require(age >= 180 days, "Reputation should remain");
        console2.log("  Verified: Bond withdrawn, reputation intact\n");
    }

    function _step10_testPause() internal {
        console2.log("STEP 10: Test Pause/Unpause");
        console2.log("-------------------------------------------");

        uint256 deployerPk =
            vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        // Pause
        vm.broadcast(deployerPk);
        registry.pause();
        console2.log("  Registry paused:", registry.paused());
        require(registry.paused(), "Should be paused");

        // Try to register while paused (should fail)
        vm.expectRevert();
        vm.broadcast(USER3_PK);
        registry.register{value: REGISTRATION_BOND}();
        console2.log("  Registration blocked while paused: OK");

        // Existing users still have reputation
        uint256 age = registry.getReputationAge(USER1);
        console2.log("  User1 reputation during pause:", age / 1 days, "days");
        require(age >= 180 days, "Existing reputation unaffected");

        // Unpause
        vm.broadcast(deployerPk);
        registry.unpause();
        console2.log("  Registry unpaused:", !registry.paused());
        require(!registry.paused(), "Should be unpaused");

        // Now registration works
        vm.broadcast(USER3_PK);
        registry.register{value: REGISTRATION_BOND}();
        console2.log("  User3 registered after unpause:", registry.isRegistered(USER3));
        require(registry.isRegistered(USER3), "User3 should be registered");
        console2.log("  Verified: Pause/unpause works correctly\n");
    }
}
