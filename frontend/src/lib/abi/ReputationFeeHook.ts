export const ReputationFeeHookABI = [
  {
    type: "function",
    name: "getFeeQuote",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "expectedFee", type: "uint24" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTier",
    inputs: [{ name: "reputationAge", type: "uint256" }],
    outputs: [{ name: "tier", type: "uint8" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "getFeeForTier",
    inputs: [{ name: "tier", type: "uint8" }],
    outputs: [{ name: "fee", type: "uint24" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "getTierDiscount",
    inputs: [{ name: "tier", type: "uint8" }],
    outputs: [{ name: "discountBps", type: "uint256" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "BASE_FEE",
    inputs: [],
    outputs: [{ name: "", type: "uint24" }],
    stateMutability: "view",
  },
] as const;
