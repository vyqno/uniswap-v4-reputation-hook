import { useReadContracts } from "wagmi";
import {
  keccak256,
  encodeAbiParameters,
  concat,
  pad,
  toHex,
  type Hex,
} from "viem";
import { CONTRACTS } from "@/lib/constants";

const POOL_MANAGER = CONTRACTS.sepolia.poolManager as `0x${string}`;
const USDC = CONTRACTS.sepolia.usdc as `0x${string}`;
const WETH = CONTRACTS.sepolia.weth as `0x${string}`;
const HOOK = CONTRACTS.sepolia.reputationFeeHook as `0x${string}`;
const DYNAMIC_FEE_FLAG = 8388608; // 0x800000
const TICK_SPACING = 60;

const Q96 = 2 ** 96;

// POOLS_SLOT = 6 in PoolManager storage
const POOLS_SLOT = pad(toHex(6), { size: 32 });

// Liquidity is at offset 3 from the pool state slot
const LIQUIDITY_OFFSET = 3n;

// Compute pool ID: keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hooks))
const POOL_ID = keccak256(
  encodeAbiParameters(
    [
      { type: "address" },
      { type: "address" },
      { type: "uint24" },
      { type: "int24" },
      { type: "address" },
    ],
    [USDC, WETH, DYNAMIC_FEE_FLAG, TICK_SPACING, HOOK]
  )
);

// Compute state slot: keccak256(abi.encodePacked(poolId, POOLS_SLOT))
const STATE_SLOT = keccak256(concat([POOL_ID as Hex, POOLS_SLOT]));

// Liquidity slot: stateSlot + 3
const LIQUIDITY_SLOT = pad(
  toHex(BigInt(STATE_SLOT) + LIQUIDITY_OFFSET),
  { size: 32 }
);

const extsloadAbi = [
  {
    type: "function",
    name: "extsload",
    inputs: [{ name: "slot", type: "bytes32" }],
    outputs: [{ name: "value", type: "bytes32" }],
    stateMutability: "view",
  },
] as const;

export interface PoolState {
  poolId: string;
  initialized: boolean;
  sqrtPriceX96: bigint;
  tick: number;
  protocolFee: number;
  lpFee: number;
  liquidity: bigint;
  priceUsdcPerWeth: number | null;
  reserveUsdc: number | null;
  reserveWeth: number | null;
  isLoading: boolean;
  error: unknown;
}

export function usePoolState(): PoolState {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: POOL_MANAGER,
        abi: extsloadAbi,
        functionName: "extsload",
        args: [STATE_SLOT as `0x${string}`],
      },
      {
        address: POOL_MANAGER,
        abi: extsloadAbi,
        functionName: "extsload",
        args: [LIQUIDITY_SLOT as `0x${string}`],
      },
    ],
    query: { refetchInterval: 15_000 },
  });

  if (!data || data[0].status !== "success" || data[1].status !== "success") {
    return {
      poolId: POOL_ID,
      isLoading,
      error,
      initialized: false,
      sqrtPriceX96: 0n,
      tick: 0,
      protocolFee: 0,
      lpFee: 0,
      liquidity: 0n,
      priceUsdcPerWeth: null,
      reserveUsdc: null,
      reserveWeth: null,
    };
  }

  const slot0Raw = BigInt(data[0].result as `0x${string}`);
  const liquidityRaw = BigInt(data[1].result as `0x${string}`);

  // Parse slot0: sqrtPriceX96 (160 bits) | tick (24 bits) | protocolFee (24 bits) | lpFee (24 bits)
  const sqrtPriceX96 = slot0Raw & ((1n << 160n) - 1n);
  const tickRaw = (slot0Raw >> 160n) & 0xFFFFFFn;
  const tick =
    tickRaw > 0x7FFFFFn
      ? Number(tickRaw) - 0x1000000
      : Number(tickRaw);
  const protocolFee = Number((slot0Raw >> 184n) & 0xFFFFFFn);
  const lpFee = Number((slot0Raw >> 208n) & 0xFFFFFFn);

  const liquidity = liquidityRaw & ((1n << 128n) - 1n);
  const initialized = sqrtPriceX96 > 0n;

  let priceUsdcPerWeth: number | null = null;
  let reserveUsdc: number | null = null;
  let reserveWeth: number | null = null;

  if (initialized && sqrtPriceX96 > 0n) {
    const sqrtPrice = Number(sqrtPriceX96) / Q96;
    const rawPrice = sqrtPrice * sqrtPrice;

    if (rawPrice > 0) {
      priceUsdcPerWeth = 1e12 / rawPrice;
    }

    // Compute reserves from liquidity and sqrtPrice
    // For full-range liquidity:
    //   token0 (USDC) ≈ L * Q96 / sqrtPriceX96  (raw units)
    //   token1 (WETH) ≈ L * sqrtPriceX96 / Q96   (raw units)
    const L = Number(liquidity);
    if (L > 0) {
      const usdcRaw = (L * Q96) / Number(sqrtPriceX96);
      const wethRaw = (L * Number(sqrtPriceX96)) / Q96;
      reserveUsdc = usdcRaw / 1e6;  // USDC has 6 decimals
      reserveWeth = wethRaw / 1e18;  // WETH has 18 decimals
    }
  }

  return {
    poolId: POOL_ID,
    initialized,
    sqrtPriceX96,
    tick,
    protocolFee,
    lpFee,
    liquidity,
    priceUsdcPerWeth,
    reserveUsdc,
    reserveWeth,
    isLoading,
    error,
  };
}
