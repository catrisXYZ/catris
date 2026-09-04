import { COLS, HIDDEN, ROWS, type Role } from "./types";
import type { EngineSnapshot } from "./engine";
import { drawCatSprite } from "./cats";

export function renderBoard(
  ctx: CanvasRenderingContext2D,
  snap: EngineSnapshot,
  cell: number,
  dpr: number,
) {
  const w = COLS * cell;
  const h = ROWS * cell;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const trauma = snap.shake * snap.shake;
  const ox = (Math.random() - 0.5) * trauma * 10;
  const oy = (Math.random() - 0.5) * trauma * 10;
  ctx.save();
  ctx.translate(ox, oy);

  ctx.fillStyle = "#140f0c";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(243,234,216,0.045)";
  ctx.lineWidth = 1;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cell + 0.5, 0);
    ctx.lineTo(c * cell + 0.5, h);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cell + 0.5);
    ctx.lineTo(w, r * cell + 0.5);
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.clip();

  const paint = (gx: number, gy: number, color: string, role: Role, ghost: boolean) => {
    const vis = gy - HIDDEN;
    if (vis < -1 || vis >= ROWS + 1) return;
    drawCatSprite(ctx, gx, vis, cell, color, role, ghost);
  };

  for (let r = 0; r < ROWS + HIDDEN; r++) {
    for (let c = 0; c < COLS; c++) {
      const cl = snap.grid[r]![c];
      if (cl) paint(c, r, cl.color, cl.role, false);
    }
  }

  if (snap.active) {
    const gy = snap.ghostY;
    snap.active.roles.forEach((row, r) =>
      row.forEach((role, c) => {
        if (!role) return;
        paint(snap.active!.x + c, gy + r, snap.active!.color, role, true);
      }),
    );
    snap.active.roles.forEach((row, r) =>
      row.forEach((role, c) => {
        if (!role) return;
        paint(snap.active!.x + c, snap.active!.y + r, snap.active!.color, role, false);
      }),
    );
  }

  if (snap.flashT > 0) {
    ctx.fillStyle = `rgba(243,234,216,${Math.min(0.45, snap.flashT * 3)})`;
    for (const r of snap.flashRows) {
      const vis = r - HIDDEN;
      if (vis >= 0 && vis < ROWS) ctx.fillRect(0, vis * cell, w, cell);
    }
  }

  for (const p of snap.particles) {
    const visY = p.y / 10 - HIDDEN;
    const visX = p.x / 10;
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(visX * cell, visY * cell, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.restore();
}

export function renderMini(
  ctx: CanvasRenderingContext2D,
  piece: EngineSnapshot["active"],
  size: number,
  dpr: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  if (!piece) return;
  let minC = 99,
    maxC = -1,
    minR = 99,
    maxR = -1;
  piece.roles.forEach((row, r) =>
    row.forEach((role, c) => {
      if (!role) return;
      minC = Math.min(minC, c);
      maxC = Math.max(maxC, c);
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
    }),
  );
  const pw = maxC - minC + 1;
  const ph = maxR - minR + 1;
  const cell = Math.floor(size / (Math.max(pw, ph) + 1.15));
  const ox = (size - pw * cell) / 2;
  const oy = (size - ph * cell) / 2;
  ctx.save();
  ctx.translate(ox, oy);
  piece.roles.forEach((row, r) =>
    row.forEach((role, c) => {
      if (!role) return;
      drawCatSprite(ctx, c - minC, r - minR, cell, piece.color, role, false);
    }),
  );
  ctx.restore();
}
