import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { parseUnits, maxUint256 } from "viem";
import { PoolSwapTestABI, ERC20ABI, WETHABI } from "@/lib/abi/PoolSwapTest";
import { CONTRACTS } from "@/lib/constants";

const USDC = CONTRACTS.sepolia.usdc as `0x${string}`;
const WETH = CONTRACTS.sepolia.weth as `0x${string}`;
const HOOK = CONTRACTS.sepolia.reputationFeeHook as `0x${string}`;
const SWAP_ROUTER = CONTRACTS.sepolia.swapRouter as `0x${string}`;

// Dynamic fee flag used in pool key
const DYNAMIC_FEE_FLAG = 8388608; // 0x800000
const TICK_SPACING = 60;

// Price limits for swaps
const MIN_SQRT_PRICE_LIMIT = BigInt("4295128740"); // TickMath.MIN_SQRT_PRICE + 1
const MAX_SQRT_PRICE_LIMIT = BigInt("1461446703485210103287273052203988822378723970341"); // TickMath.MAX_SQRT_PRICE - 1

// Pool key - USDC is token0 (lower address), WETH is token1
const POOL_KEY = {
  currency0: USDC,
  currency1: WETH,
  fee: DYNAMIC_FEE_FLAG,
  tickSpacing: TICK_SPACING,
  hooks: HOOK,
} as const;

export function useSwapRouterReady() {
  return SWAP_ROUTER !== "" && SWAP_ROUTER !== "0x";
}

export function useTokenBalance(token: "USDC" | "WETH") {
  const { address } = useAccount();
  const tokenAddress = token === "USDC" ? USDC : WETH;

  return useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useTokenAllowance(token: "USDC" | "WETH") {
  const { address } = useAccount();
  const tokenAddress = token === "USDC" ? USDC : WETH;

  return useReadContract({
    address: tokenAddress,
    abi: ERC20ABI,
    functionName: "allowance",
    args: address && SWAP_ROUTER ? [address, SWAP_ROUTER as `0x${string}`] : undefined,
    query: { enabled: !!address && !!SWAP_ROUTER },
  });
}

export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (token: "USDC" | "WETH") => {
    const tokenAddress = token === "USDC" ? USDC : WETH;
    writeContract({
      address: tokenAddress,
      abi: ERC20ABI,
      functionName: "approve",
      args: [SWAP_ROUTER as `0x${string}`, maxUint256],
    });
  };

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

export function useWrapETH() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const wrap = (ethAmount: string) => {
    writeContract({
      address: WETH,
      abi: WETHABI,
      functionName: "deposit",
      value: parseUnits(ethAmount, 18),
    });
  };

  return { wrap, hash, isPending, isConfirming, isSuccess, error };
}

export function useExecuteSwap() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const swap = (direction: "USDC_TO_WETH" | "WETH_TO_USDC", amount: string) => {
    // USDC is token0, WETH is token1
    // USDC -> WETH = zeroForOne = true (selling token0)
    // WETH -> USDC = zeroForOne = false (selling token1)
    const zeroForOne = direction === "USDC_TO_WETH";
    const decimals = zeroForOne ? 6 : 18; // USDC = 6, WETH = 18

    // Exact input: amountSpecified is negative
    const amountSpecified = -BigInt(parseUnits(amount, decimals));
    const sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_PRICE_LIMIT : MAX_SQRT_PRICE_LIMIT;

    writeContract({
      address: SWAP_ROUTER as `0x${string}`,
      abi: PoolSwapTestABI,
      functionName: "swap",
      args: [
        POOL_KEY,
        {
          zeroForOne,
          amountSpecified,
          sqrtPriceLimitX96,
        },
        {
          takeClaims: false,
          settleUsingBurn: false,
        },
        "0x" as `0x${string}`,
      ],
    });
  };

  return { swap, hash, isPending, isConfirming, isSuccess, error };
}
