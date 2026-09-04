import { defineChain, type Address } from "viem";

export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_TESTNET_ID = 46630;

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

export const robinhoodTestnet = defineChain({
  id: ROBINHOOD_TESTNET_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Testnet Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
});

/** letscash.fun launchpad on Robinhood Chain (chain 4663). */
export const LETSCASH = {
  factory: "0x5bd1Fbe78a78fe8236fa00CF48fbEBA74ae34661" as Address,
  hook: "0x75A54357D9C78a2Db19004a5FDc76c50F9242AEC" as Address,
  site: "https://letscash.fun",
  launch: "https://letscash.fun/launch",
  docs: "https://letscashfun.com/docs",
  feePercents: [1, 3, 5, 10] as const,
} as const;

/** @deprecated launch is letscash.fun — kept for the old escrow reader. */
export const PONS = {
  factory: LETSCASH.factory,
  memeHook: LETSCASH.hook,
  feeEscrow: "0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e" as Address,
  docs: LETSCASH.docs,
  launch: LETSCASH.launch,
} as const;

export const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Paste deployed addresses after Remix deploy + letscash.fun launch.
 * Prefer VITE_VAULT_CA / VITE_BOARD_CA / VITE_TOKEN_CA when set.
 */
function envAddr(key: string): Address {
  const raw = (import.meta.env as Record<string, string | undefined>)[key];
  if (raw && /^0x[a-fA-F0-9]{40}$/.test(raw)) return raw as Address;
  return ZERO;
}

export const CATRIS = {
  name: "Catris",
  symbol: "CATRIS",
  creatorTaxBps: 300,
  token: envAddr("VITE_TOKEN_CA"),
  vault: envAddr("VITE_VAULT_CA"),
  board: envAddr("VITE_BOARD_CA"),
} as const;

/** Official Catris surfaces. Vault.setMetadata uses these strings. */
export const LINKS = {
  site: "https://catris.xyz",
  launchpad: "https://letscash.fun",
  github: "https://github.com/catrisXYZ",
  githubUser: "catrisXYZ",
  x: "https://x.com/catrisXYZ",
  xHandle: "catrisXYZ",
  telegram: "https://t.me/CatrisRH",
  telegramHandle: "CatrisRH",
  telegramAnnounce: "https://t.me/catrisXYZ",
  vercel: "https://vercel.com/catris",
} as const;

export const KEEPER_URL =
  ((import.meta.env as Record<string, string | undefined>).VITE_KEEPER_URL ?? "").replace(/\/$/, "");

export const FEE_SPLIT = [
  { key: "prize", label: "Epoch prize (top score)", bps: 6000, share: "60%" },
  { key: "drip", label: "Holder drip (merkle)", bps: 3000, share: "30%" },
  { key: "team", label: "Team", bps: 1000, share: "10%" },
] as const;

export function explorerTx(hash: string) {
  return `https://robinhoodchain.blockscout.com/tx/${hash}`;
}

export function explorerAddress(address: string) {
  return `https://robinhoodchain.blockscout.com/address/${address}`;
}

export function isDeployed(address: string | undefined) {
  return Boolean(address && address !== ZERO);
}

/** 15-minute epochs, matching CatrisBoard.EPOCH_DURATION */
export const EPOCH_SECONDS = 15 * 60;

export function currentEpoch(now = Date.now()) {
  return Math.floor(now / 1000 / EPOCH_SECONDS);
}

export function epochWindow(epoch = currentEpoch()) {
  const start = epoch * EPOCH_SECONDS * 1000;
  return { start, end: start + EPOCH_SECONDS * 1000 };
}

/** @deprecated use currentEpoch */
export const currentSeason = currentEpoch;
export function seasonWindow(season: number) {
  return epochWindow(season);
}
