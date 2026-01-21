// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ChainConfig
/// @notice Configuration for different chains
library ChainConfig {
    // Chain IDs
    uint256 constant ANVIL = 31337;
    uint256 constant MAINNET = 1;
    uint256 constant SEPOLIA = 11155111;
    uint256 constant BASE = 8453;
    uint256 constant BASE_SEPOLIA = 84532;
    uint256 constant POLYGON = 137;
    uint256 constant POLYGON_AMOY = 80002;
    uint256 constant ARBITRUM = 42161;
    uint256 constant ARBITRUM_SEPOLIA = 421614;

    /// @notice Get network name from chain ID
    function getNetworkName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == ANVIL) return "anvil";
        if (chainId == MAINNET) return "mainnet";
        if (chainId == SEPOLIA) return "sepolia";
        if (chainId == BASE) return "base";
        if (chainId == BASE_SEPOLIA) return "base-sepolia";
        if (chainId == POLYGON) return "polygon";
        if (chainId == POLYGON_AMOY) return "polygon-amoy";
        if (chainId == ARBITRUM) return "arbitrum";
        if (chainId == ARBITRUM_SEPOLIA) return "arbitrum-sepolia";
        return "unknown";
    }

    /// @notice Get env prefix from chain ID
    function getEnvPrefix(uint256 chainId) internal pure returns (string memory) {
        if (chainId == ANVIL) return "ANVIL_";
        if (chainId == MAINNET) return "MAINNET_";
        if (chainId == SEPOLIA) return "SEPOLIA_";
        if (chainId == BASE) return "BASE_";
        if (chainId == BASE_SEPOLIA) return "BASE_SEPOLIA_";
        if (chainId == POLYGON) return "POLYGON_";
        if (chainId == POLYGON_AMOY) return "POLYGON_AMOY_";
        if (chainId == ARBITRUM) return "ARBITRUM_";
        if (chainId == ARBITRUM_SEPOLIA) return "ARBITRUM_SEPOLIA_";
        return "UNKNOWN_";
    }

    /// @notice Check if chain is a testnet
    function isTestnet(uint256 chainId) internal pure returns (bool) {
        return chainId == ANVIL || chainId == SEPOLIA || chainId == BASE_SEPOLIA || chainId == POLYGON_AMOY
            || chainId == ARBITRUM_SEPOLIA;
    }

    /// @notice Check if chain is a mainnet
    function isMainnet(uint256 chainId) internal pure returns (bool) {
        return chainId == MAINNET || chainId == BASE || chainId == POLYGON || chainId == ARBITRUM;
    }
}
