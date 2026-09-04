import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CatrisEngine, type EngineSnapshot } from "@/lib/game/engine";
import { COLS, ROWS } from "@/lib/game/types";
import { renderBoard, renderMini } from "@/lib/game/render";
import { preloadCats, LOGO_SVG } from "@/lib/game/cats";
import { ALL_SPRITE_COLORS } from "@/lib/game/pieces";
import {
  isMuted,
  playClear,
  playDrop,
  playHold,
  playLock,
  playMove,
  playOver,
  playRotate,
  playSpecial,
  playStart,
  setMuted,
  unlockAudio,
} from "@/lib/game/audio";
import { submitScore } from "@/lib/scores";
import { signAndSubmitScore } from "@/lib/keeper-client";
import { KEEPER_URL } from "@/lib/chain";
import { formatScore } from "@/lib/utils";
import { useWallet } from "@/lib/wallet/store";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

const HANDLE_KEY = "catris.handle.v1";
const BEST_KEY = "catris.best.v1";

function loadHandle() {
  try {
    return localStorage.getItem(HANDLE_KEY) || "Stray Cat";
  } catch {
    return "Stray Cat";
  }
}

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY) || "0") || 0;
  } catch {
    return 0;
  }
}

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="rounded-xs border border-border bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}

export function CatrisBoard() {
  const hostRef = useRef<HTMLCanvasElement>(null);
  const wellSlotRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef<HTMLCanvasElement>(null);
  const nextRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const engineRef = useRef<CatrisEngine | null>(null);
  const [snap, setSnap] = useState<EngineSnapshot | null>(null);
  const [muted, setMutedState] = useState(false);
  const [handle, setHandle] = useState("Stray Cat");
  const [best, setBest] = useState(0);
  const [posted, setPosted] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [chainNote, setChainNote] = useState<string | null>(null);
  const wallet = useWallet((s) => s.address);

  useEffect(() => {
    setHandle(loadHandle());
    setBest(loadBest());
    void preloadCats(ALL_SPRITE_COLORS);
  }, []);

  useEffect(() => {
    const engine = new CatrisEngine((ev) => {
      if (ev.type === "move") playMove();
      if (ev.type === "rotate") playRotate();
      if (ev.type === "drop") playDrop();
      if (ev.type === "lock") playLock();
      if (ev.type === "clear") playClear(ev.lines ?? 1);
      if (ev.type === "special") playSpecial();
      if (ev.type === "hold") playHold();
      if (ev.type === "gameover") playOver();
    });
    engineRef.current = engine;
    setSnap(engine.snapshot());

    let raf = 0;
    let last = performance.now();
    let hud = 0;
    let flags = "";
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      engine.update(dt);
      const s = engine.snapshot();
      const canvas = hostRef.current;
      if (canvas) {
        const css = canvas.clientWidth;
        const cell = css / COLS;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const ctx = canvas.getContext("2d");
        if (ctx) renderBoard(ctx, s, cell, dpr);
      }
      const hold = holdRef.current?.getContext("2d");
      if (hold && holdRef.current) {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        renderMini(hold, s.hold, holdRef.current.clientWidth, dpr);
      }
      s.next.forEach((p, i) => {
        const el = nextRefs.current[i];
        const ctx = el?.getContext("2d");
        if (el && ctx) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          renderMini(ctx, p, el.clientWidth, dpr);
        }
      });
      const flag = `${s.started}|${s.over}|${s.paused}|${s.overlay ?? ""}|${s.score}|${s.level}`;
      if (now - hud > 100 || flag !== flags) {
        flags = flag;
        hud = now;
        setSnap(s);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = hostRef.current;
    const frame = frameRef.current;
    const slot = wellSlotRef.current;
    if (!canvas || !frame || !slot) return;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const maxW = Math.max(120, Math.min(slot.clientWidth || 360, 360));
      const maxH = Math.max(220, slot.clientHeight || 480);
      const cell = Math.max(10, Math.floor(Math.min(maxW / COLS, maxH / ROWS)));
      const cssW = cell * COLS;
      const cssH = cell * ROWS;
      frame.style.width = `${cssW}px`;
      frame.style.height = `${cssH}px`;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      [holdRef.current, ...nextRefs.current].forEach((el) => {
        if (!el) return;
        const s = el.clientWidth;
        el.width = Math.floor(s * dpr);
        el.height = Math.floor(s * dpr);
      });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(slot);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      const map: Record<string, string> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowDown: "soft",
        ArrowUp: "rotate",
        Space: "hard",
        KeyC: "hold",
        KeyZ: "rotate",
        KeyX: "rotate",
        KeyP: "pause",
        KeyW: "rotate",
        KeyA: "left",
        KeyD: "right",
        KeyS: "soft",
      };
      const action = map[e.code];
      if (!action) return;
      e.preventDefault();
      if (e.repeat && (action === "rotate" || action === "hard" || action === "hold" || action === "pause")) return;
      unlockAudio();
      if (action === "left" || action === "right" || action === "soft") {
        eng.setHeld(action, true);
      } else {
        eng.tap(action);
      }
    };
    const up = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.code === "ArrowLeft" || e.code === "KeyA") eng.setHeld("left", false);
      if (e.code === "ArrowRight" || e.code === "KeyD") eng.setHeld("right", false);
      if (e.code === "ArrowDown" || e.code === "KeyS") eng.setHeld("soft", false);
    };
    const blur = () => {
      engineRef.current?.setHeld("left", false);
      engineRef.current?.setHeld("right", false);
      engineRef.current?.setHeld("soft", false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    if (!snap?.over || posted) return;
    if (snap.score > best) {
      setBest(snap.score);
      try {
        localStorage.setItem(BEST_KEY, String(snap.score));
      } catch {
        /* ignore */
      }
    }
  }, [snap?.over, snap?.score, best, posted]);

  const start = () => {
    unlockAudio();
    playStart();
    setPosted(false);
    setPostError(null);
    setChainNote(null);
    engineRef.current?.start();
  };

  const postRun = async () => {
    if (!snap || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      try {
        localStorage.setItem(HANDLE_KEY, handle);
      } catch {
        /* ignore */
      }
      await submitScore({
        data: {
          handle,
          wallet,
          score: snap.score,
          lines: snap.lines,
          specials: snap.specials,
          duration_ms: Math.max(1000, Math.round(snap.elapsed * 1000)),
        },
      });
      setPosted(true);
      if (wallet && KEEPER_URL) {
        try {
          const onchain = await signAndSubmitScore({
            player: wallet,
            score: snap.score,
            lines: snap.lines,
          });
          if (onchain.ok) setChainNote("Signed to the Board.");
          else if (!onchain.skipped) setChainNote(onchain.error ?? "Keeper skipped this run.");
        } catch (err) {
          setChainNote(err instanceof Error ? err.message : "On-chain submit skipped.");
        }
      }
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Could not post score.");
    } finally {
      setPosting(false);
    }
  };

  const pad = (action: string, label: string) => (
    <button
      type="button"
      className="flex h-14 min-w-0 flex-1 items-center justify-center rounded-md border border-border bg-elevated text-xs font-medium text-fg active:bg-accent active:text-accent-fg"
      onPointerDown={(e) => {
        e.preventDefault();
        unlockAudio();
        const eng = engineRef.current;
        if (!eng) return;
        if (action === "left" || action === "right" || action === "soft") {
          eng.setHeld(action, true);
        } else {
          eng.tap(action);
        }
      }}
      onPointerUp={() => {
        const eng = engineRef.current;
        if (!eng) return;
        if (action === "left" || action === "right" || action === "soft") eng.setHeld(action, false);
      }}
      onPointerCancel={() => {
        engineRef.current?.setHeld("left", false);
        engineRef.current?.setHeld("right", false);
        engineRef.current?.setHeld("soft", false);
      }}
    >
      {label}
    </button>
  );

  const overlayOpen = !snap?.started || snap.paused || snap.over;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-3">
      <div
        ref={wellSlotRef}
        className="flex min-h-0 flex-1 items-center justify-center"
      >
        <div
          ref={frameRef}
          className="relative touch-none overflow-hidden rounded-lg border border-border bg-surface"
        >
          <canvas ref={hostRef} className="block" style={{ touchAction: "none" }} />
          {snap?.overlay && snap.started && !snap.over && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="font-display text-3xl italic tracking-tight text-fg drop-shadow-[0_2px_0_#140e0c]">
                {snap.overlay}
              </p>
            </div>
          )}
          {overlayOpen && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-bg/80 px-5 text-center">
              {!snap?.started && (
                <>
                  <div
                    className="h-16 w-16 sm:h-28 sm:w-28"
                    aria-hidden
                    dangerouslySetInnerHTML={{ __html: LOGO_SVG }}
                  />
                  <p className="max-w-xs text-xs text-muted sm:text-sm">
                    Stack cats. Clear lines. Watch for black cats that refuse to move, spin, or wait.
                  </p>
                  <Button variant="accent" size="lg" onClick={start}>
                    Start run
                  </Button>
                </>
              )}
              {snap?.paused && (
                <>
                  <p className="font-display text-3xl italic">Paused</p>
                  <Button onClick={() => engineRef.current?.togglePause()}>Resume</Button>
                </>
              )}
              {snap?.over && (
                <>
                  <p className="font-display text-3xl italic">Litter full</p>
                  <p className="tabular text-2xl">{formatScore(snap.score)}</p>
                  <p className="text-sm text-muted">
                    {snap.lines} lines · {snap.specials} black cats · best {formatScore(Math.max(best, snap.score))}
                  </p>
                  <label className="flex w-full max-w-xs flex-col gap-1 text-left text-xs text-muted">
                    Handle
                    <input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.slice(0, 20))}
                      className="h-11 rounded-md border border-border bg-elevated px-3 text-sm text-fg"
                    />
                  </label>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="accent" onClick={start}>
                      Play again
                    </Button>
                    <Button variant="outline" onClick={() => void postRun()} disabled={posted || posting}>
                      {posted ? "Posted" : posting ? "Posting" : "Post to arena"}
                    </Button>
                  </div>
                  {postError && <p className="text-sm text-danger">{postError}</p>}
                  {chainNote && <p className="text-xs text-muted">{chainNote}</p>}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 border-t border-border bg-bg pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mb-2 flex items-center gap-3">
          <HudStat label="Score" value={formatScore(snap?.score ?? 0)} />
          <HudStat label="Best" value={formatScore(Math.max(best, snap?.score ?? 0))} />
          <HudStat label="Lines" value={String(snap?.lines ?? 0)} />
          <HudStat label="Lv" value={String(snap?.level ?? 1)} />
          <div className="ml-auto flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-2"
              onClick={() => engineRef.current?.togglePause()}
              disabled={!snap?.started || snap.over}
            >
              {snap?.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 px-2"
              onClick={() => {
                const next = !isMuted();
                setMuted(next);
                setMutedState(next);
              }}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </Button>
          </div>
        </div>
        <div className="flex gap-1.5">
          {pad("left", "←")}
          {pad("right", "→")}
          {pad("rotate", "Spin")}
          {pad("soft", "↓")}
          {pad("hard", "Drop")}
          {pad("hold", "Hold")}
        </div>
      </div>

      <aside className="hidden lg:grid lg:content-start lg:gap-3">
        <Stat label="Score" value={formatScore(snap?.score ?? 0)} />
        <Stat label="Best" value={formatScore(Math.max(best, snap?.score ?? 0))} />
        <Stat label="Lines" value={String(snap?.lines ?? 0)} />
        <Stat label="Level" value={String(snap?.level ?? 1)} />

        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="mb-2 text-xs tracking-widest text-muted uppercase">Hold / Next</p>
          <div className="flex items-center justify-between gap-2">
            <canvas ref={holdRef} className="size-16 rounded-sm bg-elevated" width={64} height={64} />
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <canvas
                  key={i}
                  ref={(el) => {
                    nextRefs.current[i] = el;
                  }}
                  className="size-14 rounded-sm bg-elevated"
                  width={56}
                  height={56}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => engineRef.current?.togglePause()}
            disabled={!snap?.started || snap.over}
          >
            {snap?.paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {snap?.paused ? "Resume" : "Pause"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const next = !isMuted();
              setMuted(next);
              setMutedState(next);
            }}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
        </div>

        <div className="space-y-2 text-xs text-muted">
          <p className="flex flex-wrap gap-1">
            <KeyCap>←</KeyCap>
            <KeyCap>→</KeyCap> move
          </p>
          <p className="flex flex-wrap gap-1">
            <KeyCap>↑</KeyCap> / <KeyCap>Z</KeyCap> rotate
          </p>
          <p className="flex flex-wrap gap-1">
            <KeyCap>↓</KeyCap> soft · <KeyCap>space</KeyCap> drop
          </p>
          <p className="flex flex-wrap gap-1">
            <KeyCap>C</KeyCap> hold · <KeyCap>P</KeyCap> pause
          </p>
          <p className="pt-2 leading-relaxed">
            Black cats: Still cannot rotate, Lazy cannot slide, Pounce slams down.
          </p>
        </div>
      </aside>
    </div>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="shrink-0">
      <p className="text-[9px] tracking-widest text-muted uppercase">{label}</p>
      <p className="font-display text-base tabular leading-none">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs tracking-widest text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl tabular tracking-tight">{value}</p>
    </div>
  );
}
