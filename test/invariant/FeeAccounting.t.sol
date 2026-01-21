// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {ReputationFeeHook} from "../../src/ReputationFeeHook.sol";
import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "../helpers/HookMiner.sol";

/// @title RegistryHandler
/// @notice Handler contract for invariant testing of ReputationRegistry
/// @dev Exposes functions that can be called randomly during invariant testing
contract RegistryHandler is Test {
    ReputationRegistry public registry;

    // Track state for invariant assertions
    address[] public registeredUsers;
    mapping(address => bool) public hasRegistered;
    mapping(address => bool) public hasWithdrawnBond;
    uint256 public totalBondsDeposited;
    uint256 public totalBondsWithdrawn;

    uint256 public constant REGISTRATION_BOND = 0.001 ether;
    uint256 public constant BOND_COOLDOWN = 30 days;

    constructor(ReputationRegistry _registry) {
        registry = _registry;
    }

    /// @notice Register a new user
    function register(uint256 userSeed) external {
        address user = _generateUser(userSeed);

        // Skip if already registered
        if (hasRegistered[user]) return;

        vm.deal(user, 1 ether);
        vm.prank(user);

        try registry.register{value: REGISTRATION_BOND}() {
            registeredUsers.push(user);
            hasRegistered[user] = true;
            totalBondsDeposited += REGISTRATION_BOND;
        } catch {
            // Expected to fail sometimes (e.g., when paused)
        }
    }

    /// @notice Withdraw bond for a registered user
    function withdrawBond(uint256 userIndex) external {
        if (registeredUsers.length == 0) return;

        userIndex = userIndex % registeredUsers.length;
        address user = registeredUsers[userIndex];

        // Skip if already withdrawn
        if (hasWithdrawnBond[user]) return;

        // Warp past cooldown
        uint256 regTime = registry.getRegistrationTime(user);
        if (regTime > 0) {
            vm.warp(regTime + BOND_COOLDOWN + 1);
        }

        vm.prank(user);
        try registry.withdrawBond() {
            hasWithdrawnBond[user] = true;
            totalBondsWithdrawn += REGISTRATION_BOND;
        } catch {
            // Expected to fail sometimes
        }
    }

    /// @notice Advance time
    function warpTime(uint256 timeDelta) external {
        timeDelta = bound(timeDelta, 0, 365 days);
        vm.warp(block.timestamp + timeDelta);
    }

    /// @notice Get total registered users
    function getRegisteredCount() external view returns (uint256) {
        return registeredUsers.length;
    }

    /// @notice Generate deterministic user address
    function _generateUser(uint256 seed) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encode("user", seed)))));
    }
}

/// @title HookHandler
/// @notice Handler contract for invariant testing of ReputationFeeHook
contract HookHandler is Test {
    ReputationFeeHook public hook;
    ReputationRegistry public registry;
    RegistryHandler public registryHandler;

    // Track calls for assertions
    uint256 public totalFeeQueries;
    uint256 public maxFeeObserved;
    uint256 public minFeeObserved;

    constructor(ReputationFeeHook _hook, ReputationRegistry _registry) {
        hook = _hook;
        registry = _registry;
        minFeeObserved = type(uint256).max;
    }

    function setRegistryHandler(RegistryHandler _handler) external {
        registryHandler = _handler;
    }

    /// @notice Query fee for random user
    function queryFee(uint256 userSeed) external {
        address user = _generateUser(userSeed);

        uint24 fee = hook.getFeeQuote(user);
        totalFeeQueries++;

        if (fee > maxFeeObserved) {
            maxFeeObserved = fee;
        }
        if (fee < minFeeObserved) {
            minFeeObserved = fee;
        }
    }

    /// @notice Register and query fee (delegates to RegistryHandler for tracking)
    function registerAndQueryFee(uint256 userSeed) external {
        // Use the RegistryHandler to keep tracking consistent
        if (address(registryHandler) != address(0)) {
            registryHandler.register(userSeed);
        }

        address user = _generateUser(userSeed);
        uint24 fee = hook.getFeeQuote(user);
        totalFeeQueries++;

        if (fee > maxFeeObserved) {
            maxFeeObserved = fee;
        }
        if (fee < minFeeObserved) {
            minFeeObserved = fee;
        }
    }

    function _generateUser(uint256 seed) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encode("user", seed)))));
    }
}

