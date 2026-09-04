import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { currentEpoch } from "@/lib/chain";

export type ScoreRow = {
  id: number;
  handle: string;
  wallet: string | null;
  score: number;
  lines: number;
  specials: number;
  duration_ms: number;
  season: number;
  created_at: string;
};

const GHOSTS: Omit<ScoreRow, "id" | "created_at" | "season">[] = [
  { handle: "Black Cat", wallet: null, score: 25000, lines: 84, specials: 9, duration_ms: 420000 },
  { handle: "Mouse", wallet: null, score: 15890, lines: 61, specials: 6, duration_ms: 310000 },
  { handle: "Spicy Chicken", wallet: null, score: 8000, lines: 40, specials: 4, duration_ms: 240000 },
  { handle: "Harry Dotter", wallet: null, score: 3750, lines: 22, specials: 2, duration_ms: 180000 },
  { handle: "Yarnlord", wallet: null, score: 1500, lines: 12, specials: 1, duration_ms: 90000 },
  { handle: "CasualPaw", wallet: null, score: 900, lines: 8, specials: 0, duration_ms: 60000 },
  { handle: "4Player", wallet: null, score: 780, lines: 7, specials: 1, duration_ms: 54000 },
  { handle: "TetrisKitten", wallet: null, score: 250, lines: 3, specials: 0, duration_ms: 28000 },
];

async function seedIfEmpty() {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`select count(*)::int as n from catris_scores`;
  if ((rows[0]?.n ?? 0) > 0) return;
  const season = currentEpoch();
  for (const g of GHOSTS) {
    await sql`
      insert into catris_scores (handle, wallet, score, lines, specials, duration_ms, season)
      values (${g.handle}, ${null}, ${g.score}, ${g.lines}, ${g.specials}, ${g.duration_ms}, ${season})
    `;
  }
  await sql`
    insert into catris_seasons (season, title, starts_at, ends_at, prize_note)
    values (
      ${season},
      ${"Epoch " + season + " — Opening Litter"},
      to_timestamp(${Date.now() / 1000}),
      to_timestamp(${(Date.now() + 15 * 60) / 1000}),
      ${"60% of harvested PONS tax pays this 15-minute pot"}
    )
    on conflict (season) do nothing
  `;
}

export const listScores = createServerFn({ method: "GET" })
  .validator(
    z.object({
      season: z.number().int().positive().optional(),
      all: z.boolean().optional(),
      limit: z.number().int().min(1).max(50).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await seedIfEmpty();
    const sql = await getSql();
    const limit = data.limit ?? 20;
    if (data.all) {
      const rows = await sql<ScoreRow>`
        select id, handle, wallet, score, lines, specials, duration_ms, season,
               created_at::text as created_at
        from catris_scores
        order by score desc, created_at asc
        limit ${limit}
      `;
      return { season: 0, rows };
    }
    const season = data.season ?? currentEpoch();
    const rows = await sql<ScoreRow>`
      select id, handle, wallet, score, lines, specials, duration_ms, season,
             created_at::text as created_at
      from catris_scores
      where season = ${season}
      order by score desc, created_at asc
      limit ${limit}
    `;
    return { season, rows };
  });

export const submitScore = createServerFn({ method: "POST" })
  .validator(
    z.object({
      handle: z.string().trim().min(2).max(20),
      wallet: z.string().max(42).nullable().optional(),
      score: z.number().int().min(0).max(2_000_000),
      lines: z.number().int().min(0).max(800),
      specials: z.number().int().min(0).max(200),
      duration_ms: z.number().int().min(1_000).max(3_600_000),
    }),
  )
  .handler(async ({ data }) => {
    const handle = data.handle.replace(/[^\w\s.\-]/g, "").slice(0, 20);
    if (handle.length < 2) throw new Error("Handle too short.");
    const sql = await getSql();
    const season = currentEpoch();
    const wallet = data.wallet && /^0x[a-fA-F0-9]{40}$/.test(data.wallet) ? data.wallet : null;

    const recent = await sql<{ n: number }>`
      select count(*)::int as n from catris_scores
      where handle = ${handle}
        and created_at > now() - interval '8 minutes'
    `;
    if ((recent[0]?.n ?? 0) >= 3) {
      throw new Error("Slow down — a few minutes between runs.");
    }

    const [row] = await sql<ScoreRow>`
      insert into catris_scores (handle, wallet, score, lines, specials, duration_ms, season)
      values (${handle}, ${wallet}, ${data.score}, ${data.lines}, ${data.specials}, ${data.duration_ms}, ${season})
      returning id, handle, wallet, score, lines, specials, duration_ms, season,
                created_at::text as created_at
    `;
    return row;
  });

export const bestScore = createServerFn({ method: "GET" })
  .validator(z.object({ handle: z.string().min(2).max(20) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{ score: number }>`
      select score from catris_scores
      where handle = ${data.handle}
      order by score desc
      limit 1
    `;
    return rows[0]?.score ?? 0;
  });
