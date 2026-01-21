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

import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockWETH} from "../src/mocks/MockWETH.sol";

/// @notice Interface for PoolModifyLiquidityTest router
interface IModifyLiquidityRouter {
    function modifyLiquidity(
        PoolKey memory key,
        IPoolManager.ModifyLiquidityParams memory params,
        bytes memory hookData
    ) external payable returns (int256, int256);
}

/// @notice Interface for PoolSwapTest router
interface ISwapRouter {
    struct TestSettings {
        bool takeClaims;
        bool settleUsingBurn;
    }

    function swap(
        PoolKey memory key,
        IPoolManager.SwapParams memory params,
        TestSettings memory testSettings,
        bytes memory hookData
    ) external payable returns (int256, int256);
}

/// @title SetupPoolWithLiquidity
/// @notice Complete script to create a V4 pool with the ReputationFeeHook and add liquidity
/// @dev Uses Uniswap's deployed test routers on Sepolia
contract SetupPoolWithLiquidity is Script {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    // ============ Sepolia Uniswap V4 Addresses ============
    // From: https://docs.uniswap.org/contracts/v4/deployments

    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant MODIFY_LIQUIDITY_ROUTER = 0x0C478023803a644c94c4CE1C1e7b9A087e411B0A;
    address constant SWAP_ROUTER = 0x9B6b46e2c869aa39918Db7f52f5557FE577B6eEe;

    // ============ Our Deployed Contracts (Sepolia) - Redeployed ============

    address constant MOCK_USDC = 0x8f5Ea180434196ED2d60f69977f8ba65EBeD498D;
    address constant MOCK_WETH = 0xd605E4dDCCe7C1ebbeb92eC255761d486a07065B;
    address constant REPUTATION_HOOK = 0x03Df707d29b18144477f77975d7a067C9671C080;

    // ============ Pool Configuration ============

    int24 constant TICK_SPACING = 60;

    // Price: 1 WETH = 2000 USDC (adjusted for decimals)
    // USDC has 6 decimals, WETH has 18 decimals
    // If USDC < WETH (by address), then price = WETH/USDC
    // sqrtPriceX96 = sqrt(price) * 2^96
    // For 1 WETH = 2000 USDC: sqrt(2000 * 10^6 / 10^18) * 2^96
    // = sqrt(2 * 10^-9) * 2^96 ≈ 3.54 * 10^27
    // Using a simpler 1:1 ratio for testing
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    // ============ Liquidity Configuration ============
    // User wants: 0.5 ETH worth of WETH and 5000 USDC

    uint256 constant USDC_AMOUNT = 5000 * 10 ** 6; // 5000 USDC (6 decimals)
    uint256 constant WETH_AMOUNT = 0.5 ether; // 0.5 WETH (18 decimals)

    // ============ State ============

    PoolKey public poolKey;
    address public token0;
    address public token1;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("==============================================");
        console2.log("   SETUP POOL WITH LIQUIDITY");
        console2.log("==============================================");
        console2.log("");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("");

        // Determine token order (V4 requires currency0 < currency1 by address)
        _setupTokenOrder();

        console2.log("Token0:", token0);
        console2.log("Token1:", token1);
        console2.log("Hook:", REPUTATION_HOOK);
        console2.log("");

        // Create pool key
        poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(REPUTATION_HOOK)
        });

        PoolId poolId = poolKey.toId();
        console2.log("Pool ID:");
        console2.logBytes32(PoolId.unwrap(poolId));
        console2.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Initialize the pool
        console2.log("--- Step 1: Initialize Pool ---");
        _initializePool();

        // Step 2: Mint tokens if needed
        console2.log("");
        console2.log("--- Step 2: Prepare Tokens ---");
        _prepareTokens(deployer);

        // Step 3: Approve tokens to the liquidity router
        console2.log("");
        console2.log("--- Step 3: Approve Tokens ---");
        _approveTokens();

        // Step 4: Add liquidity
        console2.log("");
        console2.log("--- Step 4: Add Liquidity ---");
        _addLiquidity();

        vm.stopBroadcast();

        // Print final summary
        _printSummary(deployer);
    }

    function _setupTokenOrder() internal {
        // V4 requires token0 < token1 by address
        if (MOCK_USDC < MOCK_WETH) {
            token0 = MOCK_USDC;
            token1 = MOCK_WETH;
        } else {
            token0 = MOCK_WETH;
            token1 = MOCK_USDC;
        }
    }

    function _initializePool() internal {
        IPoolManager manager = IPoolManager(POOL_MANAGER);

        // Check if pool already exists by trying to get its state
        // If not initialized, this will work. If already initialized, it's okay.
        try manager.initialize(poolKey, SQRT_PRICE_1_1) returns (int24 tick) {
            console2.log("Pool initialized at tick:", int256(tick));
        } catch {
            console2.log("Pool may already be initialized (or error occurred)");
        }
    }

    function _prepareTokens(address deployer) internal {
        MockUSDC usdc = MockUSDC(MOCK_USDC);
        MockWETH weth = MockWETH(payable(MOCK_WETH));

        uint256 usdcBalance = usdc.balanceOf(deployer);
        uint256 wethBalance = weth.balanceOf(deployer);

        console2.log("Current USDC balance:", usdcBalance);
        console2.log("Current WETH balance:", wethBalance);
        console2.log("Need USDC:", USDC_AMOUNT);
        console2.log("Need WETH:", WETH_AMOUNT);

        // Mint more if needed
        if (usdcBalance < USDC_AMOUNT * 2) {
            usdc.mint(deployer, USDC_AMOUNT * 2);
            console2.log("Minted additional USDC");
        }

        if (wethBalance < WETH_AMOUNT * 2) {
            weth.mint(deployer, WETH_AMOUNT * 2);
            console2.log("Minted additional WETH");
        }

        console2.log("New USDC balance:", usdc.balanceOf(deployer));
        console2.log("New WETH balance:", weth.balanceOf(deployer));
    }

    function _approveTokens() internal {
        IERC20(MOCK_USDC).approve(MODIFY_LIQUIDITY_ROUTER, type(uint256).max);
        IERC20(MOCK_WETH).approve(MODIFY_LIQUIDITY_ROUTER, type(uint256).max);
        console2.log("Approved tokens to ModifyLiquidityRouter");
    }

    function _addLiquidity() internal {
        IModifyLiquidityRouter router = IModifyLiquidityRouter(MODIFY_LIQUIDITY_ROUTER);

        // Full range liquidity
        // Using wide tick range that's divisible by tickSpacing (60)
        int24 tickLower = -887220; // Close to MIN_TICK, divisible by 60
        int24 tickUpper = 887220; // Close to MAX_TICK, divisible by 60

        // Calculate liquidity amount
        // For a 1:1 sqrt price pool with full range, liquidity roughly equals
        // the geometric mean of token amounts
        // With 5000 USDC (6 decimals) = 5e9 and 0.5 WETH (18 decimals) = 5e17
        // We need a smaller liquidity value that doesn't exceed our balances
        // Using 1e15 which should require roughly 1e15 of each token
        // But USDC only has 1e12, so we need even smaller
        // Let's use 1e9 liquidity units (matching USDC decimals scale)
        int256 liquidityDelta = 1000000000; // 1e9 liquidity units

        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: tickLower, tickUpper: tickUpper, liquidityDelta: liquidityDelta, salt: bytes32(0)
        });

        console2.log("Adding liquidity...");
        console2.log("Tick Lower:", int256(tickLower));
        console2.log("Tick Upper:", int256(tickUpper));
        console2.log("Liquidity Delta:", liquidityDelta);

        // Add liquidity
        router.modifyLiquidity(poolKey, params, bytes(""));

        console2.log("Liquidity added successfully!");
    }

    function _printSummary(address deployer) internal view {
        console2.log("");
        console2.log("==============================================");
        console2.log("         POOL SETUP COMPLETE!");
        console2.log("==============================================");
        console2.log("");
        console2.log("Network: Sepolia (Chain ID: 11155111)");
        console2.log("Deployer:", deployer);
        console2.log("");
        console2.log("Pool Configuration:");
        console2.log("  Token0:", token0);
        console2.log("  Token1:", token1);
        console2.log("  Fee: DYNAMIC (hook-controlled)");
        console2.log("  Tick Spacing:", int256(TICK_SPACING));
        console2.log("  Hook:", REPUTATION_HOOK);
        console2.log("");
        console2.log("Pool ID:");
        console2.logBytes32(PoolId.unwrap(poolKey.toId()));
        console2.log("");
        console2.log("Liquidity Added:");
        console2.log("  Target USDC: 5,000 USDC");
        console2.log("  Target WETH: 0.5 WETH");
        console2.log("");
        console2.log("Fee Tiers (via ReputationFeeHook):");
        console2.log("  Tier 1 (0-30d):   0.30% - No discount");
        console2.log("  Tier 2 (30-90d):  0.225% - 25% discount");
        console2.log("  Tier 3 (90-180d): 0.15% - 50% discount");
        console2.log("  Tier 4 (180d+):   0.075% - 75% discount");
        console2.log("");
        console2.log("Routers for Testing:");
        console2.log("  ModifyLiquidity:", MODIFY_LIQUIDITY_ROUTER);
        console2.log("  Swap:", SWAP_ROUTER);
        console2.log("==============================================");
    }
}

