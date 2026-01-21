// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {DevOpsTools} from "foundry-devops/DevOpsTools.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {ReputationFeeHook} from "../src/ReputationFeeHook.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockWETH} from "../src/mocks/MockWETH.sol";
import {ChainConfig} from "./helpers/DevOpsTools.sol";

/// @title Interactions
/// @notice Script for interacting with deployed contracts
/// @dev Uses Cyfrin DevOps to fetch deployed addresses from broadcast files
contract Interactions is Script {
    // Fetched addresses
    ReputationRegistry public registry;
    ReputationFeeHook public hook;
    MockUSDC public usdc;
    MockWETH public weth;

    /// @notice Fetch all deployed contract addresses using DevOps
    function fetchDeployedAddresses() public {
        uint256 chainId = block.chainid;
        console2.log("Fetching addresses for chain:", chainId);

        // Get most recent deployments
        address registryProxy = DevOpsTools.get_most_recent_deployment("ERC1967Proxy", chainId);
        address hookAddr = DevOpsTools.get_most_recent_deployment("ReputationFeeHook", chainId);
        address usdcAddr = DevOpsTools.get_most_recent_deployment("MockUSDC", chainId);
        address wethAddr = DevOpsTools.get_most_recent_deployment("MockWETH", chainId);

        registry = ReputationRegistry(registryProxy);
        hook = ReputationFeeHook(hookAddr);
        usdc = MockUSDC(usdcAddr);
        weth = MockWETH(payable(wethAddr));

        console2.log("Registry Proxy:", registryProxy);
        console2.log("Hook:", hookAddr);
        console2.log("USDC:", usdcAddr);
        console2.log("WETH:", wethAddr);
    }

    /// @notice Register a user on the deployed registry
    function register() external {
        fetchDeployedAddresses();

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        console2.log("=== Registering User ===");
        console2.log("User:", user);
        console2.log("Registry:", address(registry));

        uint256 bond = registry.registrationBond();
        console2.log("Bond required:", bond);

        vm.startBroadcast(deployerPrivateKey);

        registry.register{value: bond}();

        vm.stopBroadcast();

        console2.log("Registration successful!");
        console2.log("Registration time:", registry.getRegistrationTime(user));
    }

    /// @notice Check a user's reputation status
    function checkReputation() external {
        fetchDeployedAddresses();

        address user = vm.envAddress("USER_ADDRESS");

        console2.log("=== Reputation Status ===");
        console2.log("User:", user);

        bool isRegistered = registry.isRegistered(user);
        console2.log("Is Registered:", isRegistered);

        if (isRegistered) {
            uint256 registrationTime = registry.getRegistrationTime(user);
            uint256 reputationAge = registry.getReputationAge(user);
            bool isActive = registry.isReputationActive(user);

            console2.log("Registration Time:", registrationTime);
            console2.log("Reputation Age (seconds):", reputationAge);
            console2.log("Is Active:", isActive);

            // Calculate tier
            if (reputationAge >= 180 days) {
                console2.log("Current Tier: 4 (75% discount)");
            } else if (reputationAge >= 90 days) {
                console2.log("Current Tier: 3 (50% discount)");
            } else if (reputationAge >= 30 days) {
                console2.log("Current Tier: 2 (25% discount)");
            } else {
                console2.log("Current Tier: 1 (no discount)");
            }
        }
    }

    /// @notice Get fee quote for a user from the hook
    function getFeeQuote() external {
        fetchDeployedAddresses();

        address user = vm.envAddress("USER_ADDRESS");

        console2.log("=== Fee Quote ===");
        console2.log("User:", user);
        console2.log("Hook:", address(hook));

        uint24 fee = hook.getFeeQuote(user);
        console2.log("Fee (hundredths of bps):", fee);

        // Convert to percentage
        uint256 feePercent = (uint256(fee) * 100) / 10000;
        console2.log("Fee percentage:", feePercent, "/ 100 %");
    }

    /// @notice Mint test tokens to an address
    function mintTestTokens() external {
        fetchDeployedAddresses();

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address recipient = vm.envOr("RECIPIENT", vm.addr(deployerPrivateKey));

        uint256 usdcAmount = 10_000 * 10 ** 6; // 10,000 USDC
        uint256 wethAmount = 10 * 10 ** 18; // 10 WETH

        console2.log("=== Minting Test Tokens ===");
        console2.log("Recipient:", recipient);
        console2.log("USDC Amount:", usdcAmount);
        console2.log("WETH Amount:", wethAmount);

        vm.startBroadcast(deployerPrivateKey);

        usdc.mint(recipient, usdcAmount);
        weth.mint(recipient, wethAmount);

        vm.stopBroadcast();

        console2.log("Minting complete!");
        console2.log("USDC Balance:", usdc.balanceOf(recipient));
        console2.log("WETH Balance:", weth.balanceOf(recipient));
    }

    /// @notice Withdraw registration bond (after 30 days)
    function withdrawBond() external {
        fetchDeployedAddresses();

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        console2.log("=== Withdrawing Bond ===");
        console2.log("User:", user);

        uint256 balanceBefore = user.balance;

        vm.startBroadcast(deployerPrivateKey);

        registry.withdrawBond();

        vm.stopBroadcast();

        uint256 balanceAfter = user.balance;
        console2.log("Bond withdrawn!");
        console2.log("Balance before:", balanceBefore);
        console2.log("Balance after:", balanceAfter);
        console2.log("Recovered:", balanceAfter - balanceBefore);
    }

    /// @notice Check contract states (health check)
    function healthCheck() external {
        fetchDeployedAddresses();

        console2.log("=== Health Check ===");
        console2.log("");

        // Registry checks
        console2.log("--- Registry ---");
        console2.log("Address:", address(registry));
        console2.log("Owner:", registry.owner());
        console2.log("Registration Bond:", registry.registrationBond());
        console2.log("Activation Delay:", registry.activationDelay());
        console2.log("Total Registered:", registry.totalRegistered());
        console2.log("Is Paused:", registry.paused());

        // Hook checks (if deployed)
        if (address(hook) != address(0)) {
            console2.log("");
            console2.log("--- Hook ---");
            console2.log("Address:", address(hook));
            console2.log("Registry:", address(hook.registry()));
            console2.log("Base Fee:", hook.BASE_FEE());
            console2.log("Min Fee:", hook.MIN_FEE());
        }

        // Token checks
        console2.log("");
        console2.log("--- Tokens ---");
        console2.log("USDC:", address(usdc));
        console2.log("WETH:", address(weth));

        console2.log("");
        console2.log("Health check complete!");
    }

    /// @notice Simulate time passage for testing (only on Anvil)
    function warpTime(uint256 secondsToWarp) external {
        require(block.chainid == 31337, "Only on Anvil");

        console2.log("=== Time Warp ===");
        console2.log("Current timestamp:", block.timestamp);
        console2.log("Warping forward:", secondsToWarp, "seconds");

        vm.warp(block.timestamp + secondsToWarp);

        console2.log("New timestamp:", block.timestamp);
    }
}

