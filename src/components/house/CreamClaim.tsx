import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { readVaultBuckets } from "@/lib/onchain";
import { useWallet } from "@/lib/wallet/store";

export function CreamClaim() {
  const address = useWallet((s) => s.address);
  const connecting = useWallet((s) => s.connecting);
  const connect = useWallet((s) => s.connect);
  const hydrate = useWallet((s) => s.hydrate);
  const [drip, setDrip] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    void readVaultBuckets().then((b) => {
      if (b?.drip) setDrip(formatEther(BigInt(b.drip)));
    });
  }, [hydrate]);

  const eth = drip ? Number(drip).toFixed(3) : "—";

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">Claim Cream</p>
      <p className="mt-2 font-display text-3xl italic tabular text-fg">{eth} ETH</p>
      <p className="mt-1 text-sm text-muted">sitting in the dish for holders</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {!address ? (
          <Button variant="accent" disabled={connecting} onClick={() => void connect()}>
            {connecting ? "Connecting" : "Connect to claim"}
          </Button>
        ) : (
          <Button variant="accent" disabled>
            Claim Cream
          </Button>
        )}
      </div>
      <p className="mt-3 text-sm text-subtle">
        The keeper has not posted a holder list this window. $CATRIS still counts
        when it does — Claim lights up here. Not letscash. The Bowl pays.
      </p>
    </div>
  );
}
