import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownUp,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Info,
  Zap,
  Shield,
  Activity,
} from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/animations/FadeIn";
import { TierBadge } from "@/components/common/TierBadge";
import { CONTRACTS, TIERS } from "@/lib/constants";
import { useUserReputation } from "@/hooks/useReputation";
import {
  useSwapRouterReady,
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  useWrapETH,
  useExecuteSwap,
} from "@/hooks/useSwap";
import { useEthPrice } from "@/hooks/useEthPrice";
import { usePoolState } from "@/hooks/usePoolState";
import { cn } from "@/lib/utils";

type SwapDirection = "USDC_TO_WETH" | "WETH_TO_USDC";

function SwapRouterNotDeployed() {
  return (
    <div className="max-w-lg mx-auto">
      <FadeIn>
        <Card variant="glow" padding="lg">
          <div className="text-center py-8">
            <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-4">
              Swap Router Not Deployed
            </h2>
            <p className="text-foreground-secondary mb-6">
              The swap router contract needs to be deployed before you can
              execute swaps. Run the deployment script in your terminal.
            </p>
            <div className="bg-background-secondary rounded-lg p-4 text-left mb-6">
              <code className="text-sm text-brand-400 break-all">
                PRIVATE_KEY=0x... ./script/deploy-swap-router.sh
              </code>
            </div>
            <p className="text-sm text-foreground-tertiary">
              After deploying, paste the contract address into{" "}
              <code className="text-brand-400">src/lib/constants.ts</code> as
              the <code className="text-brand-400">swapRouter</code> value.
            </p>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}

function FeeInfoBanner() {
  const rep = useUserReputation();
  const tierConfig = TIERS[rep.currentTier];

  if (!rep.isRegistered) {
    return (
      <FadeIn delay={0.1}>
        <Card variant="glass" padding="default" className="mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground-secondary">
                <span className="font-medium text-foreground">
                  Unregistered user
                </span>{" "}
                — You're paying the base fee of{" "}
                <span className="text-brand-400 font-semibold">0.30%</span>.
                Register to start earning fee discounts up to 75% off!
              </p>
            </div>
          </div>
        </Card>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.1}>
      <Card variant="glass" padding="default" className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TierBadge tier={rep.currentTier} size="sm" />
            <div>
              <p className="text-sm text-foreground-secondary">
                Your swap fee:{" "}
                <span className="text-brand-400 font-semibold">
                  {rep.currentFeePercent.toFixed(3)}%
                </span>
              </p>
              <p className="text-xs text-foreground-tertiary">
                {tierConfig.discount}% discount as {tierConfig.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground-tertiary">
              vs base fee 0.30%
            </p>
            {rep.currentTier > 1 && (
              <p className="text-xs text-success font-medium">
                Saving {tierConfig.discount}%
              </p>
            )}
          </div>
        </div>
      </Card>
    </FadeIn>
  );
}

function PoolStatusCard() {
  const pool = usePoolState();
  const { price: ethPrice } = useEthPrice();

  return (
    <FadeIn delay={0.15}>
      <Card variant="glass" padding="default" className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-brand-400" />
          <span className="text-sm font-medium text-foreground">
            Pool Status
          </span>
          <span
            className={cn(
              "ml-auto text-xs px-2 py-0.5 rounded-full",
              pool.initialized
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            )}
          >
            {pool.isLoading
              ? "Loading..."
              : pool.initialized
                ? "Active"
                : "Not Initialized"}
          </span>
        </div>

        {pool.initialized && (
          <div className="space-y-2 text-sm">
            {/* Pool Reserves */}
            {pool.reserveUsdc != null && pool.reserveWeth != null && (
              <div className="p-3 rounded-lg bg-background-secondary space-y-1.5">
                <span className="text-xs text-foreground-tertiary uppercase tracking-wide">
                  Pool Reserves
                </span>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                      $
                    </div>
                    <span className="text-foreground">USDC</span>
                  </div>
                  <span className="text-foreground font-mono font-medium">
                    {pool.reserveUsdc.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                      E
                    </div>
                    <span className="text-foreground">WETH</span>
                  </div>
                  <span className="text-foreground font-mono font-medium">
                    {pool.reserveWeth.toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-foreground-tertiary">Pool Price</span>
              <span className="text-foreground font-mono">
                {pool.priceUsdcPerWeth != null
                  ? `${pool.priceUsdcPerWeth.toFixed(2)} USDC/WETH`
                  : "—"}
              </span>
            </div>
            {ethPrice && pool.priceUsdcPerWeth != null && (
              <>
                <div className="flex justify-between">
                  <span className="text-foreground-tertiary">Market Price</span>
                  <span className="text-foreground-secondary font-mono">
                    ${ethPrice.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD/ETH
                  </span>
                </div>
                {Math.abs(pool.priceUsdcPerWeth - ethPrice) / ethPrice > 0.05 && (
                  <div className="p-2 rounded bg-warning/10 text-xs text-warning">
                    Pool price is stale — differs from market by{" "}
                    {(
                      ((pool.priceUsdcPerWeth - ethPrice) / ethPrice) *
                      100
                    ).toFixed(0)}
                    %. This is normal on testnet (no arbitrage bots).
                    Swaps execute at the pool price, not market price.
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between">
              <span className="text-foreground-tertiary">Current Tick</span>
              <span className="text-foreground-secondary font-mono">
                {pool.tick}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-tertiary">Fee Model</span>
              <span className="text-brand-400 font-mono">
                Dynamic (hook-controlled)
              </span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">Pool ID</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${CONTRACTS.sepolia.poolManager}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 font-mono text-xs truncate ml-4 max-w-[200px]"
                >
                  {pool.poolId.slice(0, 10)}...{pool.poolId.slice(-8)}
                </a>
              </div>
            </div>
          </div>
        )}

        {!pool.initialized && !pool.isLoading && (
          <p className="text-xs text-foreground-tertiary">
            The USDC/WETH pool with the Reputation Fee Hook has not been
            initialized yet.
          </p>
        )}
      </Card>
    </FadeIn>
  );
}

function TokenInput({
  token,
  amount,
  onAmountChange,
  balance,
  label,
  usdValue,
  readOnly = false,
}: {
  token: "USDC" | "WETH";
  amount: string;
  onAmountChange?: (val: string) => void;
  balance: string;
  label: string;
  usdValue?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-xl bg-background-secondary border border-border p-4 overflow-hidden">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-foreground-tertiary">{label}</span>
        <span className="text-sm text-foreground-tertiary truncate ml-2">
          Balance: {balance}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (/^[0-9]*\.?[0-9]*$/.test(v)) onAmountChange?.(v);
            }}
            placeholder="0.00"
            readOnly={readOnly}
            className={cn(
              "w-full bg-transparent text-2xl font-display font-bold text-foreground outline-none truncate",
              readOnly && "text-foreground-secondary"
            )}
          />
          {usdValue && (
            <p className="text-xs text-foreground-tertiary mt-0.5">
              ~${usdValue}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border border-border flex-shrink-0">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              token === "USDC"
                ? "bg-blue-500 text-white"
                : "bg-purple-500 text-white"
            )}
          >
            {token === "USDC" ? "$" : "E"}
          </div>
          <span className="font-medium text-foreground">{token}</span>
        </div>
      </div>
      {!readOnly && (
        <div className="flex gap-2 mt-3">
          {["25", "50", "75", "100"].map((pct) => (
            <button
              key={pct}
              onClick={() => {
                const bal = parseFloat(balance);
                if (bal > 0 && onAmountChange) {
                  const val = (bal * parseInt(pct)) / 100;
                  onAmountChange(
                    token === "USDC" ? val.toFixed(2) : val.toFixed(6)
                  );
                }
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-foreground-tertiary hover:text-foreground transition-colors border border-white/5"
            >
              {pct}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const rep = useUserReputation();
  const swapRouterReady = useSwapRouterReady();
  const { price: ethPrice } = useEthPrice();
  const pool = usePoolState();

  const [direction, setDirection] = useState<SwapDirection>("USDC_TO_WETH");
  const [inputAmount, setInputAmount] = useState("");
  const [wrapAmount, setWrapAmount] = useState("");
  const [showWrap, setShowWrap] = useState(false);

  const { data: usdcBalance } = useTokenBalance("USDC");
  const { data: wethBalance } = useTokenBalance("WETH");
  const { data: usdcAllowance } = useTokenAllowance("USDC");
  const { data: wethAllowance } = useTokenAllowance("WETH");

  const {
    approve,
    isPending: isApproving,
    isConfirming: isApproveConfirming,
  } = useApproveToken();

  const {
    wrap,
    isPending: isWrapping,
    isConfirming: isWrapConfirming,
    isSuccess: wrapSuccess,
  } = useWrapETH();

  const {
    swap,
    hash: swapHash,
    isPending: isSwapping,
    isConfirming: isSwapConfirming,
    isSuccess: swapSuccess,
    error: swapError,
  } = useExecuteSwap();

  const inputToken = direction === "USDC_TO_WETH" ? "USDC" : "WETH";
  const outputToken = direction === "USDC_TO_WETH" ? "WETH" : "USDC";
  const inputDecimals = inputToken === "USDC" ? 6 : 18;

  const formattedUsdcBalance = usdcBalance
    ? parseFloat(formatUnits(usdcBalance, 6)).toFixed(2)
    : "0.00";
  const formattedWethBalance = wethBalance
    ? parseFloat(formatUnits(wethBalance, 18)).toFixed(4)
    : "0.0000";

  const inputBalance =
    inputToken === "USDC" ? formattedUsdcBalance : formattedWethBalance;
  const outputBalance =
    outputToken === "USDC" ? formattedUsdcBalance : formattedWethBalance;

  // Use pool price if available, otherwise fall back to CoinGecko price
  const poolPrice = pool.initialized && pool.priceUsdcPerWeth
    ? pool.priceUsdcPerWeth
    : null;
  const livePrice = ethPrice ?? 2700;
  const swapPrice = poolPrice ?? livePrice;

  // Fee percent: user's tier fee or base 0.30%
  const feePercent = rep.isRegistered ? rep.currentFeePercent : 0.3;

  const estimatedOutput = useMemo(() => {
    const amt = parseFloat(inputAmount);
    if (!amt || amt <= 0) return "0.00";
    // Subtract fee from input amount before conversion
    const afterFee = amt * (1 - feePercent / 100);
    if (direction === "USDC_TO_WETH") {
      return (afterFee / swapPrice).toFixed(6);
    } else {
      return (afterFee * swapPrice).toFixed(2);
    }
  }, [inputAmount, direction, swapPrice, feePercent]);

  // USD values always use MARKET price (CoinGecko) for real-world value
  const inputUsdValue = useMemo(() => {
    const amt = parseFloat(inputAmount);
    if (!amt || amt <= 0) return undefined;
    if (inputToken === "USDC") return amt.toFixed(2);
    return (amt * livePrice).toFixed(2);
  }, [inputAmount, inputToken, livePrice]);

  // Output USD value: use market price for WETH, face value for USDC
  const outputUsdValue = useMemo(() => {
    const amt = parseFloat(estimatedOutput);
    if (!amt || amt <= 0) return undefined;
    if (outputToken === "USDC") return amt.toFixed(2);
    return (amt * livePrice).toFixed(2);
  }, [estimatedOutput, outputToken, livePrice]);

  // Fee amount in input token
  const feeAmount = useMemo(() => {
    const amt = parseFloat(inputAmount);
    if (!amt || amt <= 0) return null;
    return amt * (feePercent / 100);
  }, [inputAmount, feePercent]);

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) return false;
    const allowance =
      inputToken === "USDC" ? usdcAllowance : wethAllowance;
    if (!allowance) return true;
    try {
      const needed = BigInt(
        Math.floor(parseFloat(inputAmount) * 10 ** inputDecimals)
      );
      return allowance < needed;
    } catch {
      return true;
    }
  }, [inputAmount, inputToken, usdcAllowance, wethAllowance, inputDecimals]);

  const flipDirection = () => {
    setDirection((d) =>
      d === "USDC_TO_WETH" ? "WETH_TO_USDC" : "USDC_TO_WETH"
    );
    setInputAmount("");
  };

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Wallet className="h-16 w-16 text-brand-400 mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Connect Your Wallet
        </h1>
        <p className="text-lg text-foreground-secondary mb-8">
          Connect your wallet to swap tokens
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (!swapRouterReady) {
    return <SwapRouterNotDeployed />;
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
              <ArrowDownUp className="h-5 w-5 text-brand-500" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Swap
            </h1>
          </div>
          <p className="text-foreground-secondary">
            Swap USDC and WETH with reputation-based fee discounts
          </p>
        </div>
      </FadeIn>

      {/* Fee Info */}
      <FeeInfoBanner />

      {/* Pool Status */}
      <PoolStatusCard />

      {/* Swap Card */}
      <FadeIn delay={0.2}>
        <Card variant="glow" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-600/5" />
          <div className="relative p-6">
            {/* Price Banner */}
            <div className="flex items-center justify-between mb-4 text-xs text-foreground-tertiary">
              {poolPrice ? (
                <span>
                  Pool rate: 1 WETH = {poolPrice.toFixed(2)} USDC
                </span>
              ) : ethPrice ? (
                <span>
                  1 ETH ={" "}
                  ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              ) : null}
              {poolPrice && ethPrice && (
                <span className="text-foreground-tertiary/60">
                  Market: ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>

            {/* Input Token */}
            <TokenInput
              token={inputToken}
              amount={inputAmount}
              onAmountChange={setInputAmount}
              balance={inputBalance}
              label="You pay"
              usdValue={inputUsdValue}
            />

            {/* Flip Button */}
            <div className="flex justify-center -my-3 relative z-10">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={flipDirection}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border-2 border-border hover:border-brand-500 transition-colors"
              >
                <ArrowDownUp className="h-5 w-5 text-foreground-secondary" />
              </motion.button>
            </div>

            {/* Output Token */}
            <TokenInput
              token={outputToken}
              amount={estimatedOutput}
              balance={outputBalance}
              label="You receive (estimate)"
              usdValue={outputUsdValue}
              readOnly
            />

            {/* Fee Details */}
            {inputAmount && parseFloat(inputAmount) > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-3 rounded-lg bg-white/5 space-y-2"
              >
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-tertiary">
                    Your Fee Rate
                  </span>
                  <span className="text-foreground font-medium">
                    {feePercent.toFixed(3)}%
                    {rep.isRegistered && rep.currentTier > 1 && (
                      <span className="text-success ml-1">
                        ({TIERS[rep.currentTier].discount}% off)
                      </span>
                    )}
                  </span>
                </div>
                {feeAmount != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-tertiary">
                      Fee Deducted
                    </span>
                    <span className="text-warning font-mono">
                      -{feeAmount.toFixed(inputToken === "USDC" ? 4 : 6)}{" "}
                      {inputToken}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-tertiary">
                    Base Fee (unregistered)
                  </span>
                  <span className="text-foreground-secondary">0.300%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-tertiary">
                    Price Source
                  </span>
                  <span className="text-foreground-secondary">
                    {poolPrice ? "On-chain pool" : "CoinGecko estimate"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-tertiary">Network</span>
                  <span className="text-foreground-secondary">
                    Sepolia Testnet
                  </span>
                </div>
              </motion.div>
            )}

            {/* Error Display */}
            {swapError && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {swapError.message.includes("user rejected")
                  ? "Transaction rejected by user"
                  : "Swap failed. Check your balance and try again."}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              {needsApproval ? (
                <Button
                  variant="brand"
                  size="lg"
                  className="w-full"
                  onClick={() => approve(inputToken)}
                  disabled={
                    isApproving ||
                    isApproveConfirming ||
                    !inputAmount ||
                    parseFloat(inputAmount) <= 0
                  }
                >
                  {isApproving || isApproveConfirming ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isApproving
                        ? "Confirm in Wallet..."
                        : "Approving..."}
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      Approve {inputToken}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={() => swap(direction, inputAmount)}
                  disabled={
                    isSwapping ||
                    isSwapConfirming ||
                    !inputAmount ||
                    parseFloat(inputAmount) <= 0
                  }
                >
                  {isSwapping || isSwapConfirming ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isSwapping
                        ? "Confirm in Wallet..."
                        : "Swapping..."}
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Swap {inputToken} for {outputToken}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Success State */}
            <AnimatePresence>
              {swapSuccess && swapHash && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="font-medium text-success">
                      Swap Successful!
                    </span>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${swapHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </FadeIn>

      {/* Wrap ETH Section */}
      <FadeIn delay={0.3}>
        <div className="mt-6">
          <button
            onClick={() => setShowWrap(!showWrap)}
            className="text-sm text-foreground-tertiary hover:text-foreground transition-colors"
          >
            {showWrap ? "Hide" : "Need WETH?"} — Wrap ETH to WETH
          </button>

          <AnimatePresence>
            {showWrap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card variant="glass" padding="default" className="mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-foreground-secondary truncate">
                      ETH:{" "}
                      {ethBalance
                        ? parseFloat(
                            formatUnits(ethBalance.value, 18)
                          ).toFixed(4)
                        : "0.0000"}
                    </span>
                    <span className="text-sm text-foreground-secondary truncate ml-2">
                      WETH: {formattedWethBalance}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={wrapAmount}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^[0-9]*\.?[0-9]*$/.test(v)) setWrapAmount(v);
                      }}
                      placeholder="ETH amount"
                      className="flex-1 bg-background-secondary border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:border-brand-500"
                    />
                    <Button
                      variant="brand"
                      onClick={() => wrap(wrapAmount)}
                      disabled={
                        isWrapping ||
                        isWrapConfirming ||
                        !wrapAmount ||
                        parseFloat(wrapAmount) <= 0
                      }
                    >
                      {isWrapping || isWrapConfirming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Wrap"
                      )}
                    </Button>
                  </div>
                  {wrapSuccess && (
                    <p className="text-xs text-success mt-2">
                      ETH wrapped to WETH successfully!
                    </p>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FadeIn>

      {/* Info Footer */}
      <FadeIn delay={0.4}>
        <div className="mt-6 p-4 rounded-lg bg-white/5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-brand-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground-tertiary space-y-1">
              <p>
                This swap goes through a Uniswap V4 pool with the Reputation
                Fee Hook attached. Your fee is dynamically calculated based on
                your reputation tier.
              </p>
              <p>
                Pool: USDC/WETH on Sepolia |{" "}
                <a
                  href={`https://sepolia.etherscan.io/address/${CONTRACTS.sepolia.reputationFeeHook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300"
                >
                  Hook Contract
                </a>
                {" | "}
                <a
                  href={`https://sepolia.etherscan.io/address/${CONTRACTS.sepolia.swapRouter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300"
                >
                  Swap Router
                </a>
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
