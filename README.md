# 🦄 Uniswap V4 Reputation Fee Hook

<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-0.8.26-blue)
![Foundry](https://img.shields.io/badge/Foundry-Latest-orange)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Tests](https://img.shields.io/badge/Tests-105%20Passing-brightgreen)
![License](https://img.shields.io/badge/License-MIT-green)

**An Uniswap V4 Hook that rewards loyal users with dynamic fee discounts based on on-chain reputation.**

[Features](#-features) • [Architecture](#-architecture) • [Frontend](#-frontend) • [Installation](#-installation) • [Testing](#-testing) • [Deployment](#-deployment) • [Gas Report](#-gas-report)

</div>

---

## 📖 Overview

The **Reputation Fee Hook** is a Uniswap V4 hook that creates a reputation-based fee system. Users who bond ETH and maintain their registration over time receive progressively lower swap fees, rewarding long-term participation and reducing mercenary capital behavior.

### How It Works

```
User Bonds ETH → Time Passes → Reputation Age Increases → Swap Fees Decrease
    (0.001 ETH)     (Days)         (Tier Upgrades)        (Up to 75% off!)
```

---

## ✨ Features

### 🎯 Dynamic Fee Tiers

| Tier | Reputation Age | Swap Fee | Discount |
|:----:|:--------------:|:--------:|:--------:|
| 🥉 **Tier 1** | 0-30 days | 0.30% | None |
| 🥈 **Tier 2** | 30-90 days | 0.225% | 25% off |
| 🥇 **Tier 3** | 90-180 days | 0.15% | 50% off |
| 💎 **Tier 4** | 180+ days | 0.075% | 75% off |

### 🔒 Security Features

- **UUPS Upgradeable**: Registry can be upgraded without losing user data
- **ERC-7201 Namespaced Storage**: Prevents storage collisions during upgrades
- **Transient Reentrancy Guard**: Gas-efficient protection against reentrancy
- **Pausable**: Circuit breaker for emergency situations
- **Ownable**: Admin controls for system management

### 💰 Bond System

- **Registration Bond**: 0.001 ETH (configurable)
- **Activation Delay**: 24 hours after registration
- **Cooldown Period**: 30 days before bond withdrawal
- **Refundable**: Full bond returned after cooldown

---

## 🏗 Architecture

### System Overview

The Reputation Fee Hook system consists of two main contracts:

1. **ReputationRegistry**: Manages user registrations, bonds, and reputation tiers
2. **ReputationFeeHook**: Integrates with Uniswap V4 to apply dynamic fees

### Contract Interactions

- Users register by bonding ETH to the Registry
- The Registry tracks registration time and manages bond withdrawals
- When swaps occur, the Hook queries the Registry for user reputation
- Fee multipliers are applied based on reputation age

---

## 📁 Project Structure

```
uniswap-v4-liquidity-vault/
├── src/
│   ├── ReputationRegistry.sol      # Core registry (UUPS upgradeable)
│   ├── ReputationFeeHook.sol       # V4 Hook implementation
│   ├── interfaces/
│   │   └── IReputationRegistry.sol # Interface for registry
│   └── mocks/
│       ├── MockUSDC.sol            # Test USDC token
│       └── MockWETH.sol            # Test WETH token
├── script/
│   ├── DeployComplete.s.sol        # Master deployment script
│   ├── DeploySwapRouter.s.sol      # Swap router deployment
│   ├── TestFullFlow.s.sol          # Full flow simulation
│   ├── Interactions.s.sol          # CLI interaction tools
│   └── helpers/
│       ├── ChainConfig.sol         # Network configurations
│       └── DevOpsTools.sol         # Deployment utilities
├── test/
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   ├── fuzz/                       # Fuzz tests
│   ├── invariant/                  # Invariant tests
│   ├── fork/                       # Fork tests
│   └── helpers/                    # Test utilities
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/             # Header, Sidebar, Footer
│   │   │   ├── common/             # Logo, TierBadge
│   │   │   ├── animations/         # FadeIn, CountUp, etc.
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useReputation.ts    # On-chain reputation reads/writes
│   │   │   ├── useSwap.ts          # Token swap execution
│   │   │   ├── usePoolState.ts     # Pool slot0/liquidity reads
│   │   │   └── useEthPrice.ts      # CoinGecko ETH price feed
│   │   ├── lib/
│   │   │   ├── abi/                # Contract ABIs
│   │   │   ├── constants.ts        # Addresses, tiers, config
│   │   │   └── wagmi.ts            # Wagmi + RainbowKit config
│   │   ├── pages/                  # All route pages
│   │   ├── App.tsx                 # Router & layout
│   │   └── main.tsx                # Entry point with providers
│   └── package.json
└── deployments/
    └── sepolia.json               # Deployed addresses
```

---

## 🖥 Frontend

A full-featured React dashboard that connects directly to the deployed smart contracts on Sepolia via **wagmi** + **viem**, with **RainbowKit** for wallet connection.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Animations** | Framer Motion |
| **Web3** | wagmi v2 + viem v2 |
| **Wallet** | RainbowKit v2 |
| **State** | TanStack React Query |

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | Marketing page with tier breakdown and CTA |
| **How It Works** | `/how-it-works` | Step-by-step explanation of the reputation system |
| **FAQ** | `/faq` | Frequently asked questions |
| **Dashboard** | `/dashboard` | Live reputation stats, tier progress, fee savings |
| **Register** | `/register` | Bond 0.001 ETH to register on-chain |
| **Reputation** | `/reputation` | Detailed tier timeline and milestone tracker |
| **Fee Calculator** | `/fees` | Calculate fee savings per tier and swap volume |
| **Withdraw** | `/withdraw` | Withdraw bond after 30-day cooldown |
| **Swap** | `/swap` | Execute USDC/WETH swaps through the V4 pool with reputation-based fees |
| **Stats** | `/stats` | Protocol-wide stats (total registered, TVL, contract balances) |

### On-Chain Hooks

All page data is live from the blockchain — no mock data:

- **`useReputation`** — Reads registration status, reputation age, tier, fee quote, and bond state from `ReputationRegistry` and `ReputationFeeHook`
- **`useSwap`** — Executes token swaps through `PoolSwapTest`, handles approvals and WETH wrapping
- **`usePoolState`** — Reads pool slot0 (sqrtPriceX96, tick, fees) and liquidity directly from `PoolManager` via `extsload`
- **`useEthPrice`** — Fetches live ETH/USD price from CoinGecko with session-based caching

### Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app connects to Sepolia testnet. You need a wallet with Sepolia ETH to interact with the contracts.

---

## 🔧 Installation

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Make](https://www.gnu.org/software/make/)
- [Node.js](https://nodejs.org/) v18+ (for frontend)

### Setup

```bash
# Clone the repository
git clone https://github.com/vyqno/uniswap-v4-reputation-hook.git
cd uniswap-v4-reputation-hook

# Install smart contract dependencies
make install

# Configure environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY and RPC_URLs

# Install frontend dependencies
cd frontend && npm install
```

### Build

```bash
# Build contracts
make build

# Build frontend
cd frontend && npm run build
```

---

## 🧪 Testing

We use `make` commands to run our comprehensive test suite (105+ tests).

```bash
# Run all tests
make test

# Run specific suites
make test-unit
make test-integration
make test-fuzz
make test-invariant

# Run with gas report
make test-gas

# Generate coverage report
make coverage
```

---

## ⛽ Gas Report

### Core Function Costs

| Function | Min Gas | Avg Gas | Max Gas |
|----------|--------:|--------:|--------:|
| `register()` | 72,706 | 80,221 | 107,731 |
| `withdrawBond()` | 7,268 | 56,163 | 114,491 |
| `getReputationAge()` | 4,588 | 4,588 | 4,818 |
| `getFeeQuote()` | 26,141 | 36,307 | 68,348 |
| `beforeSwap()` | ~50,000 | ~55,000 | ~70,000 |

---

## 🚀 Deployment

### Deployed Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| **Registry Proxy** | `0xaC422CB41f699d145B463eC8D4742Fc56c4e88Fa` |
| **Fee Hook** | `0xb42c6cfF6FA476677cf56D88B4fD06B02E614080` |
| **Pool Manager** | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` |
| **Modify Liquidity Router** | `0x0C478023803a644c94c4CE1C1e7b9A087e411B0A` |
| **Swap Router (PoolSwapTest)** | `0xe4bd5fe7b7728c698ebdd57be9a9d1d7291f4972` |
| **USDC** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| **WETH** | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` |

### Deploy to Testnet

To deploy to Sepolia or Base Sepolia, ensure your `.env` is configured and run:

```bash
# Deploy to Sepolia
make deploy-sepolia

# Deploy to Base Sepolia
make deploy-base-sepolia
```

### Verify Contracts

Verification happens automatically with the deployment commands if explorer keys are set. To verify manually:

```bash
make verify-sepolia
# or
make verify-base
```

---

## 📜 Usage & Interaction

We provide extensive make commands to interact with deployed contracts.

> **Note**: Ensure `RPC_URL` and `PRIVATE_KEY` are set in your `.env`.

### 1. Register for Reputation
Deposit 0.001 ETH to start your reputation timer.

```bash
make interact-register
```

### 2. Check Reputation & Fees
View your current status and fee tier.

```bash
make interact-check
make interact-fee
```

### 3. Withdraw Bond
After 30 days cooldown, withdraw your bond.

```bash
make interact-withdraw
```

---

## 🔐 Security Considerations

### Audit Status

⚠️ **This code has NOT been audited.** Use at your own risk.

### Security Features

1. **Reentrancy Protection**: Uses OpenZeppelin's `ReentrancyGuardTransient`
2. **Access Control**: Owner-only admin functions
3. **Pausable**: Emergency circuit breaker
4. **Upgradeable**: UUPS pattern for bug fixes
5. **Storage Safety**: ERC-7201 namespaced storage

### Known Limitations

1. **Hook Address Dependency**: The hook must be deployed at a specific address with correct flags
2. **Single Pool Support**: Each hook instance is tied to one Pool Manager
3. **No Slashing**: Bonds cannot be slashed for malicious behavior (future feature)

---

## 🗺 Roadmap

- [x] Core Registry Contract
- [x] V4 Hook Implementation
- [x] Comprehensive Test Suite
- [x] Sepolia Deployment
- [x] Swap Router Deployment
- [x] Frontend Dashboard (React + TypeScript)
- [x] Wallet Integration (RainbowKit + wagmi)
- [x] Live On-Chain Data (no mock data)
- [x] Token Swap UI (USDC/WETH via V4 Pool)
- [ ] Base Mainnet Deployment
- [ ] Polygon Mainnet Deployment
- [ ] Governance Integration
- [ ] Multi-pool Support
- [ ] Slashing Mechanism

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Uniswap Labs](https://uniswap.org/) - V4 Core & Periphery
- [OpenZeppelin](https://openzeppelin.com/) - Security Contracts
- [Foundry](https://getfoundry.sh/) - Development Framework
- [Cyfrin](https://cyfrin.io/) - DevOps Tools

---

<div align="center">

**Built with ❤️ for the Uniswap Ecosystem**

</div>
