import { createFileRoute } from "@tanstack/react-router";
import { CatrisBoard } from "@/components/game/CatrisBoard";
import { useEpochClock } from "@/lib/use-epoch";

export const Route = createFileRoute("/play")({ component: PlayPage });

function PlayPage() {
  const { epoch, clock } = useEpochClock();
  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-6xl flex-col px-4 py-3 sm:px-6 sm:py-4">
      <div className="mb-3 flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">Arcade</p>
          <h1 className="font-display text-2xl italic tracking-tight sm:text-3xl">The well</h1>
        </div>
        <div className="text-right">
          <p className="font-display text-xl tabular text-accent sm:text-2xl">{clock}</p>
          <p className="text-[11px] text-muted">
            Epoch {epoch ?? "—"} · top score takes 60%
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CatrisBoard />
      </div>
    </div>
  );
}
