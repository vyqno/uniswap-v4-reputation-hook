// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";

/**
 * @title ReputationRegistry
 * @notice A registry where users stake ETH to build on-chain reputation for fee discounts.
 * @dev Implements UUPS upgradeability, ERC-7201 namespaced storage, and transient reentrancy guards.
 * Users pay a bond to register, which activates after a delay. Longer registration durations unlock better fee tiers.
 * @author Hitesh (vyqno)
 */
contract ReputationRegistry is IReputationRegistry, Initializable, UUPSUpgradeable, ReentrancyGuardTransient {
    // ============ Constants ============

    /// @notice Bond cooldown period (30 days) before a user can withdraw their bond.
    uint256 public constant BOND_COOLDOWN = 30 days;

    // ============ Storage (ERC-7201 Namespaced) ============

    /**
     * @custom:storage-location erc7201:reputationregistry.storage.main
     * @notice Main storage struct using ERC-7201 namespaced storage pattern.
     */
    struct MainStorage {
        /// @notice Mapping of user address to reputation data.
        mapping(address => UserReputation) reputations;
        /// @notice Amount of ETH required to register.
        uint256 registrationBond;
        /// @notice Time delay before reputation becomes active.
        uint256 activationDelay;
        /// @notice Total number of registered users.
        uint256 totalRegistered;
        /// @notice Circuit breaker flag to pause new registrations.
        bool paused;
        /// @notice Contract owner address with admin privileges.
        address owner;
    }

    /**
     * @notice Packed user reputation data optimized for specific storage layout.
     */
    struct UserReputation {
        /// @notice Timestamp when user registered (0 = not registered).
        uint128 registrationTime;
        /// @notice Whether the user has withdrawn their bond.
        bool bondWithdrawn;
        /// @notice Reserved space for future upgrades.
        uint120 reserved;
    }

    /// @dev keccak256(abi.encode(uint256(keccak256("reputationregistry.storage.main")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant MAIN_STORAGE_LOCATION = 0x3c5e63d23f53cb5e2e44e1b8b5c67e3a8e9f2b4c7d6e1a3f5c8b7e2d4a6f9c00;

    // ============ Modifiers ============

    /// @notice Restricts function access to contract owner only.
    modifier onlyOwner() {
        MainStorage storage $ = _getMainStorage();
        if (msg.sender != $.owner) {
            revert OwnableUnauthorizedAccount(msg.sender);
        }
        _;
    }

    /// @notice Prevents function execution when registration is paused.
    modifier whenNotPaused() {
        if (_getMainStorage().paused) {
            revert RegistrationIsPaused();
        }
        _;
    }

    // ============ Errors ============

    /// @notice Thrown when non-owner tries to call owner-only function.
    error OwnableUnauthorizedAccount(address account);

    /// @notice Thrown when trying to set owner to zero address.
    error OwnableInvalidOwner(address owner);

    // ============ Events ============

    /// @notice Emitted when contract ownership is transferred to new address.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Constructor ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initializer ============

    /**
     * @notice Initialize the contract with configuration parameters.
     * @param _registrationBond Amount of ETH users must stake to register.
     * @param _activationDelay Time before reputation becomes active.
     * @param _owner Address with admin privileges.
     */
    function initialize(uint256 _registrationBond, uint256 _activationDelay, address _owner) external initializer {
        if (_owner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }

        MainStorage storage $ = _getMainStorage();
        $.registrationBond = _registrationBond;
        $.activationDelay = _activationDelay;
        $.owner = _owner;

        emit OwnershipTransferred(address(0), _owner);
    }

    // ============ External Functions ============

    /**
     * @notice Register the caller by bonding ETH.
     * @dev Excess ETH is refunded. Prevents duplicate registration.
     * @return registrationTime The block.timestamp when user was registered.
     */
    function register() external payable nonReentrant whenNotPaused returns (uint256 registrationTime) {
        MainStorage storage $ = _getMainStorage();

        if ($.reputations[msg.sender].registrationTime != 0) {
            revert AlreadyRegistered();
        }

        if (msg.value < $.registrationBond) {
            revert InsufficientBond();
        }

        registrationTime = block.timestamp;
        $.reputations[msg.sender] =
            UserReputation({registrationTime: uint128(registrationTime), bondWithdrawn: false, reserved: 0});

        unchecked {
            $.totalRegistered++;
        }

        if (msg.value > $.registrationBond) {
            uint256 refund = msg.value - $.registrationBond;
            (bool success,) = msg.sender.call{value: refund}("");
            if (!success) revert TransferFailed();
        }

        emit UserRegistered(msg.sender, registrationTime, $.registrationBond);
    }

    /**
     * @notice Withdraw registration bond after 30-day cooldown.
     * @dev User keeps reputation benefits but bond is marked withdrawn.
     */
    function withdrawBond() external nonReentrant {
        MainStorage storage $ = _getMainStorage();
        UserReputation storage rep = $.reputations[msg.sender];

        if (rep.registrationTime == 0) {
            revert NotRegistered();
        }

        if (rep.bondWithdrawn) {
            revert BondAlreadyWithdrawn();
        }

        if (block.timestamp < rep.registrationTime + BOND_COOLDOWN) {
            revert CooldownNotComplete();
        }

        rep.bondWithdrawn = true;
        uint256 bondAmount = $.registrationBond;

        (bool success,) = msg.sender.call{value: bondAmount}("");
        if (!success) revert TransferFailed();

        emit BondWithdrawn(msg.sender, bondAmount);
    }

    /**
     * @notice Pause new registrations.
     * @dev Only owner can call. Does not affect existing users.
     */
    function pause() external onlyOwner {
        MainStorage storage $ = _getMainStorage();
        $.paused = true;
        emit RegistrationPaused(block.timestamp);
    }

    /**
     * @notice Unpause new registrations.
     * @dev Only owner can call.
     */
    function unpause() external onlyOwner {
        MainStorage storage $ = _getMainStorage();
        $.paused = false;
        emit RegistrationUnpaused(block.timestamp);
    }

    /**
     * @notice Transfer contract ownership to new address.
     * @param newOwner Address that will become the new owner.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }

        MainStorage storage $ = _getMainStorage();
        address oldOwner = $.owner;

        $.owner = newOwner;

        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ============ View Functions ============

    /// @inheritdoc IReputationRegistry
    function getReputationAge(address user) external view returns (uint256 age) {
        MainStorage storage $ = _getMainStorage();
        UserReputation storage rep = $.reputations[user];

        if (rep.registrationTime == 0) {
            return 0;
        }

        uint256 activationTime = rep.registrationTime + $.activationDelay;

        if (block.timestamp < activationTime) {
            return 0;
        }

        unchecked {
            age = block.timestamp - activationTime;
        }
    }

    /// @inheritdoc IReputationRegistry
    function isReputationActive(address user) external view returns (bool) {
        MainStorage storage $ = _getMainStorage();
        UserReputation storage rep = $.reputations[user];

        if (rep.registrationTime == 0) {
            return false;
        }

        return block.timestamp >= rep.registrationTime + $.activationDelay;
    }

    /// @inheritdoc IReputationRegistry
    function isRegistered(address user) external view returns (bool) {
        return _getMainStorage().reputations[user].registrationTime != 0;
    }

    /// @inheritdoc IReputationRegistry
    function getRegistrationTime(address user) external view returns (uint256) {
        return _getMainStorage().reputations[user].registrationTime;
    }

    /// @inheritdoc IReputationRegistry
    function registrationBond() external view returns (uint256) {
        return _getMainStorage().registrationBond;
    }

    /// @inheritdoc IReputationRegistry
    function activationDelay() external view returns (uint256) {
        return _getMainStorage().activationDelay;
    }

    /// @inheritdoc IReputationRegistry
    function totalRegistered() external view returns (uint256) {
        return _getMainStorage().totalRegistered;
    }

    /// @inheritdoc IReputationRegistry
    function paused() external view returns (bool) {
        return _getMainStorage().paused;
    }

    /// @notice Get the current owner address.
    function owner() external view returns (address) {
        return _getMainStorage().owner;
    }

    /// @notice Check if a user has withdrawn their bond.
    function hasBondWithdrawn(address user) external view returns (bool) {
        return _getMainStorage().reputations[user].bondWithdrawn;
    }

    // ============ Internal Functions ============

    /// @notice Get the main storage struct.
    function _getMainStorage() private pure returns (MainStorage storage $) {
        assembly {
            $.slot := MAIN_STORAGE_LOCATION
        }
    }

    /// @notice Authorize upgrade to a new implementation.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
