// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title HookMiner
/// @notice Library for mining hook addresses with specific flags
/// @dev Used to find CREATE2 salts that produce addresses with required hook permission bits
library HookMiner {
    /// @notice Find a salt that produces a hook address with specific flags
    /// @param deployer The address that will deploy the hook
    /// @param flags The required flags in the address (lower 14 bits)
    /// @param creationCode The creation bytecode of the hook contract
    /// @param constructorArgs The encoded constructor arguments
    /// @return hookAddress The address that will be deployed
    /// @return salt The salt to use with CREATE2
    function find(address deployer, uint160 flags, bytes memory creationCode, bytes memory constructorArgs)
        internal
        pure
        returns (address hookAddress, bytes32 salt)
    {
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 bytecodeHash = keccak256(bytecode);

        uint256 nonce = 0;

        while (true) {
            salt = bytes32(nonce);
            hookAddress = computeAddress(deployer, salt, bytecodeHash);

            // Check if lower 14 bits match the required flags
            if ((uint160(hookAddress) & 0x3FFF) == flags) {
                return (hookAddress, salt);
            }

            nonce++;

            // Safety limit to prevent infinite loop (should never happen in practice)
            if (nonce > 1_000_000) {
                revert("HookMiner: could not find valid salt");
            }
        }
    }

    /// @notice Compute the CREATE2 address
    /// @param deployer The deploying contract address
    /// @param salt The salt value
    /// @param bytecodeHash The hash of the creation bytecode
    /// @return addr The computed address
    function computeAddress(address deployer, bytes32 salt, bytes32 bytecodeHash) internal pure returns (address addr) {
        // CREATE2 address = keccak256(0xff ++ deployer ++ salt ++ bytecodeHash)[12:]
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0xff00000000000000000000000000000000000000000000000000000000000000)
            mstore(add(ptr, 1), shl(96, deployer))
            mstore(add(ptr, 21), salt)
            mstore(add(ptr, 53), bytecodeHash)
            addr := and(keccak256(ptr, 85), 0xffffffffffffffffffffffffffffffffffffffff)
        }
    }
}
