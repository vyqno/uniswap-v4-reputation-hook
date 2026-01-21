// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {ReputationFeeHook} from "../../src/ReputationFeeHook.sol";
import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title SepoliaForkTest
/// @notice Fork tests against Sepolia testnet
/// @dev These tests verify contract behavior on a forked network
/// @dev Set SEPOLIA_RPC_URL environment variable to run these tests
contract SepoliaForkTest is Test {
    // ============ Fork Configuration ============

    // Set to true when Sepolia RPC is available
    bool constant FORK_ENABLED = false;

    // Sepolia contract addresses (update after deployment)
    address constant POOL_MANAGER_SEPOLIA = address(0); // TODO: Update after deployment
    address constant REGISTRY_SEPOLIA = address(0); // TODO: Update after deployment
    address constant HOOK_SEPOLIA = address(0); // TODO: Update after deployment

    // Test tokens on Sepolia
    address constant USDC_SEPOLIA = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // Circle USDC on Sepolia
    address constant WETH_SEPOLIA = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9; // WETH on Sepolia

    // ============ State ============

    uint256 sepoliaFork;
    ReputationRegistry registry;
    ReputationFeeHook hook;

    // ============ Setup ============

    function setUp() public {
        if (!FORK_ENABLED) {
            return;
        }

        // Create fork from Sepolia
        string memory rpcUrl = vm.envString("SEPOLIA_RPC_URL");
        sepoliaFork = vm.createFork(rpcUrl);
        vm.selectFork(sepoliaFork);

        // Connect to deployed contracts
        if (REGISTRY_SEPOLIA != address(0)) {
            registry = ReputationRegistry(REGISTRY_SEPOLIA);
        }
        if (HOOK_SEPOLIA != address(0)) {
            hook = ReputationFeeHook(HOOK_SEPOLIA);
        }
    }

    // ============ Fork Tests ============

    /// @notice Test fork is active
    function test_Fork_IsActive() public view {
        if (!FORK_ENABLED) {
            console2.log("Fork tests disabled. Set FORK_ENABLED = true and SEPOLIA_RPC_URL");
            return;
        }

        assertEq(vm.activeFork(), sepoliaFork, "Should be on Sepolia fork");
    }

    /// @notice Test registry exists on Sepolia
    function test_Fork_RegistryExists() public view {
        if (!FORK_ENABLED || REGISTRY_SEPOLIA == address(0)) {
            console2.log("Skipping: Registry not deployed");
            return;
        }

        assertTrue(address(registry).code.length > 0, "Registry should have code");
    }

    /// @notice Test hook exists on Sepolia
    function test_Fork_HookExists() public view {
        if (!FORK_ENABLED || HOOK_SEPOLIA == address(0)) {
            console2.log("Skipping: Hook not deployed");
            return;
        }

        assertTrue(address(hook).code.length > 0, "Hook should have code");
    }

    /// @notice Test registry configuration matches expected
    function test_Fork_RegistryConfiguration() public view {
        if (!FORK_ENABLED || REGISTRY_SEPOLIA == address(0)) {
            console2.log("Skipping: Registry not deployed");
            return;
        }

        assertEq(registry.registrationBond(), 0.001 ether, "Bond should be 0.001 ETH");
        assertEq(registry.activationDelay(), 1 days, "Activation delay should be 1 day");
    }

    /// @notice Test hook constants on Sepolia
    function test_Fork_HookConstants() public view {
        if (!FORK_ENABLED || HOOK_SEPOLIA == address(0)) {
            console2.log("Skipping: Hook not deployed");
            return;
        }

        assertEq(hook.BASE_FEE(), 3000, "BASE_FEE should be 3000");
        assertEq(hook.MIN_FEE(), 500, "MIN_FEE should be 500");
    }

    /// @notice Test registration on forked Sepolia
    function test_Fork_Registration() public {
        if (!FORK_ENABLED || REGISTRY_SEPOLIA == address(0)) {
            console2.log("Skipping: Registry not deployed");
            return;
        }

        address testUser = makeAddr("forkTestUser");
        vm.deal(testUser, 1 ether);

        // Skip if user is already registered (from previous test runs)
        if (registry.isRegistered(testUser)) {
            console2.log("User already registered on fork");
            return;
        }

        vm.prank(testUser);
        registry.register{value: 0.001 ether}();

        assertTrue(registry.isRegistered(testUser), "User should be registered");
    }

    /// @notice Test fee quote on forked Sepolia
    function test_Fork_FeeQuote() public {
        if (!FORK_ENABLED || HOOK_SEPOLIA == address(0)) {
            console2.log("Skipping: Hook not deployed");
            return;
        }

        address randomUser = makeAddr("randomForkUser");
        uint24 fee = hook.getFeeQuote(randomUser);

        assertEq(fee, hook.BASE_FEE(), "Unregistered user should pay base fee");
    }

    /// @notice Test USDC exists on Sepolia
    function test_Fork_USDCExists() public view {
        if (!FORK_ENABLED) {
            console2.log("Fork tests disabled");
            return;
        }

        assertTrue(USDC_SEPOLIA.code.length > 0, "USDC should exist on Sepolia");

        // Check token details
        IERC20 usdc = IERC20(USDC_SEPOLIA);
        assertTrue(usdc.totalSupply() > 0, "USDC should have supply");
    }

    /// @notice Test WETH exists on Sepolia
    function test_Fork_WETHExists() public view {
        if (!FORK_ENABLED) {
            console2.log("Fork tests disabled");
            return;
        }

        assertTrue(WETH_SEPOLIA.code.length > 0, "WETH should exist on Sepolia");
    }
}