/// @title FeeAccountingInvariantTest
/// @notice Invariant tests for fee accounting and registry behavior
contract FeeAccountingInvariantTest is StdInvariant, Test, Deployers {
    ReputationRegistry public registryImpl;
    ReputationRegistry public registry;
    ERC1967Proxy public registryProxy;
    ReputationFeeHook public hook;

    RegistryHandler public registryHandler;
    HookHandler public hookHandler;

    address public owner;

    uint256 constant REGISTRATION_BOND = 0.001 ether;
    uint256 constant ACTIVATION_DELAY = 1 days;

    function setUp() public {
        owner = makeAddr("owner");
        vm.deal(owner, 100 ether);

        // Deploy V4 infrastructure
        deployFreshManagerAndRouters();

        // Deploy registry
        vm.startPrank(owner);
        registryImpl = new ReputationRegistry();
        bytes memory initData =
            abi.encodeWithSelector(ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, owner);
        registryProxy = new ERC1967Proxy(address(registryImpl), initData);
        registry = ReputationRegistry(address(registryProxy));
        vm.stopPrank();

        // Deploy hook
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);
        (, bytes32 salt) =
            HookMiner.find(address(this), flags, type(ReputationFeeHook).creationCode, abi.encode(manager, registry));
        hook = new ReputationFeeHook{salt: salt}(manager, IReputationRegistry(address(registry)));

        // Deploy handlers
        registryHandler = new RegistryHandler(registry);
        hookHandler = new HookHandler(hook, registry);

        // Link handlers for consistent tracking
        hookHandler.setRegistryHandler(registryHandler);

        // Set target contracts
        targetContract(address(registryHandler));
        targetContract(address(hookHandler));

        // Exclude certain addresses
        excludeSender(owner);
        excludeSender(address(registry));
        excludeSender(address(hook));
    }

    // ============ Invariants ============

    /// @notice Fees must always be within bounds [MIN_FEE, BASE_FEE]
    function invariant_feeWithinBounds() public view {
        if (hookHandler.totalFeeQueries() > 0) {
            assertGe(hookHandler.minFeeObserved(), hook.MIN_FEE(), "Fee below minimum");
            assertLe(hookHandler.maxFeeObserved(), hook.BASE_FEE(), "Fee above maximum");
        }
    }

    /// @notice Registry bond balance must equal (deposited - withdrawn)
    function invariant_registryBondBalance() public view {
        uint256 expectedBalance = registryHandler.totalBondsDeposited() - registryHandler.totalBondsWithdrawn();
        assertEq(address(registry).balance, expectedBalance, "Registry balance mismatch");
    }

    /// @notice Total registered must match handler tracking
    function invariant_totalRegisteredConsistent() public view {
        assertEq(registry.totalRegistered(), registryHandler.getRegisteredCount(), "Total registered mismatch");
    }

    /// @notice Registered users must have non-zero registration time
    function invariant_registeredUsersHaveTimestamp() public view {
        uint256 count = registryHandler.getRegisteredCount();
        for (uint256 i = 0; i < count && i < 10; i++) {
            // Sample first 10 users
            address user = registryHandler.registeredUsers(i);
            assertGt(registry.getRegistrationTime(user), 0, "Registered user has zero timestamp");
        }
    }

    /// @notice Older reputation should never pay more than newer
    function invariant_longerReputationPaysLessOrEqual() public view {
        // Check fee for different ages
        uint24 fee0Days = hook.getFeeForTier(1);
        uint24 fee30Days = hook.getFeeForTier(2);
        uint24 fee90Days = hook.getFeeForTier(3);
        uint24 fee180Days = hook.getFeeForTier(4);

        assertGe(fee0Days, fee30Days, "30 days should pay <= 0 days");
        assertGe(fee30Days, fee90Days, "90 days should pay <= 30 days");
        assertGe(fee90Days, fee180Days, "180 days should pay <= 90 days");
    }

    /// @notice Tier assignment must be monotonically increasing
    function invariant_tierMonotonicity() public view {
        uint8 prevTier = 0;
        uint256[] memory ages = new uint256[](5);
        ages[0] = 0;
        ages[1] = 29 days;
        ages[2] = 89 days;
        ages[3] = 179 days;
        ages[4] = 365 days;

        for (uint256 i = 0; i < ages.length; i++) {
            uint8 tier = hook.getTier(ages[i]);
            assertGe(tier, prevTier, "Tier must not decrease with age");
            prevTier = tier;
        }
    }

    /// @notice Constants must remain unchanged
    function invariant_constantsUnchanged() public view {
        assertEq(hook.BASE_FEE(), 3000, "BASE_FEE changed");
        assertEq(hook.MIN_FEE(), 500, "MIN_FEE changed");
        assertEq(hook.TIER_1_THRESHOLD(), 0, "TIER_1_THRESHOLD changed");
        assertEq(hook.TIER_2_THRESHOLD(), 30 days, "TIER_2_THRESHOLD changed");
        assertEq(hook.TIER_3_THRESHOLD(), 90 days, "TIER_3_THRESHOLD changed");
        assertEq(hook.TIER_4_THRESHOLD(), 180 days, "TIER_4_THRESHOLD changed");
    }

    /// @notice Registry configuration must remain unchanged
    function invariant_registryConfigUnchanged() public view {
        assertEq(registry.registrationBond(), REGISTRATION_BOND, "Bond changed");
        assertEq(registry.activationDelay(), ACTIVATION_DELAY, "Delay changed");
        assertEq(registry.owner(), owner, "Owner changed unexpectedly");
    }
}
