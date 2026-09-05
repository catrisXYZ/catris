import { createFileRoute } from "@tanstack/react-router";
import { CatrisBoard } from "@/components/game/CatrisBoard";
import { useEpochClock } from "@/lib/use-epoch";

export const Route = createFileRoute("/play")({ component: PlayPage });

function PlayPage() {
  const { epoch, clock } = useEpochClock();
  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-6xl flex-col px-3 pt-2 pb-0 sm:px-6 sm:pt-3">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <h1 className="font-display text-xl italic tracking-tight sm:text-3xl">The well</h1>
        <div className="text-right">
          <p className="font-display text-lg tabular text-accent sm:text-2xl">{clock}</p>
          <p className="seal text-[10px] sm:text-[11px]">
            Epoch {epoch ?? "—"} · litter clock
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CatrisBoard />
      </div>
    </div>
  );
}
