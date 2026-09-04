export const ponsEscrowAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "recipient", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

export const vaultAbi = [
  {
    type: "function",
    name: "claimFromEscrow",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "pendingEscrow",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "buckets",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "prize", type: "uint256" },
      { name: "drip", type: "uint256" },
      { name: "team", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "claimDrip",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "hasClaimed",
    stateMutability: "view",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  { type: "receive", stateMutability: "payable" },
] as const;

export const boardAbi = [
  {
    type: "function",
    name: "currentEpoch",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "epochEndsAt",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getCurrentLeader",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "winner", type: "address" },
      { name: "score", type: "uint256" },
    ],
  },
] as const;