/// @title TestSwapOnPool
/// @notice Script to test a swap on the created pool
contract TestSwapOnPool is Script {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant SWAP_ROUTER = 0x9B6b46e2c869aa39918Db7f52f5557FE577B6eEe;
    address constant MOCK_USDC = 0x8f5Ea180434196ED2d60f69977f8ba65EBeD498D;
    address constant MOCK_WETH = 0xd605E4dDCCe7C1ebbeb92eC255761d486a07065B;
    address constant REPUTATION_HOOK = 0x03Df707d29b18144477f77975d7a067C9671C080;

    int24 constant TICK_SPACING = 60;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("=== Test Swap ===");
        console2.log("Swapper:", deployer);

        // Setup token order
        address token0 = MOCK_USDC < MOCK_WETH ? MOCK_USDC : MOCK_WETH;
        address token1 = MOCK_USDC < MOCK_WETH ? MOCK_WETH : MOCK_USDC;

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(REPUTATION_HOOK)
        });

        vm.startBroadcast(deployerPrivateKey);

        // Approve tokens to swap router
        IERC20(MOCK_USDC).approve(SWAP_ROUTER, type(uint256).max);
        IERC20(MOCK_WETH).approve(SWAP_ROUTER, type(uint256).max);

        // Swap 100 USDC for WETH
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: token0 == MOCK_USDC, // true if swapping USDC -> WETH
            amountSpecified: -100 * 10 ** 6, // Negative = exact input of 100 USDC
            sqrtPriceLimitX96: token0 == MOCK_USDC ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
        });

        ISwapRouter.TestSettings memory settings = ISwapRouter.TestSettings({takeClaims: false, settleUsingBurn: false});

        console2.log("Swapping 100 USDC for WETH...");

        ISwapRouter(SWAP_ROUTER).swap(poolKey, params, settings, bytes(""));

        vm.stopBroadcast();

        console2.log("Swap executed!");
    }
}
