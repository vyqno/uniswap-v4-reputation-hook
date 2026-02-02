import { Link } from "react-router-dom";
import { Logo } from "@/components/common/Logo";
import { SOCIAL_LINKS, NAV_LINKS } from "@/lib/constants";
import { Github, Twitter, MessageCircle, ExternalLink } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <Logo size="lg" />
              <p className="mt-4 text-foreground-secondary max-w-md">
                Earn lower trading fees through loyalty. The Uniswap V4 Reputation Hook
                rewards long-term users with up to 75% fee discounts.
              </p>
              
              {/* Social Links */}
              <div className="mt-6 flex items-center gap-4">
                <a
                  href={SOCIAL_LINKS.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 text-foreground-secondary hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href={SOCIAL_LINKS.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 text-foreground-secondary hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
                <a
                  href={SOCIAL_LINKS.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 text-foreground-secondary hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">
                Quick Links
              </h4>
              <ul className="space-y-3">
                {NAV_LINKS.marketing.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-foreground-secondary hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/dashboard"
                    className="text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4">
                Resources
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href={SOCIAL_LINKS.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    Documentation
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href={SOCIAL_LINKS.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <Link
                    to="/faq"
                    className="text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-foreground-tertiary">
              © {currentYear} Reputation Hook. Built on Uniswap V4.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/terms"
                className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
