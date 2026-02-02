import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/FadeIn";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/animations/CountUp";
import { TierBadge } from "@/components/common/TierBadge";
import { 
  BarChart3, 
  Users, 
  Coins, 
  TrendingDown, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { TIERS } from "@/lib/constants";

// Mock data for charts
const volumeData = [
  { name: "Jan", volume: 4.2, savings: 0.8 },
  { name: "Feb", volume: 5.8, savings: 1.2 },
  { name: "Mar", volume: 7.1, savings: 1.6 },
  { name: "Apr", volume: 6.4, savings: 1.4 },
  { name: "May", volume: 8.9, savings: 2.1 },
  { name: "Jun", volume: 11.2, savings: 2.8 },
  { name: "Jul", volume: 14.6, savings: 3.6 },
];

const tierDistribution = [
  { name: "Tier 1", value: 4521, color: "hsl(220, 10%, 50%)" },
  { name: "Tier 2", value: 3842, color: "hsl(186, 76%, 45%)" },
  { name: "Tier 3", value: 2891, color: "hsl(265, 55%, 55%)" },
  { name: "Tier 4", value: 1593, color: "hsl(43, 96%, 56%)" },
];

const activityData = [
  { day: "Mon", registrations: 42, withdrawals: 8 },
  { day: "Tue", registrations: 56, withdrawals: 12 },
  { day: "Wed", registrations: 38, withdrawals: 6 },
  { day: "Thu", registrations: 71, withdrawals: 15 },
  { day: "Fri", registrations: 64, withdrawals: 9 },
  { day: "Sat", registrations: 45, withdrawals: 7 },
  { day: "Sun", registrations: 52, withdrawals: 11 },
];

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  prefix = "", 
  suffix = "", 
  decimals = 0,
  change,
  changeLabel 
}: { 
  icon: React.ElementType;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change?: number;
  changeLabel?: string;
}) {
  const isPositive = change && change > 0;
  
  return (
    <Card variant="glass" padding="lg" className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
          <Icon className="h-5 w-5 text-brand-500" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-success" : "text-destructive"}`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      
      <p className="text-3xl font-display font-bold text-foreground mb-1">
        <CountUp end={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
      <p className="text-sm text-foreground-secondary">{label}</p>
      {changeLabel && (
        <p className="text-xs text-foreground-tertiary mt-1">{changeLabel}</p>
      )}
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="glass-card p-3 text-sm">
      <p className="font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-foreground-secondary">
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const totalUsers = tierDistribution.reduce((sum, t) => sum + t.value, 0);

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
              Real-time metrics and analytics for the Reputation Hook
            </p>
          </div>
        </FadeIn>

        {/* Key Metrics */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StaggerItem>
            <StatCard 
              icon={Users} 
              label="Total Users" 
              value={12847} 
              suffix="+"
              change={12.5}
              changeLabel="vs last month"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard 
              icon={Coins} 
              label="Total Bonded" 
              value={156.8} 
              suffix=" ETH"
              decimals={1}
              change={8.3}
              changeLabel="vs last month"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard 
              icon={TrendingDown} 
              label="Fee Savings" 
              value={2.4}
              prefix="$" 
              suffix="M"
              decimals={1}
              change={24.1}
              changeLabel="vs last month"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard 
              icon={Activity} 
              label="Avg. Discount" 
              value={42} 
              suffix="%"
              change={3.2}
              changeLabel="vs last month"
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Volume Chart */}
          <FadeIn delay={0.2} className="lg:col-span-2">
            <Card variant="glass" padding="lg">
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Volume & Savings Over Time
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeData}>
                    <defs>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(43, 96%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(43, 96%, 50%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(240, 5%, 64%)" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(240, 5%, 64%)" 
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `$${value}M`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      name="Volume ($M)"
                      stroke="hsl(43, 96%, 50%)"
                      fillOpacity={1}
                      fill="url(#volumeGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      name="Savings ($M)"
                      stroke="hsl(142, 71%, 45%)"
                      fillOpacity={1}
                      fill="url(#savingsGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </FadeIn>

          {/* Tier Distribution */}
          <FadeIn delay={0.3}>
            <Card variant="glass" padding="lg">
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Tier Distribution
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {([1, 2, 3, 4] as const).map((tier) => {
                  const data = tierDistribution[tier - 1];
                  const percent = ((data.value / totalUsers) * 100).toFixed(1);
                  return (
                    <div key={tier} className="flex items-center justify-between p-2 rounded-lg bg-background-secondary">
                      <TierBadge tier={tier} size="sm" />
                      <span className="text-sm text-foreground-secondary">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </FadeIn>
        </div>

        {/* Activity Chart */}
        <FadeIn delay={0.4}>
          <Card variant="glass" padding="lg">
            <h3 className="font-display text-lg font-semibold text-foreground mb-6">
              Weekly Activity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(240, 5%, 64%)" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(240, 5%, 64%)" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: "20px" }}
                    formatter={(value) => <span className="text-foreground-secondary text-sm">{value}</span>}
                  />
                  <Bar 
                    dataKey="registrations" 
                    name="Registrations"
                    fill="hsl(43, 96%, 50%)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="withdrawals" 
                    name="Withdrawals"
                    fill="hsl(240, 5%, 40%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </FadeIn>

        {/* Tier Stats */}
        <FadeIn delay={0.5}>
          <div className="mt-8">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">
              Tier Statistics
            </h3>
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {([1, 2, 3, 4] as const).map((tier) => {
                const config = TIERS[tier];
                const data = tierDistribution[tier - 1];
                return (
                  <StaggerItem key={tier}>
                    <Card 
                      variant={`tier${tier}` as any} 
                      padding="lg"
                      className="text-center"
                    >
                      <TierBadge tier={tier} size="lg" className="justify-center mb-4" />
                      <p className="text-3xl font-display font-bold text-foreground mb-1">
                        {data.value.toLocaleString()}
                      </p>
                      <p className="text-sm text-foreground-secondary mb-4">users</p>
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
