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

/** Official PONS v2 contracts on Robinhood Chain (chain 4663). */
export const PONS = {
  factory: "0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e" as Address,
  memeHook: "0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044" as Address,
  feeEscrow: "0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e" as Address,
  buybackVault: "0x42df2a798f82289E177311362e8f5ccC45c1219c" as Address,
  launchLocker: "0x267444D099b10fB5Ed7c3Cc7B7c767AdcA574952" as Address,
  launchRouter: "0xe33E9E479dF8802cb0866d5d05258bEc4cF62948" as Address,
  launchDeployer: "0x3711ceA4feaDE896C913C68F01Eda97Cb06D1A42" as Address,
  graduationExecutor: "0xC7819B64A1dAECD7eC19856d026cb14EfBd89046" as Address,
  graduationGuard: "0xf5695117b99B6f6401e67d4195BD653628176C6C" as Address,
  docs: "https://docs.ponsfamily.com/v2",
  launch: "https://www.ponsfamily.com/launchpad/create",
} as const;

export const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Paste deployed addresses after Remix deploy + PONS launch.
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
  github: "https://github.com/catrisXYZ",
  githubUser: "catrisXYZ",
  x: "https://x.com/catrisXYZ",
  xHandle: "catrisXYZ",
  telegram: "https://t.me/catrisXYZ",
  telegramHandle: "catrisXYZ",
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
