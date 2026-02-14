import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/FadeIn";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/animations/CountUp";
import { TierBadge } from "@/components/common/TierBadge";
import {
  BarChart3,
  Users,
  Coins,
  Shield,
  Info,
} from "lucide-react";
import { TIERS, CONTRACTS } from "@/lib/constants";
import { useTotalRegistered, useRegistrationBond } from "@/hooks/useReputation";
import { formatEther } from "viem";
import { useBalance } from "wagmi";

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sublabel?: string;
}) {
  return (
    <Card variant="glass" padding="lg" className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
          <Icon className="h-5 w-5 text-brand-500" />
        </div>
      </div>

      <p className="text-3xl font-display font-bold text-foreground mb-1">
        <CountUp end={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="text-sm text-foreground-secondary">{label}</p>
      {sublabel && (
        <p className="text-xs text-foreground-tertiary mt-1">{sublabel}</p>
      )}
    </Card>
  );
}

export default function StatsPage() {
  const { data: totalRegisteredOnChain } = useTotalRegistered();
  const { data: bondAmountRaw } = useRegistrationBond();

  // Read the actual ETH balance of the registry contract (total bonded ETH held)
  const { data: registryBalance } = useBalance({
    address: CONTRACTS.sepolia.reputationRegistry as `0x${string}`,
  });

  const totalUsers = totalRegisteredOnChain ? Number(totalRegisteredOnChain) : 0;
  const bondAmount = bondAmountRaw ? parseFloat(formatEther(bondAmountRaw)) : 0.001;
  const totalBondedETH = registryBalance
    ? parseFloat(formatEther(registryBalance.value))
    : 0;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <FadeIn>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
                <BarChart3 className="h-5 w-5 text-brand-500" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Protocol Statistics
              </h1>
            </div>
            <p className="text-foreground-secondary">
              Live on-chain metrics from the Reputation Hook on Sepolia
            </p>
          </div>
        </FadeIn>

        {/* On-Chain Info Banner */}
        <FadeIn delay={0.05}>
          <div className="mb-6 p-4 rounded-lg bg-brand-500/5 border border-brand-500/10">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground-secondary">
                All metrics below are read directly from the deployed smart
                contracts on Sepolia testnet. No mock data.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Key Metrics */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StaggerItem>
            <StatCard
              icon={Users}
              label="Total Registered Users"
              value={totalUsers}
              suffix=""
              sublabel="On-chain from ReputationRegistry"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={Coins}
              label="ETH Held in Registry"
              value={totalBondedETH}
              suffix=" ETH"
              decimals={4}
              sublabel="Contract balance (bonds held)"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={Shield}
              label="Registration Bond"
              value={bondAmount}
              suffix=" ETH"
              decimals={3}
              sublabel="Per-user bond requirement"
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Contract Addresses */}
        <FadeIn delay={0.2}>
          <Card variant="glass" padding="lg" className="mb-8">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Deployed Contracts (Sepolia)
            </h3>
            <div className="space-y-3">
              {[
                { name: "ReputationRegistry (Proxy)", address: CONTRACTS.sepolia.reputationRegistry },
                { name: "ReputationFeeHook", address: CONTRACTS.sepolia.reputationFeeHook },
                { name: "PoolManager", address: CONTRACTS.sepolia.poolManager },
                { name: "USDC", address: CONTRACTS.sepolia.usdc },
                { name: "WETH", address: CONTRACTS.sepolia.weth },
              ].map((contract) => (
                <div key={contract.name} className="flex items-center justify-between p-3 rounded-lg bg-background-secondary">
                  <span className="text-sm text-foreground-secondary">{contract.name}</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${contract.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-brand-400 hover:text-brand-300 truncate max-w-[200px] sm:max-w-none"
                  >
                    {contract.address}
                  </a>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>

        {/* Tier Reference */}
        <FadeIn delay={0.3}>
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">
              Fee Tier Reference
            </h3>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {([1, 2, 3, 4] as const).map((tier) => {
                const config = TIERS[tier];
                return (
                  <StaggerItem key={tier}>
                    <Card
                      variant={`tier${tier}` as any}
                      padding="lg"
                      className="text-center"
                    >
                      <TierBadge tier={tier} size="lg" className="justify-center mb-4" />
                      <p className="text-lg font-display font-bold text-foreground mb-1">
                        {config.name}
                      </p>
                      <p className="text-sm text-foreground-secondary mb-4">
                        {config.minDays}+ days
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-foreground-tertiary">Fee Rate</span>
                          <span className="text-foreground">{config.fee}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground-tertiary">Discount</span>
                          <span className="text-brand-400">{config.discount}%</span>
                        </div>
                      </div>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
