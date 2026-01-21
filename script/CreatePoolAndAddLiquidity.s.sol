// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";

import {ReputationFeeHook} from "../src/ReputationFeeHook.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockWETH} from "../src/mocks/MockWETH.sol";

/// @title CreatePoolAndAddLiquidity
/// @notice Script to create a Uniswap V4 pool with the ReputationFeeHook and add initial liquidity
contract CreatePoolAndAddLiquidity is Script {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    // ============ Sepolia V4 Addresses ============
    // From: https://docs.uniswap.org/contracts/v4/deployments

    address constant POOL_MANAGER_SEPOLIA = 0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A;
    address constant POSITION_MANAGER_SEPOLIA = 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4;
    address constant PERMIT2_SEPOLIA = 0x000000000022D473030F116dDEE9F6B43aC78BA3;

    // ============ Deployed Contract Addresses (from deployments/sepolia.json) ============

    address constant MOCK_USDC = 0xcf862045133267F63C69A473a8b0ccdcFE848bE2;
    address constant MOCK_WETH = 0x701297d6779Ea7f6C3C9Fea3B7cEc24DaE0cFF80;
    address constant REPUTATION_HOOK = 0x1eA4d4bC8742b55E4cA4d2792103905250bD4080;

    // ============ Pool Configuration ============

    /// @notice Tick spacing for medium-fee pools
    int24 constant TICK_SPACING = 60;

    /// @notice Initial price: 1 WETH = 2000 USDC (sqrt price for this ratio)
    /// @dev sqrtPriceX96 = sqrt(2000 * 10^6 / 10^18) * 2^96 ≈ 3.543 * 10^27
    /// For simplicity, using 1:1 price initially
    uint160 constant INITIAL_SQRT_PRICE = 79228162514264337593543950336; // 1:1 price

    // ============ Liquidity Configuration ============

    /// @notice Amount of USDC to add as liquidity (10,000 USDC)
    uint256 constant USDC_LIQUIDITY = 10_000 * 10 ** 6;

    /// @notice Amount of WETH to add as liquidity (5 WETH)
    uint256 constant WETH_LIQUIDITY = 5 * 10 ** 18;

    // ============ State ============

    IPoolManager public poolManager;
    IPositionManager public positionManager;
    PoolKey public poolKey;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("=== Create Pool and Add Liquidity ===");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);

        poolManager = IPoolManager(POOL_MANAGER_SEPOLIA);
        positionManager = IPositionManager(POSITION_MANAGER_SEPOLIA);

        // Determine currency order (lower address first per Uniswap convention)
        address token0;
        address token1;
        if (MOCK_USDC < MOCK_WETH) {
            token0 = MOCK_USDC;
            token1 = MOCK_WETH;
        } else {
            token0 = MOCK_WETH;
            token1 = MOCK_USDC;
        }

        console2.log("Token0 (lower):", token0);
        console2.log("Token1 (higher):", token1);
        console2.log("Hook:", REPUTATION_HOOK);

        // Create pool key
        poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG, // Dynamic fee controlled by hook
            tickSpacing: TICK_SPACING,
            hooks: IHooks(REPUTATION_HOOK)
        });

        PoolId poolId = poolKey.toId();
        console2.log("Pool ID:");
        console2.logBytes32(PoolId.unwrap(poolId));

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Initialize the pool
        console2.log("\n--- Step 1: Initialize Pool ---");
        _initializePool();

        // Step 2: Mint tokens for liquidity
        console2.log("\n--- Step 2: Mint Tokens ---");
        _mintTokens(deployer);

        // Step 3: Approve tokens for PositionManager
        console2.log("\n--- Step 3: Approve Tokens ---");
        _approveTokens();

        // Step 4: Add liquidity
        console2.log("\n--- Step 4: Add Liquidity ---");
        _addLiquidity(deployer);

        vm.stopBroadcast();

        // Print summary
        _printSummary(deployer);
    }

    function _initializePool() internal {
        // Initialize the pool through PositionManager
        int24 tick = positionManager.initializePool(poolKey, INITIAL_SQRT_PRICE);

        if (tick == type(int24).max) {
            console2.log("Pool already initialized or failed");
        } else {
            console2.log("Pool initialized at tick:", tick);
        }
    }

    function _mintTokens(address recipient) internal {
        MockUSDC usdc = MockUSDC(MOCK_USDC);
        MockWETH weth = MockWETH(payable(MOCK_WETH));

        // Mint extra tokens for liquidity provision
        usdc.mint(recipient, USDC_LIQUIDITY * 2);
        weth.mint(recipient, WETH_LIQUIDITY * 2);

        console2.log("Minted USDC:", USDC_LIQUIDITY * 2);
        console2.log("Minted WETH:", WETH_LIQUIDITY * 2);
    }

    function _approveTokens() internal {
        IERC20(MOCK_USDC).approve(address(positionManager), type(uint256).max);
        IERC20(MOCK_WETH).approve(address(positionManager), type(uint256).max);

        // Also approve Permit2 for the PositionManager
        IERC20(MOCK_USDC).approve(PERMIT2_SEPOLIA, type(uint256).max);
        IERC20(MOCK_WETH).approve(PERMIT2_SEPOLIA, type(uint256).max);

        console2.log("Tokens approved for PositionManager and Permit2");
    }

    function _addLiquidity(address recipient) internal {
        // Define tick range for full range liquidity
        int24 tickLower = -887220; // Near min tick (divisible by tickSpacing)
        int24 tickUpper = 887220; // Near max tick (divisible by tickSpacing)

        // Calculate liquidity amount (simplified - in production use LiquidityAmounts library)
        uint128 liquidity = 1000000000000000000; // 1e18 liquidity units

        // Encode the mint action
        bytes memory actions = abi.encodePacked(uint8(Actions.MINT_POSITION), uint8(Actions.SETTLE_PAIR));

        bytes[] memory params = new bytes[](2);

        // MINT_POSITION params
        params[0] = abi.encode(
            poolKey,
            tickLower,
            tickUpper,
            liquidity,
            type(uint128).max, // amount0Max (max slippage)
            type(uint128).max, // amount1Max (max slippage)
            recipient,
            bytes("") // hookData
        );

        // SETTLE_PAIR params
        params[1] = abi.encode(poolKey.currency0, poolKey.currency1);

        // Execute the liquidity addition
        bytes memory unlockData = abi.encode(actions, params);
        positionManager.modifyLiquidities(unlockData, block.timestamp + 60);

        console2.log("Liquidity added successfully!");
        console2.log("Tick Lower:", int256(tickLower));
        console2.log("Tick Upper:", int256(tickUpper));
    }

    function _printSummary(address deployer) internal view {
        console2.log("\n========================================");
        console2.log("       POOL CREATION SUMMARY");
        console2.log("========================================");
        console2.log("Network: Sepolia");
        console2.log("Deployer:", deployer);
        console2.log("");
        console2.log("Pool Configuration:");
        console2.log("  Token0:", Currency.unwrap(poolKey.currency0));
        console2.log("  Token1:", Currency.unwrap(poolKey.currency1));
        console2.log("  Fee: DYNAMIC (hook-controlled)");
        console2.log("  Tick Spacing:", int256(TICK_SPACING));
        console2.log("  Hook:", address(poolKey.hooks));
        console2.log("");
        console2.log("Pool ID:");
        console2.logBytes32(PoolId.unwrap(poolKey.toId()));
        console2.log("");
        console2.log("Initial Liquidity:");
        console2.log("  ~10,000 USDC equivalent");
        console2.log("  ~5 WETH equivalent");
        console2.log("========================================\n");
    }
}

