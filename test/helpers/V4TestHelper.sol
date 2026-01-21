// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {HookMiner} from "./HookMiner.sol";

import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {ReputationFeeHook} from "../../src/ReputationFeeHook.sol";
import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";
import {MockWETH} from "../../src/mocks/MockWETH.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title V4TestHelper
/// @notice Test helper for Uniswap V4 integration tests
/// @dev Inherits from Deployers to use V4 test utilities
abstract contract V4TestHelper is Test, Deployers {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    // ============ Constants ============

    uint256 public constant REGISTRATION_BOND = 0.001 ether;
    uint256 public constant ACTIVATION_DELAY = 1 days;
    // Note: SQRT_PRICE_1_1 is inherited from Deployers

    // ============ Test Addresses ============

    address public owner;
    address public user1;
    address public user2;
    address public user3;
    address public lpProvider;

    // ============ Contracts ============

    ReputationRegistry public registryImpl;
    ReputationRegistry public registry;
    ERC1967Proxy public registryProxy;
    ReputationFeeHook public hook;

    MockUSDC public usdc;
    MockWETH public weth;

    PoolKey public poolKey;
    PoolId public poolId;

    // ============ Events ============

    event DynamicFeeApplied(address indexed user, PoolId indexed poolId, uint256 reputationAge, uint24 feeApplied);

    // ============ Setup ============

    function setUp() public virtual {
        // Create test addresses
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        lpProvider = makeAddr("lpProvider");

        // Fund test addresses
        vm.deal(owner, 1000 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(user3, 100 ether);
        vm.deal(lpProvider, 1000 ether);

        // Deploy V4 infrastructure
        deployFreshManagerAndRouters();

        // Deploy registry
        _deployRegistry();

        // Deploy mock tokens
        _deployTokens();

        // Deploy hook with correct address
        _deployHook();

        // Initialize pool
        _initializePool();
    }

    // ============ Internal Helpers ============

    /// @notice Deploy registry implementation and proxy
    function _deployRegistry() internal {
        vm.startPrank(owner);

        registryImpl = new ReputationRegistry();

        bytes memory initData =
            abi.encodeWithSelector(ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, owner);

        registryProxy = new ERC1967Proxy(address(registryImpl), initData);
        registry = ReputationRegistry(address(registryProxy));

        vm.stopPrank();
    }

    /// @notice Deploy mock tokens
    function _deployTokens() internal {
        vm.startPrank(owner);

        usdc = new MockUSDC();
        weth = new MockWETH();

        // Mint tokens to LP provider and users
        usdc.mint(lpProvider, 1_000_000 * 10 ** 6);
        weth.mint(lpProvider, 1000 * 10 ** 18);

        usdc.mint(user1, 100_000 * 10 ** 6);
        weth.mint(user1, 100 * 10 ** 18);

        usdc.mint(user2, 100_000 * 10 ** 6);
        weth.mint(user2, 100 * 10 ** 18);

        usdc.mint(user3, 100_000 * 10 ** 6);
        weth.mint(user3, 100 * 10 ** 18);

        vm.stopPrank();
    }

    /// @notice Deploy hook with mined address that has correct flags
    function _deployHook() internal {
        // Define hook flags - only beforeSwap is enabled
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);

        // Mine a salt that produces a valid hook address
        (address hookAddress, bytes32 salt) =
            HookMiner.find(address(this), flags, type(ReputationFeeHook).creationCode, abi.encode(manager, registry));

        // Deploy hook with the mined salt
        hook = new ReputationFeeHook{salt: salt}(manager, IReputationRegistry(address(registry)));

        // Verify the address matches
        require(address(hook) == hookAddress, "Hook address mismatch");
    }

    /// @notice Initialize pool with hook
    function _initializePool() internal {
        // Sort currencies (lower address first)
        Currency currency0;
        Currency currency1;

        if (address(usdc) < address(weth)) {
            currency0 = Currency.wrap(address(usdc));
            currency1 = Currency.wrap(address(weth));
        } else {
            currency0 = Currency.wrap(address(weth));
            currency1 = Currency.wrap(address(usdc));
        }

        // Create pool key with dynamic fee
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG, // Dynamic fee
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        poolId = poolKey.toId();

        // Initialize pool at 1:1 price
        manager.initialize(poolKey, SQRT_PRICE_1_1);
    }

    /// @notice Register a user with default bond
    function _registerUser(address user) internal {
        vm.prank(user);
        registry.register{value: REGISTRATION_BOND}();
    }

    /// @notice Register and activate a user's reputation
    function _registerAndActivate(address user) internal {
        _registerUser(user);
        vm.warp(block.timestamp + ACTIVATION_DELAY + 1);
    }

    /// @notice Register a user with specific reputation age
    function _registerWithAge(address user, uint256 ageAfterActivation) internal {
        _registerUser(user);
        vm.warp(block.timestamp + ACTIVATION_DELAY + ageAfterActivation);
    }
}
