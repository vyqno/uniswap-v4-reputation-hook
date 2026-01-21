// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {PoolManager} from "v4-core/PoolManager.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {IHooks} from "v4-core/interfaces/IHooks.sol";
import {PoolId, PoolIdLibrary} from "v4-core/types/PoolId.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {ReputationFeeHook} from "../src/ReputationFeeHook.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {AggregatorV3Interface} from "chainlink/shared/interfaces/AggregatorV3Interface.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Interfaces for Tokens
interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);
}

interface IWETH is IERC20 {
    function deposit() external payable;
}

interface PoolModifyLiquidityTest {
    function modifyLiquidity(
        PoolKey memory key,
        IPoolManager.ModifyLiquidityParams memory params,
        bytes memory hookData
    ) external payable returns (uint256 delta); // Returns BalanceDelta, simplified to uint256 or bytes32 to avoid import
}

contract DeployRealPrice is Script {
    using PoolIdLibrary for PoolKey;

    // Existing Tokens
    address constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; // 6 decimals
    address constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; // 18 decimals

    // Chainlink Feed (Sepolia)
    address constant ETH_USD_FEED = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

    // Core Addresses
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;
    address constant MODIFY_LIQUIDITY_ROUTER = 0x0C478023803a644c94c4CE1C1e7b9A087e411B0A;
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Registry
        // Implementation
        ReputationRegistry implementation = new ReputationRegistry();
        console.log("Registry Implementation:", address(implementation));

        // Proxy
        bytes memory initData =
            abi.encodeWithSelector(ReputationRegistry.initialize.selector, 1000000000000000, 86400, deployer);

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);
        ReputationRegistry registry = ReputationRegistry(address(proxy));
        console.log("Registry Proxy deployed at:", address(registry));

        // 2. Deploy Hook
        // Hook needs BEFORE_SWAP_FLAG set in address
        uint160 hookFlags = uint160(1 << 7);

        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            hookFlags,
            type(ReputationFeeHook).creationCode,
            abi.encode(IPoolManager(POOL_MANAGER), registry)
        );

        console.log("Hook Miner found address:", hookAddress);

        ReputationFeeHook hook = new ReputationFeeHook{salt: salt}(IPoolManager(POOL_MANAGER), registry);
        require(address(hook) == hookAddress, "Hook address mismatch");
        console.log("Hook deployed at:", address(hook));

        // 3. Fetch Real Price
        (, int256 priceResponse,,,) = AggregatorV3Interface(ETH_USD_FEED).latestRoundData();
        uint256 ethPriceUsd = uint256(priceResponse) / 1e8; // Raw price (e.g. 3000)
        console.log("ETH Price (USD):", ethPriceUsd);

        // 4. Calculate SqrtPriceX96
        // Token0 = USDC (0x1c7...)
        // Token1 = WETH (0xfFf...)
        // Price = WETH per USDC.
        // 1 USDC = 1/3000 ETH.
        // Price P = 1 / ethPriceUsd.
        // But we need to account for decimals.
        // decimal0 = 6 (USDC). decimal1 = 18 (WETH).
        // Raw Price Ratio = (Amount1 / 10^18) / (Amount0 / 10^6) = P_real (1/3000)
        // Amount1 / Amount0 = P_real * 10^12.
        // Ratio = (1/3000) * 10^12 = 10^12 / 3000 = 10^9 / 3.
        // sqrt(Ratio) * 2^96.
        // Ratio = 1e12 / ethPriceUsd.
        // We can do this math in Solidity or passed in.
        // Since we are in Solidity, we can calculate.

        // ratioX128 (using higher precision for sqrt)?
        // uint256 ratio = 10**12 * 1e18 / ethPriceUsd; // Scale up to avoid precision loss?
        // Let's use:
        // sqrtPriceX96 = sqrt( (1e18 * 1e12) / ethPriceUsd ) * 2^96 / 1e9?
        // Simpler:
        // r = 10^30 / ethPriceUsd. (Where 10^30 comes from 10^12 * 10^18).
        // sqrt(r) = 10^15 / sqrt(ethPriceUsd).
        // Q96 = sqrt(r) * 2^96 / 10^18? No.

        // Let's just use the JS logic approach manually translated.
        // price = 1 / 3000.
        // decimals_factor = 10^(18-6) = 10^12.
        // Q96 = sqrt(price * decimals_factor) * 2^96.
        // Q96 = sqrt(1/3000 * 10^12) * 2^96.
        // Q96 = sqrt(10^12 / 3000) * 2^96.
        // Q96 = sqrt( 10^12 * 2^192 / 3000 )? No.

        // Calculation in solidity:
        // uint256 numerator = 10**12;
        // uint256 invPrice = ethPriceUsd;
        // uint256 val = numerator * (1 << 192) / invPrice;
        // uint160 sqrtPriceX96 = uint160(sqrt(val));

        uint256 val = ((10 ** 12) << 192) / ethPriceUsd; // This might overflow 256 bits?
        // 10^12 is ~40 bits. 192 bits. Total 232 bits. Safe.
        // 10^12 * 2^192 / 3000.
        // sqrt(val).

        uint160 sqrtPriceX96 = uint160(sqrt(val));
        console.log("Calculated SqrtPriceX96:", sqrtPriceX96);

        // 5. Initialize Pool
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(USDC),
            currency1: Currency.wrap(WETH),
            fee: 8388608, // Dynamic Fee
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });

        IPoolManager(POOL_MANAGER).initialize(key, sqrtPriceX96);
        console.log("Pool initialized");

        // 6. Token Approvals & WETH Wrapping
        // Wrap 0.3 ETH
        uint256 wethAmt = 0.3 ether;
        IWETH(WETH).deposit{value: wethAmt}();
        console.log("Wrapped 0.3 ETH");

        // Need matching USDC
        // Value = 0.3 * ETH_Price.
        // e.g. 0.3 * 3000 = 900 USDC.
        // We need 900 * 10^6 units.
        uint256 usdcAmt = (wethAmt * ethPriceUsd) / 10 ** 12; // (1e18 * price) / 1e12 = 1e6 scale.
        // (0.3e18 * 3000) / 1e12 = 900e21 / 1e12 = 900e9 ?? No.
        // (0.3 * 10^18 * 3000) / 10^12 = 900 * 10^18 / 10^12 = 900 * 10^6. Correct.

        console.log("Required USDC:", usdcAmt);

        // Approve
        IERC20(USDC).approve(MODIFY_LIQUIDITY_ROUTER, type(uint256).max);
        IERC20(WETH).approve(MODIFY_LIQUIDITY_ROUTER, type(uint256).max);

        // 7. Add Liquidity
        // Calculate delta?
        // We can just try to add with a wide range and specifying amounts?
        // No, ModifyLiquidity takes `liquidityDelta`.
        // We need to calculate Liquidity L from amount0 and amount1.
        // L = amount0 * sqrt(P) / (1 - P_lower/P_curr)?
        // Simplified: use `liquidityDelta` approx.
        // Liquidity = amount1 / (sqrtPrice - sqrtPriceLower).
        // Let's assume a range [-600, 600] to contain the price? No, wide range.
        // Let's use range [-887220, 887220] (Full range).
        // For full range:
        // L = sqrt(X * Y).
        // X (USDC) ~ 900e6. Y (WETH) ~ 0.3e18.
        // L = sqrt(900e6 * 0.3e18) = sqrt(270e24) = sqrt(270) * 1e12.
        // sqrt(270) ~ 16.4.
        // L ~ 16.4e12.

        // Let's calculate roughly in script.
        uint256 L = sqrt(usdcAmt * wethAmt); // Geometric mean approx for full range?
        // Not exact but close enough for "depositing some amount".
        // Actually, precise formula for full range is L = amount1 / (sqrtPrice) + amount0 * sqrtPrice ...?
        // Full Range Liquidity L = amount0 * sqrtPrice * sqrtPriceUpper / (sqrtPriceUpper - sqrtPrice) ?
        // If range is infinite, L = sqrt(x*y) is only at P=1?
        // Let's just create a position with SOME liquidity.
        // e.g. 1e13.
        // We have 0.3 ETH (3e17) and 900 USDC (9e8).
        // Liquidity 1 unit of WETH (1e18) at price 1 USDC (1e6) -> L?
        // Let's use 1000000000 (1e9) as before? That was tiny.
        // 1e9 liquidity with 1e18 tokens is nothing.
        // We want to use SIGNIFICANT liquidity.
        // Let's try `liquidityDelta = 1 ether` (1e18)?
        // If Price ~ 3000 (1/3000).
        // 1e18 liquidity might require ~ 1000 USD?
        // Let's try `int256 delta = 100000000;` (1e8)?
        // Better:
        // Use a safe moderate amount like 1e14.
        // We can check balances after script?

        // Actually, since we want to consume 0.3 ETH.
        // L = Amount1 / (sqrtPrice - sqrtPriceLower).
        // If TickLower = min. sqrtPriceLower ~ 0.
        // L = Amount1 / sqrtPrice.
        // Amount1 = 0.3e18.
        // sqrtPrice (X96) ~ sqrt(1e12/3000) * 2^96.
        // sqrt(1e12/3000) ~ sqrt(3.3e8) ~ 1.8e4.
        // sqrtPrice ~ 1.8e4 * 2^96.
        // L = 0.3e18 / (1.8e4 * 2^96 / 2^96) = 0.3e18 / 1.8e4 = 3e17 / 1.8e4 = 1.6e13.
        // So L ~ 1.6e13.
        // Let's set liquidityDelta = 16000000000000 (1.6e13).

        int256 liquidityDelta = 15000000000000; // 1.5e13

        IPoolManager.ModifyLiquidityParams memory params = IPoolManager.ModifyLiquidityParams({
            tickLower: -887220, tickUpper: 887220, liquidityDelta: liquidityDelta, salt: bytes32(0)
        });

        // Use Router interface
        PoolModifyLiquidityTest(MODIFY_LIQUIDITY_ROUTER).modifyLiquidity(key, params, bytes(""));
        console.log("Liquidity Added");

        vm.stopBroadcast();
    }

    // Sqrt function from Uniswap V2 or basic Newton
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
