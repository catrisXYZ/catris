export type Role = "head" | "body" | "tail" | "legs";

export type SpecialKind = 0 | 1 | 2 | 3;
// 0 none, 1 unrotatable, 2 unmovable, 3 forced hard-drop

export type PieceName = "I" | "O" | "T" | "J" | "L" | "S" | "Z";

export interface Cell {
  color: string;
  role: Role;
  special: SpecialKind;
}

export interface PieceDef {
  name: PieceName;
  color: string;
  /** Row-major matrix. null = empty. */
  roles: (Role | null)[][];
}

export interface ActivePiece {
  name: PieceName;
  roles: (Role | null)[][];
  color: string;
  x: number;
  y: number;
  special: SpecialKind;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export interface GameEvent {
  type:
    | "lock"
    | "clear"
    | "drop"
    | "rotate"
    | "move"
    | "special"
    | "gameover"
    | "hold"
    | "level";
  lines?: number;
  special?: SpecialKind;
  score?: number;
}

export const COLS = 10;
export const ROWS = 20;
export const HIDDEN = 2;

export const SPECIAL_LABEL: Record<SpecialKind, string | null> = {
  0: null,
  1: "UNROTATABLE!",
  2: "UNMOVABLE!",
  3: "HARD DROP!",
};
