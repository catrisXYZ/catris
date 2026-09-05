export const letscashHookAbi = [
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [],
  },
  {
    type: "function",
    name: "tab",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "pending",
    stateMutability: "view",
    inputs: [{ name: "poolId", type: "bytes32" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "updateCreator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "poolId", type: "bytes32" },
      { name: "newAddr", type: "address" },
    ],
    outputs: [],
  },
] as const;

export const vaultAbi = [
  {
    type: "function",
    name: "harvest",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "pendingTab",
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
  {
    type: "function",
    name: "currentMerkleRoot",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "dripWei",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "settleEpoch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "epochId", type: "uint256" },
      { name: "merkleRoot", type: "bytes32" },
      { name: "winner", type: "address" },
      { name: "winnerPrize", type: "uint256" },
    ],
    outputs: [],
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
  {
    type: "function",
    name: "getEpochWinner",
    stateMutability: "view",
    inputs: [{ name: "epochId", type: "uint256" }],
    outputs: [
      { name: "winner", type: "address" },
      { name: "score", type: "uint256" },
      { name: "lines", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "submitScore",
    stateMutability: "nonpayable",
    inputs: [
      { name: "player", type: "address" },
      { name: "score", type: "uint256" },
      { name: "lines", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
    outputs: [{ name: "isNewLeader", type: "bool" }],
  },
  {
    type: "function",
    name: "markSettled",
    stateMutability: "nonpayable",
    inputs: [{ name: "epochId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "epochs",
    stateMutability: "view",
    inputs: [{ name: "epochId", type: "uint256" }],
    outputs: [
      { name: "winner", type: "address" },
      { name: "topScore", type: "uint256" },
      { name: "topLines", type: "uint256" },
      { name: "settled", type: "bool" },
    ],
  },
] as const;
