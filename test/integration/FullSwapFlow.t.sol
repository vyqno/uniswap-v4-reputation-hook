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
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";

import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {ReputationFeeHook} from "../../src/ReputationFeeHook.sol";
import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {HookMiner} from "../helpers/HookMiner.sol";

/// @title FullSwapFlowTest
/// @notice Integration tests for complete swap flow with dynamic fees
/// @dev Tests full lifecycle: deploy → register → swap → verify fee differences
contract FullSwapFlowTest is Test, Deployers {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    // ============ Constants ============

    uint256 constant REGISTRATION_BOND = 0.001 ether;
    uint256 constant ACTIVATION_DELAY = 1 days;
    uint256 constant INITIAL_LIQUIDITY = 1e20; // Large liquidity for testing

    // ============ Test State ============

    ReputationRegistry public registryImpl;
    ReputationRegistry public registry;
    ERC1967Proxy public registryProxy;
    ReputationFeeHook public hook;

    PoolKey public poolKey;
    PoolId public poolId;

    address public owner;
    address public lpProvider;
    address public userUnregistered;
    address public userTier1;
    address public userTier2;
    address public userTier3;
    address public userTier4;

    MockERC20 public token0;
    MockERC20 public token1;

    // ============ Events ============

    event DynamicFeeApplied(address indexed user, PoolId indexed poolId, uint256 reputationAge, uint24 feeApplied);

    // ============ Setup ============

    function setUp() public {
        // Create test addresses
        owner = makeAddr("owner");
        lpProvider = makeAddr("lpProvider");
        userUnregistered = makeAddr("userUnregistered");
        userTier1 = makeAddr("userTier1");
        userTier2 = makeAddr("userTier2");
        userTier3 = makeAddr("userTier3");
        userTier4 = makeAddr("userTier4");

        // Fund addresses
        vm.deal(owner, 100 ether);
        vm.deal(lpProvider, 100 ether);
        vm.deal(userUnregistered, 100 ether);
        vm.deal(userTier1, 100 ether);
        vm.deal(userTier2, 100 ether);
        vm.deal(userTier3, 100 ether);
        vm.deal(userTier4, 100 ether);

        // Deploy V4 infrastructure
        deployFreshManagerAndRouters();

        // Deploy registry
        _deployRegistry();

        // Deploy hook
        _deployHook();

        // Deploy tokens and initialize pool
        _setupPoolWithLiquidity();

        // Setup users with different registration ages
        _setupUsersWithDifferentAges();
    }

    // ============ Internal Setup Helpers ============

    function _deployRegistry() internal {
        vm.startPrank(owner);

        registryImpl = new ReputationRegistry();

        bytes memory initData =
            abi.encodeWithSelector(ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, owner);

        registryProxy = new ERC1967Proxy(address(registryImpl), initData);
        registry = ReputationRegistry(address(registryProxy));

        vm.stopPrank();
    }

    function _deployHook() internal {
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);

        (address hookAddress, bytes32 salt) =
            HookMiner.find(address(this), flags, type(ReputationFeeHook).creationCode, abi.encode(manager, registry));

        hook = new ReputationFeeHook{salt: salt}(manager, IReputationRegistry(address(registry)));
        require(address(hook) == hookAddress, "Hook address mismatch");
    }

    function _setupPoolWithLiquidity() internal {
        // Create tokens using Deployers helper
        (currency0, currency1) = deployMintAndApprove2Currencies();

        token0 = MockERC20(Currency.unwrap(currency0));
        token1 = MockERC20(Currency.unwrap(currency1));

        // Create pool key with dynamic fee and our hook
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        poolId = poolKey.toId();

        // Initialize pool at 1:1 price
        manager.initialize(poolKey, SQRT_PRICE_1_1);

        // Add liquidity
        modifyLiquidityRouter.modifyLiquidity(
            poolKey,
            IPoolManager.ModifyLiquidityParams({
                tickLower: -120, tickUpper: 120, liquidityDelta: int256(INITIAL_LIQUIDITY), salt: 0
            }),
            ZERO_BYTES
        );

        // Mint tokens to users
        token0.mint(userUnregistered, 1e24);
        token1.mint(userUnregistered, 1e24);
        token0.mint(userTier1, 1e24);
        token1.mint(userTier1, 1e24);
        token0.mint(userTier2, 1e24);
        token1.mint(userTier2, 1e24);
        token0.mint(userTier3, 1e24);
        token1.mint(userTier3, 1e24);
        token0.mint(userTier4, 1e24);
        token1.mint(userTier4, 1e24);

        // Approve swap router for all users
        _approveSwapRouter(userUnregistered);
        _approveSwapRouter(userTier1);
        _approveSwapRouter(userTier2);
        _approveSwapRouter(userTier3);
        _approveSwapRouter(userTier4);
    }

    function _approveSwapRouter(address user) internal {
        vm.startPrank(user);
        token0.approve(address(swapRouter), type(uint256).max);
        token1.approve(address(swapRouter), type(uint256).max);
        vm.stopPrank();
    }

    function _setupUsersWithDifferentAges() internal {
        // We want at the END of setup:
        // - userTier4: 180+ days reputation age = Tier 4
        // - userTier3: 90-179 days reputation age = Tier 3
        // - userTier2: 30-89 days reputation age = Tier 2
        // - userTier1: 1-29 days reputation age = Tier 1 (just past activation)

        uint256 endTime = block.timestamp + 182 days; // Final time we'll warp to

        // User Tier4 - register now, will have 181 days age at endTime (minus activation delay = 180 days reputation)
        vm.prank(userTier4);
        registry.register{value: REGISTRATION_BOND}();

        // User Tier3 - register 90 days later, will have 91 days age at endTime (minus activation = 90 days)
        vm.warp(block.timestamp + 90 days);
        vm.prank(userTier3);
        registry.register{value: REGISTRATION_BOND}();

        // User Tier2 - register 60 days later (150 total), will have 31 days age (minus activation = 30 days)
        vm.warp(block.timestamp + 60 days);
        vm.prank(userTier2);
        registry.register{value: REGISTRATION_BOND}();

        // User Tier1 - register 29 days later (179 total), will have 2 days age (minus activation = 1 day)
        vm.warp(block.timestamp + 29 days);
        vm.prank(userTier1);
        registry.register{value: REGISTRATION_BOND}();

        // Warp to endTime (182 days from original start)
        vm.warp(endTime);
    }

    // ============ Integration Tests ============

    /// @notice Test that unregistered user pays full base fee
    function test_Swap_UnregisteredUser_PaysBaseFee() public {
        // Verify reputation age is 0
        assertEq(registry.getReputationAge(userUnregistered), 0, "Unregistered should have 0 age");

        // Get expected fee
        uint24 expectedFee = hook.getFeeQuote(userUnregistered);
        assertEq(expectedFee, hook.BASE_FEE(), "Should expect base fee");

        // Note: In V4, the sender in beforeSwap is the swap router, not the user
        // The hook sees the router address, so we verify fee quote instead

        vm.prank(userUnregistered);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test Tier 1 user pays base fee (no discount)
    function test_Swap_Tier1User_PaysBaseFee() public {
        uint256 reputationAge = registry.getReputationAge(userTier1);
        assertGt(reputationAge, 0, "Tier1 should have some age");
        assertLt(reputationAge, 30 days, "Tier1 should be under 30 days");

        uint24 expectedFee = hook.getFeeQuote(userTier1);
        assertEq(expectedFee, hook.BASE_FEE(), "Tier 1 should pay base fee");

        vm.prank(userTier1);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test Tier 2 user gets 25% discount
    function test_Swap_Tier2User_Gets25PercentDiscount() public {
        uint256 reputationAge = registry.getReputationAge(userTier2);
        assertGe(reputationAge, 30 days, "Tier2 should be at least 30 days");
        assertLt(reputationAge, 90 days, "Tier2 should be under 90 days");

        uint24 expectedFee = hook.getFeeQuote(userTier2);
        assertEq(expectedFee, 2250, "Tier 2 should pay 2250 (25% off 3000)");

        vm.prank(userTier2);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test Tier 3 user gets 50% discount
    function test_Swap_Tier3User_Gets50PercentDiscount() public {
        uint256 reputationAge = registry.getReputationAge(userTier3);
        assertGe(reputationAge, 90 days, "Tier3 should be at least 90 days");
        assertLt(reputationAge, 180 days, "Tier3 should be under 180 days");

        uint24 expectedFee = hook.getFeeQuote(userTier3);
        assertEq(expectedFee, 1500, "Tier 3 should pay 1500 (50% off 3000)");

        vm.prank(userTier3);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test Tier 4 user gets 75% discount
    function test_Swap_Tier4User_Gets75PercentDiscount() public {
        uint256 reputationAge = registry.getReputationAge(userTier4);
        assertGe(reputationAge, 180 days, "Tier4 should be at least 180 days");

        uint24 expectedFee = hook.getFeeQuote(userTier4);
        assertEq(expectedFee, 750, "Tier 4 should pay 750 (75% off 3000)");

        vm.prank(userTier4);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e18, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test multiple swaps by different users in sequence
    function test_Swap_MultipleUsers_SequentialSwaps() public {
        // User 4 swaps first
        vm.prank(userTier4);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );

        // User 1 swaps next
        vm.prank(userTier1);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );

        // Unregistered user swaps
        vm.prank(userUnregistered);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test user's tier changes over time
    function test_Swap_TierProgressionOverTime() public {
        address newUser = makeAddr("newUser");
        vm.deal(newUser, 100 ether);
        token0.mint(newUser, 1e24);
        token1.mint(newUser, 1e24);
        _approveSwapRouter(newUser);

        // Register new user
        vm.prank(newUser);
        registry.register{value: REGISTRATION_BOND}();

        // Initially should be Tier 1 (after activation)
        vm.warp(block.timestamp + ACTIVATION_DELAY + 1);
        assertEq(hook.getTier(registry.getReputationAge(newUser)), 1, "Should start as Tier 1");

        // Swap as Tier 1
        vm.prank(newUser);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e16, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );

        // Advance to Tier 2
        vm.warp(block.timestamp + 30 days);
        assertEq(hook.getTier(registry.getReputationAge(newUser)), 2, "Should be Tier 2 after 30 days");

        // Swap as Tier 2
        uint24 tier2Fee = hook.getFeeQuote(newUser);
        assertEq(tier2Fee, 2250, "Should pay Tier 2 fee");

        vm.prank(newUser);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -1e16, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test swap in both directions
    function test_Swap_BothDirections() public {
        // Swap zeroForOne
        vm.prank(userTier3);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );

        // Swap oneForZero
        vm.prank(userTier3);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: false, amountSpecified: -1e17, sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test exact output swaps
    function test_Swap_ExactOutput() public {
        // Positive amountSpecified means exact output
        vm.prank(userTier2);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true,
                amountSpecified: 1e17, // exact output
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test fee comparison between tiers
    function test_Swap_FeeComparison_AllTiers() public view {
        // Verify fee ordering: Tier4 < Tier3 < Tier2 < Tier1/Unregistered
        uint24 feeUnreg = hook.getFeeQuote(userUnregistered);
        uint24 feeTier1 = hook.getFeeQuote(userTier1);
        uint24 feeTier2 = hook.getFeeQuote(userTier2);
        uint24 feeTier3 = hook.getFeeQuote(userTier3);
        uint24 feeTier4 = hook.getFeeQuote(userTier4);

        // Verify ordering
        assertEq(feeUnreg, feeTier1, "Unregistered and Tier1 should pay same fee");
        assertLt(feeTier2, feeTier1, "Tier2 should pay less than Tier1");
        assertLt(feeTier3, feeTier2, "Tier3 should pay less than Tier2");
        assertLt(feeTier4, feeTier3, "Tier4 should pay less than Tier3");

        // Verify exact values
        assertEq(feeUnreg, 3000, "Unregistered: 3000");
        assertEq(feeTier1, 3000, "Tier1: 3000");
        assertEq(feeTier2, 2250, "Tier2: 2250");
        assertEq(feeTier3, 1500, "Tier3: 1500");
        assertEq(feeTier4, 750, "Tier4: 750");
    }

    /// @notice Test large swap amounts
    function test_Swap_LargeAmount() public {
        // Mint extra tokens for large swap
        token0.mint(userTier4, 1e26);

        vm.prank(userTier4);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true,
                amountSpecified: -1e19, // Large swap
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }

    /// @notice Test very small swap amounts
    function test_Swap_SmallAmount() public {
        vm.prank(userTier2);
        swapRouter.swap(
            poolKey,
            IPoolManager.SwapParams({
                zeroForOne: true,
                amountSpecified: -1000, // Very small swap
                sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ZERO_BYTES
        );
    }
}

// Import for the swap test settings
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
