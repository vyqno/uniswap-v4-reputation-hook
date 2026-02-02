import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Wallet } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/dashboard") || 
                     location.pathname.startsWith("/register") ||
                     location.pathname.startsWith("/reputation") ||
                     location.pathname.startsWith("/fees") ||
                     location.pathname.startsWith("/withdraw") ||
                     location.pathname.startsWith("/stats");

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="relative z-10">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.marketing.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  location.pathname === link.href
                    ? "text-foreground"
                    : "text-foreground-secondary"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAppRoute ? (
              <Button variant="brand" size="default">
                <Wallet className="h-4 w-4" />
                0x1234...5678
              </Button>
            ) : (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="default">
                    Launch App
                  </Button>
                </Link>
                <Button variant="brand" size="default">
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden relative z-10 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </nav>
      </div>

      {/* Backdrop blur */}
      <div className="absolute inset-0 glass -z-10" />

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={mobileMenuOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, height: "auto" },
          closed: { opacity: 0, height: 0 },
        }}
        className="md:hidden overflow-hidden bg-background-secondary border-b border-border"
      >
        <div className="px-4 py-6 space-y-4">
          {NAV_LINKS.marketing.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block py-2 text-base font-medium transition-colors",
                location.pathname === link.href
                  ? "text-foreground"
                  : "text-foreground-secondary"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 space-y-3">
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="secondary" className="w-full">
                Launch App
              </Button>
            </Link>
            <Button variant="brand" className="w-full">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
