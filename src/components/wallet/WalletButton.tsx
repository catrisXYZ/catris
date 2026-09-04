import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ROBINHOOD_CHAIN_ID } from "@/lib/chain";
import { shortAddress } from "@/lib/utils";
import { useWallet } from "@/lib/wallet/store";

export function WalletButton() {
  const { address, chainId, connecting, connect, disconnect, ensureChain } =
    useWallet();

  useEffect(() => {
    useWallet.getState().hydrate();
  }, []);

  if (!address) {
    return (
      <Button size="sm" variant="outline" onClick={() => void connect()} disabled={connecting}>
        {connecting ? "Connecting" : "Connect"}
      </Button>
    );
  }

  const wrong = chainId !== null && chainId !== ROBINHOOD_CHAIN_ID;

  return (
    <div className="flex items-center gap-2">
      {wrong && (
        <Button size="sm" variant="accent" onClick={() => void ensureChain()}>
          Switch chain
        </Button>
      )}
      <button
        type="button"
        onClick={disconnect}
        className="hidden rounded-sm border border-border px-2.5 py-1.5 font-mono text-xs text-muted sm:inline"
        title="Disconnect"
      >
        {shortAddress(address)}
      </button>
    </div>
  );
}
