import { useEffect, useRef, useState } from "react";
import { useInView, motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function CountUp({
  end,
  start = 0,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  formatter,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hasStarted, setHasStarted] = useState(false);

  const spring = useSpring(start, {
    mass: 1,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) => {
    const value = Math.round(current * Math.pow(10, decimals)) / Math.pow(10, decimals);
    if (formatter) {
      return formatter(value);
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  });

  useEffect(() => {
    if (isInView && !hasStarted) {
      const timeout = setTimeout(() => {
        spring.set(end);
        setHasStarted(true);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, hasStarted, spring, end, delay]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

interface AnimatedNumberProps {
  value: number;
  className?: string;
  decimals?: number;
}

export function AnimatedNumber({ value, className, decimals = 0 }: AnimatedNumberProps) {
  const spring = useSpring(value, {
    mass: 1,
    stiffness: 75,
    damping: 15,
  });

  const display = useTransform(spring, (current) => {
    return Math.round(current * Math.pow(10, decimals)) / Math.pow(10, decimals);
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={cn("tabular-nums", className)}>{display}</motion.span>;
}
