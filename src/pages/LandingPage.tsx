import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Zap, Shield, TrendingUp, Gift, Check, ExternalLink, Users, Coins, BarChart3, Percent } from "lucide-react";
import handLeftGreen from "@/assets/hand-left-green.png";
import handRightGreen from "@/assets/hand-right-green.png";

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

// Get current time formatted
function useCurrentTime() {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return time;
}

// Header/Navigation
function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <nav className="flex items-center justify-between py-5">
          {/* Logo */}
          <Link to="/" className="group">
            <span className="font-display text-lg font-semibold text-foreground tracking-tight">
              ReputationHook.
            </span>
          </Link>

          {/* Center Nav - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/how-it-works"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-300"
            >
              How It Works
            </Link>
            <a
              href="#features"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-300"
            >
              Features
            </a>
            <a
              href="#stats"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-300"
            >
              Stats
            </a>
          </div>

          {/* CTA */}
          <button className="px-5 py-2.5 text-sm font-medium text-foreground-secondary border border-border rounded-full hover:bg-foreground/5 hover:text-foreground transition-all duration-300">
            Connect Wallet
          </button>
        </nav>
      </div>
    </header>
  );
}

// Hero Section with Stats Panel
function HeroSection() {
  const currentTime = useCurrentTime();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Atmospheric Fog Background */}
      <div className="fog-overlay" />
      
      {/* Green Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/15 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-700/10 blur-[100px] pointer-events-none" />

      {/* Floating Hand Image - Left */}
      <div className="absolute left-[-5%] top-[15%] w-[28%] max-w-[320px] animate-float-left pointer-events-none hidden lg:block">
        <img
          src={handLeftGreen}
          alt=""
          className="w-full h-auto drop-shadow-2xl"
          style={{ transform: "rotate(-6deg)" }}
        />
      </div>

      {/* Floating Hand Image - Right */}
      <div className="absolute right-[-5%] bottom-[10%] w-[28%] max-w-[320px] animate-float-right pointer-events-none hidden lg:block">
        <img
          src={handRightGreen}
          alt=""
          className="w-full h-auto drop-shadow-2xl"
          style={{ transform: "rotate(6deg) scaleX(-1)" }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8 py-20">
        {/* Main Content Card */}
        <div className="reveal active">
          <div className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 md:p-12 shadow-2xl">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="mb-4">
                <span className="block font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground leading-tight">
                  Uniswap V4
                </span>
                <span className="block font-serif italic text-4xl sm:text-5xl md:text-6xl font-normal text-foreground mt-1">
                  Reputation Hook
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-brand-400 font-medium mt-4">
                Earn Lower Fees Through Loyalty
              </p>
            </div>

            {/* Description */}
            <div className="max-w-2xl mx-auto text-center mb-10">
              <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed">
                Bond a small amount of ETH, activate your reputation, and unlock tiered fee discounts—transparent, onchain, and built for long-term traders.
              </p>
            </div>

            {/* CTA and Stats Row */}
            <div className="flex flex-col items-center gap-8">
              {/* Primary CTA */}
              <Link to="/register">
                <button className="group inline-flex items-center gap-3 px-8 py-4 text-base font-medium bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-all duration-300 shadow-glow btn-glow">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <span>Start Earning</span>
                </button>
              </Link>

              {/* Stats Mini Cards */}
              <div className="w-full max-w-md">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-foreground-tertiary text-xs mb-1">
                      <Users className="w-3 h-3" />
                      Registered Users
                    </div>
                    <p className="font-display text-2xl font-semibold text-foreground">1,234</p>
                    <p className="text-xs text-foreground-muted mt-1">Live from registry contract</p>
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-foreground-tertiary text-xs mb-1">
                      <Coins className="w-3 h-3" />
                      Bonded ETH
                    </div>
                    <p className="font-display text-2xl font-semibold text-foreground">45.6</p>
                    <p className="text-xs text-foreground-muted mt-1">Estimated total bonded</p>
                  </div>
                </div>

                {/* Network Status */}
                <div className="flex items-center justify-center gap-3 text-xs text-foreground-tertiary">
                  <span>{currentTime}</span>
                  <span className="w-1 h-1 rounded-full bg-brand-500"></span>
                  <span>Sepolia (Testnet)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const containerRef = useRevealAnimation();
  
  const steps = [
    {
      icon: Coins,
      title: "1. Bond",
      description: "Deposit the registration bond (e.g., 0.001 ETH) to start your reputation timer."
    },
    {
      icon: Shield,
      title: "2. Activate",
      description: "A short delay (e.g., 24h) prevents instant gaming and makes loyalty measurable."
    },
    {
      icon: TrendingUp,
      title: "3. Trade",
      description: "Swap normally. The fee hook reads your tier and applies the correct fee automatically."
    },
    {
      icon: Gift,
      title: "4. Save",
      description: "Higher tiers unlock deeper discounts—up to 75% off base fee at Tier 4."
    }
  ];

  return (
    <section className="py-24 lg:py-32 border-t border-border" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="reveal text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Build reputation, unlock rewards.
          </h2>
          <p className="text-foreground-secondary max-w-2xl mx-auto text-lg">
            A minimalist path to lower fees: bond once, wait for activation, trade as usual, and watch discounts appear automatically.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="reveal bg-card border border-border rounded-2xl p-6 hover:border-foreground-tertiary transition-all duration-300"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-foreground-secondary text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Brand Marquee */}
        <div className="reveal mt-16 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          <p className="text-lg font-display tracking-[0.2em] text-foreground-muted">UNISWAP</p>
          <p className="text-lg font-display tracking-[0.2em] text-foreground-muted">WAGMI</p>
          <p className="text-lg font-display tracking-[0.2em] text-foreground-muted">VIEM</p>
          <p className="text-lg font-display tracking-[0.2em] text-foreground-muted">R3F</p>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const containerRef = useRevealAnimation();

  return (
    <section id="features" className="py-24 lg:py-32 border-t border-border" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="reveal mb-16">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground leading-tight">
            Reputation that{" "}
            <span className="font-serif italic font-normal text-foreground-secondary">
              pays you back
            </span>
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 01 - Instant Rewards */}
          <div className="reveal">
            <div className="group relative bg-card border border-border rounded-2xl p-8 lg:p-10 min-h-[380px] flex flex-col hover:border-foreground-tertiary transition-all duration-500 overflow-hidden">
              {/* Glow Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Card Header */}
              <div className="flex items-center justify-between mb-auto relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-brand-400" />
                  </div>
                  <span className="text-foreground-muted text-sm font-mono">01</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="mt-auto relative">
                <h3 className="font-display text-4xl sm:text-5xl font-semibold text-foreground leading-none mb-4">
                  Instant<br />Rewards
                </h3>
                <p className="text-foreground-secondary text-base leading-relaxed max-w-sm">
                  See your expected fee before swapping. As your reputation matures, discounts apply seamlessly—no dashboards required.
                </p>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowUpRight className="w-6 h-6 text-foreground-tertiary" />
              </div>
            </div>
          </div>

          {/* Card 02 - Lifetime Benefits */}
          <div className="reveal" style={{ transitionDelay: "100ms" }}>
            <div className="group relative bg-card border border-border rounded-2xl p-8 lg:p-10 min-h-[380px] flex flex-col hover:border-foreground-tertiary transition-all duration-500 overflow-hidden">
              {/* Glow Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Card Header */}
              <div className="flex items-center justify-between mb-auto relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-400" />
                  </div>
                  <span className="text-foreground-muted text-sm font-mono">02</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="mt-auto relative">
                <h3 className="font-display text-4xl sm:text-5xl font-semibold text-foreground leading-none mb-4">
                  Lifetime<br />Benefits
                </h3>
                <p className="text-foreground-secondary text-base leading-relaxed max-w-sm mb-4">
                  Your onchain history becomes a permanent asset. Withdraw your bond after cooldown while keeping what you earned.
                </p>
                <div className="flex items-center gap-2 text-brand-400 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Transparent fee logic</span>
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowUpRight className="w-6 h-6 text-foreground-tertiary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Live Stats Section
function StatsSection() {
  const containerRef = useRevealAnimation();
  
  const stats = [
    { icon: Users, label: "Registered", value: "1,234", description: "Total wallets registered" },
    { icon: Coins, label: "Bonded", value: "45.6 ETH", description: "Total registration bonds" },
    { icon: BarChart3, label: "Volume", value: "$12.3M", description: "Swap volume (tracked)" },
    { icon: Percent, label: "Avg Save", value: "15.2%", description: "Average discount applied" },
  ];

  return (
    <section id="stats" className="py-24 lg:py-32 border-t border-border" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="reveal text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Live system signals.
          </h2>
          <p className="text-foreground-secondary max-w-2xl mx-auto text-lg">
            A single glance at adoption, liquidity commitment, and the kind of savings loyalty makes possible.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="reveal bg-card border border-border rounded-2xl p-6 text-center hover:border-foreground-tertiary transition-all duration-300"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-center gap-2 text-foreground-tertiary text-xs mb-3">
                <stat.icon className="w-3.5 h-3.5" />
                <span>{stat.label}</span>
              </div>
              <p className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-foreground-muted">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* View Contracts Link */}
        <div className="reveal flex justify-center">
          <a
            href="https://sepolia.etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors duration-300"
          >
            <ExternalLink className="w-4 h-4" />
            View contracts on Sepolia
          </a>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-16 lg:py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12">
          {/* Large Logo Text */}
          <div className="reveal active">
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-none mb-4">
              REPUTATION.
            </h2>
            <p className="text-foreground-secondary max-w-md">
              Uniswap V4 Reputation Hook helps long-term traders pay less—by proving loyalty onchain.
            </p>
          </div>

          {/* Links & Copyright */}
          <div className="flex flex-col items-start lg:items-end gap-6">
            {/* Social Links */}
            <div className="flex items-center gap-6 text-sm text-foreground-secondary">
              <a
                href="https://twitter.com/uniswap"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors duration-300"
              >
                X (Twitter)
              </a>
              <a
                href="https://discord.gg/uniswap"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors duration-300"
              >
                Discord
              </a>
              <a
                href="https://github.com/uniswap"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors duration-300"
              >
                GitHub
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-foreground-muted">
              © {currentYear} ReputationHook. All rights reserved.
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <StatsSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
