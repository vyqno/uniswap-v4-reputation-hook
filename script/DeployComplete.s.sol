// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {ReputationRegistry} from "../src/ReputationRegistry.sol";
import {ReputationFeeHook} from "../src/ReputationFeeHook.sol";
import {IReputationRegistry} from "../src/interfaces/IReputationRegistry.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MockWETH} from "../src/mocks/MockWETH.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {ChainConfig} from "./helpers/DevOpsTools.sol";

/// @title DeployComplete
/// @notice Master deployment script for the Reputation Fee Hook system
/// @dev Supports multi-chain deployment with address export
contract DeployComplete is Script {
    // ============ Configuration ============

    /// @notice Registration bond amount (0.001 ETH)
    uint256 public constant REGISTRATION_BOND = 0.001 ether;

    /// @notice Activation delay (1 day)
    uint256 public constant ACTIVATION_DELAY = 1 days;

    /// @notice Deterministic CREATE2 deployer used by forge script
    /// @dev See: https://github.com/Arachnid/deterministic-deployment-proxy
    address public constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    // ============ Deployed Addresses ============

    MockUSDC public usdc;
    MockWETH public weth;
    ReputationRegistry public registryImplementation;
    ReputationRegistry public registry;
    ReputationFeeHook public hook;

    // ============ Deployment Info ============

    struct DeploymentInfo {
        address deployer;
        uint256 chainId;
        string networkName;
        address mockUSDC;
        address mockWETH;
        address registryImpl;
        address registryProxy;
        address hook;
        address poolManager;
        uint256 timestamp;
    }

    DeploymentInfo public deploymentInfo;

    // ============ Main Deployment Function ============

    /// @notice Deploy all contracts with hook mining (for testnets/mainnets with V4)
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get pool manager address based on chain
        address poolManagerAddress = _getPoolManagerForChain(block.chainid);
        require(poolManagerAddress != address(0), "Pool manager not set for this chain");

        IPoolManager poolManager = IPoolManager(poolManagerAddress);

        console2.log("=== Reputation Fee Hook Deployment ===");
        console2.log("Chain ID:", block.chainid);
        console2.log("Network:", ChainConfig.getNetworkName(block.chainid));
        console2.log("Deployer:", deployer);
        console2.log("Deployer Balance:", deployer.balance);
        console2.log("Pool Manager:", poolManagerAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy all contracts
        _deployTokens();
        _deployRegistry(deployer);
        _deployHookWithMining(poolManager);

        vm.stopBroadcast();

        // Save deployment info
        _saveDeploymentInfo(deployer, poolManagerAddress);

        // Print summary
        _printSummary();

        // Export addresses to files
        _exportAddresses();
    }

    /// @notice Deploy for local Anvil testing (no pool manager required)
    function runLocal() external {
        // Use Anvil's default private key
        uint256 deployerPrivateKey =
            vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("=== Local Anvil Deployment ===");
        console2.log("Chain ID:", block.chainid);
        console2.log("Deployer:", deployer);
        console2.log("Deployer Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy tokens
        _deployTokens();

        // Deploy registry with proxy
        _deployRegistry(deployer);

        vm.stopBroadcast();

        // Save deployment info (no hook for local)
        deploymentInfo = DeploymentInfo({
            deployer: deployer,
            chainId: block.chainid,
            networkName: "anvil",
            mockUSDC: address(usdc),
            mockWETH: address(weth),
            registryImpl: address(registryImplementation),
            registryProxy: address(registry),
            hook: address(0),
            poolManager: address(0),
            timestamp: block.timestamp
        });

        _printSummary();
        _exportAddresses();
    }

    /// @notice Deploy with a mock pool manager for integration testing
    function runWithMockPoolManager(address mockPoolManager) external {
        uint256 deployerPrivateKey =
            vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("=== Deployment with Mock Pool Manager ===");
        console2.log("Chain ID:", block.chainid);
        console2.log("Deployer:", deployer);
        console2.log("Mock Pool Manager:", mockPoolManager);

        vm.startBroadcast(deployerPrivateKey);

        _deployTokens();
        _deployRegistry(deployer);
        _deployHookWithMining(IPoolManager(mockPoolManager));

        vm.stopBroadcast();

        _saveDeploymentInfo(deployer, mockPoolManager);
        _printSummary();
        _exportAddresses();
    }

    // ============ Internal Deployment Functions ============

    function _deployTokens() internal {
        console2.log("\n--- Deploying Mock Tokens ---");
        usdc = new MockUSDC();
        weth = new MockWETH();
        console2.log("MockUSDC:", address(usdc));
        console2.log("MockWETH:", address(weth));
    }

    function _deployRegistry(address owner) internal {
        console2.log("\n--- Deploying ReputationRegistry ---");

        // Deploy implementation
        registryImplementation = new ReputationRegistry();
        console2.log("Registry Implementation:", address(registryImplementation));

        // Prepare initialization data
        bytes memory initData =
            abi.encodeWithSelector(ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, owner);

        // Deploy proxy
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImplementation), initData);
        registry = ReputationRegistry(address(registryProxy));
        console2.log("Registry Proxy:", address(registry));

        // Verify initialization
        require(registry.registrationBond() == REGISTRATION_BOND, "Bond not set");
        require(registry.activationDelay() == ACTIVATION_DELAY, "Delay not set");
        require(registry.owner() == owner, "Owner not set");
        console2.log("Registry initialized successfully");
    }

    function _deployHookWithMining(IPoolManager poolManager) internal {
        console2.log("\n--- Deploying ReputationFeeHook ---");

        // Hook needs BEFORE_SWAP_FLAG set in address
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);

        // Mine for valid hook address using the deterministic CREATE2 deployer
        // In forge script, salted deployments go through 0x4e59b44847b379578588920cA78FbF26c0B4956C
        console2.log("Mining hook address...");
        console2.log("CREATE2 Deployer:", CREATE2_DEPLOYER);
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER, flags, type(ReputationFeeHook).creationCode, abi.encode(poolManager, registry)
        );
        console2.log("Target Hook Address:", hookAddress);
        console2.log("Salt:", uint256(salt));

        // Deploy hook with found salt
        hook = new ReputationFeeHook{salt: salt}(poolManager, IReputationRegistry(address(registry)));

        // Verify deployed address matches mined address
        require(address(hook) == hookAddress, "Hook address mismatch");
        console2.log("ReputationFeeHook:", address(hook));

        // Verify hook permissions
        bool hasBeforeSwap = (uint160(address(hook)) & Hooks.BEFORE_SWAP_FLAG) != 0;
        console2.log("beforeSwap enabled:", hasBeforeSwap);
        require(hasBeforeSwap, "Hook missing beforeSwap permission");
    }

    // ============ Address Export Functions ============

    function _saveDeploymentInfo(address deployer, address poolManager) internal {
        deploymentInfo = DeploymentInfo({
            deployer: deployer,
            chainId: block.chainid,
            networkName: ChainConfig.getNetworkName(block.chainid),
            mockUSDC: address(usdc),
            mockWETH: address(weth),
            registryImpl: address(registryImplementation),
            registryProxy: address(registry),
            hook: address(hook),
            poolManager: poolManager,
            timestamp: block.timestamp
        });
    }

    function _exportAddresses() internal {
        string memory networkName = ChainConfig.getNetworkName(block.chainid);

        // Export JSON
        string memory jsonPath = string(abi.encodePacked("deployments/", networkName, ".json"));

        string memory json = _buildJson();
        vm.writeFile(jsonPath, json);
        console2.log("\nDeployment JSON saved to:", jsonPath);

        // Export ENV
        string memory envPath = string(abi.encodePacked("deployments/", networkName, ".env"));

        string memory envContent = _buildEnv();
        vm.writeFile(envPath, envContent);
        console2.log("Deployment ENV saved to:", envPath);
    }

    function _buildJson() internal view returns (string memory) {
        return string(
            abi.encodePacked(
                "{\n",
                '  "network": "',
                deploymentInfo.networkName,
                '",\n',
                '  "chainId": ',
                vm.toString(deploymentInfo.chainId),
                ",\n",
                '  "deployer": "',
                vm.toString(deploymentInfo.deployer),
                '",\n',
                '  "timestamp": ',
                vm.toString(deploymentInfo.timestamp),
                ",\n",
                '  "contracts": {\n',
                '    "MockUSDC": "',
                vm.toString(deploymentInfo.mockUSDC),
                '",\n',
                '    "MockWETH": "',
                vm.toString(deploymentInfo.mockWETH),
                '",\n',
                '    "ReputationRegistry": {\n',
                '      "implementation": "',
                vm.toString(deploymentInfo.registryImpl),
                '",\n',
                '      "proxy": "',
                vm.toString(deploymentInfo.registryProxy),
                '"\n',
                "    },\n",
                '    "ReputationFeeHook": "',
                vm.toString(deploymentInfo.hook),
                '"\n',
                "  },\n",
                '  "config": {\n',
                '    "poolManager": "',
                vm.toString(deploymentInfo.poolManager),
                '",\n',
                '    "registrationBond": "',
                vm.toString(REGISTRATION_BOND),
                '",\n',
                '    "activationDelay": ',
                vm.toString(ACTIVATION_DELAY),
                "\n",
                "  }\n",
                "}"
            )
        );
    }

    function _buildEnv() internal view returns (string memory) {
        string memory prefix = ChainConfig.getEnvPrefix(deploymentInfo.chainId);

        return string(
            abi.encodePacked(
                "# Deployment for ",
                deploymentInfo.networkName,
                " (Chain ID: ",
                vm.toString(deploymentInfo.chainId),
                ")\n",
                "# Deployed at: ",
                vm.toString(deploymentInfo.timestamp),
                "\n",
                "# Deployer: ",
                vm.toString(deploymentInfo.deployer),
                "\n\n",
                prefix,
                "USDC_ADDRESS=",
                vm.toString(deploymentInfo.mockUSDC),
                "\n",
                prefix,
                "WETH_ADDRESS=",
                vm.toString(deploymentInfo.mockWETH),
                "\n",
                prefix,
                "REGISTRY_IMPL=",
                vm.toString(deploymentInfo.registryImpl),
                "\n",
                prefix,
                "REGISTRY_ADDRESS=",
                vm.toString(deploymentInfo.registryProxy),
                "\n",
                prefix,
                "HOOK_ADDRESS=",
                vm.toString(deploymentInfo.hook),
                "\n",
                prefix,
                "POOL_MANAGER=",
                vm.toString(deploymentInfo.poolManager),
                "\n"
            )
        );
    }

    // ============ Chain Configuration ============

    function _getPoolManagerForChain(uint256 chainId) internal view returns (address) {
        // Testnets
        if (chainId == ChainConfig.SEPOLIA) {
            return vm.envOr("POOL_MANAGER_SEPOLIA", address(0));
        }
        if (chainId == ChainConfig.BASE_SEPOLIA) {
            return vm.envOr("POOL_MANAGER_BASE_SEPOLIA", address(0));
        }
        if (chainId == ChainConfig.ARBITRUM_SEPOLIA) {
            return vm.envOr("POOL_MANAGER_ARB_SEPOLIA", address(0));
        }
        if (chainId == ChainConfig.POLYGON_AMOY) {
            return vm.envOr("POOL_MANAGER_POLYGON_AMOY", address(0));
        }

        // Mainnets
        if (chainId == ChainConfig.MAINNET) {
            return vm.envOr("POOL_MANAGER_MAINNET", address(0));
        }
        if (chainId == ChainConfig.BASE) {
            return vm.envOr("POOL_MANAGER_BASE", address(0));
        }
        if (chainId == ChainConfig.POLYGON) {
            return vm.envOr("POOL_MANAGER_POLYGON", address(0));
        }
        if (chainId == ChainConfig.ARBITRUM) {
            return vm.envOr("POOL_MANAGER_ARBITRUM", address(0));
        }

        // Local/Anvil - no pool manager
        if (chainId == ChainConfig.ANVIL) {
            return address(0);
        }

        return address(0);
    }

    // ============ Summary ============

    function _printSummary() internal view {
        console2.log("\n========================================");
        console2.log("       DEPLOYMENT SUMMARY");
        console2.log("========================================");
        console2.log("Network:", deploymentInfo.networkName);
        console2.log("Chain ID:", deploymentInfo.chainId);
        console2.log("Deployer:", deploymentInfo.deployer);
        console2.log("");
        console2.log("Contracts:");
        console2.log("  MockUSDC:            ", deploymentInfo.mockUSDC);
        console2.log("  MockWETH:            ", deploymentInfo.mockWETH);
        console2.log("  Registry Impl:       ", deploymentInfo.registryImpl);
        console2.log("  Registry Proxy:      ", deploymentInfo.registryProxy);
        if (deploymentInfo.hook != address(0)) {
            console2.log("  ReputationFeeHook:   ", deploymentInfo.hook);
        }
        console2.log("");
        console2.log("Configuration:");
        if (deploymentInfo.poolManager != address(0)) {
            console2.log("  Pool Manager:        ", deploymentInfo.poolManager);
        }
        console2.log("  Registration Bond:    0.001 ETH");
        console2.log("  Activation Delay:     1 day");
        console2.log("");
        console2.log("Fee Tiers:");
        console2.log("  Tier 1 (0-30d):      0.30% (no discount)");
        console2.log("  Tier 2 (30-90d):     0.225% (25% discount)");
        console2.log("  Tier 3 (90-180d):    0.15% (50% discount)");
        console2.log("  Tier 4 (180d+):      0.075% (75% discount)");
        console2.log("========================================\n");
    }
}
