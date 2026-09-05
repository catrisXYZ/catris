import { createFileRoute } from "@tanstack/react-router";
import { submitSignedScore } from "@/lib/keeper/run";

export const Route = createFileRoute("/api/keeper/submit-score")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
          },
        }),
      POST: async ({ request }) => {
        const headers = {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        };
        try {
          const body = (await request.json()) as {
            player?: string;
            score?: number;
            lines?: number;
            nonce?: string;
            signature?: string;
          };
          if (!body.player || !body.nonce || !body.signature || body.score == null) {
            return Response.json({ ok: false, error: "bad request" }, { status: 400, headers });
          }
          const result = await submitSignedScore({
            player: body.player,
            score: Number(body.score),
            lines: Number(body.lines ?? 0),
            nonce: body.nonce,
            signature: body.signature,
          });
          return Response.json(result, { status: result.ok ? 200 : 400, headers });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "bad request" },
            { status: 400, headers },
          );
        }
      },
    },
  },
});
