import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/FadeIn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/common/TierBadge";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Timer,
  Coins,
  Info,
  ExternalLink,
} from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Link } from "react-router-dom";
import { REGISTRATION_BOND, TIMING, TIERS } from "@/lib/constants";
import { useUserReputation, useWithdrawBond } from "@/hooks/useReputation";
import { cn } from "@/lib/utils";

function CooldownProgress({
  registrationDate,
}: {
  registrationDate: Date | null;
}) {
  const cooldownDays = TIMING.cooldownPeriod / (24 * 60 * 60);
  const daysPassed = registrationDate
    ? Math.floor(
        (Date.now() - registrationDate.getTime()) / (24 * 60 * 60 * 1000)
      )
    : 0;
  const progress = Math.min((daysPassed / cooldownDays) * 100, 100);
  const daysRemaining = Math.max(cooldownDays - daysPassed, 0);
  const isComplete = daysRemaining === 0;

  return (
    <Card variant="glass" padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-5 w-5 text-brand-500" />
        <h3 className="font-display text-lg font-semibold text-foreground">
          Cooldown Period
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">Progress</span>
          <span
            className={cn(
              "font-medium",
              isComplete ? "text-success" : "text-foreground"
            )}
          >
            {daysPassed} / {cooldownDays} days
          </span>
        </div>

        <div className="relative">
          <Progress value={progress} className="h-2" />
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1"
            >
              <CheckCircle2 className="h-4 w-4 text-success" />
            </motion.div>
          )}
        </div>

        {isComplete ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">
              Cooldown complete - ready to withdraw
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <Clock className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning font-medium">
              {daysRemaining} days remaining
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

function WithdrawConfirmation({
  onConfirm,
  onCancel,
  ageDays,
  error,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  ageDays: number;
  error: Error | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Confirm Withdrawal
        </h3>
        <p className="text-foreground-secondary text-sm">
          Are you sure you want to withdraw your bond?
        </p>
      </div>

      <Card variant="glass" padding="default" className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">Bond Amount</span>
          <span className="font-medium text-foreground">
            {REGISTRATION_BOND.amount} ETH
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-foreground-secondary">Reputation Age</span>
          <span className="font-medium text-foreground">
            {Math.floor(ageDays)} days
          </span>
        </div>
      </Card>

      <div className="p-4 rounded-lg bg-info/10 border border-info/20">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-info flex-shrink-0" />
          <p className="text-sm text-foreground-secondary">
            <span className="text-info font-medium">Good news!</span> Your
            reputation age will be preserved. If you re-register later, you'll
            continue from {Math.floor(ageDays)} days.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error.message.includes("CooldownNotComplete")
            ? "Cooldown period is not yet complete"
            : error.message.includes("BondAlreadyWithdrawn")
              ? "Bond has already been withdrawn"
              : "Transaction failed. Please try again."}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="brand" className="flex-1" onClick={onConfirm}>
          Confirm Withdrawal
        </Button>
      </div>
    </motion.div>
  );
}

function WithdrawSuccess({ hash }: { hash: `0x${string}` | undefined }) {
  const rep = useUserReputation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="h-10 w-10 text-success" />
      </motion.div>

      <h3 className="font-display text-2xl font-bold text-foreground mb-2">
        Withdrawal Complete
      </h3>
      <p className="text-foreground-secondary mb-6">
        Your bond of {REGISTRATION_BOND.amount} ETH has been returned to your
        wallet
      </p>

      <div className="p-4 rounded-lg bg-brand-500/10 border border-brand-500/20 mb-6">
        <p className="text-sm text-foreground-secondary">
          Your reputation age of{" "}
          <span className="text-brand-400 font-semibold">
            {Math.floor(rep.ageDays)} days
          </span>{" "}
          has been saved. Re-register anytime to continue where you left off.
        </p>
      </div>

      {hash && (
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary" className="gap-2">
            View Transaction
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      )}
    </motion.div>
  );
}

