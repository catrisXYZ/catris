import { useEffect, useRef } from "react";
import { drawCatSprite, preloadCats } from "@/lib/game/cats";
import { ALL_SPRITE_COLORS, PIECES } from "@/lib/game/pieces";
import type { Role } from "@/lib/game/types";

type Variant = "arena" | "vault" | "docs" | "bowl" | "well" | "pounce" | "cream" | "whiskers";

const COLS = 10;
const ROWS = 7;

const STACKS: Record<Variant, { piece: number; x: number; y: number }[]> = {
  arena: [
    { piece: 0, x: 3, y: 5 },
    { piece: 1, x: 1, y: 3 },
    { piece: 2, x: 6, y: 4 },
    { piece: 5, x: 4, y: 2 },
  ],
  well: [
    { piece: 0, x: 3, y: 5 },
    { piece: 1, x: 1, y: 3 },
    { piece: 2, x: 6, y: 4 },
    { piece: 5, x: 4, y: 2 },
  ],
  vault: [
    { piece: 3, x: 0, y: 4 },
    { piece: 4, x: 3, y: 4 },
    { piece: 6, x: 7, y: 4 },
    { piece: 1, x: 4, y: 2 },
  ],
  bowl: [
    { piece: 3, x: 0, y: 4 },
    { piece: 4, x: 3, y: 4 },
    { piece: 6, x: 7, y: 4 },
    { piece: 1, x: 4, y: 2 },
  ],
  docs: [
    { piece: 2, x: 3, y: 4 },
    { piece: 5, x: 1, y: 2 },
    { piece: 6, x: 6, y: 2 },
    { piece: 0, x: 3, y: 0 },
  ],
  pounce: [
    { piece: 6, x: 2, y: 5 },
    { piece: 2, x: 5, y: 4 },
    { piece: 0, x: 3, y: 1 },
  ],
  cream: [
    { piece: 1, x: 2, y: 5 },
    { piece: 5, x: 5, y: 4 },
    { piece: 3, x: 0, y: 3 },
    { piece: 4, x: 7, y: 3 },
  ],
  whiskers: [
    { piece: 2, x: 1, y: 5 },
    { piece: 2, x: 4, y: 5 },
    { piece: 2, x: 7, y: 5 },
    { piece: 0, x: 3, y: 2 },
  ],
};

const COPY: Record<Variant, { kicker: string; title: string }> = {
  arena: { kicker: "This epoch", title: "Highest run takes the pot" },
  well: { kicker: "The well", title: "Ten by twenty. No rent control." },
  vault: { kicker: "The bowl", title: "Treats land here" },
  bowl: { kicker: "The bowl", title: "Treats land here" },
  docs: { kicker: "Manual", title: "Stack · spin · drop" },
  pounce: { kicker: "Pounce", title: "One winner. Fifteen minutes." },
  cream: { kicker: "Cream", title: "Holders lap the leftover milk" },
  whiskers: { kicker: "Whiskers", title: "The crew that keeps the litter clean" },
};

export function PageWell({ variant }: { variant: Variant }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const copy = COPY[variant];

  useEffect(() => {
    let gone = false;
    const paint = () => {
      const canvas = ref.current;
      if (!canvas || gone) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = canvas.clientWidth || 320;
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
      ctx.strokeStyle = "rgba(243,234,216,0.06)";
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
      for (const slot of STACKS[variant]) {
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
  }, [variant]);

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-[#c96a4a]/40 bg-surface shadow-[inset_0_0_0_6px_#2a221c,inset_0_0_0_8px_#e07a5f]">
      <canvas ref={ref} className="block w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-bg via-bg/70 to-transparent px-5 py-4">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-muted uppercase">{copy.kicker}</p>
          <p className="font-display text-xl italic text-fg sm:text-2xl">{copy.title}</p>
        </div>
      </div>
    </div>
  );
}
