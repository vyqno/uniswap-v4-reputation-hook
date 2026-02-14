import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import handLeftGreen from "@/assets/hand-left-green.png";
import handRightGreen from "@/assets/hand-right-green.png";
import { useTransparentPng } from "@/hooks/useTransparentPng";

// Reveal animation hook
function useRevealAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px"
    });
    const elements = ref.current?.querySelectorAll(".reveal");
    elements?.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

// Header/Navigation - Exact structure
function Header() {
  return <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <nav className="flex items-center justify-between py-6">
          {/* Logo */}
          <Link to="/" className="group">
            <span className="font-display text-lg font-semibold text-foreground tracking-tight">
              Reputation Hook.
            </span>
          </Link>

          {/* Center Nav - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/how-it-works" className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-300">
              How It Works
            </Link>
            <Link to="/#tiers" className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-300">
              Tiers
            </Link>
            <Link to="/faq" className="text-sm text-foreground-secondary hover:text-foreground transition-colors duration-300">
              FAQ
            </Link>
          </div>

          {/* CTA */}
          <Link to="/register">
            <button className="px-5 py-2.5 text-sm font-medium text-background bg-foreground rounded-full hover:bg-foreground/90 transition-all duration-300">
              Start Saving
            </button>
          </Link>
        </nav>
      </div>
    </header>;
}

// Hero Section - Exact structure from HTML
function HeroSection() {
  const handLeftClean = useTransparentPng(handLeftGreen);
  const handRightClean = useTransparentPng(handRightGreen);
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden mx-0 my-0">
      {/* Atmospheric Fog Background */}
      <div className="fog-overlay" />
      
      {/* Green Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-700/15 blur-[100px] pointer-events-none" />

      {/* Floating Hand Image - Left */}
      <div className="absolute left-[-3%] top-[-30%] w-[30%] max-w-[350px] animate-float-left pointer-events-none hidden lg:block">
        <img src={handLeftClean} alt="" className="w-full h-auto" style={{
        transform: "rotate(-6deg)",
        filter: "drop-shadow(0 0 40px hsl(var(--brand-400) / 0.5)) drop-shadow(0 8px 30px hsl(0 0% 0% / 0.4))"
      }} />
      </div>

      {/* Floating Hand Image - Right */}
      <div className="absolute right-[-5%] bottom-[5%] w-[30%] max-w-[350px] animate-float-right pointer-events-none hidden lg:block">
        <img src={handRightClean} alt="" className="w-full h-auto" style={{
        transform: "rotate(180deg)",
        filter: "drop-shadow(0 0 40px hsl(var(--brand-400) / 0.5)) drop-shadow(0 8px 30px hsl(0 0% 0% / 0.4))"
      }} />
      </div>

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 py-32 text-center">
        {/* Main Title */}
        <div className="reveal active mb-8">
          <h1 className="mb-4">
            <span className="block font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-foreground">
              Reputation Hook.
            </span>
            <span className="block font-serif italic text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-foreground-secondary mt-2">
              The loyalty layer.
            </span>
          </h1>
        </div>

        {/* Description */}
        <div className="reveal active max-w-xl mx-auto mb-12">
          <p className="text-base sm:text-lg text-foreground-secondary leading-relaxed">
            Register your wallet with a small bond and unlock up to 75% fee discounts on every swap. The longer you stay, the more you save.
          </p>
        </div>

        {/* CTA Row */}
        <div className="reveal active flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* Button */}
          <Link to="/register">
            <button className="group inline-flex items-center gap-3 px-8 py-4 text-base font-medium text-background bg-foreground rounded-full hover:bg-foreground/90 transition-all duration-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              <span>Enter the Void</span>
            </button>
          </Link>

          {/* Info */}
          <div className="flex items-center gap-3 text-sm text-foreground-tertiary">
            <span>0.001 ETH</span>
            <span className="w-1 h-1 rounded-full bg-foreground-muted"></span>
            <span>Uniswap V4</span>
          </div>
        </div>
      </div>
    </section>;
}

