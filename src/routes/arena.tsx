import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageWell } from "@/components/game/PageWell";
import { listScores, type ScoreRow } from "@/lib/scores";
import { useEpochClock } from "@/lib/use-epoch";
import { formatScore, shortAddress } from "@/lib/utils";

export const Route = createFileRoute("/arena")({ component: ArenaPage });

function ArenaPage() {
  const { epoch, clock, ready } = useEpochClock();
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [allTime, setAllTime] = useState<ScoreRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || epoch == null) return;
    let live = true;
    Promise.all([
      listScores({ data: { season: epoch, limit: 15 } }),
      listScores({ data: { all: true, limit: 10 } }),
    ])
      .then(([cur, all]) => {
        if (!live) return;
        setRows(cur.rows);
        setAllTime(all.rows);
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : "Could not load scores.");
      });
    return () => {
      live = false;
    };
  }, [epoch, ready]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted uppercase">The well</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-4xl italic tracking-tight">
              Epoch {epoch ?? "—"}
            </h1>
            <p className="font-display text-3xl tabular tracking-tight text-accent">{clock}</p>
          </div>
          <p className="mt-3 max-w-2xl text-muted">
            Fifteen minutes. Highest stack takes Pounce. Cream drips to holders
            when the keeper rings the bell. Post a run from Play — no gas if
            you sign.
          </p>
        </div>
        <PageWell variant="well" />
      </div>

      <BoardTable rows={rows} empty="No runs yet this epoch. The well is empty." error={error} />

      <h2 className="mt-12 font-display text-2xl italic">All-time well</h2>
      <BoardTable rows={allTime} empty="No runs posted." error={null} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="accent" asChild>
          <Link to="/play">Drop a run</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/house" search={{ room: "pounce" }}>
            What is Pounce
          </Link>
        </Button>
      </div>
    </div>
  );
}

function BoardTable({
  rows,
  empty,
  error,
}: {
  rows: ScoreRow[];
  empty: string;
  error: string | null;
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs tracking-widest text-muted uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Handle</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Lines</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Wallet</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className="border-t border-border">
              <td className="px-4 py-3 tabular text-muted">{i + 1}</td>
              <td className="px-4 py-3">{row.handle}</td>
              <td className="px-4 py-3 font-display text-lg tabular">{formatScore(row.score)}</td>
              <td className="hidden px-4 py-3 tabular text-muted sm:table-cell">{row.lines}</td>
              <td className="hidden px-4 py-3 font-mono text-xs text-subtle md:table-cell">
                {row.wallet ? shortAddress(row.wallet) : "—"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && !error && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
          {error && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-danger">
                {error}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
