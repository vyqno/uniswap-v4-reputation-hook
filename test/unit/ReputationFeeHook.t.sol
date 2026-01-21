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

import {ReputationFeeHook} from "../../src/ReputationFeeHook.sol";
import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";
import {MockRegistry} from "../helpers/MockRegistry.sol";
import {HookMiner} from "../helpers/HookMiner.sol";

/// @title ReputationFeeHookTest
/// @notice Unit tests for ReputationFeeHook contract
/// @dev Tests fee calculation, tier determination, and view functions
contract ReputationFeeHookTest is Test, Deployers {
    using PoolIdLibrary for PoolKey;

    // ============ Constants ============

    uint24 constant BASE_FEE = 3000;
    uint24 constant MIN_FEE = 500;

    uint256 constant TIER_1_THRESHOLD = 0;
    uint256 constant TIER_2_THRESHOLD = 30 days;
    uint256 constant TIER_3_THRESHOLD = 90 days;
    uint256 constant TIER_4_THRESHOLD = 180 days;

    uint256 constant TIER_1_DISCOUNT = 0;
    uint256 constant TIER_2_DISCOUNT = 2500;
    uint256 constant TIER_3_DISCOUNT = 5000;
    uint256 constant TIER_4_DISCOUNT = 7500;

    // ============ Test State ============

    ReputationFeeHook public hook;
    MockRegistry public mockRegistry;

    address public user1;
    address public user2;

    // ============ Events ============

    event DynamicFeeApplied(address indexed user, PoolId indexed poolId, uint256 reputationAge, uint24 feeApplied);

    // ============ Setup ============

    function setUp() public {
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        // Deploy V4 manager
        deployFreshManagerAndRouters();

        // Deploy mock registry
        mockRegistry = new MockRegistry();

        // Deploy hook with correct address flags
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);

        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this), flags, type(ReputationFeeHook).creationCode, abi.encode(manager, mockRegistry)
        );

        hook = new ReputationFeeHook{salt: salt}(manager, IReputationRegistry(address(mockRegistry)));
        require(address(hook) == hookAddress, "Hook address mismatch");
    }

    // ============ Constants Tests ============

    /// @notice Verify BASE_FEE constant is correct
    function test_Constants_BaseFee() public view {
        assertEq(hook.BASE_FEE(), BASE_FEE, "BASE_FEE should be 3000");
    }

    /// @notice Verify MIN_FEE constant is correct
    function test_Constants_MinFee() public view {
        assertEq(hook.MIN_FEE(), MIN_FEE, "MIN_FEE should be 500");
    }

    /// @notice Verify tier thresholds
    function test_Constants_TierThresholds() public view {
        assertEq(hook.TIER_1_THRESHOLD(), TIER_1_THRESHOLD, "Tier 1 threshold should be 0");
        assertEq(hook.TIER_2_THRESHOLD(), TIER_2_THRESHOLD, "Tier 2 threshold should be 30 days");
        assertEq(hook.TIER_3_THRESHOLD(), TIER_3_THRESHOLD, "Tier 3 threshold should be 90 days");
        assertEq(hook.TIER_4_THRESHOLD(), TIER_4_THRESHOLD, "Tier 4 threshold should be 180 days");
    }

    /// @notice Verify discount percentages
    function test_Constants_Discounts() public view {
        assertEq(hook.TIER_1_DISCOUNT(), TIER_1_DISCOUNT, "Tier 1 discount should be 0%");
        assertEq(hook.TIER_2_DISCOUNT(), TIER_2_DISCOUNT, "Tier 2 discount should be 25%");
        assertEq(hook.TIER_3_DISCOUNT(), TIER_3_DISCOUNT, "Tier 3 discount should be 50%");
        assertEq(hook.TIER_4_DISCOUNT(), TIER_4_DISCOUNT, "Tier 4 discount should be 75%");
    }

    // ============ Fee Quote Tests ============

    /// @notice Test fee quote for unregistered user (0 reputation)
    function test_GetFeeQuote_Unregistered() public {
        mockRegistry.setReputationAge(user1, 0);

        uint24 fee = hook.getFeeQuote(user1);
        assertEq(fee, BASE_FEE, "Unregistered user should pay base fee");
    }

    /// @notice Test fee quote for Tier 1 (0-30 days)
    function test_GetFeeQuote_Tier1() public {
        // Just after activation (1 day)
        mockRegistry.setReputationAge(user1, 1 days);

        uint24 fee = hook.getFeeQuote(user1);
        assertEq(fee, BASE_FEE, "Tier 1 should pay base fee (no discount)");

        // Just before Tier 2 (29 days)
        mockRegistry.setReputationAge(user1, 29 days);
        fee = hook.getFeeQuote(user1);
        assertEq(fee, BASE_FEE, "Should still be Tier 1 at 29 days");
    }

    /// @notice Test fee quote for Tier 2 (30-90 days)
    function test_GetFeeQuote_Tier2() public {
        // At exactly 30 days
        mockRegistry.setReputationAge(user1, 30 days);

        uint24 fee = hook.getFeeQuote(user1);
        uint24 expectedFee = uint24((uint256(BASE_FEE) * 7500) / 10000); // 25% discount = 2250
        assertEq(fee, expectedFee, "Tier 2 should get 25% discount");
        assertEq(fee, 2250, "Fee should be 2250");

        // At 60 days
        mockRegistry.setReputationAge(user1, 60 days);
        fee = hook.getFeeQuote(user1);
        assertEq(fee, expectedFee, "Should still be Tier 2 at 60 days");

        // Just before Tier 3 (89 days)
        mockRegistry.setReputationAge(user1, 89 days);
        fee = hook.getFeeQuote(user1);
        assertEq(fee, expectedFee, "Should still be Tier 2 at 89 days");
    }

    /// @notice Test fee quote for Tier 3 (90-180 days)
    function test_GetFeeQuote_Tier3() public {
        // At exactly 90 days
        mockRegistry.setReputationAge(user1, 90 days);

        uint24 fee = hook.getFeeQuote(user1);
        uint24 expectedFee = uint24((uint256(BASE_FEE) * 5000) / 10000); // 50% discount = 1500
        assertEq(fee, expectedFee, "Tier 3 should get 50% discount");
        assertEq(fee, 1500, "Fee should be 1500");

        // At 120 days
        mockRegistry.setReputationAge(user1, 120 days);
        fee = hook.getFeeQuote(user1);
        assertEq(fee, expectedFee, "Should still be Tier 3 at 120 days");

        // Just before Tier 4 (179 days)
        mockRegistry.setReputationAge(user1, 179 days);
        fee = hook.getFeeQuote(user1);
        assertEq(fee, expectedFee, "Should still be Tier 3 at 179 days");
    }

    /// @notice Test fee quote for Tier 4 (180+ days)
    function test_GetFeeQuote_Tier4() public {
        // At exactly 180 days
        mockRegistry.setReputationAge(user1, 180 days);

        uint24 fee = hook.getFeeQuote(user1);
        uint24 expectedFee = uint24((uint256(BASE_FEE) * 2500) / 10000); // 75% discount = 750
        assertEq(fee, expectedFee, "Tier 4 should get 75% discount");
        assertEq(fee, 750, "Fee should be 750");

        // At 365 days
        mockRegistry.setReputationAge(user1, 365 days);
        fee = hook.getFeeQuote(user1);
        assertEq(fee, expectedFee, "Should still be Tier 4 at 365 days");

        // At 10 years
        mockRegistry.setReputationAge(user1, 3650 days);
        fee = hook.getFeeQuote(user1);
        assertEq(fee, expectedFee, "Should still be Tier 4 at 10 years");
    }

    /// @notice Test minimum fee enforcement
    function test_GetFeeQuote_MinimumFeeEnforced() public {
        // Even with maximum discount (75%), fee should not go below MIN_FEE
        // BASE_FEE * 0.25 = 3000 * 0.25 = 750 > MIN_FEE (500), so OK

        // If we theoretically had higher discount, min fee would kick in
        // For our current constants: 3000 * 0.25 = 750 > 500, so minimum doesn't kick in
        mockRegistry.setReputationAge(user1, 365 days);
        uint24 fee = hook.getFeeQuote(user1);
        assertGe(fee, MIN_FEE, "Fee should never be below minimum");
    }

    /// @notice Test circuit breaker - registry reverts
    function test_GetFeeQuote_RegistryReverts_ReturnsBaseFee() public {
        mockRegistry.setShouldRevert(true, "Registry error");

        uint24 fee = hook.getFeeQuote(user1);
        assertEq(fee, BASE_FEE, "Should return base fee when registry reverts");
    }

    // ============ Tier Determination Tests ============

    /// @notice Test getTier function
    function test_GetTier() public view {
        assertEq(hook.getTier(0), 1, "0 days should be Tier 1");
        assertEq(hook.getTier(29 days), 1, "29 days should be Tier 1");
        assertEq(hook.getTier(30 days), 2, "30 days should be Tier 2");
        assertEq(hook.getTier(89 days), 2, "89 days should be Tier 2");
        assertEq(hook.getTier(90 days), 3, "90 days should be Tier 3");
        assertEq(hook.getTier(179 days), 3, "179 days should be Tier 3");
        assertEq(hook.getTier(180 days), 4, "180 days should be Tier 4");
        assertEq(hook.getTier(365 days), 4, "365 days should be Tier 4");
    }

    /// @notice Test getTierDiscount function
    function test_GetTierDiscount() public view {
        assertEq(hook.getTierDiscount(1), TIER_1_DISCOUNT, "Tier 1 discount should be 0");
        assertEq(hook.getTierDiscount(2), TIER_2_DISCOUNT, "Tier 2 discount should be 2500");
        assertEq(hook.getTierDiscount(3), TIER_3_DISCOUNT, "Tier 3 discount should be 5000");
        assertEq(hook.getTierDiscount(4), TIER_4_DISCOUNT, "Tier 4 discount should be 7500");
        // Invalid tiers default to Tier 1
        assertEq(hook.getTierDiscount(0), TIER_1_DISCOUNT, "Tier 0 should default to Tier 1");
        assertEq(hook.getTierDiscount(5), TIER_1_DISCOUNT, "Tier 5 should default to Tier 1");
    }

    /// @notice Test getFeeForTier function
    function test_GetFeeForTier() public view {
        assertEq(hook.getFeeForTier(1), BASE_FEE, "Tier 1 fee should be base fee");
        assertEq(hook.getFeeForTier(2), 2250, "Tier 2 fee should be 2250");
        assertEq(hook.getFeeForTier(3), 1500, "Tier 3 fee should be 1500");
        assertEq(hook.getFeeForTier(4), 750, "Tier 4 fee should be 750");
    }

    // ============ Hook Permissions Tests ============

    /// @notice Test hook permissions are correctly set
    function test_HookPermissions() public view {
        Hooks.Permissions memory permissions = hook.getHookPermissions();

        assertFalse(permissions.beforeInitialize, "beforeInitialize should be false");
        assertFalse(permissions.afterInitialize, "afterInitialize should be false");
        assertFalse(permissions.beforeAddLiquidity, "beforeAddLiquidity should be false");
        assertFalse(permissions.afterAddLiquidity, "afterAddLiquidity should be false");
        assertFalse(permissions.beforeRemoveLiquidity, "beforeRemoveLiquidity should be false");
        assertFalse(permissions.afterRemoveLiquidity, "afterRemoveLiquidity should be false");
        assertTrue(permissions.beforeSwap, "beforeSwap should be true");
        assertFalse(permissions.afterSwap, "afterSwap should be false");
        assertFalse(permissions.beforeDonate, "beforeDonate should be false");
        assertFalse(permissions.afterDonate, "afterDonate should be false");
        assertFalse(permissions.beforeSwapReturnDelta, "beforeSwapReturnDelta should be false");
        assertFalse(permissions.afterSwapReturnDelta, "afterSwapReturnDelta should be false");
        assertFalse(permissions.afterAddLiquidityReturnDelta, "afterAddLiquidityReturnDelta should be false");
        assertFalse(permissions.afterRemoveLiquidityReturnDelta, "afterRemoveLiquidityReturnDelta should be false");
    }

    /// @notice Test hook address has correct flags
    function test_HookAddressFlags() public view {
        uint160 hookFlags = uint160(address(hook)) & 0x3FFF;

        // Only BEFORE_SWAP_FLAG should be set
        assertTrue((hookFlags & Hooks.BEFORE_SWAP_FLAG) != 0, "BEFORE_SWAP_FLAG should be set");
    }

    // ============ Registry Reference Tests ============

    /// @notice Test registry is immutable and correctly set
    function test_RegistryReference() public view {
        assertEq(address(hook.registry()), address(mockRegistry), "Registry should be set correctly");
    }

    // ============ Fuzz Tests ============

    /// @notice Fuzz test: fee is always within bounds
    function testFuzz_FeeWithinBounds(uint256 reputationAge) public {
        // Cap at reasonable age (100 years)
        reputationAge = bound(reputationAge, 0, 100 * 365 days);

        mockRegistry.setReputationAge(user1, reputationAge);
        uint24 fee = hook.getFeeQuote(user1);

        assertGe(fee, MIN_FEE, "Fee should be >= MIN_FEE");
        assertLe(fee, BASE_FEE, "Fee should be <= BASE_FEE");
    }

    /// @notice Fuzz test: older reputation always pays less or equal
    function testFuzz_OlderReputationPaysLessOrEqual(uint256 age1, uint256 age2) public {
        age1 = bound(age1, 0, 1000 days);
        age2 = bound(age2, 0, 1000 days);

        if (age1 > age2) {
            (age1, age2) = (age2, age1); // Ensure age1 <= age2
        }

        mockRegistry.setReputationAge(user1, age1);
        uint24 fee1 = hook.getFeeQuote(user1);

        mockRegistry.setReputationAge(user1, age2);
        uint24 fee2 = hook.getFeeQuote(user1);

        assertLe(fee2, fee1, "Older reputation should pay less or equal fee");
    }

    /// @notice Fuzz test: tier determination is monotonic
    function testFuzz_TierIsMonotonic(uint256 age1, uint256 age2) public view {
        age1 = bound(age1, 0, 1000 days);
        age2 = bound(age2, 0, 1000 days);

        if (age1 > age2) {
            (age1, age2) = (age2, age1);
        }

        uint8 tier1 = hook.getTier(age1);
        uint8 tier2 = hook.getTier(age2);

        assertGe(tier2, tier1, "Tier should increase or stay same with age");
    }

    // ============ Edge Case Tests ============

    /// @notice Test tier boundaries exactly
    function test_TierBoundaries_Exact() public view {
        // Just before Tier 2
        assertEq(hook.getTier(30 days - 1), 1, "Should be Tier 1 at 30 days - 1 second");
        // Exactly at Tier 2
        assertEq(hook.getTier(30 days), 2, "Should be Tier 2 at exactly 30 days");

        // Just before Tier 3
        assertEq(hook.getTier(90 days - 1), 2, "Should be Tier 2 at 90 days - 1 second");
        // Exactly at Tier 3
        assertEq(hook.getTier(90 days), 3, "Should be Tier 3 at exactly 90 days");

        // Just before Tier 4
        assertEq(hook.getTier(180 days - 1), 3, "Should be Tier 3 at 180 days - 1 second");
        // Exactly at Tier 4
        assertEq(hook.getTier(180 days), 4, "Should be Tier 4 at exactly 180 days");
    }

    /// @notice Test very large reputation ages
    function test_VeryLargeReputationAge() public view {
        // 100 years
        uint8 tier = hook.getTier(100 * 365 days);
        assertEq(tier, 4, "Should be Tier 4 for very old reputation");

        // Maximum uint256 value still works
        tier = hook.getTier(type(uint256).max);
        assertEq(tier, 4, "Should handle max uint256");
    }

    /// @notice Test fee precision
    function test_FeePrecision() public view {
        // Verify exact fee calculations
        // Tier 1: 3000 * (10000 - 0) / 10000 = 3000
        assertEq(hook.getFeeForTier(1), 3000, "Tier 1 exact");

        // Tier 2: 3000 * (10000 - 2500) / 10000 = 3000 * 0.75 = 2250
        assertEq(hook.getFeeForTier(2), 2250, "Tier 2 exact");

        // Tier 3: 3000 * (10000 - 5000) / 10000 = 3000 * 0.50 = 1500
        assertEq(hook.getFeeForTier(3), 1500, "Tier 3 exact");

        // Tier 4: 3000 * (10000 - 7500) / 10000 = 3000 * 0.25 = 750
        assertEq(hook.getFeeForTier(4), 750, "Tier 4 exact");
    }
}
