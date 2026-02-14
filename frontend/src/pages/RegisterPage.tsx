import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FadeIn, ScaleIn } from "@/components/animations/FadeIn";
import { TierBadge } from "@/components/common/TierBadge";
import { REGISTRATION_BOND, TIMING, TIERS } from "@/lib/constants";
import { useRegister, useIsRegistered } from "@/hooks/useReputation";
import { cn } from "@/lib/utils";

type RegistrationStep = "connect" | "info" | "confirm" | "pending" | "success";

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: alreadyRegistered } = useIsRegistered();
  const { register, hash, isPending, isConfirming, isSuccess, error } = useRegister();

  const [step, setStep] = useState<RegistrationStep>("connect");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Auto-advance steps based on wallet/tx state
  useEffect(() => {
    if (isConnected && step === "connect") {
      setStep("info");
    }
  }, [isConnected, step]);

  useEffect(() => {
    if (isPending || isConfirming) setStep("pending");
  }, [isPending, isConfirming]);

  useEffect(() => {
    if (isSuccess) setStep("success");
  }, [isSuccess]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const formattedBalance = balance
    ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ETH`
    : "0 ETH";

  const handleRegister = () => {
    register();
  };

  const benefits = [
    {
      icon: Shield,
      title: "Refundable Bond",
      description:
        "Your 0.001 ETH bond can be withdrawn after the 30-day cooldown period.",
    },
    {
      icon: Clock,
      title: "24-Hour Activation",
      description:
        "Your reputation activates 24 hours after registration to prevent gaming.",
    },
    {
      icon: CheckCircle2,
      title: "Keep Benefits",
      description:
        "Even after withdrawing your bond, you keep your accumulated reputation.",
    },
  ];

  // If already registered, show message
  if (alreadyRegistered && step !== "success") {
    return (
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="text-center py-16">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Already Registered
            </h1>
            <p className="text-lg text-foreground-secondary mb-8">
              Your wallet is already registered in the reputation system.
            </p>
            <Link to="/dashboard">
              <Button variant="hero" size="lg">
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    );
  }

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
                      Connect your Ethereum wallet to register and start earning
                      lower fees
                    </p>

                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  </motion.div>
                )}

                {step === "info" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex justify-center mb-8">
                      <motion.div
                        animate={{ rotateY: 360 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="relative"
                      >
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-300 to-brand-600 flex items-center justify-center shadow-glow">
                          <span className="font-display text-3xl font-bold text-primary-foreground">
                            E
                          </span>
                        </div>
                        <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl" />
                      </motion.div>
                    </div>

                    <div className="text-center mb-8">
                      <p className="text-foreground-secondary mb-2">
                        Registration Bond
                      </p>
                      <p className="font-display text-4xl font-bold text-foreground">
                        {REGISTRATION_BOND.amount} ETH
                      </p>
                      <p className="text-foreground-tertiary text-sm mt-1">
                        Refundable after 30-day cooldown
                      </p>
                    </div>

                    <div className="space-y-4 mb-8">
                      {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 flex-shrink-0">
                            <benefit.icon className="h-5 w-5 text-brand-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {benefit.title}
                            </h4>
                            <p className="text-sm text-foreground-tertiary">
                              {benefit.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-start gap-3 mb-6 p-4 rounded-lg bg-white/5">
                      <Checkbox
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) =>
                          setTermsAccepted(checked as boolean)
                        }
                        className="mt-1"
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-foreground-secondary cursor-pointer"
                      >
                        I understand that my bond will be locked for 30 days
                        before I can withdraw. I also understand that my
                        reputation will take 24 hours to activate.
                      </label>
                    </div>

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
                        You are about to send {REGISTRATION_BOND.amount} ETH to
                        register your wallet.
                      </p>
                    </div>

                    <div className="space-y-4 mb-8 p-4 rounded-lg bg-white/5">
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">From</span>
                        <span className="font-mono text-foreground">
                          {shortAddress}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">
                          Amount
                        </span>
                        <span className="font-medium text-foreground">
                          {REGISTRATION_BOND.amount} ETH
                        </span>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {error.message.includes("InsufficientBond")
                          ? "Insufficient ETH balance for bond"
                          : error.message.includes("AlreadyRegistered")
                            ? "This wallet is already registered"
                            : "Transaction failed. Please try again."}
                      </div>
                    )}

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
                      {isPending
                        ? "Confirm in Wallet"
                        : "Processing Registration"}
                    </h3>
                    <p className="text-foreground-secondary mb-4">
                      {isPending
                        ? "Please confirm the transaction in your wallet"
                        : "Waiting for transaction confirmation..."}
                    </p>
                    {hash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300"
                      >
                        View on Etherscan
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
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
                      Your wallet is now registered. Your reputation will
                      activate in 24 hours.
                    </p>

                    {hash && (
                      <div className="p-4 rounded-lg bg-white/5 mb-6">
                        <p className="text-sm text-foreground-tertiary mb-1">
                          Transaction Hash
                        </p>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-mono text-sm text-brand-400 hover:text-brand-300"
                        >
                          {`${hash.slice(0, 10)}...${hash.slice(-8)}`}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}

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
                    {isConnected ? "Connected Wallet" : "Wallet Status"}
                  </p>
                  <p className="font-mono font-medium text-foreground">
                    {shortAddress || "Not connected"}
                  </p>
                </div>
              </div>
              {isConnected && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-foreground-secondary">Balance</span>
                  <span className="font-medium text-foreground">
                    {formattedBalance}
                  </span>
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
                  <p className="font-medium text-foreground">
                    Tier 1: Starter
                  </p>
                  <p className="text-sm text-foreground-tertiary">
                    0.30% fee rate
                  </p>
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
                <span className="text-foreground-secondary">
                  Sepolia Testnet
                </span>
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
