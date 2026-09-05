import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  type Address,
  verifyMessage,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { boardAbi, letscashHookAbi, vaultAbi } from "@/lib/abis";
import { CATRIS, LETSCASH, robinhoodChain } from "@/lib/chain";
import { scoreMessage } from "@/lib/keeper-client";

const ZERO = "0x0000000000000000000000000000000000000000" as Address;
const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex;

function keeperKey(): Hex | null {
  const raw = process.env.KEEPER_PRIVATE_KEY?.trim();
  if (!raw) return null;
  const hex = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) return null;
  return hex as Hex;
}

function clients() {
  const key = keeperKey();
  if (!key) return null;
  const account = privateKeyToAccount(key);
  const transport = http(robinhoodChain.rpcUrls.default.http[0]);
  const publicClient = createPublicClient({ chain: robinhoodChain, transport });
  const wallet = createWalletClient({ chain: robinhoodChain, transport, account });
  return { account, publicClient, wallet };
}

export function keeperConfigured() {
  return Boolean(keeperKey()) && CATRIS.vault !== ZERO && CATRIS.board !== ZERO;
}

export async function submitSignedScore(input: {
  player: string;
  score: number;
  lines: number;
  nonce: string;
  signature: string;
}) {
  const ctx = clients();
  if (!ctx) return { ok: false as const, error: "keeper offline" };

  const player = input.player as Address;
  const nonce = input.nonce as Hex;
  const message = scoreMessage(player, input.score, input.lines, nonce);
  const recovered = await verifyMessage({
    address: player,
    message,
    signature: input.signature as Hex,
  });
  if (!recovered) return { ok: false as const, error: "invalid signature" };

  const hash = await ctx.wallet.writeContract({
    address: CATRIS.board,
    abi: boardAbi,
    functionName: "submitScore",
    args: [player, BigInt(input.score), BigInt(input.lines), nonce],
    account: ctx.account,
    chain: robinhoodChain,
  });
  await ctx.publicClient.waitForTransactionReceipt({ hash });
  return { ok: true as const, tx: hash };
}

export async function tick() {
  const ctx = clients();
  if (!ctx) return { ok: false as const, error: "keeper offline — set KEEPER_PRIVATE_KEY" };

  const out: { harvest?: string; settle?: string; skipped?: string[] } = { skipped: [] };
  const poolId = CATRIS.poolId as Hex;

  try {
    const pending = await ctx.publicClient.readContract({
      address: LETSCASH.hook,
      abi: letscashHookAbi,
      functionName: "pending",
      args: [poolId],
    });
    if (pending > 0n) {
      const hash = await ctx.wallet.writeContract({
        address: CATRIS.vault,
        abi: vaultAbi,
        functionName: "harvest",
        account: ctx.account,
        chain: robinhoodChain,
      });
      await ctx.publicClient.waitForTransactionReceipt({ hash });
      out.harvest = hash;
    } else {
      out.skipped?.push("harvest empty");
    }
  } catch (e) {
    out.skipped?.push(`harvest ${e instanceof Error ? e.message : "failed"}`);
  }

  try {
    const epochId = await ctx.publicClient.readContract({
      address: CATRIS.board,
      abi: boardAbi,
      functionName: "currentEpoch",
    });
    const prev = epochId > 0n ? epochId - 1n : 0n;
    const rec = await ctx.publicClient.readContract({
      address: CATRIS.board,
      abi: boardAbi,
      functionName: "epochs",
      args: [prev],
    });
    const [winner, , , settled] = rec;
    if (settled) {
      out.skipped?.push(`epoch ${prev} settled`);
    } else {
      const [prize] = await ctx.publicClient.readContract({
        address: CATRIS.vault,
        abi: vaultAbi,
        functionName: "buckets",
      });
      const winnerPrize =
        winner !== ZERO && prize > 0n ? (prize * 80n) / 100n : 0n;
      const hash = await ctx.wallet.writeContract({
        address: CATRIS.vault,
        abi: vaultAbi,
        functionName: "settleEpoch",
        args: [prev, ZERO_HASH, winner, winnerPrize],
        account: ctx.account,
        chain: robinhoodChain,
      });
      await ctx.publicClient.waitForTransactionReceipt({ hash });
      const mark = await ctx.wallet.writeContract({
        address: CATRIS.board,
        abi: boardAbi,
        functionName: "markSettled",
        args: [prev],
        account: ctx.account,
        chain: robinhoodChain,
      });
      await ctx.publicClient.waitForTransactionReceipt({ hash: mark });
      out.settle = hash;
    }
  } catch (e) {
    out.skipped?.push(`settle ${e instanceof Error ? e.message : "failed"}`);
  }

  return { ok: true as const, ...out };
}
