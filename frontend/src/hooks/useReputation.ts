import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { ReputationRegistryABI } from "@/lib/abi/ReputationRegistry";
import { ReputationFeeHookABI } from "@/lib/abi/ReputationFeeHook";
import { CONTRACTS } from "@/lib/constants";

const REGISTRY_ADDRESS = CONTRACTS.sepolia.reputationRegistry as `0x${string}`;
const HOOK_ADDRESS = CONTRACTS.sepolia.reputationFeeHook as `0x${string}`;

// ──────────────────────────────────────────
// Read hooks for ReputationRegistry
// ──────────────────────────────────────────

export function useIsRegistered() {
  const { address } = useAccount();
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "isRegistered",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useIsReputationActive() {
  const { address } = useAccount();
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "isReputationActive",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useReputationAge() {
  const { address } = useAccount();
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "getReputationAge",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useRegistrationTime() {
  const { address } = useAccount();
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "getRegistrationTime",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useHasBondWithdrawn() {
  const { address } = useAccount();
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "hasBondWithdrawn",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useRegistrationBond() {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "registrationBond",
  });
}

export function useTotalRegistered() {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "totalRegistered",
  });
}

export function useIsPaused() {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "paused",
  });
}

export function useBondCooldown() {
  return useReadContract({
    address: REGISTRY_ADDRESS,
    abi: ReputationRegistryABI,
    functionName: "BOND_COOLDOWN",
  });
}

// ──────────────────────────────────────────
// Read hooks for ReputationFeeHook
// ──────────────────────────────────────────

export function useFeeQuote() {
  const { address } = useAccount();
  return useReadContract({
    address: HOOK_ADDRESS,
    abi: ReputationFeeHookABI,
    functionName: "getFeeQuote",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

// ──────────────────────────────────────────
// Write hooks
// ──────────────────────────────────────────

export function useRegister() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const register = () => {
    writeContract({
      address: REGISTRY_ADDRESS,
      abi: ReputationRegistryABI,
      functionName: "register",
      value: parseEther("0.001"),
    });
  };

  return { register, hash, isPending, isConfirming, isSuccess, error };
}

export function useWithdrawBond() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = () => {
    writeContract({
      address: REGISTRY_ADDRESS,
      abi: ReputationRegistryABI,
      functionName: "withdrawBond",
    });
  };

  return { withdraw, hash, isPending, isConfirming, isSuccess, error };
}

// ──────────────────────────────────────────
// Derived helpers
// ──────────────────────────────────────────

export function useUserReputation() {
  const { address, isConnected } = useAccount();
  const { data: isRegistered, isLoading: loadingRegistered } = useIsRegistered();
  const { data: isActive, isLoading: loadingActive } = useIsReputationActive();
  const { data: reputationAge, isLoading: loadingAge } = useReputationAge();
  const { data: registrationTime, isLoading: loadingRegTime } = useRegistrationTime();
  const { data: bondWithdrawn, isLoading: loadingBond } = useHasBondWithdrawn();
  const { data: feeQuote, isLoading: loadingFee } = useFeeQuote();

  const ageDays = reputationAge ? Number(reputationAge) / 86400 : 0;
  const regDate = registrationTime && registrationTime > 0n
    ? new Date(Number(registrationTime) * 1000)
    : null;

  // Compute tier from age in days
  let currentTier: 1 | 2 | 3 | 4 = 1;
  if (ageDays >= 180) currentTier = 4;
  else if (ageDays >= 90) currentTier = 3;
  else if (ageDays >= 30) currentTier = 2;

  // Compute next tier progress
  const tierThresholds = [0, 30, 90, 180];
  const nextTier = currentTier < 4 ? currentTier + 1 : null;
  const currentThreshold = tierThresholds[currentTier - 1];
  const nextThreshold = nextTier ? tierThresholds[nextTier - 1] : 180;
  const progressToNextTier = nextTier
    ? Math.min(((ageDays - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100)
    : 100;
  const daysToNextTier = nextTier ? Math.max(nextThreshold - ageDays, 0) : 0;

  // Fee as percentage (contract returns basis points * 100, e.g., 3000 = 0.30%)
  const currentFeePercent = feeQuote ? Number(feeQuote) / 10000 : 0.3;

  const isLoading = loadingRegistered || loadingActive || loadingAge || loadingRegTime || loadingBond || loadingFee;

  return {
    address,
    isConnected,
    isRegistered: !!isRegistered,
    isActive: !!isActive,
    reputationAge: reputationAge ? Number(reputationAge) : 0,
    ageDays,
    registrationDate: regDate,
    bondWithdrawn: !!bondWithdrawn,
    currentTier,
    nextTier,
    progressToNextTier,
    daysToNextTier: Math.ceil(daysToNextTier),
    currentFeePercent,
    isLoading,
  };
}
