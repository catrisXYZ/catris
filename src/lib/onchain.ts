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

export type WellRun = {
  epoch: string;
  winner: string;
  score: string;
  lines: string;
  settled: boolean;
};

export const readWellLive = createServerFn({ method: "GET" }).handler(async () => {
  if (!isDeployed(CATRIS.board)) {
    return null as {
      epoch: string;
      leader: WellRun | null;
      last: WellRun | null;
      history: WellRun[];
      prize: string;
    } | null;
  }
  const client = createPublicClient({
    chain: robinhoodChain,
    transport: http(robinhoodChain.rpcUrls.default.http[0]),
  });
  try {
    const [epoch, leader, buckets] = await Promise.all([
      client.readContract({ address: CATRIS.board, abi: boardAbi, functionName: "currentEpoch" }),
      client.readContract({ address: CATRIS.board, abi: boardAbi, functionName: "getCurrentLeader" }),
      client.readContract({ address: CATRIS.vault, abi: vaultAbi, functionName: "buckets" }),
    ]);
    const [leadAddr, leadScore] = leader;
    const current: WellRun | null =
      leadAddr && leadAddr !== zeroAddress && leadScore > 0n
        ? {
            epoch: epoch.toString(),
            winner: leadAddr,
            score: leadScore.toString(),
            lines: "0",
            settled: false,
          }
        : null;

    const history: WellRun[] = [];
    for (let i = 1; i <= 8; i++) {
      const id = epoch - BigInt(i);
      if (id < 0n) break;
      const rec = await client.readContract({
        address: CATRIS.board,
        abi: boardAbi,
        functionName: "epochs",
        args: [id],
      });
      const [winner, topScore, topLines, settled] = rec;
      if (winner === zeroAddress || topScore === 0n) continue;
      history.push({
        epoch: id.toString(),
        winner,
        score: topScore.toString(),
        lines: topLines.toString(),
        settled,
      });
    }
    return {
      epoch: epoch.toString(),
      leader: current,
      last: history[0] ?? null,
      history,
      prize: buckets[0].toString(),
    };
  } catch {
    return null;
  }
});
