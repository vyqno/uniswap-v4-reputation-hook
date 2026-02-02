import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FadeIn, ScaleIn } from "@/components/animations/FadeIn";
import { TierBadge } from "@/components/common/TierBadge";
import { REGISTRATION_BOND, TIMING, TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type RegistrationStep = "connect" | "info" | "confirm" | "pending" | "success";

export default function RegisterPage() {
  const [step, setStep] = useState<RegistrationStep>("connect");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0 ETH");

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    // Simulate wallet connection (demo mode)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a random demo wallet address
    const randomAddr = "0x" + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    const shortAddr = `${randomAddr.slice(0, 6)}...${randomAddr.slice(-4)}`;
    
    setWalletAddress(shortAddr);
    setWalletBalance("1.234 ETH");
    setIsConnecting(false);
    setStep("info");
  };

  const handleRegister = () => {
    setStep("pending");
    // Simulate transaction
    setTimeout(() => {
      setStep("success");
    }, 3000);
  };

  const benefits = [
    {
      icon: Shield,
      title: "Refundable Bond",
      description: "Your 0.001 ETH bond can be withdrawn after the 30-day cooldown period.",
    },
    {
      icon: Clock,
      title: "24-Hour Activation",
      description: "Your reputation activates 24 hours after registration to prevent gaming.",
    },
    {
      icon: CheckCircle2,
      title: "Keep Benefits",
      description: "Even after withdrawing your bond, you keep your accumulated reputation.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Register Your Wallet
          </h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Join the reputation system and start earning lower fees on every swap
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Card */}
        <div className="lg:col-span-3">
          <FadeIn delay={0.1}>
            <Card variant="glow" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/5" />
              
              <div className="relative p-8">
                {step === "connect" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    {/* Wallet Icon */}
                    <div className="flex justify-center mb-8">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-300/20 to-brand-600/20 flex items-center justify-center border border-brand-500/30">
                          <Wallet className="w-12 h-12 text-brand-400" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-brand-500/10 blur-xl" />
                      </div>
                    </div>

                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-foreground-secondary mb-8 max-w-sm mx-auto">
                      Connect your Ethereum wallet to register and start earning lower fees
                    </p>

                    {/* Connect Button */}
                    <Button
                      variant="hero"
                      size="xl"
                      className="w-full mb-4"
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-5 w-5" />
                          Connect Wallet (Demo)
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-foreground-tertiary">
                      This is a demo. No real wallet connection required.
                    </p>
                  </motion.div>
                )}

                {step === "info" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* Animated Coin */}
                    <div className="flex justify-center mb-8">
                      <motion.div
                        animate={{ rotateY: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="relative"
                      >
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-300 to-brand-600 flex items-center justify-center shadow-glow">
                          <span className="font-display text-3xl font-bold text-primary-foreground">Ξ</span>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl" />
                      </motion.div>
                    </div>

                    {/* Bond Amount */}
                    <div className="text-center mb-8">
                      <p className="text-foreground-secondary mb-2">Registration Bond</p>
                      <p className="font-display text-4xl font-bold text-foreground">
                        {REGISTRATION_BOND.amount} ETH
                      </p>
                      <p className="text-foreground-tertiary text-sm mt-1">≈ $3.50 USD</p>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-4 mb-8">
                      {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 flex-shrink-0">
                            <benefit.icon className="h-5 w-5 text-brand-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{benefit.title}</h4>
                            <p className="text-sm text-foreground-tertiary">{benefit.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-3 mb-6 p-4 rounded-lg bg-white/5">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        className="mt-1"
                      />
                      <label htmlFor="terms" className="text-sm text-foreground-secondary cursor-pointer">
                        I understand that my bond will be locked for 30 days before I can withdraw.
                        I also understand that my reputation will take 24 hours to activate.
                      </label>
                    </div>

                    {/* Register Button */}
                    <Button
                      variant="hero"
                      size="xl"
                      className="w-full"
                      disabled={!termsAccepted}
                      onClick={() => setStep("confirm")}
                    >
                      Continue to Register
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}

                {step === "confirm" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-center mb-8">
                      <AlertCircle className="h-16 w-16 text-warning mx-auto mb-4" />
                      <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                        Confirm Registration
                      </h3>
                      <p className="text-foreground-secondary">
                        You are about to send {REGISTRATION_BOND.amount} ETH to register your wallet.
                      </p>
                    </div>

                    <div className="space-y-4 mb-8 p-4 rounded-lg bg-white/5">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">From</span>
                        <span className="font-mono text-foreground">{walletAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Amount</span>
                        <span className="font-medium text-foreground">{REGISTRATION_BOND.amount} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">Estimated Gas</span>
                        <span className="text-foreground">~0.0003 ETH</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="flex-1"
                        onClick={() => setStep("info")}
                      >
                        Back
                      </Button>
                      <Button
                        variant="hero"
                        size="lg"
                        className="flex-1"
                        onClick={handleRegister}
                      >
                        Confirm & Register
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === "pending" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <Loader2 className="h-20 w-20 text-brand-500 animate-spin" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                      Processing Registration
                    </h3>
                    <p className="text-foreground-secondary mb-4">
                      Please confirm the transaction in your wallet
                    </p>
                    <p className="text-sm text-foreground-tertiary">
                      This may take a few moments...
                    </p>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full bg-success/20 animate-pulse" />
                      <div className="absolute inset-2 rounded-full bg-success/30" />
                      <CheckCircle2 className="absolute inset-0 m-auto h-12 w-12 text-success" />
                    </div>
                    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                      Registration Successful!
                    </h3>
                    <p className="text-foreground-secondary mb-6">
                      Your wallet is now registered. Your reputation will activate in 24 hours.
                    </p>

                    {/* Transaction Hash */}
                    <div className="p-4 rounded-lg bg-white/5 mb-6">
                      <p className="text-sm text-foreground-tertiary mb-1">Transaction Hash</p>
                      <a
                        href="#"
                        className="inline-flex items-center gap-2 font-mono text-sm text-brand-400 hover:text-brand-300"
                      >
                        0x1234...abcd
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    <Link to="/dashboard">
                      <Button variant="hero" size="lg" className="w-full">
                        Go to Dashboard
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </Card>
          </FadeIn>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Info */}
          <FadeIn delay={0.2}>
            <Card variant="glass" padding="default">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                  <Wallet className="h-6 w-6 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground-tertiary">
                    {walletAddress ? "Connected Wallet" : "Wallet Status"}
                  </p>
                  <p className="font-mono font-medium text-foreground">
                    {walletAddress || "Not connected"}
                  </p>
                </div>
              </div>
              {walletAddress && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-foreground-secondary">Balance</span>
                  <span className="font-medium text-foreground">{walletBalance}</span>
                </div>
              )}
            </Card>
          </FadeIn>

          {/* Tier Preview */}
          <FadeIn delay={0.3}>
            <Card variant="glass" padding="default">
              <h4 className="font-display font-semibold text-foreground mb-4">
                Your Starting Tier
              </h4>
              <div className="flex items-center gap-4 mb-4">
                <TierBadge tier={1} size="lg" />
                <div>
                  <p className="font-medium text-foreground">Tier 1: Starter</p>
                  <p className="text-sm text-foreground-tertiary">0.30% fee rate</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-foreground-secondary">
                  <span>Tier 2 in</span>
                  <span>30 days</span>
                </div>
                <div className="flex justify-between text-foreground-secondary">
                  <span>Tier 3 in</span>
                  <span>90 days</span>
                </div>
                <div className="flex justify-between text-foreground-secondary">
                  <span>Tier 4 in</span>
                  <span>180 days</span>
                </div>
              </div>
            </Card>
          </FadeIn>

          {/* Network Info */}
          <FadeIn delay={0.4}>
            <Card variant="glass" padding="default">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
                <span className="text-foreground-secondary">Sepolia Testnet</span>
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
