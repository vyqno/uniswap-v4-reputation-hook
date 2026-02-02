import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Clock, TrendingDown, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/common/TierBadge";
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from "@/components/animations/FadeIn";
import { CountUp } from "@/components/animations/CountUp";
import { TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-brand-600/10 blur-[100px]" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Badge */}
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-sm text-brand-400 mb-8">
              <Sparkles className="h-4 w-4" />
              <span>Built on Uniswap V4</span>
            </div>
          </FadeIn>

          {/* Main Heading */}
          <FadeIn delay={0.2}>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6">
              <span className="text-foreground">Earn Lower Fees</span>
              <br />
              <span className="text-gradient">Through Loyalty</span>
            </h1>
          </FadeIn>

          {/* Description */}
          <FadeIn delay={0.3}>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-foreground-secondary mb-10">
              Register your wallet with a small bond and unlock up to{" "}
              <span className="text-brand-400 font-semibold">75% fee discounts</span>{" "}
              on every swap. The longer you stay, the more you save.
            </p>
          </FadeIn>

          {/* CTA Buttons */}
          <FadeIn delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="hero" size="xl" className="group">
                  Get Started
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="secondary" size="xl">
                  How It Works
                </Button>
              </Link>
            </div>
          </FadeIn>

          {/* Floating Tier Badges */}
          <FadeIn delay={0.6}>
            <div className="mt-20 flex items-center justify-center gap-6">
              {([1, 2, 3, 4] as const).map((tier, index) => (
                <motion.div
                  key={tier}
                  animate={{ 
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    delay: index * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <TierBadge tier={tier} size="lg" />
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="h-14 w-8 rounded-full border-2 border-foreground-tertiary flex items-start justify-center p-2">
          <div className="h-2 w-1 rounded-full bg-foreground-tertiary" />
        </div>
      </motion.div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      icon: Shield,
      title: "Bond 0.001 ETH",
      description: "Register your wallet with a small refundable bond to join the reputation system.",
      highlight: "~$3.50",
    },
    {
      icon: Clock,
      title: "Wait 24 Hours",
      description: "Your reputation activates after a brief delay, preventing gaming of the system.",
      highlight: "Activation",
    },
    {
      icon: TrendingDown,
      title: "Trade & Save",
      description: "Every swap you make uses your discounted fee rate based on your tier.",
      highlight: "Up to 75%",
    },
    {
      icon: Zap,
      title: "Tier Up",
      description: "The longer you hold your reputation, the higher your tier and savings grow.",
      highlight: "180 Days",
    },
  ];

  return (
    <section className="py-24 lg:py-32 relative" id="how-it-works">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/5 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Start earning lower fees in just four simple steps
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <StaggerItem key={step.title}>
              <Card
                variant="glass"
                hover="lift"
                padding="lg"
                className="relative h-full"
              >
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500/10">
                  <step.icon className="h-7 w-7 text-brand-500" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-foreground-secondary text-sm mb-4">
                  {step.description}
                </p>
                
                {/* Highlight */}
                <span className="inline-flex items-center rounded-full bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-400">
                  {step.highlight}
                </span>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Connecting Lines (Desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
      </div>
    </section>
  );
}

// Tier Benefits Section
function TierBenefitsSection() {
  return (
    <section className="py-24 lg:py-32" id="tiers">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Tier Benefits
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Progress through tiers to unlock increasingly better fee discounts
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {([1, 2, 3, 4] as const).map((tier) => {
            const tierConfig = TIERS[tier];
            const isGold = tier === 4;
            
            return (
              <StaggerItem key={tier}>
                <Card
                  variant={isGold ? "tier4" : `tier${tier}` as any}
                  hover="glow"
                  className={cn(
                    "relative overflow-hidden h-full",
                    isGold && "ring-1 ring-amber-500/30"
                  )}
                >
                  {/* Popular Badge */}
                  {tier === 3 && (
                    <div className="absolute top-4 right-4 rounded-full bg-violet-500/20 px-2 py-1 text-xs font-medium text-violet-400">
                      Popular
                    </div>
                  )}
                  {isGold && (
                    <div className="absolute top-4 right-4 rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-400">
                      Best Value
                    </div>
                  )}

                  <div className="p-6">
                    {/* Badge */}
                    <div className="mb-6">
                      <TierBadge tier={tier} size="xl" animated={isGold} />
                    </div>

                    {/* Tier Info */}
                    <h3 className="font-display text-2xl font-bold text-foreground mb-1">
                      {tierConfig.name}
                    </h3>
                    <p className="text-foreground-secondary text-sm mb-6">
                      {tierConfig.description}
                    </p>

                    {/* Stats */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-secondary">Fee Rate</span>
                        <span className="font-display text-lg font-semibold text-foreground">
                          {tierConfig.fee}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-secondary">Discount</span>
                        <span className={cn(
                          "font-display text-lg font-semibold",
                          tier === 1 ? "text-foreground-tertiary" : "text-brand-400"
                        )}>
                          {tierConfig.discount}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground-secondary">Unlock After</span>
                        <span className="font-display text-lg font-semibold text-foreground">
                          {tierConfig.minDays} days
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Accent */}
                  <div className={cn(
                    "h-1 w-full",
                    tier === 1 && "bg-gradient-to-r from-zinc-500 to-zinc-600",
                    tier === 2 && "bg-gradient-to-r from-cyan-500 to-cyan-600",
                    tier === 3 && "bg-gradient-to-r from-violet-500 to-violet-600",
                    tier === 4 && "bg-gradient-to-r from-amber-400 to-amber-500",
                  )} />
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}

// Stats Section
function StatsSection() {
  const stats = [
    { label: "Registered Users", value: 12847, prefix: "", suffix: "+" },
    { label: "Total Bonded", value: 156.8, prefix: "", suffix: " ETH", decimals: 1 },
    { label: "Fee Savings", value: 2.4, prefix: "$", suffix: "M", decimals: 1 },
    { label: "Avg Discount", value: 42, prefix: "", suffix: "%" },
  ];

  return (
    <section className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-brand-500/5 to-background" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Live Statistics
            </h2>
            <p className="text-lg text-foreground-secondary">
              Real-time metrics from the reputation system
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <Card variant="glass" padding="lg" className="text-center">
                <p className="stat-value text-gradient mb-2">
                  <CountUp
                    end={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                  />
                </p>
                <p className="text-foreground-secondary">{stat.label}</p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScaleIn>
          <Card
            variant="glow"
            className="relative overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/10" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px]" />
            
            <div className="relative p-8 lg:p-16 text-center">
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Ready to Start Saving?
              </h2>
              <p className="text-lg text-foreground-secondary max-w-xl mx-auto mb-8">
                Join thousands of traders already enjoying reduced fees on Uniswap V4.
                Register today with just 0.001 ETH.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button variant="hero" size="xl" className="group">
                    Register Now
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/fees">
                  <Button variant="outline" size="xl">
                    Calculate Savings
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </ScaleIn>
      </div>
    </section>
  );
}

// Main Landing Page
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <HowItWorksSection />
      <TierBenefitsSection />
      <StatsSection />
      <CTASection />
    </div>
  );
}
