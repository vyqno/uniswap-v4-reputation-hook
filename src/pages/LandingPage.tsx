import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, TrendingDown, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/common/TierBadge";
import { Logo } from "@/components/common/Logo";
import { CountUp } from "@/components/animations/CountUp";
import { TIERS, SOCIAL_LINKS, NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Reveal animation hook
function useRevealAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = ref.current?.querySelectorAll(".reveal");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}

// Header/Navigation
function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <nav className="flex items-center justify-between py-6">
          {/* Logo */}
          <Link to="/" className="group">
            <span className="font-display text-xl font-semibold text-foreground tracking-tight">
              Reputation Hook.
            </span>
          </Link>

          {/* Center Nav - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.marketing.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-300"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Link to="/register">
            <Button variant="outline" size="sm" className="border-foreground-tertiary text-foreground hover:bg-foreground hover:text-background transition-all duration-300">
              Start Saving
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-background" />

      {/* Floating Hand Images - Decorative */}
      <div className="absolute left-0 top-1/4 w-64 h-96 opacity-30 animate-float-left pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-brand-500/20 to-transparent rounded-full blur-3xl" />
      </div>
      <div className="absolute right-0 bottom-1/4 w-64 h-96 opacity-30 animate-float-right pointer-events-none">
        <div className="w-full h-full bg-gradient-to-tl from-brand-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="flex flex-col items-center text-center">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight leading-[0.9]">
              <span className="text-foreground">Reputation Hook.</span>
              <br />
              <span className="text-foreground-secondary font-normal italic font-serif">
                The loyalty layer.
              </span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mb-12"
          >
            <p className="text-lg sm:text-xl text-foreground-secondary leading-relaxed">
              Register your wallet with a small bond and unlock up to{" "}
              <span className="text-brand-400 font-medium">75% fee discounts</span>{" "}
              on every swap. The longer you stay, the more you save.
            </p>
          </motion.div>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link to="/register">
              <Button 
                variant="default" 
                size="lg" 
                className="group bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-base font-medium"
              >
                <span className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  Enter the Void
                </span>
              </Button>
            </Link>

            <div className="flex items-center gap-4 text-sm text-foreground-tertiary">
              <span>Built on Uniswap V4</span>
              <span className="w-1 h-1 rounded-full bg-foreground-muted" />
              <span>0.001 ETH Bond</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="h-14 w-8 rounded-full border border-foreground-tertiary flex items-start justify-center p-2">
          <div className="h-2 w-1 rounded-full bg-foreground-tertiary" />
        </div>
      </motion.div>
    </section>
  );
}

