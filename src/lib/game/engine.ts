import {
  COLS,
  HIDDEN,
  ROWS,
  SPECIAL_LABEL,
  type ActivePiece,
  type Cell,
  type GameEvent,
  type Particle,
  type PieceName,
  type SpecialKind,
} from "./types";
import {
  PIECE_BY_NAME,
  SPECIAL_COLOR,
  cloneRoles,
  rotateRoles,
  shuffleBag,
} from "./pieces";

const LOCK_DELAY = 520;
const LOCK_RESETS = 15;
const DAS = 160;
const ARR = 38;
const SOFT_GRAVITY = 18;

export interface EngineSnapshot {
  grid: (Cell | null)[][];
  active: ActivePiece | null;
  ghostY: number;
  hold: ActivePiece | null;
  canHold: boolean;
  next: ActivePiece[];
  score: number;
  lines: number;
  level: number;
  combo: number;
  specials: number;
  elapsed: number;
  over: boolean;
  paused: boolean;
  started: boolean;
  overlay: string | null;
  particles: Particle[];
  shake: number;
  flashRows: number[];
  flashT: number;
}

export class CatrisEngine {
  grid: (Cell | null)[][] = [];
  active: ActivePiece | null = null;
  hold: ActivePiece | null = null;
  canHold = true;
  bag: PieceName[] = [];
  queue: ActivePiece[] = [];
  score = 0;
  lines = 0;
  level = 1;
  combo = -1;
  specials = 0;
  elapsed = 0;
  over = false;
  paused = false;
  started = false;
  overlay: string | null = null;
  overlayT = 0;
  particles: Particle[] = [];
  shake = 0;
  flashRows: number[] = [];
  flashT = 0;

  fallMs = 0;
  lockMs = 0;
  locking = false;
  lockResets = 0;
  dasDir: -1 | 0 | 1 = 0;
  dasMs = 0;
  arrMs = 0;
  lastSpecial = 0 as SpecialKind;
  specialCooldown = 0;
  timeBonusAcc = 0;
  lastRepeatName: PieceName | null = null;
  lastRepeatCount = 0;

  held: Record<string, boolean> = {};
  emit: (e: GameEvent) => void;