// Philosophy Section - Exact structure from HTML
function PhilosophySection() {
  const containerRef = useRevealAnimation();
  return <section className="py-24 lg:py-32 border-t border-border" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Quote */}
          <div className="reveal">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground leading-snug mb-6">
              We turn the unseen into the unforgettable. A Uniswap V4 hook for those who value long-term commitment.
            </h2>
            <p className="text-foreground-secondary text-base">
              Elegance is loyalty. We reward the patient traders so your savings grow with absolute clarity.
            </p>
          </div>

          {/* Right Column - Brand Logos */}
          <div className="reveal flex flex-wrap items-center justify-start lg:justify-end gap-x-12 gap-y-4">
            <p className="text-xl font-display tracking-[0.2em] text-foreground-muted">UNISWAP</p>
            <p className="text-xl font-display tracking-[0.2em] text-foreground-muted">ETHEREUM</p>
            <p className="text-xl font-display tracking-[0.2em] text-foreground-muted">DEFI</p>
            <p className="text-xl font-display tracking-[0.2em] text-foreground-muted">WEB3</p>
          </div>
        </div>
      </div>
    </section>;
}

// Services Section - Exact structure from HTML
function ServicesSection() {
  const containerRef = useRevealAnimation();
  return <section className="py-24 lg:py-32 border-t border-border" id="tiers" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Title */}
        <div className="reveal mb-16">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-foreground leading-tight">
            Define your{" "}
            <span className="font-serif italic font-normal text-foreground-secondary">
              trading reputation
            </span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 01 - New Traders */}
          <Link to="/register" className="reveal">
            <div className="group relative bg-card border border-border rounded-2xl p-8 lg:p-10 min-h-[400px] flex flex-col hover:border-foreground-tertiary transition-all duration-500">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-auto">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                    <svg className="w-5 h-5 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-foreground-muted text-sm font-mono">01</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="mt-auto">
                <h3 className="font-display text-4xl sm:text-5xl font-semibold text-foreground leading-none mb-4">
                  New<br />Traders
                </h3>
                <p className="text-foreground-secondary text-base leading-relaxed max-w-xs">
                  You have the spark. We provide the atmosphere for it to ignite into a blazing reality.
                </p>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowUpRight className="w-6 h-6 text-foreground-tertiary" />
              </div>
            </div>
          </Link>

          {/* Card 02 - Loyal Holders */}
          <Link to="/register" className="reveal" style={{ transitionDelay: "100ms" }}>
            <div className="group relative bg-card border border-border rounded-2xl p-8 lg:p-10 min-h-[400px] flex flex-col hover:border-foreground-tertiary transition-all duration-500">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-auto">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                    <svg className="w-5 h-5 text-foreground-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-foreground-muted text-sm font-mono">02</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="mt-auto">
                <h3 className="font-display text-4xl sm:text-5xl font-semibold text-foreground leading-none mb-4">
                  Loyal<br />Holders
                </h3>
                <p className="text-foreground-secondary text-base leading-relaxed max-w-xs">
                  You've arrived. Now let's make sure you never leave their minds. Permanence is our craft.
                </p>
              </div>

              {/* Hover Arrow */}
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowUpRight className="w-6 h-6 text-foreground-tertiary" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>;
}

// Footer - Exact structure from HTML
function Footer() {
  const currentYear = new Date().getFullYear();
  return <footer className="py-16 lg:py-24 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12">
          {/* Large Logo Text */}
          <div className="reveal active">
            <h2 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-none">
              REPUTATION HOOK.
            </h2>
          </div>

          {/* Links & Copyright */}
          <div className="flex flex-col items-start lg:items-end gap-6">
            {/* Social Links */}
            <div className="flex items-center gap-8 text-sm text-foreground-secondary">
              <a href="https://twitter.com/uniswap" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-300">
                Twitter
              </a>
              <a href="https://discord.gg/uniswap" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-300">
                Discord
              </a>
              <a href="https://github.com/uniswap" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-300">
                GitHub
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-foreground-muted">
              © {currentYear} Reputation Hook. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>;
}

// Main Landing Page
export default function LandingPage() {
  return <div className="min-h-screen bg-background text-foreground">
      {/* Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        <HeroSection />
        <PhilosophySection />
        <ServicesSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>;
}