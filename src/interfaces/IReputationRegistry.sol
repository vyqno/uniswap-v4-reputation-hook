// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IReputationRegistry
/// @notice Interface for the ReputationRegistry contract that tracks user registration timestamps
/// @dev Used by the ReputationFeeHook to determine swap fee discounts based on reputation age
interface IReputationRegistry {
    // ============ Events ============

    /// @notice Emitted when a user successfully registers
    /// @param user The address that registered
    /// @param timestamp The block timestamp when registration occurred
    /// @param bondAmount The amount of ETH deposited as bond
    event UserRegistered(address indexed user, uint256 timestamp, uint256 bondAmount);

    /// @notice Emitted when a user withdraws their registration bond
    /// @param user The address that withdrew the bond
    /// @param bondAmount The amount of ETH returned
    event BondWithdrawn(address indexed user, uint256 bondAmount);

    /// @notice Emitted when registration is paused
    /// @param timestamp The block timestamp when paused
    event RegistrationPaused(uint256 timestamp);

    /// @notice Emitted when registration is unpaused
    /// @param timestamp The block timestamp when unpaused
    event RegistrationUnpaused(uint256 timestamp);

    // ============ Errors ============

    /// @notice Thrown when caller is already registered
    error AlreadyRegistered();

    /// @notice Thrown when caller is not registered
    error NotRegistered();

    /// @notice Thrown when msg.value is less than required bond
    error InsufficientBond();

    /// @notice Thrown when bond withdrawal is attempted before cooldown completes
    error CooldownNotComplete();

    /// @notice Thrown when bond has already been withdrawn
    error BondAlreadyWithdrawn();

    /// @notice Thrown when registration is paused
    error RegistrationIsPaused();

    /// @notice Thrown when ETH transfer fails
    error TransferFailed();

    // ============ External Functions ============

    /// @notice Register the caller's address and store the current timestamp
    /// @dev Requires msg.value >= registrationBond, emits UserRegistered event
    /// @return registrationTime The block.timestamp when the user was registered
    function register() external payable returns (uint256 registrationTime);

    /// @notice Withdraw the registration bond after the cooldown period
    /// @dev Only callable 30 days after registration
    function withdrawBond() external;

    // ============ View Functions ============

    /// @notice Get the reputation age in seconds for an address
    /// @param user The address to query
    /// @return age Seconds since registration became active (0 if not registered or before activation)
    function getReputationAge(address user) external view returns (uint256 age);

    /// @notice Check if a user's reputation is active (past the activation delay)
    /// @param user The address to check
    /// @return True if the user is registered and past the activation delay
    function isReputationActive(address user) external view returns (bool);

    /// @notice Check if a user is registered
    /// @param user The address to check
    /// @return True if the user has registered
    function isRegistered(address user) external view returns (bool);

    /// @notice Get the registration timestamp for a user
    /// @param user The address to query
    /// @return The timestamp when the user registered (0 if not registered)
    function getRegistrationTime(address user) external view returns (uint256);

    /// @notice Get the current registration bond requirement
    /// @return The amount of ETH required to register
    function registrationBond() external view returns (uint256);

    /// @notice Get the activation delay period
    /// @return The number of seconds before reputation becomes active
    function activationDelay() external view returns (uint256);

    /// @notice Get the total number of registered users
    /// @return The total count of registrations
    function totalRegistered() external view returns (uint256);

    /// @notice Check if registration is currently paused
    /// @return True if registration is paused
    function paused() external view returns (bool);
}
