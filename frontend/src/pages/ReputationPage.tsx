import { motion } from "framer-motion";
import {
  Award,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Circle,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TierBadge } from "@/components/common/TierBadge";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/FadeIn";
import { CountUp } from "@/components/animations/CountUp";
import { TIERS } from "@/lib/constants";
import { useUserReputation } from "@/hooks/useReputation";
import { cn } from "@/lib/utils";

export default function ReputationPage() {
  const { isConnected } = useAccount();
  const rep = useUserReputation();

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <Wallet className="h-16 w-16 text-brand-400 mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Connect Your Wallet
        </h1>
        <p className="text-lg text-foreground-secondary mb-8">
          Connect your wallet to view your reputation
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (rep.isLoading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-foreground-secondary mt-4">Loading reputation data...</p>
      </div>
    );
  }

  if (!rep.isRegistered) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <Award className="h-16 w-16 text-brand-400 mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Not Registered
        </h1>
        <p className="text-lg text-foreground-secondary mb-8">
          Register to start building your reputation
        </p>
        <Link to="/register">
          <Button variant="hero" size="lg">Register Now</Button>
        </Link>
      </div>
    );
  }

  const tierConfig = TIERS[rep.currentTier];
  const nextTierConfig =
    rep.currentTier < 4
      ? TIERS[(rep.currentTier + 1) as 1 | 2 | 3 | 4]
      : null;

  // Build milestones from real data
  const tierThresholds = [0, 30, 90, 180];
  const milestones = ([1, 2, 3, 4] as const).map((tier) => {
    const thresholdDays = tierThresholds[tier - 1];
    const reached = rep.ageDays >= thresholdDays;
    const date = rep.registrationDate
      ? new Date(
          rep.registrationDate.getTime() +
            (thresholdDays + 1) * 24 * 60 * 60 * 1000
        )
      : new Date();
    return {
      tier,
      date,
      status: reached ? ("completed" as const) : ("upcoming" as const),
    };
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Your Reputation
          </h1>
          <p className="text-foreground-secondary">
            Track your tier progress and see your complete reputation timeline
          </p>
        </div>
      </FadeIn>

      {/* Current Tier Card */}
      <FadeIn delay={0.1}>
        <Card variant="glow" className="relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/5" />

          <div className="relative p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TierBadge tier={rep.currentTier} size="xl" />
                </motion.div>
                <h2 className="font-display text-3xl font-bold text-foreground mt-4">
                  Tier {rep.currentTier}
                </h2>
                <p className="text-brand-400 font-medium">{tierConfig.name}</p>
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                <div className="text-center lg:text-left">
                  <p className="text-foreground-tertiary text-sm mb-1">
                    Reputation Age
                  </p>
                  <p className="font-display text-3xl font-bold text-foreground">
                    <CountUp
                      end={Math.floor(rep.ageDays)}
                      suffix=" days"
                    />
                  </p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-foreground-tertiary text-sm mb-1">
                    Current Fee Rate
                  </p>
                  <p className="font-display text-3xl font-bold text-gradient">
                    {rep.currentFeePercent.toFixed(3)}%
                  </p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-foreground-tertiary text-sm mb-1">
                    Discount
                  </p>
                  <p className="font-display text-3xl font-bold text-success">
                    {tierConfig.discount}% off
                  </p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-foreground-tertiary text-sm mb-1">
                    Registered Since
                  </p>
                  <p className="font-display text-xl font-bold text-foreground">
                    {rep.registrationDate
                      ? rep.registrationDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {nextTierConfig && (
              <div className="mt-8 pt-8 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TierBadge tier={rep.currentTier} size="sm" />
                    <ChevronRight className="h-4 w-4 text-foreground-tertiary" />
                    <TierBadge
                      tier={(rep.currentTier + 1) as 1 | 2 | 3 | 4}
                      size="sm"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground-tertiary">
                      Time remaining
                    </p>
                    <p className="font-display font-semibold text-foreground">
                      {rep.daysToNextTier} days
                    </p>
                  </div>
                </div>
                <Progress value={rep.progressToNextTier} className="h-3" />
                <div className="flex justify-between mt-2 text-sm text-foreground-tertiary">
                  <span>Progress: {rep.progressToNextTier.toFixed(1)}%</span>
                  <span>
                    +{nextTierConfig.discount - tierConfig.discount}% more
                    discount at Tier {rep.currentTier + 1}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </FadeIn>

      {/* Timeline & Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timeline */}
        <FadeIn delay={0.2}>
          <Card variant="glass" padding="lg">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">
              Reputation Timeline
            </h3>
            <div className="space-y-6">
              {milestones.map((milestone, index) => {
                const mTierConfig = TIERS[milestone.tier];
                const isCompleted = milestone.status === "completed";

                return (
                  <div key={milestone.tier} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          isCompleted
                            ? "bg-success text-success-foreground"
                            : "bg-white/10 text-foreground-tertiary"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      {index < milestones.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 h-12 mt-2",
                            isCompleted ? "bg-success" : "bg-white/10"
                          )}
                        />
                      )}
                    </div>

                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-3 mb-1">
                        <TierBadge tier={milestone.tier} size="sm" />
                        <span className="font-medium text-foreground">
                          Tier {milestone.tier}: {mTierConfig.name}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-tertiary mb-1">
                        {isCompleted ? "Reached" : "Expected"}:{" "}
                        {milestone.date.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {mTierConfig.discount}% discount - {mTierConfig.fee}%
                        fee
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </FadeIn>

        {/* Tier Benefits */}
        <FadeIn delay={0.3}>
          <Card variant="glass" padding="lg">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">
              Your Benefits
            </h3>
            <div className="space-y-4">
              {([1, 2, 3, 4] as const).map((tier) => {
                const config = TIERS[tier];
                const isUnlocked = tier <= rep.currentTier;
                const isCurrent = tier === rep.currentTier;

                return (
                  <div
                    key={tier}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-colors",
                      isCurrent && "bg-brand-500/10 ring-1 ring-brand-500/30",
                      !isUnlocked && "opacity-50"
                    )}
                  >
                    <TierBadge tier={tier} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {config.name}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground-tertiary">
                        {config.minDays}+ days - {config.discount}% discount
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-foreground">
                        {config.fee}%
                      </p>
                      <p className="text-xs text-foreground-tertiary">
                        fee rate
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
