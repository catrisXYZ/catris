/**
 * Catris epoch keeper — 15 minute settlements on Robinhood Chain 4663.
 *
 * ENV
 *   RPC_URL          https://rpc.mainnet.chain.robinhood.com
 *   BOT_PRIVATE_KEY  keeper EOA (setBot on vault + board)
 *   VAULT_CA BOARD_CA TOKEN_CA
 *   PORT             3000
 *   ALLOW_ORIGIN     https://www.catris.xyz
 */
import { createServer } from "node:http";
import { MerkleTree } from "merkletreejs";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  ZeroAddress,
  ZeroHash,
  keccak256,
  solidityPacked,
  verifyMessage,
} from "ethers";

const RPC = process.env.RPC_URL || "https://rpc.mainnet.chain.robinhood.com";
const EPOCH_DURATION = 15 * 60;
const ORIGIN = process.env.ALLOW_ORIGIN || "*";

const VAULT_ABI = [
  "function settleEpoch(uint256 epochId, bytes32 merkleRoot, address winner, uint256 winnerPrize) external",
  "function harvest() external",
  "function pendingTab() external view returns (uint256)",
  "function buckets() external view returns (uint256 prize, uint256 drip, uint256 team)",
];
const BOARD_ABI = [
  "function submitScore(address player, uint256 score, uint256 lines, bytes32 nonce) external returns (bool)",
  "function markSettled(uint256 epochId) external",
  "function getCurrentLeader() external view returns (address winner, uint256 score)",
  "function getEpochWinner(uint256 epochId) external view returns (address winner, uint256 score, uint256 lines)",
  "function epochs(uint256 epochId) external view returns (address winner, uint256 topScore, uint256 topLines, bool settled)",
  "function currentEpoch() external view returns (uint256)",
  "function epochEndsAt() external view returns (uint256)",
];
const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

if (!process.env.BOT_PRIVATE_KEY || !process.env.VAULT_CA || !process.env.BOARD_CA) {
  console.error("[catris-keeper] missing BOT_PRIVATE_KEY / VAULT_CA / BOARD_CA");
  process.exit(1);
}

const provider = new JsonRpcProvider(RPC);
const wallet = new Wallet(process.env.BOT_PRIVATE_KEY, provider);
const vault = new Contract(process.env.VAULT_CA, VAULT_ABI, wallet);
const board = new Contract(process.env.BOARD_CA, BOARD_ABI, wallet);
const token = process.env.TOKEN_CA ? new Contract(process.env.TOKEN_CA, ERC20_ABI, provider) : null;

/** @type {{ root: string, leaves: { address: string, amount: bigint, leaf: string }[], epochId: string } | null} */
let currentMerkleData = null;

export function scoreMessage(player, score, lines, nonce) {
  return `Catris score v1:${player.toLowerCase()}:${score}:${lines}:${nonce}`;
}

function hashFn(value) {
  return keccak256(value);
}

async function handleScoreSubmit(player, score, lines, nonce, signature) {
  const recovered = verifyMessage(scoreMessage(player, score, lines, nonce), signature);
  if (recovered.toLowerCase() !== player.toLowerCase()) {
    return { ok: false, error: "invalid signature" };
  }
  const tx = await board.submitScore(player, score, lines, nonce);
  await tx.wait();
  return { ok: true, tx: tx.hash };
}

async function buildDripTree(dripPool) {
  if (!token || dripPool === 0n) return { root: ZeroHash, leaves: [] };
  const events = await token.queryFilter(token.filters.Transfer(), -4000);
  const holders = new Set();
  for (const e of events) {
    if (e.args?.to && e.args.to !== ZeroAddress) holders.add(e.args.to);
  }
  const entries = [];
  for (const holder of holders) {
    try {
      const bal = await token.balanceOf(holder);
      if (bal > 0n) entries.push({ address: holder, balance: bal });
    } catch {
      /* skip RPC blips */
    }
  }
  if (entries.length === 0) return { root: ZeroHash, leaves: [] };
  const total = entries.reduce((s, e) => s + e.balance, 0n);
  const leaves = entries
    .map((e) => {
      const amount = (dripPool * e.balance) / total;
      return {
        address: e.address,
        amount,
        leaf: keccak256(solidityPacked(["address", "uint256"], [e.address, amount])),
      };
    })
    .filter((l) => l.amount > 0n);
  const tree = new MerkleTree(
    leaves.map((l) => l.leaf),
    hashFn,
    { sortPairs: true },
  );
  return { root: tree.getHexRoot(), leaves };
}

