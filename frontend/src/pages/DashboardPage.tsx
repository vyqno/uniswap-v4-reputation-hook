import { motion } from "framer-motion";
import {
  Award,
  TrendingUp,
  DollarSign,
  Clock,
  ArrowRight,
  Wallet,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TierBadge, TierBadgeRow } from "@/components/common/TierBadge";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/FadeIn";
import { CountUp } from "@/components/animations/CountUp";
import { TIERS } from "@/lib/constants";
import { useUserReputation } from "@/hooks/useReputation";
import { cn } from "@/lib/utils";

function NotConnected() {
  return (
    <div className="max-w-6xl mx-auto">
      <FadeIn>
        <div className="text-center py-16">
          <Wallet className="h-16 w-16 text-brand-400 mx-auto mb-4" />
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-lg text-foreground-secondary mb-8">
            Connect your wallet to view your reputation dashboard
          </p>
          <ConnectButton />
        </div>
      </FadeIn>
    </div>
  );
}

function NotRegistered() {
  return (
    <div className="max-w-6xl mx-auto">
      <FadeIn>
        <div className="text-center py-16">
          <Award className="h-16 w-16 text-brand-400 mx-auto mb-4" />
          <h1 className="font-display text-4xl font-bold text-foreground mb-4">
            Start Your Reputation Journey
          </h1>
          <p className="text-lg text-foreground-secondary mb-8">
            Register your wallet to join the reputation system and start earning
            lower fees
          </p>
          <Link to="/register">
            <Button variant="hero" size="lg">
              Register Now
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}

function WelcomeHeader() {
  return (
    <FadeIn>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-foreground-secondary">
            Your reputation is working for you. Here's your current status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/fees">
            <Button variant="secondary" size="default">
              Fee Calculator
            </Button>
          </Link>
          <Link to="/reputation">
            <Button variant="brand" size="default">
              View Reputation
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </FadeIn>
  );
}

function TierCard() {
  const rep = useUserReputation();
  const tierConfig = TIERS[rep.currentTier];

  return (
    <FadeIn delay={0.1}>
      <Card variant="glow" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/5" />

        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-shrink-0">
              <TierBadge tier={rep.currentTier} size="xl" animated />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Tier {rep.currentTier}: {tierConfig.name}
                </h2>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    rep.isActive
                      ? "bg-success/20 text-success"
                      : "bg-warning/20 text-warning"
                  )}
                >
                  {rep.isActive ? "Active" : "Activating..."}
                </span>
              </div>
              <p className="text-foreground-secondary mb-4">
                {tierConfig.description}
              </p>
              <TierBadgeRow currentTier={rep.currentTier} className="mb-4" />
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <div className="text-right">
                <p className="text-foreground-secondary text-sm">
                  Your Fee Rate
                </p>
                <p className="font-display text-3xl font-bold text-gradient">
                  {rep.currentFeePercent.toFixed(3)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-foreground-secondary text-sm">Discount</p>
                <p className="font-display text-xl font-semibold text-brand-400">
                  {tierConfig.discount}% off
                </p>
              </div>
            </div>
          </div>

          {rep.nextTier && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground-secondary text-sm">
                  Progress to Tier {rep.nextTier}
                </span>
                <span className="text-foreground text-sm font-medium">
                  {rep.daysToNextTier} days remaining
                </span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${rep.progressToNextTier}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </FadeIn>
  );
}

function StatsGrid() {
  const rep = useUserReputation();
  const tierConfig = TIERS[rep.currentTier];

  const stats = [
    {
      icon: Clock,
      label: "Reputation Age",
      value: Math.floor(rep.ageDays),
      prefix: "",
      suffix: " days",
      decimals: 0,
      color: "text-brand-400",
    },
    {
      icon: TrendingUp,
      label: "Current Discount",
      value: tierConfig.discount,
      prefix: "",
      suffix: "%",
      decimals: 0,
      color: "text-brand-400",
    },
    {
      icon: DollarSign,
      label: "Your Fee",
      value: rep.currentFeePercent * 100,
      prefix: "",
      suffix: " bps",
      decimals: 1,
      color: "text-success",
    },
    {
      icon: Award,
      label: "Fee Saved vs Base",
      value: 0.3 - rep.currentFeePercent,
      prefix: "",
      suffix: "%",
      decimals: 3,
      color: "text-success",
    },
  ];

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {stats.map((stat, index) => (
        <StaggerItem key={stat.label}>
          <Card variant="glass" padding="default" hover="lift" className="h-full">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                <stat.icon className="h-6 w-6 text-brand-500" />
              </div>
              <div>
                <p className="text-foreground-tertiary text-sm mb-1">
                  {stat.label}
                </p>
                <p className={cn("font-display text-2xl font-bold", stat.color)}>
                  <CountUp
                    end={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    delay={0.2 + index * 0.1}
                  />
                </p>
              </div>
            </div>
          </Card>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

function QuickActions() {
  const actions = [
    {
      icon: Award,
      title: "View Full Reputation",
      description: "See detailed breakdown of your tier progress",
      href: "/reputation",
      color: "from-brand-500/20 to-brand-600/10",
    },
    {
      icon: Zap,
      title: "Fee Calculator",
      description: "Calculate your savings on any swap",
      href: "/fees",
      color: "from-cyan-500/20 to-cyan-600/10",
    },
    {
      icon: Wallet,
      title: "Withdraw Bond",
      description: "Reclaim your ETH after cooldown",
      href: "/withdraw",
      color: "from-violet-500/20 to-violet-600/10",
    },
  ];

  return (
    <FadeIn delay={0.3}>
      <div className="mt-8">
        <h3 className="font-display text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Link key={action.href} to={action.href}>
              <Card
                variant="glass"
                hover="lift"
                padding="default"
                className="h-full group cursor-pointer"
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    action.color
                  )}
                />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                    <action.icon className="h-6 w-6 text-foreground-secondary group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1 group-hover:text-brand-400 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-foreground-tertiary">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-foreground-tertiary group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

export default function DashboardPage() {
  const { isConnected } = useAccount();
  const { isRegistered, isLoading } = useUserReputation();

  if (!isConnected) return <NotConnected />;
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto" />
        <p className="text-foreground-secondary mt-4">Loading your reputation data...</p>
      </div>
    );
  }
  if (!isRegistered) return <NotRegistered />;

  return (
    <div className="max-w-6xl mx-auto">
      <WelcomeHeader />
      <TierCard />
      <StatsGrid />
      <QuickActions />
    </div>
  );
}
