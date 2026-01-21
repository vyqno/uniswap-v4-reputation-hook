# ============================================================
# REPUTATION FEE HOOK - MAKEFILE
# ============================================================
# Comprehensive build, test, and deployment automation
# ============================================================

# Load environment variables
-include .env

# ============ CONFIGURATION ============

# Default network
NETWORK ?= anvil

# Foundry defaults
FOUNDRY_PROFILE ?= default

# Script paths
DEPLOY_SCRIPT := script/DeployComplete.s.sol
INTERACT_SCRIPT := script/Interactions.s.sol

# Verbosity levels: -v, -vv, -vvv, -vvvv
VERBOSITY ?= -vvv

# ============ PHONY TARGETS ============

.PHONY: all build test clean install update fmt lint snapshot coverage \
        anvil deploy-anvil deploy-sepolia deploy-mainnet \
        deploy-base deploy-polygon deploy-arbitrum \
        verify-sepolia verify-mainnet verify-base verify-polygon verify-arbitrum \
        interact-register interact-check interact-mint interact-health \
        help

# ============ DEFAULT TARGET ============

all: clean install build test

# ============ BUILD & COMPILE ============

## Build contracts
build:
	@echo "Building contracts..."
	forge build

## Build with production profile (via IR)
build-prod:
	@echo "Building with production profile..."
	FOUNDRY_PROFILE=production forge build

## Clean build artifacts
clean:
	@echo "Cleaning..."
	forge clean
	rm -rf cache out broadcast

## Install dependencies
install:
	@echo "Installing dependencies..."
	forge install

## Update dependencies
update:
	@echo "Updating dependencies..."
	forge update

# ============ CODE QUALITY ============

## Format code
fmt:
	@echo "Formatting code..."
	forge fmt

## Check formatting
fmt-check:
	@echo "Checking formatting..."
	forge fmt --check

## Lint with Slither (requires slither installed)
lint:
	@echo "Running Slither..."
	slither . --exclude-dependencies --exclude-informational

# ============ TESTING ============

## Run all tests
test:
	@echo "Running all tests..."
	forge test $(VERBOSITY)

## Run tests with gas report
test-gas:
	@echo "Running tests with gas report..."
	forge test --gas-report $(VERBOSITY)

## Run unit tests only
test-unit:
	@echo "Running unit tests..."
	forge test --match-path "test/unit/*" $(VERBOSITY)

## Run integration tests only
test-integration:
	@echo "Running integration tests..."
	forge test --match-path "test/integration/*" $(VERBOSITY)

## Run fuzz tests
test-fuzz:
	@echo "Running fuzz tests..."
	forge test --match-path "test/fuzz/*" $(VERBOSITY)

## Run invariant tests
test-invariant:
	@echo "Running invariant tests..."
	forge test --match-path "test/invariant/*" $(VERBOSITY)

## Run fork tests (requires RPC URL)
test-fork:
	@echo "Running fork tests on Sepolia..."
	forge test --match-path "test/fork/*" --fork-url $(SEPOLIA_RPC_URL) $(VERBOSITY)

## Generate gas snapshot
snapshot:
	@echo "Generating gas snapshot..."
	forge snapshot

## Generate coverage report
coverage:
	@echo "Generating coverage report..."
	forge coverage --report summary
	forge coverage --report lcov

# ============ LOCAL DEVELOPMENT ============

## Start local Anvil node
anvil:
	@echo "Starting Anvil..."
	anvil --block-time 1

## Start Anvil in background
anvil-bg:
	@echo "Starting Anvil in background..."
	anvil --block-time 1 > /dev/null 2>&1 &
	@sleep 2
	@echo "Anvil started on http://127.0.0.1:8545"

## Stop background Anvil
anvil-stop:
	@echo "Stopping Anvil..."
	@pkill -f anvil || true

## Deploy to local Anvil (no hook mining)
deploy-anvil:
	@echo "Deploying to local Anvil..."
	@mkdir -p deployments
	forge script $(DEPLOY_SCRIPT):DeployComplete \
		--sig "runLocal()" \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		$(VERBOSITY)
	@echo ""
	@echo "Deployment complete! Check deployments/anvil.json"