// Philosophy Section
function PhilosophySection() {
  const containerRef = useRevealAnimation();

  return (
    <section className="py-32 relative" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Philosophy Text */}
          <div className="reveal mb-16">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-6">
              We turn the unseen into the unforgettable. A Uniswap V4 hook for those who value long-term commitment.
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl">
              Elegance is loyalty. We reward the patient traders so your savings grow with absolute clarity.
            </p>
          </div>

          {/* Partner Logos / Trust Badges */}
          <div className="reveal flex flex-wrap items-center gap-8 text-foreground-muted">
            <span className="text-lg font-display tracking-widest">UNISWAP</span>
            <span className="text-lg font-display tracking-widest">ETHEREUM</span>
            <span className="text-lg font-display tracking-widest">DEFI</span>
            <span className="text-lg font-display tracking-widest">WEB3</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// How It Works / Services Section
function HowItWorksSection() {
  const containerRef = useRevealAnimation();

  const steps = [
    {
      icon: Shield,
      number: "01",
      title: "Bond\n0.001 ETH",
      description: "Register your wallet with a small refundable bond to join the reputation system.",
    },
    {
      icon: Clock,
      number: "02",
      title: "Wait\n24 Hours",
      description: "Your reputation activates after a brief delay, preventing gaming of the system.",
    },
    {
      icon: TrendingDown,
      number: "03",
      title: "Trade\n& Save",
      description: "Every swap you make uses your discounted fee rate based on your tier.",
    },
    {
      icon: Zap,
      number: "04",
      title: "Tier\nUp",
      description: "The longer you hold your reputation, the higher your tier and savings grow.",
    },
  ];

  return (
    <section className="py-32 relative" id="how-it-works" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="reveal mb-20">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground leading-tight">
            Define your{" "}
            <span className="italic font-serif font-normal text-foreground-secondary">
              trading reputation
            </span>
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="reveal"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Card
                variant="glass"
                className="group relative overflow-hidden h-full p-8 hover:border-foreground-tertiary transition-all duration-500"
              >
                {/* Number & Icon */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-foreground-secondary" />
                    </div>
                    <span className="text-foreground-muted text-sm font-mono">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="font-display text-3xl sm:text-4xl font-semibold text-foreground whitespace-pre-line leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-foreground-secondary text-base leading-relaxed max-w-sm">
                    {step.description}
                  </p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-6 h-6 text-foreground-tertiary" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Tier Benefits Section
function TierBenefitsSection() {
  const containerRef = useRevealAnimation();

  return (
    <section className="py-32" id="tiers" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="reveal text-center mb-20">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground mb-4">
            Tier Benefits
          </h2>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Progress through tiers to unlock increasingly better fee discounts
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {([1, 2, 3, 4] as const).map((tier, index) => {
            const tierConfig = TIERS[tier];
            const isGold = tier === 4;

            return (
              <div
                key={tier}
                className="reveal"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <Card
                  variant="glass"
                  className={cn(
                    "relative overflow-hidden h-full group hover:border-foreground-tertiary transition-all duration-500",
                    isGold && "ring-1 ring-amber-500/20"
                  )}
                >
                  {/* Popular Badge */}
                  {tier === 3 && (
                    <div className="absolute top-4 right-4 rounded-full bg-brand-500/20 px-2 py-1 text-xs font-medium text-brand-400">
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
                        <span
                          className={cn(
                            "font-display text-lg font-semibold",
                            tier === 1 ? "text-foreground-tertiary" : "text-brand-400"
                          )}
                        >
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
                  <div
                    className={cn(
                      "h-1 w-full",
                      tier === 1 && "bg-gradient-to-r from-slate-400 to-slate-500",
                      tier === 2 && "bg-gradient-to-r from-sky-400 to-sky-500",
                      tier === 3 && "bg-gradient-to-r from-emerald-400 to-emerald-500",
                      tier === 4 && "bg-gradient-to-r from-amber-400 to-amber-500"
                    )}
                  />
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Stats Section
function StatsSection() {
  const containerRef = useRevealAnimation();

  const stats = [
    { label: "Registered Users", value: 12847, prefix: "", suffix: "+" },
    { label: "Total Bonded", value: 156.8, prefix: "", suffix: " ETH", decimals: 1 },
    { label: "Fee Savings", value: 2.4, prefix: "$", suffix: "M", decimals: 1 },
    { label: "Avg Discount", value: 42, prefix: "", suffix: "%" },
  ];

  return (
    <section className="py-32 relative" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="reveal text-center mb-16">
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-foreground mb-4">
            Live Statistics
          </h2>
          <p className="text-lg text-foreground-secondary">
            Real-time metrics from the reputation system
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="reveal"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <Card variant="glass" className="p-6 text-center">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-20 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
          {/* Logo */}
          <div>
            <span className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
              REPUTATION HOOK.
            </span>
          </div>

          {/* Links & Copyright */}
          <div className="flex flex-col items-start lg:items-end gap-6">
            <div className="flex items-center gap-6 text-sm text-foreground-secondary">
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Twitter
              </a>
              <a
                href={SOCIAL_LINKS.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Discord
              </a>
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
            <p className="text-sm text-foreground-muted">
              © {currentYear} Reputation Hook. Built on Uniswap V4. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        <HeroSection />
        <PhilosophySection />
        <HowItWorksSection />
        <TierBenefitsSection />
        <StatsSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
