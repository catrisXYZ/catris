import { useEffect, useState } from "react";
import { currentEpoch, epochWindow } from "@/lib/chain";

export function useEpochClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return { epoch: null as number | null, clock: "—:—", ms: 0, ready: false };
  }
  const epoch = currentEpoch(now);
  const ms = Math.max(0, epochWindow(epoch).end - now);
  const s = Math.floor(ms / 1000);
  const clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return { epoch, clock, ms, ready: true };
}
