import { createServerFn } from "@tanstack/react-start";
import { createPublicClient, http, zeroAddress } from "viem";
import { boardAbi, vaultAbi } from "@/lib/abis";
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

export const readWellLeader = createServerFn({ method: "GET" }).handler(async () => {
  if (!isDeployed(CATRIS.board)) {
    return null as { winner: string; score: string; epoch: string } | null;
  }
  const client = createPublicClient({
    chain: robinhoodChain,
    transport: http(robinhoodChain.rpcUrls.default.http[0]),
  });
  try {
    const [epoch, leader] = await Promise.all([
      client.readContract({ address: CATRIS.board, abi: boardAbi, functionName: "currentEpoch" }),
      client.readContract({ address: CATRIS.board, abi: boardAbi, functionName: "getCurrentLeader" }),
    ]);
    const [winner, score] = leader;
    if (!winner || winner === zeroAddress || score === 0n) {
      return { winner: "", score: "0", epoch: epoch.toString() };
    }
    return { winner, score: score.toString(), epoch: epoch.toString() };
  } catch {
    return null;
  }
});
