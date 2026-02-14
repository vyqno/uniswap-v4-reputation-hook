# Reputation Hook

Earn lower fees through loyalty on Uniswap V4. Register your wallet with a small bond and unlock up to 75% fee discounts on swaps. The longer you stay, the more you save.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Framer Motion** for animations
- **Zustand** for state management
- **React Router** for routing
- **React Query** for data fetching

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```sh
# Clone the repository
git clone https://github.com/HarshalJain-cs/serene-shores-design.git

# Navigate to the project directory
cd serene-shores-design

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/         # Route pages
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── stores/        # Zustand state stores
└── main.tsx       # Application entry point
```

## Deployment

Build the project for production:

```sh
npm run build
```

The output will be in the `dist/` directory, ready to be deployed to any static hosting provider (Vercel, Netlify, GitHub Pages, etc.).
