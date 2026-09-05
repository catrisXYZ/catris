import { createFileRoute } from "@tanstack/react-router";
import { createPublicClient, http } from "viem";
import { vaultAbi } from "@/lib/abis";
import { CATRIS, robinhoodChain } from "@/lib/chain";
import { buildCreamTree, proofFor, rememberCream, recalledCream } from "@/lib/keeper/merkle";

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
        const [drip, onRoot] = await Promise.all([
          client.readContract({ address: CATRIS.vault, abi: vaultAbi, functionName: "dripWei" }),
          client.readContract({
            address: CATRIS.vault,
            abi: vaultAbi,
            functionName: "currentMerkleRoot",
          }),
        ]);
        if (onRoot === "0x0000000000000000000000000000000000000000000000000000000000000000") {
          return Response.json({ ok: false, error: "no cream list yet", drip: drip.toString() });
        }
        let snap = recalledCream();
        if (!snap || snap.root.toLowerCase() !== onRoot.toLowerCase()) {
          snap = await buildCreamTree(drip);
          rememberCream(snap);
        }
        if (snap.root.toLowerCase() !== onRoot.toLowerCase()) {
          return Response.json({ ok: false, error: "list moved, wait for the next knock" });
        }
        const proof = proofFor(player);
        if (!proof) return Response.json({ ok: false, error: "not on this list" });
        return Response.json({ ok: true, ...proof });
      },
    },
  },
});
