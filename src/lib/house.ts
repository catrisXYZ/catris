export const ROOMS = ["bowl", "well", "pounce", "cream", "whiskers"] as const;
export type RoomId = (typeof ROOMS)[number];

export type HouseRoom = {
  id: RoomId;
  name: string;
  kicker: string;
  title: string;
  contract: string;
  deploy: "launch" | "inside";
  well: RoomId;
  body: string[];
  footnote: string;
};

/** Five named rooms. Two contracts at launch. The old weekly PONS trio stays in the repo as drafts. */
export const HOUSE: HouseRoom[] = [
  {
    id: "bowl",
    name: "The Bowl",
    kicker: "Where treats land",
    title: "A contract, not a wallet.",
    contract: "CatrisVault.sol",
    deploy: "launch",
    well: "bowl",
    body: [
      "Every trade on the Uniswap v4 pool leaves a little ETH on the letscash hook. The Bowl is the only address allowed to claim it. No EOA. No weekend plans.",
      "When the keeper knocks, harvest() pulls the tab. ETH hits receive() and the house splits itself: Pounce, Cream, Whiskers. Empty tab is a shrug, not a revert.",
    ],
    footnote: "Remix this one first. Constructor takes the Whiskers wallet.",
  },
  {
    id: "well",
    name: "The Well",
    kicker: "10 × 20",
    title: "Fifteen minutes. One stack.",
    contract: "CatrisBoard.sol",
    deploy: "launch",
    well: "well",
    body: [
      "The visible field is ten across and twenty down, with two hidden spawn rows above the lip. Guideline gravity, ghost, hold, a bag of seven cats, and the original overflowing sprites — ears and tails spill the cell on purpose.",
      "Scores are signed in the browser (personal_sign). The keeper posts them so players pay no gas. Highest run in the window is the Pounce winner. Game over copy: Litter full.",
    ],
    footnote: "Remix this one second. No constructor args. Then setBot and setVault.",
  },
  {
    id: "pounce",
    name: "Pounce",
    kicker: "The epoch prize",
    title: "One cat on the podium.",
    contract: "inside CatrisVault (prizeWei)",
    deploy: "inside",
    well: "pounce",
    body: [
      "Pounce is the black cat that does not wait for lock delay — and the name of the prize room. When an epoch closes, the top score drinks first from the Bowl.",
      "The keeper settles the previous window, not the empty one it just entered. Payout is capped so one lucky run cannot drain the whole dish. CatrisArena.sol was an older weekly draft. Do not deploy it.",
    ],
    footnote: "Live as a bucket on the Bowl. The /well page is the public board.",
  },
  {
    id: "cream",
    name: "Cream",
    kicker: "Holder drip",
    title: "The rest of the saucer.",
    contract: "inside CatrisVault (dripWei)",
    deploy: "inside",
    well: "cream",
    body: [
      "Holders lap what Pounce does not drink. Each epoch the keeper publishes a merkle root of $CATRIS balances. Claim with a proof. No stake-and-lock minigame, no weekly season.",
      "CatrisRewards.sol was a Synthetix-style staker from the first draft. Cream lives in the Bowl instead. Simpler, harder to rug, same milk.",
    ],
    footnote: "claimDrip(amount, proof) on the Bowl. Leaf is address + amount.",
  },
  {
    id: "whiskers",
    name: "Whiskers",
    kicker: "The crew",
    title: "Litter box, lights, lunch.",
    contract: "inside CatrisVault (teamWei)",
    deploy: "inside",
    well: "whiskers",
    body: [
      "A thin slice of every harvest goes to the team wallet set at deploy. Only that wallet can withdrawTeam(). The deployer is a different key. The keeper is a third. Do not mix them.",
      "CatrisTreasury.sol used to route PONS escrow into four destinations. The Bowl does the split in one receive(). Treasury stays in the repo as a fossil.",
    ],
    footnote: "Constructor argument on the Bowl. Never the creator stream recipient.",
  },
];

export function roomById(id: string | undefined): HouseRoom {
  return HOUSE.find((r) => r.id === id) ?? HOUSE[0]!;
}

export const HOUSE_NAV = HOUSE.map((r) => ({ id: r.id, name: r.name }));
