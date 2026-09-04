import type { PieceDef, PieceName, Role } from "./types";

export const PIECES: PieceDef[] = [
  {
    name: "I",
    color: "#ff6666",
    roles: [["head", "body", "body", "tail"]],
  },
  {
    name: "O",
    color: "#0044ff",
    roles: [
      ["head", "body"],
      ["legs", "tail"],
    ],
  },
  {
    name: "T",
    color: "#99ff99",
    roles: [
      [null, "head", null],
      ["tail", "body", "legs"],
    ],
  },
  {
    name: "L",
    color: "#ffcc66",
    roles: [
      ["head", null, null],
      ["tail", "body", "legs"],
    ],
  },
  {
    name: "J",
    color: "#ff7b00",
    roles: [
      [null, null, "head"],
      ["legs", "body", "tail"],
    ],
  },
  {
    name: "S",
    color: "#f266ff",
    roles: [
      ["head", "body", null],
      [null, "legs", "tail"],
    ],
  },
  {
    name: "Z",
    color: "#62cdff",
    roles: [
      [null, "body", "head"],
      ["tail", "legs", null],
    ],
  },
];

export const PIECE_BY_NAME: Record<PieceName, PieceDef> = Object.fromEntries(
  PIECES.map((p) => [p.name, p]),
) as Record<PieceName, PieceDef>;

export const SPECIAL_COLOR = "#333333";

export const ALL_SPRITE_COLORS = [...PIECES.map((p) => p.color), SPECIAL_COLOR];

export function rotateRoles(roles: (Role | null)[][]): (Role | null)[][] {
  const h = roles.length;
  const w = roles[0]?.length ?? 0;
  const next: (Role | null)[][] = Array.from({ length: w }, () =>
    Array<Role | null>(h).fill(null),
  );
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      next[c][h - 1 - r] = roles[r][c];
    }
  }
  return next;
}

export function cloneRoles(roles: (Role | null)[][]) {
  return roles.map((row) => row.slice());
}

export function shuffleBag(): PieceName[] {
  const bag: PieceName[] = ["I", "O", "T", "J", "L", "S", "Z"];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = bag[i]!;
    bag[i] = bag[j]!;
    bag[j] = tmp;
  }
  return bag;
}