/// @title SimplePoolInitializer
/// @notice Simpler script that just initializes the pool without adding liquidity
contract SimplePoolInitializer is Script {
    using PoolIdLibrary for PoolKey;

    address constant POOL_MANAGER_SEPOLIA = 0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A;
    address constant MOCK_USDC = 0xcf862045133267F63C69A473a8b0ccdcFE848bE2;
    address constant MOCK_WETH = 0x701297d6779Ea7f6C3C9Fea3B7cEc24DaE0cFF80;
    address constant REPUTATION_HOOK = 0x1eA4d4bC8742b55E4cA4d2792103905250bD4080;

    int24 constant TICK_SPACING = 60;
    uint160 constant INITIAL_SQRT_PRICE = 79228162514264337593543950336;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console2.log("=== Simple Pool Initialization ===");

        // Determine currency order
        address token0 = MOCK_USDC < MOCK_WETH ? MOCK_USDC : MOCK_WETH;
        address token1 = MOCK_USDC < MOCK_WETH ? MOCK_WETH : MOCK_USDC;

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(REPUTATION_HOOK)
        });

        console2.log("Token0:", token0);
        console2.log("Token1:", token1);
        console2.log("Hook:", REPUTATION_HOOK);
        console2.log("Pool ID:");
        console2.logBytes32(PoolId.unwrap(poolKey.toId()));

        vm.startBroadcast(deployerPrivateKey);

        // Initialize pool directly on PoolManager
        IPoolManager(POOL_MANAGER_SEPOLIA).initialize(poolKey, INITIAL_SQRT_PRICE);

        vm.stopBroadcast();

        console2.log("Pool initialized successfully!");
    }
}