  constructor(emit: (e: GameEvent) => void = () => {}) {
    this.emit = emit;
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: ROWS + HIDDEN }, () =>
      Array<Cell | null>(COLS).fill(null),
    );
    this.active = null;
    this.hold = null;
    this.canHold = true;
    this.bag = [];
    this.queue = [];
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.specials = 0;
    this.elapsed = 0;
    this.over = false;
    this.paused = false;
    this.started = false;
    this.overlay = null;
    this.overlayT = 0;
    this.particles = [];
    this.shake = 0;
    this.flashRows = [];
    this.flashT = 0;
    this.fallMs = 0;
    this.lockMs = 0;
    this.locking = false;
    this.lockResets = 0;
    this.dasDir = 0;
    this.dasMs = 0;
    this.arrMs = 0;
    this.lastSpecial = 0;
    this.specialCooldown = 0;
    this.timeBonusAcc = 0;
    this.lastRepeatName = null;
    this.lastRepeatCount = 0;
    this.held = {};
    while (this.queue.length < 5) this.queue.push(this.spawnFromBag());
  }

  start() {
    this.reset();
    this.started = true;
    this.spawnNext();
  }

  togglePause() {
    if (!this.started || this.over) return;
    this.paused = !this.paused;
  }

  setHeld(action: string, down: boolean) {
    this.held[action] = down;
    if (action === "left") {
      if (down) {
        this.tryMove(-1);
        this.dasDir = -1;
        this.dasMs = 0;
        this.arrMs = 0;
      } else if (this.dasDir === -1) this.dasDir = 0;
    }
    if (action === "right") {
      if (down) {
        this.tryMove(1);
        this.dasDir = 1;
        this.dasMs = 0;
        this.arrMs = 0;
      } else if (this.dasDir === 1) this.dasDir = 0;
    }
  }

  tap(action: string) {
    if (!this.started) {
      this.start();
      return;
    }
    if (this.over) return;
    if (action === "pause") {
      this.togglePause();
      return;
    }
    if (this.paused) return;
    if (action === "rotate") this.tryRotate();
    if (action === "hard") this.hardDrop();
    if (action === "hold") this.tryHold();
    if (action === "soft") this.softDrop();
  }

  gravityMs() {
    return Math.max(70, 900 - (this.level - 1) * 72);
  }

  update(dt: number) {
    const cap = Math.min(dt, 0.05);
    this.shake = Math.max(0, this.shake - cap * 3.2);
    if (this.overlayT > 0) {
      this.overlayT -= cap;
      if (this.overlayT <= 0) this.overlay = null;
    }
    if (this.flashT > 0) {
      this.flashT -= cap;
      if (this.flashT <= 0) this.flashRows = [];
    }
    this.stepParticles(cap);

    if (!this.started || this.paused || this.over || !this.active) return;

    this.elapsed += cap;
    this.timeBonusAcc += cap;
    while (this.timeBonusAcc >= 10) {
      this.timeBonusAcc -= 10;
      this.score += 10;
    }
    this.specialCooldown = Math.max(0, this.specialCooldown - cap * 1000);

    if (this.dasDir !== 0) {
      this.dasMs += cap * 1000;
      if (this.dasMs >= DAS) {
        this.arrMs += cap * 1000;
        while (this.arrMs >= ARR) {
          this.arrMs -= ARR;
          if (!this.tryMove(this.dasDir)) break;
        }
      }
    }

    if (this.held.soft) {
      this.fallMs += cap * 1000 * (this.gravityMs() / SOFT_GRAVITY);
    } else {
      this.fallMs += cap * 1000;
    }

    if (this.active.special === 3) {
      this.hardDrop();
      return;
    }

    const g = this.gravityMs();
    while (this.fallMs >= g) {
      this.fallMs -= g;
      if (!this.tryFall()) break;
    }

    if (this.locking) {
      this.lockMs += cap * 1000;
      if (this.lockMs >= LOCK_DELAY) this.lockPiece();
    }
  }

  ghostY() {
    if (!this.active) return 0;
    const p = { ...this.active };
    while (!this.collides(p.x, p.y + 1, p.roles)) p.y++;
    return p.y;
  }

  snapshot(): EngineSnapshot {
    return {
      grid: this.grid,
      active: this.active,
      ghostY: this.ghostY(),
      hold: this.hold,
      canHold: this.canHold,
      next: this.queue.slice(0, 3),
      score: this.score,
      lines: this.lines,
      level: this.level,
      combo: Math.max(0, this.combo),
      specials: this.specials,
      elapsed: this.elapsed,
      over: this.over,
      paused: this.paused,
      started: this.started,
      overlay: this.overlay,
      particles: this.particles,
      shake: this.shake,
      flashRows: this.flashRows,
      flashT: this.flashT,
    };
  }

  private spawnFromBag(): ActivePiece {
    if (this.bag.length === 0) this.bag = shuffleBag();
    const name = this.bag.shift()!;
    if (this.lastRepeatName === name) {
      this.lastRepeatCount++;
      if (this.lastRepeatCount >= 2 && this.bag.length > 0) {
        const swap = this.bag.findIndex((n) => n !== name);
        if (swap >= 0) {
          const alt = this.bag[swap]!;
          this.bag[swap] = name;
          return this.makePiece(alt);
        }
      }
    } else {
      this.lastRepeatName = name;
      this.lastRepeatCount = 1;
    }
    return this.makePiece(name);
  }

  private makePiece(name: PieceName): ActivePiece {
    const def = PIECE_BY_NAME[name];
    let special: SpecialKind = 0;
    if (this.score >= 120 && this.specialCooldown <= 0 && Math.random() < 0.16) {
      const roll = (Math.floor(Math.random() * 3) + 1) as SpecialKind;
      special = roll === this.lastSpecial ? (((roll % 3) + 1) as SpecialKind) : roll;
      this.lastSpecial = special;
      this.specialCooldown = Math.max(8000, 22000 - this.score * 4);
    }
    const w = def.roles[0]?.length ?? 1;
    return {
      name,
      roles: cloneRoles(def.roles),
      color: special ? SPECIAL_COLOR : def.color,
      x: Math.floor(COLS / 2 - Math.ceil(w / 2)),
      y: 0,
      special,
    };
  }

  private spawnNext() {
    this.active = this.queue.shift() ?? this.spawnFromBag();
    while (this.queue.length < 5) this.queue.push(this.spawnFromBag());
    this.canHold = true;
    this.fallMs = 0;
    this.locking = false;
    this.lockMs = 0;
    this.lockResets = 0;
    if (this.active.special) {
      this.showOverlay(SPECIAL_LABEL[this.active.special] ?? "BLACK CAT");
      this.emit({ type: "special", special: this.active.special });
      this.specials++;
    }
    if (this.collides(this.active.x, this.active.y, this.active.roles)) {
      this.over = true;
      this.emit({ type: "gameover", score: this.score });
    }
  }

  private collides(x: number, y: number, roles: ActivePiece["roles"]) {
    for (let r = 0; r < roles.length; r++) {
      for (let c = 0; c < roles[r]!.length; c++) {
        if (!roles[r]![c]) continue;
        const gx = x + c;
        const gy = y + r;
        if (gx < 0 || gx >= COLS || gy >= ROWS + HIDDEN) return true;
        if (gy >= 0 && this.grid[gy]![gx]) return true;
      }
    }
    return false;
  }

  private tryMove(dir: number) {
    if (!this.active || this.active.special === 2) return false;
    if (!this.collides(this.active.x + dir, this.active.y, this.active.roles)) {
      this.active.x += dir;
      this.onShift();
      this.emit({ type: "move" });
      return true;
    }
    return false;
  }

  private tryRotate() {
    if (!this.active || this.active.special === 1) return;
    const rotated = rotateRoles(this.active.roles);
    const kicks = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [-2, 0],
      [2, 0],
      [-1, -1],
      [1, -1],
    ];
    for (const [dx, dy] of kicks) {
      if (!this.collides(this.active.x + dx, this.active.y + dy, rotated)) {
        this.active.roles = rotated;
        this.active.x += dx;
        this.active.y += dy;
        this.onShift();
        this.emit({ type: "rotate" });
        return;
      }
    }
  }

  private tryFall() {
    if (!this.active) return false;
    if (!this.collides(this.active.x, this.active.y + 1, this.active.roles)) {
      this.active.y++;
      this.locking = false;
      this.lockMs = 0;
      if (this.held.soft) this.score += 1;
      return true;
    }
    this.locking = true;
    return false;
  }

  private softDrop() {
    if (this.tryFall()) this.score += 1;
  }

  private hardDrop() {
    if (!this.active) return;
    let dist = 0;
    while (!this.collides(this.active.x, this.active.y + 1, this.active.roles)) {
      this.active.y++;
      dist++;
    }
    this.score += dist * 2;
    this.burst(this.active.x + 1, this.active.y, this.active.color, 8);
    this.shake = Math.min(1, this.shake + 0.28);
    this.emit({ type: "drop" });
    this.lockPiece();
  }

  private tryHold() {
    if (!this.active || !this.canHold) return;
    const current = this.makePiece(this.active.name);
    current.special = 0;
    current.color = PIECE_BY_NAME[this.active.name].color;
    if (!this.hold) {
      this.hold = current;
      this.spawnNext();
    } else {
      const swap = this.hold;
      this.hold = current;
      swap.x = Math.floor(COLS / 2 - Math.ceil((swap.roles[0]?.length ?? 1) / 2));
      swap.y = 0;
      this.active = swap;
      if (this.collides(swap.x, swap.y, swap.roles)) {
        this.over = true;
        this.emit({ type: "gameover", score: this.score });
      }
    }
    this.canHold = false;
    this.locking = false;
    this.lockMs = 0;
    this.emit({ type: "hold" });
  }

  private onShift() {
    if (!this.locking) return;
    if (this.lockResets < LOCK_RESETS) {
      this.lockMs = 0;
      this.lockResets++;
    }
    if (this.active && !this.collides(this.active.x, this.active.y + 1, this.active.roles)) {
      this.locking = false;
    }
  }

  private lockPiece() {
    if (!this.active) return;
    const piece = this.active;
    for (let r = 0; r < piece.roles.length; r++) {
      for (let c = 0; c < piece.roles[r]!.length; c++) {
        const role = piece.roles[r]![c];
        if (!role) continue;
        const gx = piece.x + c;
        const gy = piece.y + r;
        if (gy >= 0 && gy < ROWS + HIDDEN && gx >= 0 && gx < COLS) {
          this.grid[gy]![gx] = {
            color: piece.color,
            role,
            special: piece.special,
          };
        }
      }
    }
    this.active = null;
    this.emit({ type: "lock" });
    const cleared = this.clearLines();
    if (cleared === 0) this.combo = -1;
    this.spawnNext();
  }

  private clearLines() {
    const full: number[] = [];
    for (let r = 0; r < ROWS + HIDDEN; r++) {
      if (this.grid[r]!.every((c) => c)) full.push(r);
    }
    if (full.length === 0) return 0;
    this.flashRows = full.slice();
    this.flashT = 0.16;
    for (const r of full) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.grid[r]![c];
        if (cell) this.burst(c, r, cell.color, 6);
      }
    }
    const keep = this.grid.filter((_, i) => !full.includes(i));
    const pad = Array.from({ length: full.length }, () =>
      Array<Cell | null>(COLS).fill(null),
    );
    this.grid = [...pad, ...keep];
    this.combo = this.combo < 0 ? 0 : this.combo + 1;
    const table = [0, 100, 300, 500, 800];
    const gained =
      (table[full.length] ?? 800) * this.level + this.combo * 50 * this.level;
    this.score += gained;
    this.lines += full.length;
    const nextLevel = Math.floor(this.lines / 10) + 1;
    if (nextLevel > this.level) {
      this.level = nextLevel;
      this.emit({ type: "level" });
    }
    this.shake = Math.min(1, this.shake + 0.2 + full.length * 0.12);
    this.showOverlay(
      full.length === 4 ? "LITTER CLEAR" : full.length === 3 ? "TRIPLE" : null,
    );
    this.emit({ type: "clear", lines: full.length, score: gained });
    return full.length;
  }

  private showOverlay(text: string | null) {
    if (!text) return;
    this.overlay = text;
    this.overlayT = 1.4;
  }

  private burst(x: number, y: number, color: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 18 + Math.random() * 46;
      this.particles.push({
        x: (x + 0.5) * 10,
        y: (y + 0.5) * 10,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 12,
        life: 0.45 + Math.random() * 0.35,
        max: 0.8,
        color,
        size: 2 + Math.random() * 3,
      });
    }
    if (this.particles.length > 180) this.particles.splice(0, this.particles.length - 180);
  }

  private stepParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }
}
