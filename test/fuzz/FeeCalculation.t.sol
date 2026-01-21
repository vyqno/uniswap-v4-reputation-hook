// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console2} from "forge-std/Test.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

import {ReputationRegistry} from "../../src/ReputationRegistry.sol";
import {ReputationFeeHook} from "../../src/ReputationFeeHook.sol";
import {IReputationRegistry} from "../../src/interfaces/IReputationRegistry.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {HookMiner} from "../helpers/HookMiner.sol";

/// @title FeeCalculationFuzzTest
/// @notice Fuzz tests for fee calculation edge cases
/// @dev Tests properties with random inputs across wide ranges
contract FeeCalculationFuzzTest is Test, Deployers {
    ReputationRegistry public registryImpl;
    ReputationRegistry public registry;
    ERC1967Proxy public registryProxy;
    ReputationFeeHook public hook;

    address public owner;

    uint256 constant REGISTRATION_BOND = 0.001 ether;
    uint256 constant ACTIVATION_DELAY = 1 days;

    function setUp() public {
        owner = makeAddr("owner");
        vm.deal(owner, 100 ether);

        // Deploy V4 infrastructure
        deployFreshManagerAndRouters();

        // Deploy registry
        vm.startPrank(owner);
        registryImpl = new ReputationRegistry();
        bytes memory initData =
            abi.encodeWithSelector(ReputationRegistry.initialize.selector, REGISTRATION_BOND, ACTIVATION_DELAY, owner);
        registryProxy = new ERC1967Proxy(address(registryImpl), initData);
        registry = ReputationRegistry(address(registryProxy));
        vm.stopPrank();

        // Deploy hook with mined address
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);
        (address hookAddress, bytes32 salt) =
            HookMiner.find(address(this), flags, type(ReputationFeeHook).creationCode, abi.encode(manager, registry));
        hook = new ReputationFeeHook{salt: salt}(manager, IReputationRegistry(address(registry)));
        require(address(hook) == hookAddress, "Hook address mismatch");
    }

    // ============ Fee Bounds Tests ============

    /// @notice Fuzz: Fee is always >= MIN_FEE
    function testFuzz_FeeNeverBelowMinimum(uint256 reputationAge) public view {
        // Bound to reasonable range (0 to 100 years)
        reputationAge = bound(reputationAge, 0, 100 * 365 days);

        uint24 fee = hook.getFeeForTier(hook.getTier(reputationAge));
        assertGe(fee, hook.MIN_FEE(), "Fee should never be below MIN_FEE");
    }

    /// @notice Fuzz: Fee is always <= BASE_FEE
    function testFuzz_FeeNeverAboveBase(uint256 reputationAge) public view {
        reputationAge = bound(reputationAge, 0, 100 * 365 days);

        uint24 fee = hook.getFeeForTier(hook.getTier(reputationAge));
        assertLe(fee, hook.BASE_FEE(), "Fee should never exceed BASE_FEE");
    }

    /// @notice Fuzz: Fee within bounds for any tier input
    function testFuzz_FeeForTierWithinBounds(uint8 tier) public view {
        uint24 fee = hook.getFeeForTier(tier);

        assertGe(fee, hook.MIN_FEE(), "Fee below minimum");
        assertLe(fee, hook.BASE_FEE(), "Fee above maximum");
    }

    // ============ Monotonicity Tests ============

    /// @notice Fuzz: Older reputation always pays less or equal
    function testFuzz_OlderReputationPaysLessOrEqual(uint256 age1, uint256 age2) public view {
        age1 = bound(age1, 0, 365 * 10 days); // 10 years max
        age2 = bound(age2, 0, 365 * 10 days);

        // Ensure age1 <= age2
        if (age1 > age2) {
            (age1, age2) = (age2, age1);
        }

        uint8 tier1 = hook.getTier(age1);
        uint8 tier2 = hook.getTier(age2);

        uint24 fee1 = hook.getFeeForTier(tier1);
        uint24 fee2 = hook.getFeeForTier(tier2);

        assertGe(tier2, tier1, "Older age should have same or higher tier");
        assertLe(fee2, fee1, "Older age should pay less or equal fee");
    }

    /// @notice Fuzz: Tier is monotonically increasing
    function testFuzz_TierMonotonicity(uint256 age1, uint256 age2) public view {
        age1 = bound(age1, 0, 365 * 10 days);
        age2 = bound(age2, 0, 365 * 10 days);

        if (age1 > age2) {
            (age1, age2) = (age2, age1);
        }

        uint8 tier1 = hook.getTier(age1);
        uint8 tier2 = hook.getTier(age2);

        assertGe(tier2, tier1, "Tier should be monotonically increasing");
    }

    // ============ Tier Boundary Tests ============

    /// @notice Fuzz: Test around tier boundaries
    function testFuzz_TierBoundaryTransitions(uint256 offset) public view {
        // Test around 30 days boundary
        offset = bound(offset, 0, 1 days);

        uint256 justBefore30 = 30 days - offset - 1;
        uint256 at30 = 30 days;
        uint256 justAfter30 = 30 days + offset + 1;

        if (offset < 30 days) {
            assertEq(hook.getTier(justBefore30), 1, "Should be Tier 1 before 30 days");
        }
        assertEq(hook.getTier(at30), 2, "Should be Tier 2 at exactly 30 days");
        assertEq(hook.getTier(justAfter30), 2, "Should be Tier 2 after 30 days");

        // Test around 90 days boundary
        uint256 justBefore90 = 90 days - offset - 1;
        uint256 at90 = 90 days;
        uint256 justAfter90 = 90 days + offset + 1;

        assertEq(hook.getTier(justBefore90), 2, "Should be Tier 2 before 90 days");
        assertEq(hook.getTier(at90), 3, "Should be Tier 3 at exactly 90 days");
        assertEq(hook.getTier(justAfter90), 3, "Should be Tier 3 after 90 days");

        // Test around 180 days boundary
        uint256 justBefore180 = 180 days - offset - 1;
        uint256 at180 = 180 days;
        uint256 justAfter180 = 180 days + offset + 1;

        assertEq(hook.getTier(justBefore180), 3, "Should be Tier 3 before 180 days");
        assertEq(hook.getTier(at180), 4, "Should be Tier 4 at exactly 180 days");
        assertEq(hook.getTier(justAfter180), 4, "Should be Tier 4 after 180 days");
    }

    // ============ Registry Fuzz Tests ============

    /// @notice Fuzz: Random users can register
    function testFuzz_RandomUserRegistration(address user) public {
        // Skip invalid addresses
        vm.assume(user != address(0));
        vm.assume(user.code.length == 0);
        vm.assume(!registry.isRegistered(user));

        vm.deal(user, 1 ether);

        vm.prank(user);
        uint256 regTime = registry.register{value: REGISTRATION_BOND}();

        assertTrue(registry.isRegistered(user), "User should be registered");
        assertEq(registry.getRegistrationTime(user), regTime, "Registration time mismatch");
    }

    /// @notice Fuzz: Excess ETH is refunded
    function testFuzz_ExcessEthRefund(uint256 excessAmount) public {
        excessAmount = bound(excessAmount, 1, 100 ether);

        address user = makeAddr("fuzzUser");
        uint256 totalSent = REGISTRATION_BOND + excessAmount;
        vm.deal(user, totalSent);

        uint256 balanceBefore = user.balance;

        vm.prank(user);
        registry.register{value: totalSent}();

        uint256 balanceAfter = user.balance;
        assertEq(balanceBefore - balanceAfter, REGISTRATION_BOND, "Should only spend bond amount");
    }

    /// @notice Fuzz: Reputation age calculation with various time deltas
    function testFuzz_ReputationAgeCalculation(uint256 timeDelta) public {
        timeDelta = bound(timeDelta, 0, 365 * 10 days);

        address user = makeAddr("ageTestUser");
        vm.deal(user, 1 ether);

        vm.prank(user);
        registry.register{value: REGISTRATION_BOND}();

        uint256 regTime = block.timestamp;

        // Warp time
        vm.warp(regTime + ACTIVATION_DELAY + timeDelta);

        uint256 reputationAge = registry.getReputationAge(user);
        assertEq(reputationAge, timeDelta, "Reputation age should match time delta");
    }

    /// @notice Fuzz: Bond withdrawal timing
    function testFuzz_BondWithdrawalTiming(uint256 waitTime) public {
        waitTime = bound(waitTime, 0, 365 days);

        address user = makeAddr("withdrawUser");
        vm.deal(user, 1 ether);

        vm.prank(user);
        registry.register{value: REGISTRATION_BOND}();

        uint256 regTime = block.timestamp;
        vm.warp(regTime + waitTime);

        if (waitTime >= 30 days) {
            // Should succeed
            uint256 balanceBefore = user.balance;
            vm.prank(user);
            registry.withdrawBond();
            assertEq(user.balance, balanceBefore + REGISTRATION_BOND, "Bond should be returned");
        } else {
            // Should fail
            vm.prank(user);
            vm.expectRevert(IReputationRegistry.CooldownNotComplete.selector);
            registry.withdrawBond();
        }
    }

    // ============ Fee Quote Integration Tests ============

    /// @notice Fuzz: Fee quote consistency
    function testFuzz_FeeQuoteConsistency(uint256 timeDelta) public {
        timeDelta = bound(timeDelta, 0, 365 days);

        address user = makeAddr("quoteUser");
        vm.deal(user, 1 ether);

        // Fee before registration
        uint24 feeBefore = hook.getFeeQuote(user);
        assertEq(feeBefore, hook.BASE_FEE(), "Unregistered should pay base fee");

        // Register
        vm.prank(user);
        registry.register{value: REGISTRATION_BOND}();

        // Fee immediately after (before activation)
        uint24 feeJustAfter = hook.getFeeQuote(user);
        assertEq(feeJustAfter, hook.BASE_FEE(), "Should pay base fee before activation");

        // Warp past activation
        vm.warp(block.timestamp + ACTIVATION_DELAY + timeDelta);

        uint24 feeAfterTime = hook.getFeeQuote(user);
        uint8 expectedTier = hook.getTier(timeDelta);
        uint24 expectedFee = hook.getFeeForTier(expectedTier);

        assertEq(feeAfterTime, expectedFee, "Fee should match tier");
    }

    /// @notice Fuzz: Multiple users with different ages - verify fee monotonicity
    function testFuzz_MultipleUsersFeeDifferences(uint256 seed) public view {
        seed = bound(seed, 0, type(uint64).max);

        // Generate 4 random ages, one for each tier range
        uint256[] memory ages = new uint256[](4);
        ages[0] = bound(seed % 1000, 0, 29 days); // Tier 1
        ages[1] = bound((seed / 1000) % 1000, 30 days, 89 days); // Tier 2
        ages[2] = bound((seed / 1000000) % 1000, 90 days, 179 days); // Tier 3
        ages[3] = bound((seed / 1000000000) % 1000, 180 days, 500 days); // Tier 4

        // Verify fee ordering directly using tier fees
        uint24 prevFee = type(uint24).max;
        for (uint256 i = 0; i < 4; i++) {
            uint8 tier = hook.getTier(ages[i]);
            uint24 fee = hook.getFeeForTier(tier);

            // Higher tier = lower fee, but within same tier fees are equal
            // So we just verify the ordering property holds
            if (i > 0 && ages[i] > ages[i - 1]) {
                assertLe(fee, prevFee, "Older reputation should pay less or equal");
            }
            prevFee = fee;
        }
    }

    // ============ Edge Case Fuzz Tests ============

    /// @notice Fuzz: Very large reputation ages
    function testFuzz_VeryLargeReputationAge(uint256 numYears) public view {
        numYears = bound(numYears, 100, 1000); // 100-1000 years
        uint256 age = numYears * 365 days;

        uint8 tier = hook.getTier(age);
        uint24 fee = hook.getFeeForTier(tier);

        assertEq(tier, 4, "Very old reputation should be Tier 4");
        assertEq(fee, 750, "Tier 4 fee should be 750");
    }

    /// @notice Fuzz: Maximum uint256 age
    function test_MaxUint256Age() public view {
        uint256 maxAge = type(uint256).max;

        uint8 tier = hook.getTier(maxAge);
        uint24 fee = hook.getFeeForTier(tier);

        assertEq(tier, 4, "Max age should be Tier 4");
        assertGe(fee, hook.MIN_FEE(), "Fee should be at least MIN_FEE");
    }

    /// @notice Fuzz: Tier discount values
    function testFuzz_TierDiscountConsistency(uint8 tier) public view {
        tier = uint8(bound(tier, 1, 4));

        uint256 discount = hook.getTierDiscount(tier);

        if (tier == 1) {
            assertEq(discount, 0, "Tier 1 should have 0% discount");
        } else if (tier == 2) {
            assertEq(discount, 2500, "Tier 2 should have 25% discount");
        } else if (tier == 3) {
            assertEq(discount, 5000, "Tier 3 should have 50% discount");
        } else if (tier == 4) {
            assertEq(discount, 7500, "Tier 4 should have 75% discount");
        }
    }

    /// @notice Fuzz: Fee calculation precision
    function testFuzz_FeePrecision(uint8 tier) public view {
        tier = uint8(bound(tier, 1, 4));

        uint256 discount = hook.getTierDiscount(tier);
        uint256 baseFee = hook.BASE_FEE();
        uint256 minFee = hook.MIN_FEE();

        // Calculate expected fee manually
        uint256 expectedFee = (baseFee * (10000 - discount)) / 10000;
        if (expectedFee < minFee) {
            expectedFee = minFee;
        }

        uint24 actualFee = hook.getFeeForTier(tier);
        assertEq(actualFee, expectedFee, "Fee calculation should match");
    }
}
