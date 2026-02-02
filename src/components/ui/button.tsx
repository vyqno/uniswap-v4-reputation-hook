import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
        brand:
          "bg-gradient-to-r from-brand-500 to-brand-600 text-primary-foreground hover:from-brand-400 hover:to-brand-500 shadow-lg shadow-brand-500/30 btn-glow",
        secondary:
          "bg-white/10 text-foreground hover:bg-white/20 border border-white/10 hover:border-white/20",
        outline:
          "border-2 border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-primary-foreground",
        ghost:
          "text-foreground-secondary hover:text-foreground hover:bg-white/5",
        link:
          "text-brand-500 underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success:
          "bg-success text-success-foreground hover:bg-success/90",
        hero:
          "bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 text-primary-foreground font-bold shadow-xl shadow-brand-500/40 hover:shadow-brand-500/60 hover:scale-[1.02] active:scale-[0.98] animate-gradient",
        glass:
          "glass text-foreground hover:bg-white/10",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-14 rounded-xl px-8 text-base",
        xl: "h-16 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
