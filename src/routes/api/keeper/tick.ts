import { createFileRoute } from "@tanstack/react-router";
import { tick } from "@/lib/keeper/run";

export const Route = createFileRoute("/api/keeper/tick")({
  server: {
    handlers: {
      GET: async () => {
        const result = await tick();
        return Response.json(result, { status: result.ok ? 200 : 503 });
      },
      POST: async () => {
        const result = await tick();
        return Response.json(result, { status: result.ok ? 200 : 503 });
      },
    },
  },
});