/// @title VerifyDeployment
/// @notice Verification script to run after deployment
contract VerifyDeployment is Script {
    function run() external {
        uint256 chainId = block.chainid;
        console2.log("=== Verifying Deployment on Chain", chainId, "===");

        // Get deployed addresses
        address registryProxy = DevOpsTools.get_most_recent_deployment("ERC1967Proxy", chainId);

        ReputationRegistry registry = ReputationRegistry(registryProxy);

        // Verify registry
        require(registry.registrationBond() == 0.001 ether, "Wrong bond");
        require(registry.activationDelay() == 1 days, "Wrong delay");
        require(!registry.paused(), "Registry is paused");

        console2.log("Registry verification passed!");

        // Try to get hook (may not exist for local deployment)
        address hookAddr = _getDeploymentSafe("ReputationFeeHook", chainId);
        if (hookAddr != address(0)) {
            ReputationFeeHook hook = ReputationFeeHook(hookAddr);

            require(address(hook.registry()) == registryProxy, "Wrong registry in hook");
            require(hook.BASE_FEE() == 3000, "Wrong base fee");
            require(hook.MIN_FEE() == 500, "Wrong min fee");

            console2.log("Hook verification passed!");
        } else {
            console2.log("No hook found (local deployment)");
        }

        console2.log("");
        console2.log("All verifications passed!");
    }

    /// @notice Safely get deployment address, returns address(0) if not found
    function _getDeploymentSafe(string memory contractName, uint256 chainId) internal returns (address) {
        // Use a low-level call to catch any revert
        (bool success, bytes memory data) =
            address(this).call(abi.encodeWithSignature("_getDeployment(string,uint256)", contractName, chainId));
        if (success && data.length >= 32) {
            return abi.decode(data, (address));
        }
        return address(0);
    }

    /// @notice Get deployment address (may revert)
    function _getDeployment(string memory contractName, uint256 chainId) external view returns (address) {
        return DevOpsTools.get_most_recent_deployment(contractName, chainId);
    }
}