/// @title LocalForkSimulationTest
/// @notice Simulated fork tests that run locally without actual RPC
/// @dev These tests simulate fork-like conditions for CI/CD environments
contract LocalForkSimulationTest is Test {
    ReputationRegistry public registryImpl;
    ReputationRegistry public registry;
    ERC1967Proxy public registryProxy;

    address public owner;
    address public user1;

    uint256 constant REGISTRATION_BOND = 0.001 ether;
    uint256 constant ACTIVATION_DELAY = 1 days;

    function setUp() public {
        owner = makeAddr("owner");
        user1 = makeAddr("user1");

        vm.deal(owner, 100 ether);
        vm.deal(user1, 100 ether);

        // Simulate deployment on a "forked" network
        vm.startPrank(owner);

        registryImpl = new ReputationRegistry();
        bytes memory initData =
            abi.encodeWithSelector(ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, owner);
        registryProxy = new ERC1967Proxy(address(registryImpl), initData);
        registry = ReputationRegistry(address(registryProxy));

        vm.stopPrank();
    }

    /// @notice Test simulated fork state persistence
    function test_SimulatedFork_StatePersistence() public {
        // Register user
        vm.prank(user1);
        registry.register{value: REGISTRATION_BOND}();

        // Create a snapshot (simulating fork block)
        uint256 snapshot = vm.snapshotState();

        // Advance time
        vm.warp(block.timestamp + 30 days + ACTIVATION_DELAY);

        // Check reputation age
        uint256 age = registry.getReputationAge(user1);
        assertGt(age, 0, "Should have reputation age");

        // Revert to snapshot (simulating fork revert)
        vm.revertToState(snapshot);

        // After revert, should be back to original state
        assertTrue(registry.isRegistered(user1), "Should still be registered after snapshot revert");
    }

    /// @notice Test simulated fork with multiple users
    function test_SimulatedFork_MultipleUsers() public {
        address[] memory users = new address[](5);

        for (uint256 i = 0; i < 5; i++) {
            users[i] = makeAddr(string(abi.encodePacked("forkUser", i)));
            vm.deal(users[i], 1 ether);

            vm.prank(users[i]);
            registry.register{value: REGISTRATION_BOND}();
        }

        assertEq(registry.totalRegistered(), 5, "Should have 5 registered users");

        // Simulate block advancement
        vm.roll(block.number + 1000);
        vm.warp(block.timestamp + 100 days);

        // All users should have reputation
        for (uint256 i = 0; i < 5; i++) {
            assertTrue(registry.isReputationActive(users[i]), "User should be active");
        }
    }

    /// @notice Test simulated fork block characteristics
    function test_SimulatedFork_BlockCharacteristics() public view {
        // Check we're on a standard EVM setup
        assertGt(block.number, 0, "Should have block number");
        assertGt(block.timestamp, 0, "Should have timestamp");
        assertEq(block.chainid, 31337, "Should be on Anvil/Hardhat network");
    }

    /// @notice Test gas consumption on simulated fork
    function test_SimulatedFork_GasConsumption() public {
        uint256 gasBefore = gasleft();

        vm.prank(user1);
        registry.register{value: REGISTRATION_BOND}();

        uint256 gasUsed = gasBefore - gasleft();

        // Registration should use reasonable gas
        assertLt(gasUsed, 200000, "Registration should use less than 200k gas");
        console2.log("Registration gas used:", gasUsed);
    }

    /// @notice Test storage layout on simulated fork
    function test_SimulatedFork_StorageLayout() public {
        vm.prank(user1);
        registry.register{value: REGISTRATION_BOND}();

        // Read storage directly
        uint256 totalRegistered = registry.totalRegistered();
        assertEq(totalRegistered, 1, "Should have 1 registration in storage");

        // Verify proxy storage
        address impl = address(
            uint160(
                uint256(
                    vm.load(
                        address(registry),
                        bytes32(uint256(0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc))
                    )
                )
            )
        );
        assertEq(impl, address(registryImpl), "Implementation should match");
    }
}
