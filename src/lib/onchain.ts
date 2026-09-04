import { createServerFn } from "@tanstack/react-start";
import { createPublicClient, http } from "viem";
import { vaultAbi } from "@/lib/abis";
import { CATRIS, robinhoodChain, isDeployed } from "@/lib/chain";

export const readVaultBuckets = createServerFn({ method: "GET" }).handler(async () => {
  if (!isDeployed(CATRIS.vault)) return null as { prize: string; drip: string; team: string } | null;
  const client = createPublicClient({
    chain: robinhoodChain,
    transport: http(robinhoodChain.rpcUrls.default.http[0]),
  });
  try {
    const [prize, drip, team] = await client.readContract({
      address: CATRIS.vault,
      abi: vaultAbi,
      functionName: "buckets",
    });
    return { prize: prize.toString(), drip: drip.toString(), team: team.toString() };
  } catch {
    return null;
  }
});

export const readPendingTab = createServerFn({ method: "GET" }).handler(async () => {
  if (!isDeployed(CATRIS.vault)) return null as string | null;
  const client = createPublicClient({
    chain: robinhoodChain,
    transport: http(robinhoodChain.rpcUrls.default.http[0]),
  });
  try {
    const value = await client.readContract({
      address: CATRIS.vault,
      abi: vaultAbi,
      functionName: "pendingTab",
    });
    return value.toString();
  } catch {
    return null;
  }
});