async function settle() {
  const current = await board.currentEpoch();
  const epochId = current > 0n ? current - 1n : 0n;
  const rec = await board.epochs(epochId);
  const settled = rec.settled ?? rec[3];
  const winner = rec.winner ?? rec[0];
  const topScore = rec.topScore ?? rec[1];
  if (settled) {
    console.log(`[settle] epoch=${epochId} already settled`);
    return;
  }
  const { prize, drip } = await vault.buckets();
  console.log(`[settle] epoch=${epochId} winner=${winner} score=${topScore} prize=${prize} drip=${drip}`);
  const { root, leaves } = await buildDripTree(drip);
  const winnerPrize =
    winner && winner !== ZeroAddress && prize > 0n ? (prize * 80n) / 100n : 0n;
  const tx = await vault.settleEpoch(epochId, root, winner, winnerPrize);
  await tx.wait();
  const tx2 = await board.markSettled(epochId);
  await tx2.wait();
  currentMerkleData = { root, leaves, epochId: epochId.toString() };
  console.log(`[settle] tx=${tx.hash} prize=${winnerPrize} root=${root}`);
}

async function maybeHarvest() {
  try {
    const tx = await vault.harvest();
    await tx.wait();
    console.log(`[harvest] tx=${tx.hash}`);
  } catch (e) {
    console.error("[harvest]", e instanceof Error ? e.message : e);
  }
}

function scheduleNextEpoch() {
  const now = Math.floor(Date.now() / 1000);
  const next = (Math.floor(now / EPOCH_DURATION) + 1) * EPOCH_DURATION;
  const ms = (next - now) * 1000 + 5000;
  console.log(`[timer] next epoch in ${Math.round(ms / 1000)}s`);
  setTimeout(async () => {
    try {
      await maybeHarvest();
      await settle();
    } catch (e) {
      console.error("[epoch]", e instanceof Error ? e.message : e);
    }
    scheduleNextEpoch();
  }, ms);
}

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }
  const url = new URL(req.url || "/", "http://keeper");

  if (req.method === "POST" && url.pathname === "/submit-score") {
    let body = "";
    req.on("data", (d) => {
      body += d;
    });
    req.on("end", async () => {
      try {
        const { player, score, lines, nonce, signature } = JSON.parse(body);
        const result = await handleScoreSubmit(player, score, lines, nonce, signature);
        res.writeHead(result.ok ? 200 : 400);
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "bad request" }));
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/merkle-proof") {
    const player = url.searchParams.get("player")?.toLowerCase();
    if (!currentMerkleData || !player) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false }));
      return;
    }
    const entry = currentMerkleData.leaves.find((l) => l.address.toLowerCase() === player);
    if (!entry) {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: "not in tree" }));
      return;
    }
    const tree = new MerkleTree(
      currentMerkleData.leaves.map((l) => l.leaf),
      hashFn,
      { sortPairs: true },
    );
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, amount: entry.amount.toString(), proof: tree.getHexProof(entry.leaf) }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/status") {
    try {
      const [epochId, endsAt, leader] = await Promise.all([
        board.currentEpoch(),
        board.epochEndsAt(),
        board.getCurrentLeader(),
      ]);
      const { prize, drip } = await vault.buckets();
      res.writeHead(200);
      res.end(
        JSON.stringify({
          epochId: epochId.toString(),
          endsAt: endsAt.toString(),
          leader: leader[0],
          leaderScore: leader[1].toString(),
          prizeWei: prize.toString(),
          dripWei: drip.toString(),
        }),
      );
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : "status failed" }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "not found" }));
});

const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`[catris-keeper] :${PORT} vault=${process.env.VAULT_CA}`);
  scheduleNextEpoch();
});
