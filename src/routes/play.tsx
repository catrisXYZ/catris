import { createFileRoute } from "@tanstack/react-router";
import { CatrisBoard } from "@/components/game/CatrisBoard";
import { useEpochClock } from "@/lib/use-epoch";

export const Route = createFileRoute("/play")({ component: PlayPage });

function PlayPage() {
  const { epoch, clock } = useEpochClock();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted uppercase">Arcade</p>
          <h1 className="font-display text-4xl italic tracking-tight">The well</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl tabular text-accent">{clock}</p>
          <p className="text-xs text-muted">
            Epoch {epoch ?? "—"} · top score takes 60% of this pot
          </p>
        </div>
      </div>
      <CatrisBoard />
    </div>
  );
}