export default function WithdrawPage() {
  const { isConnected } = useAccount();
  const rep = useUserReputation();
  const {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  } = useWithdrawBond();
  const [step, setStep] = useState<"overview" | "confirm" | "pending" | "success">(
    "overview"
  );

  useEffect(() => {
    if (isPending || isConfirming) setStep("pending");
  }, [isPending, isConfirming]);

  useEffect(() => {
    if (isSuccess) setStep("success");
  }, [isSuccess]);

  if (!isConnected) {
    return (
      <div className="min-h-screen py-8 max-w-4xl mx-auto text-center py-16">
        <Wallet className="h-16 w-16 text-brand-400 mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Connect Your Wallet
        </h1>
        <p className="text-lg text-foreground-secondary mb-8">
          Connect your wallet to manage your bond
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (!rep.isRegistered) {
    return (
      <div className="min-h-screen py-8 max-w-4xl mx-auto text-center py-16">
        <Shield className="h-16 w-16 text-brand-400 mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Not Registered
        </h1>
        <p className="text-lg text-foreground-secondary mb-8">
          You need to register first before you can withdraw a bond
        </p>
        <Link to="/register">
          <Button variant="hero" size="lg">Register Now</Button>
        </Link>
      </div>
    );
  }

  if (rep.bondWithdrawn && step !== "success") {
    return (
      <div className="min-h-screen py-8 max-w-4xl mx-auto text-center py-16">
        <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Bond Already Withdrawn
        </h1>
        <p className="text-lg text-foreground-secondary mb-8">
          Your bond has already been withdrawn. Your reputation of{" "}
          {Math.floor(rep.ageDays)} days is preserved.
        </p>
        <Link to="/dashboard">
          <Button variant="hero" size="lg">
            Go to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }

  const cooldownDays = TIMING.cooldownPeriod / (24 * 60 * 60);
  const daysPassed = rep.registrationDate
    ? Math.floor(
        (Date.now() - rep.registrationDate.getTime()) / (24 * 60 * 60 * 1000)
      )
    : 0;
  const cooldownComplete = daysPassed >= cooldownDays;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
                <Wallet className="h-5 w-5 text-brand-500" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Withdraw Bond
              </h1>
            </div>
            <p className="text-foreground-secondary">
              Reclaim your registration bond while preserving your reputation
            </p>
          </div>
        </FadeIn>

        <AnimatePresence mode="wait">
          {step === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StaggerContainer className="space-y-6">
                  <StaggerItem>
                    <Card variant="glass" padding="lg">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="h-5 w-5 text-brand-500" />
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          Your Bond
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-3xl font-display font-bold text-foreground">
                            {REGISTRATION_BOND.amount} ETH
                          </p>
                          <p className="text-foreground-secondary text-sm">
                            Refundable bond
                          </p>
                        </div>
                        <div className="h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                          <Coins className="h-8 w-8 text-brand-500" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground-secondary">
                            Current Tier
                          </span>
                          <TierBadge tier={rep.currentTier} size="sm" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground-secondary">
                            Reputation Age
                          </span>
                          <span className="font-medium text-foreground">
                            {Math.floor(rep.ageDays)} days
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground-secondary">
                            Registered
                          </span>
                          <span className="font-medium text-foreground">
                            {rep.registrationDate
                              ? rep.registrationDate.toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </StaggerItem>

                  <StaggerItem>
                    <CooldownProgress
                      registrationDate={rep.registrationDate}
                    />
                  </StaggerItem>
                </StaggerContainer>

                <StaggerContainer className="space-y-6">
                  <StaggerItem>
                    <Card variant="glow" padding="lg">
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                            {cooldownComplete
                              ? "Ready to Withdraw"
                              : "Cooldown In Progress"}
                          </h3>
                          <p className="text-foreground-secondary text-sm">
                            {cooldownComplete
                              ? "Your cooldown period is complete. You can now withdraw your bond."
                              : "Please wait for the cooldown period to complete."}
                          </p>
                        </div>

                        <div className="space-y-3 p-4 rounded-lg bg-background-secondary">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-foreground-secondary">
                              Bond will be returned to your wallet
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-foreground-secondary">
                              Reputation age is preserved
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="text-foreground-secondary">
                              Can re-register anytime
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="brand"
                          size="lg"
                          className="w-full group"
                          disabled={!cooldownComplete}
                          onClick={() => setStep("confirm")}
                        >
                          {cooldownComplete
                            ? `Withdraw ${REGISTRATION_BOND.amount} ETH`
                            : "Cooldown Not Complete"}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </div>
                    </Card>
                  </StaggerItem>

                  <StaggerItem>
                    <Card variant="glass" padding="default">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 text-brand-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-foreground-secondary">
                            <span className="font-medium text-foreground">
                              Note:
                            </span>{" "}
                            After withdrawal, you'll lose access to discounted
                            fees until you re-register. Your reputation age will
                            be saved and restored upon re-registration.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </StaggerItem>
                </StaggerContainer>
              </div>
            </motion.div>
          )}

          {step === "confirm" && (
            <Card variant="glass" padding="lg" className="max-w-md mx-auto">
              <WithdrawConfirmation
                onConfirm={() => withdraw()}
                onCancel={() => setStep("overview")}
                ageDays={rep.ageDays}
                error={error}
              />
            </Card>
          )}

          {step === "pending" && (
            <Card variant="glass" padding="lg" className="max-w-md mx-auto">
              <div className="text-center py-12">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="animate-spin h-20 w-20 border-2 border-brand-500 border-t-transparent rounded-full" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                  {isPending ? "Confirm in Wallet" : "Processing Withdrawal"}
                </h3>
                <p className="text-foreground-secondary">
                  {isPending
                    ? "Please confirm the transaction in your wallet"
                    : "Waiting for transaction confirmation..."}
                </p>
                {hash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-sm text-brand-400 hover:text-brand-300"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </Card>
          )}

          {step === "success" && (
            <Card variant="glass" padding="lg" className="max-w-md mx-auto">
              <WithdrawSuccess hash={hash} />
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
