import { cn } from "@/lib/utils";
import { TIERS } from "@/lib/constants";
import { Award, Crown, Shield, Star } from "lucide-react";

interface TierBadgeProps {
  tier: 1 | 2 | 3 | 4;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

export function TierBadge({
  tier,
  size = "md",
  showLabel = false,
  className,
  animated = false,
}: TierBadgeProps) {
  const tierConfig = TIERS[tier];

  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-24 w-24",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const TierIcon = {
    1: Shield,
    2: Award,
    3: Star,
    4: Crown,
  }[tier];

  const tierStyles = {
    1: "bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-slate-500/25",
    2: "bg-gradient-to-br from-sky-400 to-sky-500 text-white shadow-sky-500/30",
    3: "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-emerald-500/30",
    4: "bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-amber-500/35",
  }[tier];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl shadow-lg",
          sizes[size],
          tierStyles,
          animated && "animate-float"
        )}
      >
        <TierIcon className={iconSizes[size]} />
        
        {/* Glow ring for tier 4 */}
        {tier === 4 && (
          <div className="absolute inset-0 rounded-xl bg-amber-400/30 blur-md -z-10 animate-pulse" />
        )}
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <span className={cn("font-display font-semibold", textSizes[size])}>
            Tier {tier}
          </span>
          <span className={cn("text-foreground-secondary", size === "sm" ? "text-xs" : "text-sm")}>
            {tierConfig.name}
          </span>
        </div>
      )}
    </div>
  );
}

interface TierBadgeRowProps {
  currentTier: 1 | 2 | 3 | 4;
  className?: string;
}

export function TierBadgeRow({ currentTier, className }: TierBadgeRowProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {([1, 2, 3, 4] as const).map((tier) => (
        <div
          key={tier}
          className={cn(
            "relative transition-all duration-300",
            tier <= currentTier ? "opacity-100 scale-100" : "opacity-40 scale-90"
          )}
        >
          <TierBadge tier={tier} size="sm" />
          {tier === currentTier && (
            <div className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-brand-600" />
          )}
        </div>
      ))}
    </div>
  );
}
