import { useEffect, useState } from "react";
import {
  createWalletClient,
  custom,
  formatEther,
  type Hex,
} from "viem";
import { Button } from "@/components/ui/button";
import { vaultAbi } from "@/lib/abis";
import { CATRIS, robinhoodChain } from "@/lib/chain";
import { readVaultBuckets } from "@/lib/onchain";
import { useWallet } from "@/lib/wallet/store";

type Proof = { ok: true; amount: string; proof: Hex[]; root: Hex } | { ok: false; error?: string };

export function CreamClaim() {
  const address = useWallet((s) => s.address);
  const connecting = useWallet((s) => s.connecting);
  const connect = useWallet((s) => s.connect);
  const hydrate = useWallet((s) => s.hydrate);
  const ensureChain = useWallet((s) => s.ensureChain);
  const [drip, setDrip] = useState<string | null>(null);
  const [proof, setProof] = useState<Proof | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    void readVaultBuckets().then((b) => {
      if (b?.drip) setDrip(formatEther(BigInt(b.drip)));
    });
  }, [hydrate]);

  useEffect(() => {
    if (!address) {
      setProof(null);
      return;
    }
    let live = true;
    fetch(`/api/keeper/cream-proof?player=${address}`)
      .then((r) => r.json() as Promise<Proof>)
      .then((p) => {
        if (live) setProof(p);
      })
      .catch(() => {
        if (live) setProof({ ok: false, error: "could not load list" });
      });
    return () => {
      live = false;
    };
  }, [address]);

  const eth = drip ? Number(drip).toFixed(3) : "—";
  const mine = proof && proof.ok ? Number(formatEther(BigInt(proof.amount))).toFixed(5) : null;

  const claim = async () => {
    if (!address || !proof || !proof.ok) return;
    const ethereum = (window as unknown as { ethereum?: { request: (a: unknown) => Promise<unknown> } }).ethereum;
    if (!ethereum) return;
    setBusy(true);
    setNote(null);
    try {
      await ensureChain();
      const wallet = createWalletClient({
        chain: robinhoodChain,
        transport: custom(ethereum),
        account: address as `0x${string}`,
      });
      const hash = await wallet.writeContract({
        address: CATRIS.vault,
        abi: vaultAbi,
        functionName: "claimDrip",
        args: [BigInt(proof.amount), proof.proof],
        chain: robinhoodChain,
        account: address as `0x${string}`,
      });
      setNote(`Cream in. ${hash.slice(0, 10)}…`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "claim failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">Claim Cream</p>
      <p className="mt-2 font-display text-3xl italic tabular text-fg">{eth} ETH</p>
      <p className="mt-1 text-sm text-muted">in the dish for holders</p>
      {mine && (
        <p className="mt-2 font-display text-xl italic text-accent">{mine} ETH yours</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {!address ? (
          <Button variant="accent" disabled={connecting} onClick={() => void connect()}>
            {connecting ? "Connecting" : "Connect to claim"}
          </Button>
        ) : (
          <Button variant="accent" disabled={busy || !proof || !proof.ok} onClick={() => void claim()}>
            {busy ? "Claiming…" : "Claim Cream"}
          </Button>
        )}
      </div>
      <p className="mt-3 text-sm text-subtle">
        {note
          ? note
          : proof && !proof.ok
            ? proof.error ?? "No cream this window."
            : "The Bowl pays. Not letscash. Gas is a sip."}
      </p>
    </div>
  );
}
