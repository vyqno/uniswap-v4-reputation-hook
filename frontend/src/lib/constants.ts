// Uniswap V4 Reputation Hook - Constants

export const SITE_CONFIG = {
  name: "Reputation Hook",
  description: "Earn lower fees through loyalty on Uniswap V4",
  url: "https://reputation.hook.xyz",
};

// Contract Addresses (Sepolia Testnet)
export const CONTRACTS = {
  sepolia: {
    chainId: 11155111,
    reputationRegistry: "0xaC422CB41f699d145B463eC8D4742Fc56c4e88Fa" as const,
    reputationFeeHook: "0xb42c6cfF6FA476677cf56D88B4fD06B02E614080" as const,
    poolManager: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543" as const,
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const,
    weth: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as const,
  },
} as const;

// Tier Configuration
export const TIERS = {
  1: {
    name: "Starter",
    minDays: 0,
    fee: 0.30,
    discount: 0,
    color: "tier-1",
    description: "Welcome to the reputation system",
  },
  2: {
    name: "Bronze",
    minDays: 30,
    fee: 0.225,
    discount: 25,
    color: "tier-2",
    description: "25% fee reduction unlocked",
  },
  3: {
    name: "Silver",
    minDays: 90,
    fee: 0.15,
    discount: 50,
    color: "tier-3",
    description: "50% fee reduction - halfway there!",
  },
  4: {
    name: "Gold",
    minDays: 180,
    fee: 0.075,
    discount: 75,
    color: "tier-4",
    description: "Maximum 75% fee reduction",
  },
} as const;

// Registration Bond
export const REGISTRATION_BOND = {
  amount: "0.001",
  amountWei: "1000000000000000", // 0.001 ETH in wei
};

// Timing Constants
export const TIMING = {
  activationDelay: 24 * 60 * 60, // 24 hours in seconds
  cooldownPeriod: 30 * 24 * 60 * 60, // 30 days in seconds
};

// Navigation Links
export const NAV_LINKS = {
  marketing: [
    { name: "How It Works", href: "/how-it-works" },
    { name: "Tiers", href: "/#tiers" },
    { name: "FAQ", href: "/faq" },
  ],
  app: [
    { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { name: "Reputation", href: "/reputation", icon: "Award" },
    { name: "Fees", href: "/fees", icon: "Calculator" },
    { name: "Withdraw", href: "/withdraw", icon: "Wallet" },
    { name: "Stats", href: "/stats", icon: "BarChart3" },
  ],
} as const;

// Social Links
export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/uniswap",
  discord: "https://discord.gg/uniswap",
  github: "https://github.com/uniswap",
  docs: "https://docs.uniswap.org",
} as const;