## Deploy to Anvil with mock pool manager
deploy-anvil-full:
	@echo "Deploying to Anvil with mock pool manager..."
	@mkdir -p deployments
	forge script $(DEPLOY_SCRIPT):DeployComplete \
		--sig "runWithMockPoolManager(address)" \
		$(MOCK_POOL_MANAGER) \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		$(VERBOSITY)

## Full local test: start anvil, deploy, verify
local-test: anvil-bg deploy-anvil verify-local anvil-stop
	@echo "Local test complete!"

## Run complete user flow test (simulated - includes time warping)
test-flow:
	@echo "Running full user flow test (simulation)..."
	@echo "Note: This uses vm.warp() to simulate time passage through all tiers"
	forge script script/TestFullFlow.s.sol:TestFullFlow $(VERBOSITY)

## Run basic deployment test on live Anvil (no time manipulation)
test-deploy-live:
	@echo "Running live deployment test on Anvil..."
	@echo "Note: This only tests deployment + registration (no time warping)"
	forge script script/TestFullFlow.s.sol:TestBasicFlow \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		$(VERBOSITY)

## Verify local deployment
verify-local:
	@echo "Verifying local deployment..."
	forge script script/Interactions.s.sol:VerifyDeployment \
		--rpc-url http://127.0.0.1:8545 \
		$(VERBOSITY)

# ============ TESTNET DEPLOYMENTS ============

## Deploy to Sepolia
deploy-sepolia:
	@echo "Deploying to Sepolia..."
	@mkdir -p deployments
	forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		$(VERBOSITY)
	@echo ""
	@echo "Deployment complete! Check deployments/sepolia.json"

## Deploy to Sepolia (dry run - no broadcast)
deploy-sepolia-dry:
	@echo "Dry run deployment to Sepolia..."
	forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		$(VERBOSITY)

