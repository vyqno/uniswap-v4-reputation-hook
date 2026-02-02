import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, size = "md", showText = true, ...props }, ref) => {
    const sizes = {
      sm: "h-6 w-6",
      md: "h-8 w-8",
      lg: "h-10 w-10",
    };

    const textSizes = {
      sm: "text-lg",
      md: "text-xl",
      lg: "text-2xl",
    };

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        {/* Unicorn Logo inspired by Uniswap */}
        <div className={cn("relative", sizes[size])}>
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Background Circle */}
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="url(#logo-gradient)"
              className="drop-shadow-lg"
            />
            
            {/* Unicorn Shape - Simplified */}
            <path
              d="M12 28C12 28 14 24 16 22C18 20 20 18 22 18C24 18 26 20 27 22C28 24 28 26 28 28"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M20 18L22 10L24 14"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="18" cy="20" r="1.5" fill="white" />
            
            {/* Star accent */}
            <circle cx="28" cy="12" r="2" fill="white" opacity="0.8" />
            
            <defs>
              <linearGradient
                id="logo-gradient"
                x1="0"
                y1="0"
                x2="40"
                y2="40"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(45, 100%, 60%)" />
                <stop offset="1" stopColor="hsl(38, 92%, 48%)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-md -z-10" />
        </div>

        {showText && (
          <span
            className={cn(
              "font-display font-bold text-gradient",
              textSizes[size]
            )}
          >
            Reputation
          </span>
        )}
      </div>
    );
  }
);

Logo.displayName = "Logo";
