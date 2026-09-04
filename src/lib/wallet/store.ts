import { create } from "zustand";
import {
  ROBINHOOD_CHAIN_ID,
  robinhoodChain,
} from "@/lib/chain";

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (ev: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (ev: string, cb: (...args: unknown[]) => void) => void;
};

function getEth(): Eth | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: Eth }).ethereum ?? null;
}

interface WalletState {
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  ensureChain: () => Promise<void>;
  hydrate: () => void;
}

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  chainId: null,
  connecting: false,
  error: null,

  hydrate() {
    const eth = getEth();
    if (!eth) return;
    void eth.request({ method: "eth_accounts" }).then((acc) => {
      const list = acc as string[];
      if (list[0]) set({ address: list[0] });
    });
    void eth.request({ method: "eth_chainId" }).then((id) => {
      set({ chainId: parseInt(String(id), 16) });
    });
    const onAccounts = (...args: unknown[]) => {
      const a = (args[0] as string[]) ?? [];
      set({ address: a[0] ?? null });
    };
    const onChain = (...args: unknown[]) => {
      set({ chainId: parseInt(String(args[0]), 16) });
    };
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
  },

  async connect() {
    const eth = getEth();
    if (!eth) {
      set({ error: "No injected wallet. Install MetaMask or Rabby, then add Robinhood Chain." });
      return;
    }
    set({ connecting: true, error: null });
    try {
      const acc = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      set({ address: acc[0] ?? null });
      await get().ensureChain();
      const id = (await eth.request({ method: "eth_chainId" })) as string;
      set({ chainId: parseInt(id, 16) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Wallet request rejected." });
    } finally {
      set({ connecting: false });
    }
  },

  disconnect() {
    set({ address: null, error: null });
  },

  async ensureChain() {
    const eth = getEth();
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1237" }],
      });
    } catch (err) {
      const code = (err as { code?: number })?.code;
      if (code === 4902 || code === -32603) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x1237",
              chainName: robinhoodChain.name,
              nativeCurrency: robinhoodChain.nativeCurrency,
              rpcUrls: [...robinhoodChain.rpcUrls.default.http],
              blockExplorerUrls: [robinhoodChain.blockExplorers.default.url],
            },
          ],
        });
      } else {
        throw err;
      }
    }
    set({ chainId: ROBINHOOD_CHAIN_ID });
  },
}));

export function hasInjectedWallet() {
  return Boolean(getEth());
}