## Deploy to Base Sepolia
deploy-base-sepolia:
	@echo "Deploying to Base Sepolia..."
	@mkdir -p deployments
	forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(BASE_SEPOLIA_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		$(VERBOSITY)

## Deploy to Arbitrum Sepolia
deploy-arbitrum-sepolia:
	@echo "Deploying to Arbitrum Sepolia..."
	@mkdir -p deployments
	forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(ARBITRUM_SEPOLIA_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ARBISCAN_API_KEY) \
		$(VERBOSITY)

## Deploy to Polygon Amoy
deploy-polygon-amoy:
	@echo "Deploying to Polygon Amoy..."
	@mkdir -p deployments
	forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(POLYGON_AMOY_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(POLYGONSCAN_API_KEY) \
		$(VERBOSITY)

## Deploy to all testnets
deploy-testnets: deploy-sepolia deploy-base-sepolia deploy-arbitrum-sepolia deploy-polygon-amoy
	@echo "All testnet deployments complete!"

# ============ MAINNET DEPLOYMENTS ============

## Deploy to Ethereum Mainnet (PRODUCTION - BE CAREFUL!)
deploy-mainnet:
	@echo "⚠️  WARNING: Deploying to Ethereum Mainnet!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read _
	@mkdir -p deployments
	FOUNDRY_PROFILE=production forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(MAINNET_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		--slow \
		$(VERBOSITY)

## Deploy to Ethereum Mainnet (dry run)
deploy-mainnet-dry:
	@echo "Dry run deployment to Ethereum Mainnet..."
	FOUNDRY_PROFILE=production forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(MAINNET_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		$(VERBOSITY)

## Deploy to Base Mainnet
deploy-base:
	@echo "⚠️  WARNING: Deploying to Base Mainnet!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read _
	@mkdir -p deployments
	FOUNDRY_PROFILE=production forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(BASE_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		--slow \
		$(VERBOSITY)

## Deploy to Polygon Mainnet
deploy-polygon:
	@echo "⚠️  WARNING: Deploying to Polygon Mainnet!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read _
	@mkdir -p deployments
	FOUNDRY_PROFILE=production forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(POLYGON_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(POLYGONSCAN_API_KEY) \
		--slow \
		$(VERBOSITY)

## Deploy to Arbitrum Mainnet
deploy-arbitrum:
	@echo "⚠️  WARNING: Deploying to Arbitrum Mainnet!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read _
	@mkdir -p deployments
	FOUNDRY_PROFILE=production forge script $(DEPLOY_SCRIPT):DeployComplete \
		--rpc-url $(ARBITRUM_RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ARBISCAN_API_KEY) \
		--slow \
		$(VERBOSITY)

## Deploy to all mainnets (PRODUCTION - BE VERY CAREFUL!)
deploy-mainnets:
	@echo "⚠️  WARNING: This will deploy to ALL mainnets!"
	@echo "This is extremely expensive and irreversible!"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read _
	$(MAKE) deploy-mainnet
	$(MAKE) deploy-base
	$(MAKE) deploy-polygon
	$(MAKE) deploy-arbitrum
	@echo "All mainnet deployments complete!"

# ============ VERIFICATION ============

## Verify contracts on Sepolia
verify-sepolia:
	@echo "Verifying contracts on Sepolia..."
	forge verify-contract $(REGISTRY_ADDRESS) src/ReputationRegistry.sol:ReputationRegistry \
		--chain sepolia \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

## Verify contracts on Mainnet
verify-mainnet:
	@echo "Verifying contracts on Mainnet..."
	forge verify-contract $(REGISTRY_ADDRESS) src/ReputationRegistry.sol:ReputationRegistry \
		--chain mainnet \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

## Verify contracts on Base
verify-base:
	@echo "Verifying contracts on Base..."
	forge verify-contract $(REGISTRY_ADDRESS) src/ReputationRegistry.sol:ReputationRegistry \
		--chain base \
		--etherscan-api-key $(BASESCAN_API_KEY)

## Verify contracts on Polygon
verify-polygon:
	@echo "Verifying contracts on Polygon..."
	forge verify-contract $(REGISTRY_ADDRESS) src/ReputationRegistry.sol:ReputationRegistry \
		--chain polygon \
		--etherscan-api-key $(POLYGONSCAN_API_KEY)

## Verify contracts on Arbitrum
verify-arbitrum:
	@echo "Verifying contracts on Arbitrum..."
	forge verify-contract $(REGISTRY_ADDRESS) src/ReputationRegistry.sol:ReputationRegistry \
		--chain arbitrum \
		--etherscan-api-key $(ARBISCAN_API_KEY)

# ============ INTERACTIONS (using DevOps) ============

## Register user on deployed contract
interact-register:
	@echo "Registering user..."
	forge script $(INTERACT_SCRIPT):Interactions \
		--sig "register()" \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		$(VERBOSITY)

## Check user reputation
interact-check:
	@echo "Checking reputation..."
	forge script $(INTERACT_SCRIPT):Interactions \
		--sig "checkReputation()" \
		--rpc-url $(RPC_URL) \
		$(VERBOSITY)

## Get fee quote for user
interact-fee:
	@echo "Getting fee quote..."
	forge script $(INTERACT_SCRIPT):Interactions \
		--sig "getFeeQuote()" \
		--rpc-url $(RPC_URL) \
		$(VERBOSITY)

## Mint test tokens
interact-mint:
	@echo "Minting test tokens..."
	forge script $(INTERACT_SCRIPT):Interactions \
		--sig "mintTestTokens()" \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		$(VERBOSITY)

## Health check on deployed contracts
interact-health:
	@echo "Running health check..."
	forge script $(INTERACT_SCRIPT):Interactions \
		--sig "healthCheck()" \
		--rpc-url $(RPC_URL) \
		$(VERBOSITY)

## Withdraw registration bond
interact-withdraw:
	@echo "Withdrawing bond..."
	forge script $(INTERACT_SCRIPT):Interactions \
		--sig "withdrawBond()" \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		$(VERBOSITY)

# ============ DEVOPS UTILITIES ============

## Get deployed addresses for a network
get-addresses:
	@echo "Getting deployed addresses for $(NETWORK)..."
	@cat deployments/$(NETWORK).json 2>/dev/null || echo "No deployment found for $(NETWORK)"

## List all deployments
list-deployments:
	@echo "Available deployments:"
	@ls -la deployments/ 2>/dev/null || echo "No deployments directory"

## Export addresses to .env format
export-env:
	@echo "Exporting addresses to .env.deployed..."
	@cat deployments/*.env > .env.deployed 2>/dev/null || echo "No deployments to export"
	@echo "Exported to .env.deployed"

# ============ CAST UTILITIES ============

## Get balance of an address
balance:
	@cast balance $(ADDRESS) --rpc-url $(RPC_URL)

## Get chain ID
chain-id:
	@cast chain-id --rpc-url $(RPC_URL)

## Call registry read function
call-registry:
	@cast call $(REGISTRY_ADDRESS) "registrationBond()" --rpc-url $(RPC_URL)

## Get block number
block:
	@cast block-number --rpc-url $(RPC_URL)

# ============ HELP ============

## Show help
help:
	@echo ""
	@echo "╔══════════════════════════════════════════════════════════════════╗"
	@echo "║       REPUTATION FEE HOOK - MAKEFILE COMMANDS                    ║"
	@echo "╠══════════════════════════════════════════════════════════════════╣"
	@echo "║                                                                  ║"
	@echo "║  BUILD & COMPILE                                                 ║"
	@echo "║    make build           - Build all contracts                    ║"
	@echo "║    make build-prod      - Build with production profile          ║"
	@echo "║    make clean           - Clean build artifacts                  ║"
	@echo "║    make install         - Install dependencies                   ║"
	@echo "║                                                                  ║"
	@echo "║  TESTING                                                         ║"
	@echo "║    make test            - Run all tests                          ║"
	@echo "║    make test-gas        - Run tests with gas report              ║"
	@echo "║    make test-unit       - Run unit tests only                    ║"
	@echo "║    make test-fuzz       - Run fuzz tests                         ║"
	@echo "║    make test-invariant  - Run invariant tests                    ║"
	@echo "║    make coverage        - Generate coverage report               ║"
	@echo "║                                                                  ║"
	@echo "║  LOCAL DEVELOPMENT                                               ║"
	@echo "║    make anvil           - Start local Anvil node                 ║"
	@echo "║    make deploy-anvil    - Deploy to local Anvil                  ║"
	@echo "║    make local-test      - Full local test cycle                  ║"
	@echo "║                                                                  ║"
	@echo "║  TESTNET DEPLOYMENTS                                             ║"
	@echo "║    make deploy-sepolia          - Deploy to Sepolia              ║"
	@echo "║    make deploy-base-sepolia     - Deploy to Base Sepolia         ║"
	@echo "║    make deploy-arbitrum-sepolia - Deploy to Arbitrum Sepolia     ║"
	@echo "║    make deploy-polygon-amoy     - Deploy to Polygon Amoy         ║"
	@echo "║    make deploy-testnets         - Deploy to all testnets         ║"
	@echo "║                                                                  ║"
	@echo "║  MAINNET DEPLOYMENTS (PRODUCTION!)                               ║"
	@echo "║    make deploy-mainnet  - Deploy to Ethereum Mainnet             ║"
	@echo "║    make deploy-base     - Deploy to Base Mainnet                 ║"
	@echo "║    make deploy-polygon  - Deploy to Polygon Mainnet              ║"
	@echo "║    make deploy-arbitrum - Deploy to Arbitrum Mainnet             ║"
	@echo "║                                                                  ║"
	@echo "║  INTERACTIONS (using Cyfrin DevOps)                              ║"
	@echo "║    make interact-register - Register a user                      ║"
	@echo "║    make interact-check    - Check user reputation                ║"
	@echo "║    make interact-fee      - Get fee quote                        ║"
	@echo "║    make interact-mint     - Mint test tokens                     ║"
	@echo "║    make interact-health   - Health check contracts               ║"
	@echo "║                                                                  ║"
	@echo "║  UTILITIES                                                       ║"
	@echo "║    make get-addresses   - Get deployed addresses                 ║"
	@echo "║    make list-deployments- List all deployments                   ║"
	@echo "║    make export-env      - Export addresses to .env               ║"
	@echo "║    make fmt             - Format code                            ║"
	@echo "║    make lint            - Run Slither linter                     ║"
	@echo "║                                                                  ║"
	@echo "║  ENVIRONMENT VARIABLES                                           ║"
	@echo "║    NETWORK    - Target network (default: anvil)                  ║"
	@echo "║    VERBOSITY  - Log verbosity (-v to -vvvv)                      ║"
	@echo "║    RPC_URL    - RPC endpoint URL                                 ║"
	@echo "║    PRIVATE_KEY- Deployer private key                             ║"
	@echo "║                                                                  ║"
	@echo "╚══════════════════════════════════════════════════════════════════╝"
	@echo ""
