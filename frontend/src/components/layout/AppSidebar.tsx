import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Award,
  Calculator,
  Wallet,
  BarChart3,
  History,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Logo } from "@/components/common/Logo";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Swap", href: "/swap", icon: ArrowDownUp },
  { name: "Reputation", href: "/reputation", icon: Award },
  { name: "Fees", href: "/fees", icon: Calculator },
  { name: "Withdraw", href: "/withdraw", icon: Wallet },
  { name: "History", href: "/history", icon: History },
  { name: "Statistics", href: "/stats", icon: BarChart3 },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { address, isConnected } = useAccount();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border bg-sidebar",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between px-4">
        <Link to="/">
          <Logo size="md" showText={!collapsed} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-500/10 text-brand-600"
                  : "text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
              )}
            >
              <link.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-brand-600")} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {link.name}
                </motion.span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 h-8 w-1 rounded-r-full bg-brand-600"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Wallet Section */}
      <div className="border-t border-border p-4">
        {!collapsed ? (
          isConnected ? (
            <div className="rounded-xl bg-background-secondary border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15">
                  <Wallet className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {shortAddress}
                  </p>
                  <p className="text-xs text-foreground-tertiary">
                    Sepolia Testnet
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ConnectButton
              chainStatus="none"
              showBalance={false}
              accountStatus="address"
            />
          )
        ) : (
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15">
              <Wallet className="h-5 w-5 text-brand-600" />
            </div>
          </div>
        )}
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground-secondary hover:text-foreground transition-colors shadow-md"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  );
}
