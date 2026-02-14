import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/FadeIn";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TierBadge } from "@/components/common/TierBadge";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingDown, Sparkles, ArrowRight, Info } from "lucide-react";
import { useAccount } from "wagmi";
import { TIERS } from "@/lib/constants";
import { useUserReputation } from "@/hooks/useReputation";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const BASE_FEE_RATE = 0.003; // 0.30%

export default function FeeCalculatorPage() {
  const { isConnected } = useAccount();
  const rep = useUserReputation();
  const [swapAmount, setSwapAmount] = useState<string>("10000");
  const [monthlySwaps, setMonthlySwaps] = useState<number>(20);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | 4>(
    isConnected && rep.isRegistered ? rep.currentTier : 3
  );

  const calculations = useMemo(() => {
    const amount = parseFloat(swapAmount) || 0;
    const tierConfig = TIERS[selectedTier];
    const discountMultiplier = 1 - (tierConfig.discount / 100);
    
    const baseFeePerSwap = amount * BASE_FEE_RATE;
    const discountedFeePerSwap = baseFeePerSwap * discountMultiplier;
    const savingsPerSwap = baseFeePerSwap - discountedFeePerSwap;
    
    const monthlySavings = savingsPerSwap * monthlySwaps;
    const yearlySavings = monthlySavings * 12;
    
    return {
      baseFeePerSwap,
      discountedFeePerSwap,
      savingsPerSwap,
      monthlySavings,
      yearlySavings,
      discountPercent: tierConfig.discount,
    };
  }, [swapAmount, monthlySwaps, selectedTier]);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <FadeIn>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
                <Calculator className="h-5 w-5 text-brand-500" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Fee Calculator
              </h1>
            </div>
            <p className="text-foreground-secondary">
              Estimate your potential savings based on your trading activity
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator Input */}
          <FadeIn delay={0.1} className="lg:col-span-2">
            <Card variant="glass" padding="lg">
              <CardHeader className="p-0 pb-6">
                <CardTitle className="text-xl">Calculate Your Savings</CardTitle>
                <CardDescription>
                  Adjust the values below to see your potential fee savings
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 space-y-8">
                {/* Swap Amount */}
                <div className="space-y-3">
                  <Label htmlFor="swapAmount" className="text-foreground-secondary">
                    Average Swap Amount (USD)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-tertiary">
                      $
                    </span>
                    <Input
                      id="swapAmount"
                      type="number"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      className="pl-8 text-lg font-medium"
                      placeholder="10000"
                    />
                  </div>
                </div>

                {/* Monthly Swaps */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground-secondary">
                      Monthly Swaps
                    </Label>
                    <span className="text-lg font-semibold text-foreground">
                      {monthlySwaps} swaps
                    </span>
                  </div>
                  <Slider
                    value={[monthlySwaps]}
                    onValueChange={([value]) => setMonthlySwaps(value)}
                    min={1}
                    max={100}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-foreground-tertiary">
                    <span>1 swap</span>
                    <span>100 swaps</span>
                  </div>
                </div>

                {/* Tier Selection */}
                <div className="space-y-4">
                  <Label className="text-foreground-secondary">
                    Select Your Tier
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([1, 2, 3, 4] as const).map((tier) => {
                      const isSelected = selectedTier === tier;
                      return (
                        <motion.button
                          key={tier}
                          onClick={() => setSelectedTier(tier)}
                          className={cn(
                            "relative p-4 rounded-xl border transition-all duration-200",
                            isSelected
                              ? "border-brand-500/50 bg-brand-500/10"
                              : "border-border hover:border-border-hover bg-background-secondary"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="tierSelector"
                              className="absolute inset-0 border-2 border-brand-500 rounded-xl"
                              transition={{ type: "spring", duration: 0.3 }}
                            />
                          )}
                          <div className="relative flex flex-col items-center gap-2">
                            <TierBadge tier={tier} size="md" />
                            <span className="text-xs text-foreground-secondary">
                              {TIERS[tier].discount}% off
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Results */}
          <StaggerContainer className="space-y-6">
            {/* Savings Summary */}
            <StaggerItem>
              <Card variant="glow" padding="lg">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-brand-500" />
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Your Savings
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="text-center py-4">
                    <motion.p 
                      className="text-5xl font-display font-bold text-gradient"
                      key={calculations.yearlySavings}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", duration: 0.4 }}
                    >
                      ${calculations.yearlySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </motion.p>
                    <p className="text-foreground-secondary mt-1">per year</p>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Per Swap</span>
                      <span className="font-medium text-success">
                        -${calculations.savingsPerSwap.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Monthly</span>
                      <span className="font-medium text-success">
                        -${calculations.monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </StaggerItem>

            {/* Fee Breakdown */}
            <StaggerItem>
              <Card variant="glass" padding="lg">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-brand-500" />
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Fee Breakdown
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-secondary text-sm">Base Fee</span>
                    <span className="font-mono text-foreground line-through opacity-60">
                      ${calculations.baseFeePerSwap.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-secondary text-sm">Your Fee</span>
                    <span className="font-mono text-brand-400 font-semibold">
                      ${calculations.discountedFeePerSwap.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex justify-between items-center">
                      <span className="text-success text-sm font-medium">Discount</span>
                      <span className="text-success font-bold">
                        {calculations.discountPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </StaggerItem>

            {/* CTA */}
            <StaggerItem>
              <Link to="/register">
                <Button variant="brand" size="lg" className="w-full group">
                  Start Saving Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Info Section */}
        <FadeIn delay={0.3}>
          <Card variant="glass" padding="lg" className="mt-8">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-brand-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-foreground mb-1">
                  How Fees Are Calculated
                </h4>
                <p className="text-foreground-secondary text-sm leading-relaxed">
                  The Reputation Hook applies a discount to the base swap fee (0.30%) based on your tier. 
                  Your tier is determined by how long you've held your reputation bond. 
                  Tier 4 members enjoy a 75% discount, paying just 0.075% per swap instead of 0.30%.
                </p>
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
