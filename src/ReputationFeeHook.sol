// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";

/// @title ReputationFeeHook
/// @notice Uniswap V4 hook that calculates dynamic swap fees based on user reputation
/// @dev Implements beforeSwap hook to override fees based on reputation age tiers
/// @author Reputation Hook Team
contract ReputationFeeHook is BaseHook {
    using PoolIdLibrary for PoolKey;
    using LPFeeLibrary for uint24;

    // ============ Immutable State ============

    /// @notice The reputation registry contract
    IReputationRegistry public immutable registry;

    // ============ Fee Constants ============

    /// @notice Base fee in hundredths of basis points (0.30%)
    uint24 public constant BASE_FEE = 3000;

    /// @notice Minimum fee to protect LPs (0.05%)
    uint24 public constant MIN_FEE = 500;

    // ============ Tier Thresholds (seconds) ============

    /// @notice Tier 1: New users (0 days)
    uint256 public constant TIER_1_THRESHOLD = 0;

    /// @notice Tier 2: 30 days reputation
    uint256 public constant TIER_2_THRESHOLD = 30 days;

    /// @notice Tier 3: 90 days reputation
    uint256 public constant TIER_3_THRESHOLD = 90 days;

    /// @notice Tier 4: 180 days reputation
    uint256 public constant TIER_4_THRESHOLD = 180 days;

    // ============ Discount Percentages (basis points, 10000 = 100%) ============

    /// @notice Tier 1: No discount (0%)
    uint256 public constant TIER_1_DISCOUNT = 0;

    /// @notice Tier 2: 25% discount
    uint256 public constant TIER_2_DISCOUNT = 2500;

    /// @notice Tier 3: 50% discount
    uint256 public constant TIER_3_DISCOUNT = 5000;

    /// @notice Tier 4: 75% discount
    uint256 public constant TIER_4_DISCOUNT = 7500;

    // ============ Events ============

    /// @notice Emitted when a dynamic fee is applied to a swap
    /// @param user The address performing the swap
    /// @param poolId The ID of the pool
    /// @param reputationAge The user's reputation age in seconds
    /// @param feeApplied The fee applied in hundredths of basis points
    event DynamicFeeApplied(address indexed user, PoolId indexed poolId, uint256 reputationAge, uint24 feeApplied);

    // ============ Constructor ============

    /// @notice Deploy the hook with the pool manager and registry
    /// @param _poolManager The Uniswap V4 pool manager
    /// @param _registry The reputation registry contract
    constructor(IPoolManager _poolManager, IReputationRegistry _registry) BaseHook(_poolManager) {
        registry = _registry;
    }

    // ============ Hook Permissions ============

    /// @notice Returns the hook permissions
    /// @dev Only beforeSwap is enabled for dynamic fee calculation
    /// @return permissions The permissions struct
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ============ Hook Implementation ============

    /// @notice Called before each swap to calculate dynamic fee
    /// @param sender The address initiating the swap
    /// @param key The pool key
    /// @param params The swap parameters
    /// @param hookData Additional hook data (unused)
    /// @return selector The function selector
    /// @return delta The before swap delta (zero - no token changes)
    /// @return fee The calculated fee with override flag
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        // Silence unused variable warnings
        (params, hookData);

        // Get user's reputation age from registry
        // If registry call fails, default to BASE_FEE (circuit breaker)
        uint256 reputationAge;
        try registry.getReputationAge(sender) returns (uint256 age) {
            reputationAge = age;
        } catch {
            // Registry unavailable - use base fee
            return
                (
                    IHooks.beforeSwap.selector,
                    BeforeSwapDeltaLibrary.ZERO_DELTA,
                    BASE_FEE | LPFeeLibrary.OVERRIDE_FEE_FLAG
                );
        }

        // Calculate dynamic fee based on tier
        uint24 dynamicFee = _calculateFee(reputationAge);

        // Emit event for off-chain tracking
        emit DynamicFeeApplied(sender, key.toId(), reputationAge, dynamicFee);

        // Return fee with override flag set
        return
            (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, dynamicFee | LPFeeLibrary.OVERRIDE_FEE_FLAG);
    }

    // ============ Fee Calculation ============

    /// @notice Calculate fee based on reputation age using tiered model
    /// @param reputationAge Seconds since user registration became active
    /// @return fee The swap fee in hundredths of basis points
    function _calculateFee(uint256 reputationAge) internal pure returns (uint24 fee) {
        uint256 discountBps;

        // Determine tier and discount
        if (reputationAge >= TIER_4_THRESHOLD) {
            discountBps = TIER_4_DISCOUNT;
        } else if (reputationAge >= TIER_3_THRESHOLD) {
            discountBps = TIER_3_DISCOUNT;
        } else if (reputationAge >= TIER_2_THRESHOLD) {
            discountBps = TIER_2_DISCOUNT;
        } else {
            discountBps = TIER_1_DISCOUNT;
        }

        // Apply discount: fee = BASE_FEE * (10000 - discountBps) / 10000
        uint256 discountedFee = (uint256(BASE_FEE) * (10000 - discountBps)) / 10000;

        // Ensure minimum fee to protect LPs
        fee = discountedFee < MIN_FEE ? MIN_FEE : uint24(discountedFee);
    }

    // ============ View Functions ============

    /// @notice Get the expected fee for a user without executing a swap
    /// @param user Address to check
    /// @return expectedFee The fee the user would pay (in hundredths of bps)
    function getFeeQuote(address user) external view returns (uint24 expectedFee) {
        uint256 reputationAge;
        try registry.getReputationAge(user) returns (uint256 age) {
            reputationAge = age;
        } catch {
            return BASE_FEE;
        }
        return _calculateFee(reputationAge);
    }

    /// @notice Get the tier for a given reputation age
    /// @param reputationAge The reputation age in seconds
    /// @return tier The tier number (1-4)
    function getTier(uint256 reputationAge) external pure returns (uint8 tier) {
        if (reputationAge >= TIER_4_THRESHOLD) {
            return 4;
        } else if (reputationAge >= TIER_3_THRESHOLD) {
            return 3;
        } else if (reputationAge >= TIER_2_THRESHOLD) {
            return 2;
        } else {
            return 1;
        }
    }

    /// @notice Get the discount percentage for a tier
    /// @param tier The tier number (1-4)
    /// @return discountBps The discount in basis points
    function getTierDiscount(uint8 tier) external pure returns (uint256 discountBps) {
        if (tier == 4) {
            return TIER_4_DISCOUNT;
        } else if (tier == 3) {
            return TIER_3_DISCOUNT;
        } else if (tier == 2) {
            return TIER_2_DISCOUNT;
        } else {
            return TIER_1_DISCOUNT;
        }
    }

    /// @notice Calculate fee for a specific tier (for testing/display)
    /// @param tier The tier number (1-4)
    /// @return fee The fee for that tier
    function getFeeForTier(uint8 tier) external pure returns (uint24 fee) {
        uint256 discountBps;
        if (tier == 4) {
            discountBps = TIER_4_DISCOUNT;
        } else if (tier == 3) {
            discountBps = TIER_3_DISCOUNT;
        } else if (tier == 2) {
            discountBps = TIER_2_DISCOUNT;
        } else {
            discountBps = TIER_1_DISCOUNT;
        }

        uint256 discountedFee = (uint256(BASE_FEE) * (10000 - discountBps)) / 10000;
        return discountedFee < MIN_FEE ? MIN_FEE : uint24(discountedFee);
    }
}
