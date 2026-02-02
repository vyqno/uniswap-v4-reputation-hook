import { motion } from "framer-motion";
import { 
  Award, 
  Clock, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TierBadge } from "@/components/common/TierBadge";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/FadeIn";
import { CountUp } from "@/components/animations/CountUp";
import { TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Mock data
const mockData = {
  currentTier: 3 as const,
  reputationAgeDays: 95,
  registrationDate: new Date("2025-10-30"),
  activationDate: new Date("2025-10-31"),
  daysToNextTier: 85,
  progressToNextTier: 52.8,
  milestones: [
    { tier: 1, date: new Date("2025-10-31"), status: "completed" as const },
    { tier: 2, date: new Date("2025-11-30"), status: "completed" as const },
    { tier: 3, date: new Date("2026-01-29"), status: "completed" as const },
    { tier: 4, date: new Date("2026-04-28"), status: "upcoming" as const },
  ],
};

export default function ReputationPage() {
  const tierConfig = TIERS[mockData.currentTier];
  const nextTierConfig = mockData.currentTier < 4 ? TIERS[(mockData.currentTier + 1) as 1|2|3|4] : null;

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
              {/* Tier Badge */}
              <div className="flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TierBadge tier={mockData.currentTier} size="xl" />
                </motion.div>
                <h2 className="font-display text-3xl font-bold text-foreground mt-4">
                  Tier {mockData.currentTier}
                </h2>
                <p className="text-brand-400 font-medium">{tierConfig.name}</p>
              </div>

              {/* Stats */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                <div className="text-center lg:text-left">
                  <p className="text-foreground-tertiary text-sm mb-1">Reputation Age</p>
                  <p className="font-display text-3xl font-bold text-foreground">
                    <CountUp end={mockData.reputationAgeDays} suffix=" days" />
                  </p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-foreground-tertiary text-sm mb-1">Current Fee Rate</p>
                  <p className="font-display text-3xl font-bold text-gradient">
                    {tierConfig.fee}%
                  </p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-foreground-tertiary text-sm mb-1">Discount</p>
                  <p className="font-display text-3xl font-bold text-success">
                    {tierConfig.discount}% off
                  </p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-foreground-tertiary text-sm mb-1">Registered Since</p>
                  <p className="font-display text-xl font-bold text-foreground">
                    {mockData.registrationDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {nextTierConfig && (
              <div className="mt-8 pt-8 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TierBadge tier={mockData.currentTier} size="sm" />
                    <ChevronRight className="h-4 w-4 text-foreground-tertiary" />
                    <TierBadge tier={(mockData.currentTier + 1) as 1|2|3|4} size="sm" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground-tertiary">Time remaining</p>
                    <p className="font-display font-semibold text-foreground">
                      {mockData.daysToNextTier} days
                    </p>
                  </div>
                </div>
                <Progress value={mockData.progressToNextTier} className="h-3" />
                <div className="flex justify-between mt-2 text-sm text-foreground-tertiary">
                  <span>Progress: {mockData.progressToNextTier.toFixed(1)}%</span>
                  <span>+{nextTierConfig.discount - tierConfig.discount}% more discount at Tier {mockData.currentTier + 1}</span>
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
              {mockData.milestones.map((milestone, index) => {
                const tierConfig = TIERS[milestone.tier as 1|2|3|4];
                const isCompleted = milestone.status === "completed";
                
                return (
                  <div key={milestone.tier} className="flex gap-4">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isCompleted 
                          ? "bg-success text-success-foreground" 
                          : "bg-white/10 text-foreground-tertiary"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      {index < mockData.milestones.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-12 mt-2",
                          isCompleted ? "bg-success" : "bg-white/10"
                        )} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-3 mb-1">
                        <TierBadge tier={milestone.tier as 1|2|3|4} size="sm" />
                        <span className="font-medium text-foreground">
                          Tier {milestone.tier}: {tierConfig.name}
                        </span>
                      </div>
                      <p className="text-sm text-foreground-tertiary mb-1">
                        {milestone.date.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {tierConfig.discount}% discount • {tierConfig.fee}% fee
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
                const isUnlocked = tier <= mockData.currentTier;
                const isCurrent = tier === mockData.currentTier;
                
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
                        <span className="font-medium text-foreground">{config.name}</span>
                        {isCurrent && (
                          <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground-tertiary">
                        {config.minDays}+ days • {config.discount}% discount
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-foreground">{config.fee}%</p>
                      <p className="text-xs text-foreground-tertiary">fee rate</p>
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
