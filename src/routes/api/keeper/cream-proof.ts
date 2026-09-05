import { createFileRoute } from "@tanstack/react-router";
import { createPublicClient, http } from "viem";
import { vaultAbi } from "@/lib/abis";
import { CATRIS, robinhoodChain } from "@/lib/chain";
import { loadPostedCream, postedCreamRoot, proofFor } from "@/lib/keeper/merkle";

export const Route = createFileRoute("/api/keeper/cream-proof")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const player = new URL(request.url).searchParams.get("player") ?? "";
        if (!/^0x[a-fA-F0-9]{40}$/.test(player)) {
          return Response.json({ ok: false, error: "player" }, { status: 400 });
        }
        const client = createPublicClient({
          chain: robinhoodChain,
          transport: http(robinhoodChain.rpcUrls.default.http[0]),
        });
        let onRoot: `0x${string}`;
        try {
          onRoot = await client.readContract({
            address: CATRIS.vault,
            abi: vaultAbi,
            functionName: "currentMerkleRoot",
          });
        } catch {
          return Response.json({ ok: false, error: "chain busy, retry" });
        }
        const posted = postedCreamRoot();
        if (onRoot === "0x0000000000000000000000000000000000000000000000000000000000000000") {
          return Response.json({ ok: false, error: "no cream list yet" });
        }
        if (onRoot.toLowerCase() !== posted.toLowerCase()) {
          return Response.json({ ok: false, error: "list catching up — refresh in a minute" });
        }
        loadPostedCream();
        const proof = proofFor(player);
        if (!proof) return Response.json({ ok: false, error: "not on this list" });
        return Response.json({ ok: true, ...proof });
      },
    },
  },
});
