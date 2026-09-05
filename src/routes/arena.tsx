import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageWell } from "@/components/game/PageWell";
import { readWellLive, type WellRun } from "@/lib/onchain";
import { useEpochClock } from "@/lib/use-epoch";
import { cn, formatEth, formatScore, shortAddress } from "@/lib/utils";

export const Route = createFileRoute("/arena")({ component: ArenaPage });

function ArenaPage() {
  const { epoch, clock, ready } = useEpochClock();
  const [live, setLive] = useState<Awaited<ReturnType<typeof readWellLive>>>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let liveFlag = true;
    const pull = () => {
      void readWellLive()
        .then((data) => {
          if (!liveFlag) return;
          setLive(data);
          setError(null);
        })
        .catch((err: unknown) => {
          if (liveFlag) setError(err instanceof Error ? err.message : "Well is quiet.");
        });
    };
    pull();
    const id = window.setInterval(pull, 8000);
    return () => {
      liveFlag = false;
      window.clearInterval(id);
    };
  }, [ready, epoch]);

  const prize = live?.prize ? formatEth(BigInt(live.prize), 3) : "—";
  const maxScore = Math.max(
    Number(live?.leader?.score ?? 0),
    ...((live?.history ?? []).map((r) => Number(r.score)) || [0]),
    1,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-xs tracking-[0.2em] text-accent uppercase">The well · live</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-4xl italic tracking-tight">
              Epoch {live?.epoch ?? epoch ?? "—"}
            </h1>
            <p className="font-display text-3xl tabular tracking-tight text-accent">{clock}</p>
          </div>
          <p className="mt-3 max-w-2xl text-muted">
            Fifteen minutes. Highest stack takes Pounce. The board updates as
            the keeper knocks — this list is the chain, not a guestbook.
          </p>
        </div>
        <PageWell variant="well" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <PulseCard
          kicker="This window"
          title={live?.leader ? formatScore(Number(live.leader.score)) : "Empty well"}
          detail={
            live?.leader
              ? shortAddress(live.leader.winner)
              : "Stack a cat. Sign. No gas."
          }
          bar={live?.leader ? Number(live.leader.score) / maxScore : 0}
          tone="accent"
          live
        />
        <PulseCard
          kicker="Last Pounce"
          title={live?.last ? formatScore(Number(live.last.score)) : "No sip yet"}
          detail={
            live?.last
              ? `${shortAddress(live.last.winner)} · epoch ${live.last.epoch}`
              : "The first stack still echoes."
          }
          bar={live?.last ? Number(live.last.score) / maxScore : 0}
          tone="ok"
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface px-5 py-4">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">Pounce in the dish</p>
        <p className="mt-1 font-display text-2xl italic tabular text-accent">{prize} ETH</p>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <h2 className="mt-12 font-display text-2xl italic">Recent pounces</h2>
      <p className="mt-1 text-sm text-muted">Settled windows. The cats that drank.</p>
      <HistoryTable rows={live?.history ?? []} maxScore={maxScore} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="accent" asChild>
          <Link to="/play">Stack cats</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/house" search={{ room: "pounce" }}>
            Lick Pounce
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/house" search={{ room: "cream" }}>
            Cream saucer
          </Link>
        </Button>
      </div>
    </div>
  );
}

function PulseCard({
  kicker,
  title,
  detail,
  bar,
  tone,
  live: isLive,
}: {
  kicker: string;
  title: string;
  detail: string;
  bar: number;
  tone: "accent" | "ok";
  live?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs tracking-[0.2em] text-muted uppercase">{kicker}</p>
        {isLive && (
          <span className="flex items-center gap-1.5 text-xs text-accent">
            <span className="inline-block size-1.5 rounded-full bg-accent" />
            live
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-4xl italic tabular tracking-tight">{title}</p>
      <p className="mt-1 font-mono text-xs text-subtle">{detail}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-elevated">
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", tone === "accent" ? "bg-accent" : "bg-ok")}
          style={{ width: `${Math.max(4, Math.min(100, bar * 100))}%` }}
        />
      </div>
    </div>
  );
}

function HistoryTable({ rows, maxScore }: { rows: WellRun[]; maxScore: number }) {
  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-border bg-surface px-4 py-10 text-center text-muted">
        No settled windows yet. The first Pounce is still warm.
      </div>
    );
  }
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs tracking-widest text-muted uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Epoch</th>
            <th className="px-4 py-3 font-medium">Stack</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Lines</th>
            <th className="px-4 py-3 font-medium">Wallet</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.epoch} className="border-t border-border">
              <td className="px-4 py-3 tabular text-muted">{row.epoch}</td>
              <td className="px-4 py-3">
                <p className="font-display text-lg tabular text-fg">{formatScore(Number(row.score))}</p>
                <div className="mt-1 h-1.5 max-w-48 overflow-hidden rounded-full bg-elevated">
                  <div
                    className={cn("h-full rounded-full", i === 0 ? "bg-accent" : i === 1 ? "bg-warn" : "bg-ok")}
                    style={{ width: `${Math.max(6, (Number(row.score) / maxScore) * 100)}%` }}
                  />
                </div>
              </td>
              <td className="hidden px-4 py-3 tabular text-muted sm:table-cell">{row.lines}</td>
              <td className="px-4 py-3 font-mono text-xs text-subtle">{shortAddress(row.winner)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
