import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageWell } from "@/components/game/PageWell";
import {
  CATRIS,
  FEE_SPLIT,
  LETSCASH,
  explorerAddress,
  isDeployed,
} from "@/lib/chain";
import { readPendingTab } from "@/lib/onchain";
import { formatEth } from "@/lib/utils";

export const Route = createFileRoute("/treasury")({ component: TreasuryPage });

function TreasuryPage() {
  const [escrow, setEscrow] = useState<bigint | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isDeployed(CATRIS.vault)) return;
    readPendingTab()
      .then((v) => {
        if (v === null) setEscrow(null);
        else setEscrow(BigInt(v));
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : "Could not read creator tab."),
      );
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted uppercase">On-chain vault</p>
          <h1 className="mt-2 font-display text-4xl italic tracking-tight">Vault</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Hand the letscash.fun creator stream to this contract with{" "}
            <span className="text-fg">updateCreator</span>. The keeper harvests
            ETH every 15 minutes and splits 60 / 30 / 10.
          </p>
        </div>
        <PageWell variant="vault" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Panel
          label="Creator tax"
          value={`${CATRIS.creatorTaxBps / 100}%`}
          hint="1% trade tax · 0.7% creator stream to the vault"
        />
        <Panel
          label="Creator stream (ETH)"
          value={escrow === null ? "—" : formatEth(escrow)}
          hint={
            isDeployed(CATRIS.vault)
              ? "Unclaimed creator ETH sitting on the letscash hook"
              : "Set VITE_VAULT_CA after Remix to read the tab"
          }
        />
        <Panel
          label="Status"
          value={isDeployed(CATRIS.vault) ? "Live" : "Awaiting deploy"}
          hint="Set VITE_VAULT_CA after Remix"
        />
      </div>
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}

      <ol className="mt-10 grid gap-3 md:grid-cols-3">
        {FEE_SPLIT.map((s) => (
          <li key={s.key} className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs tracking-widest text-muted uppercase">{s.share}</p>
            <p className="mt-2 font-display text-xl italic">{s.label}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-2xl italic">Addresses</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Addr label="letscash.fun factory" value={LETSCASH.factory} />
          <Addr label="letscash.fun hook" value={LETSCASH.hook} />
          <Addr label="Catris vault" value={CATRIS.vault} />
          <Addr label="Catris board" value={CATRIS.board} />
          <Addr label="CATRIS token" value={CATRIS.token} />
        </dl>
        <div className="mt-6">
          <Button variant="outline" asChild>
            <a href={LETSCASH.launch} target="_blank" rel="noreferrer">
              letscash.fun/launch
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Panel({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl tabular tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-subtle">{hint}</p>
    </div>
  );
}

function Addr({ label, value }: { label: string; value: string }) {
  const live = isDeployed(value);
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-xs break-all">
        {live ? (
          <a
            className="underline decoration-border underline-offset-4 hover:text-accent"
            href={explorerAddress(value)}
            target="_blank"
            rel="noreferrer"
          >
            {value}
          </a>
        ) : (
          <span className="text-subtle">not deployed</span>
        )}
      </dd>
    </div>
  );
}
