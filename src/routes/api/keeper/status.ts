import { createFileRoute } from "@tanstack/react-router";
import { keeperConfigured } from "@/lib/keeper/run";

export const Route = createFileRoute("/api/keeper/status")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          ok: true,
          configured: keeperConfigured(),
          vault: true,
          board: true,
        });
      },
    },
  },
});
