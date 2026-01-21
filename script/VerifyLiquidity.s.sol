// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";

/// @title VerifyLiquidity
/// @notice Script to verify the state of a pool and its liquidity
/// @dev Reads directly from storage slots for verification
contract VerifyLiquidity is Script {
    using PoolIdLibrary for PoolKey;

    function run() external view {
        address poolManagerAddress = vm.envAddress("POOL_MANAGER_SEPOLIA");
        // Verify explicit address from deployments.json to be sure
        console.log("Pool Manager:", poolManagerAddress);

        IPoolManager manager = IPoolManager(poolManagerAddress);

        // PoolKey parameters
        address token0 = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // USDC
        address token1 = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; // WETH
        uint24 fee = 8388608;
        int24 tickSpacing = 60;
        address hook = 0xb42c6cfF6FA476677cf56D88B4fD06B02E614080;

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hook)
        });

        PoolId id = key.toId();
        console.logBytes32(PoolId.unwrap(id));

        // Use extsload to read liquidity
        // slot(_pools) is likely 6.
        // mapping(PoolId => Pool.State) _pools
        // State struct: slot0 (0), feeGlobal0 (1), feeGlobal1 (2), liquidity (3)

        bytes32 poolsMappingSlot = bytes32(uint256(6));
        bytes32 poolStateSlot = keccak256(abi.encode(PoolId.unwrap(id), poolsMappingSlot));
        bytes32 liquiditySlot = bytes32(uint256(poolStateSlot) + 3);

        bytes32 liquidityValue = manager.extsload(liquiditySlot);
        uint128 liquidity = uint128(uint256(liquidityValue));

        console.log("Liquidity via extsload (assuming slot 6):", liquidity);

        // Also check slot0 just to be sure we hit the right struct
        bytes32 slot0Value = manager.extsload(poolStateSlot);
        uint160 sqrtPriceX96 = uint160(uint256(slot0Value));
        int24 tick = int24(int256(uint256(slot0Value) >> 160));

        console.log("SqrtPriceX96:", sqrtPriceX96);
        console.log("Tick:", tick);
    }
}
