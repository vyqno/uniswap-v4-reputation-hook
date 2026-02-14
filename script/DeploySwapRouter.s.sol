// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {PoolSwapTest} from "v4-core/test/PoolSwapTest.sol";

/// @title DeploySwapRouter
/// @notice Deploys a PoolSwapTest contract on Sepolia for executing swaps through V4 pools
contract DeploySwapRouter is Script {
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("PoolManager:", POOL_MANAGER);

        vm.startBroadcast(deployerPrivateKey);

        PoolSwapTest swapRouter = new PoolSwapTest(IPoolManager(POOL_MANAGER));
        console.log("PoolSwapTest deployed at:", address(swapRouter));

        vm.stopBroadcast();

        console.log("");
        console.log("=== IMPORTANT ===");
        console.log("Add this to deployments/sepolia.json as 'swapRouter':");
        console.log(address(swapRouter));
        console.log("Then update frontend/src/lib/constants.ts with the swap router address");
    }
}
