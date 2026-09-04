import { useEffect, useRef } from "react";
import { drawCatSprite, preloadCats } from "@/lib/game/cats";
import { ALL_SPRITE_COLORS, PIECES } from "@/lib/game/pieces";
import type { Role } from "@/lib/game/types";

const COLS = 10;
const ROWS = 12;
const STACK: { piece: number; x: number; y: number }[] = [
  { piece: 0, x: 3, y: 9 },
  { piece: 1, x: 1, y: 7 },
  { piece: 4, x: 6, y: 7 },
  { piece: 2, x: 3, y: 6 },
  { piece: 3, x: 0, y: 5 },
  { piece: 6, x: 6, y: 5 },
  { piece: 5, x: 2, y: 3 },
];

export function HeroWell() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let gone = false;
    const paint = () => {
      const canvas = ref.current;
      if (!canvas || gone) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = canvas.clientWidth || 420;
      const cell = cssW / COLS;
      const cssH = cell * ROWS;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#140f0c";
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.strokeStyle = "rgba(243,234,216,0.05)";
      ctx.lineWidth = 1;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cell + 0.5, 0);
        ctx.lineTo(c * cell + 0.5, cssH);
        ctx.stroke();
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, cssW, cssH);
      ctx.clip();
      for (const slot of STACK) {
        const p = PIECES[slot.piece];
        if (!p) continue;
        p.roles.forEach((row, r) =>
          row.forEach((role, c) => {
            if (!role) return;
            drawCatSprite(ctx, slot.x + c, slot.y + r, cell, p.color, role as Role, false);
          }),
        );
      }
      ctx.restore();
    };

    void preloadCats(ALL_SPRITE_COLORS).then(paint);
    const ro = new ResizeObserver(paint);
    if (ref.current) ro.observe(ref.current);
    return () => {
      gone = true;
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-surface">
      <canvas ref={ref} className="block w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-bg/90 to-transparent px-6 py-5">
        <p className="font-display text-2xl italic">Well 10×20</p>
        <p className="text-xs tracking-widest text-muted uppercase">Original sprites</p>
      </div>
    </div>
  );
}
