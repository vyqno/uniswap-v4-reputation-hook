import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/FadeIn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/common/TierBadge";
import {
  ArrowRight,
  Wallet,
  Clock,
  TrendingDown,
  Shield,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { TIERS, REGISTRATION_BOND, TIMING } from "@/lib/constants";

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: "Connect & Register",
      description: "Connect your wallet and deposit a small 0.001 ETH bond to join the reputation system. This bond is fully refundable after the cooldown period.",
      icon: Wallet,
      details: [
        "Supports MetaMask, Coinbase, WalletConnect",
        "Bond amount: 0.001 ETH (~$3.50)",
        "One-time registration per wallet",
      ],
    },
    {
      number: 2,
      title: "Wait for Activation",
      description: "Your reputation activates 24 hours after registration. This delay prevents gaming and ensures fair access for all users.",
      icon: Clock,
      details: [
        "24-hour activation delay",
        "Automatic activation, no action needed",
        "Start at Tier 1 immediately after activation",
      ],
    },
    {
      number: 3,
      title: "Trade with Lower Fees",
      description: "Once active, every swap you make on supported pools automatically uses your discounted fee rate based on your current tier.",
      icon: TrendingDown,
      details: [
        "Discounts applied automatically",
        "Works on all hook-enabled pools",
        "No claim or stake required",
      ],
    },
    {
      number: 4,
      title: "Progress Through Tiers",
      description: "The longer you maintain your reputation, the higher your tier climbs. Reach Tier 4 after 180 days for maximum 75% discounts.",
      icon: Zap,
      details: [
        "Tier 2 at 30 days: 25% discount",
        "Tier 3 at 90 days: 50% discount",
        "Tier 4 at 180 days: 75% discount",
      ],
    },
  ];

  return (
    <div className="min-h-screen py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Start earning lower trading fees in four simple steps
            </p>
          </div>
        </FadeIn>

        {/* Steps */}
        <div className="space-y-8 mb-24">
          {steps.map((step, index) => (
            <FadeIn key={step.number} delay={0.1 * index}>
              <Card
                variant="glass"
                className="relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-400 to-brand-600" />
                <div className="p-8 pl-12">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Step Number & Icon */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/20">
                        <step.icon className="h-8 w-8 text-brand-500" />
                      </div>
                      <div className="lg:hidden">
                        <span className="text-sm text-foreground-tertiary">Step {step.number}</span>
                        <h3 className="font-display text-xl font-bold text-foreground">{step.title}</h3>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="hidden lg:block mb-2">
                        <span className="text-sm text-foreground-tertiary">Step {step.number}</span>
                        <h3 className="font-display text-2xl font-bold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-foreground-secondary mb-4">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* Tier Benefits */}
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Tier Benefits
            </h2>
            <p className="text-foreground-secondary">
              Each tier unlocks better fee discounts
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {([1, 2, 3, 4] as const).map((tier) => {
            const config = TIERS[tier];
            return (
              <StaggerItem key={tier}>
                <Card
                  variant="glass"
                  hover="lift"
                  padding="lg"
                  className="text-center"
                >
                  <TierBadge tier={tier} size="lg" className="justify-center mb-4" />
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">
                    {config.name}
                  </h3>
                  <p className="text-foreground-tertiary text-sm mb-4">
                    After {config.minDays} days
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Fee Rate</span>
                      <span className="font-medium text-foreground">{config.fee}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-secondary">Discount</span>
                      <span className="font-medium text-brand-400">{config.discount}%</span>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* CTA */}
        <FadeIn>
          <Card variant="glow" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/5" />
            <div className="relative p-8 lg:p-12 text-center">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                Ready to Start?
              </h2>
              <p className="text-foreground-secondary mb-8 max-w-xl mx-auto">
                Join thousands of users already saving on every swap with the Reputation Hook
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Register Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/faq">
                  <Button variant="secondary" size="xl">
                    View FAQ
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
