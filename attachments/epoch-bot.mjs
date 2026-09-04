/**
 * Catris Epoch Keeper Bot
 * ─────────────────────────────────────────────────────────────────────────
 * Runs on Railway. Every 15 minutes:
 *   1. Reads current epoch winner from CatrisBoard
 *   2. Reads $CATRIS holder balances (for drip distribution)
 *   3. Builds merkle tree of {holder → dripShare}
 *   4. Calls CatrisVault.settleEpoch(epochId, merkleRoot, winner, prize)
 *   5. Claims from Pons Fee Escrow into vault (if pending > threshold)
 *
 * Also exposes /submit-score endpoint called by game client after game-over.
 *
 * ENV VARS (set in Railway):
 *   RPC_URL          = https://rpc.robinhoodchain.com  (or chain 4663 RPC)
 *   BOT_PRIVATE_KEY  = 0x...   (keeper EOA — keep funded with ETH for gas)
 *   VAULT_CA         = 0x...   (CatrisVault address)
 *   BOARD_CA         = 0x...   (CatrisBoard address)
 *   TOKEN_CA         = 0x...   (set after Pons v2 launch)
 *   PORT             = 3000
 *   MIN_CLAIM_ETH    = 0.005   (min escrow balance before auto-claim, in ETH)
 */

import { createPublicClient, createWalletClient, http, parseEther, keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { MerkleTree } from 'merkletreejs';
import { createServer } from 'http';
import { ethers } from 'ethers';

/* ─────────────── Chain config ─────────────── */

const ROBINHOOD_CHAIN = {
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.RPC_URL] } },
};

/* ─────────────── ABIs ─────────────── */

const VAULT_ABI = [
  'function settleEpoch(uint256 epochId, bytes32 merkleRoot, address winner, uint256 winnerPrize) external',
  'function claimFromEscrow() external',
  'function pendingEscrow() external view returns (uint256)',
  'function prizeWei() external view returns (uint256)',
  'function dripWei() external view returns (uint256)',
  'function currentMerkleRoot() external view returns (bytes32)',
  'function buckets() external view returns (uint256 prize, uint256 drip, uint256 team)',
];

const BOARD_ABI = [
  'function submitScore(address player, uint256 score, uint256 lines, bytes32 nonce) external returns (bool)',
  'function markSettled(uint256 epochId) external',
  'function getCurrentLeader() external view returns (address winner, uint256 score)',
  'function getEpochWinner(uint256 epochId) external view returns (address winner, uint256 score, uint256 lines)',
  'function currentEpoch() external view returns (uint256)',
  'function epochEndsAt() external view returns (uint256)',
  'function getPlayerScore(uint256 epochId, address player) external view returns (tuple(address player, uint256 score, uint256 lines, uint256 ts))',
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

/* ─────────────── Init ─────────────── */

const account = privateKeyToAccount(process.env.BOT_PRIVATE_KEY);

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet   = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, provider);

const vault = new ethers.Contract(process.env.VAULT_CA, VAULT_ABI, wallet);
const board = new ethers.Contract(process.env.BOARD_CA, BOARD_ABI, wallet);
const token = process.env.TOKEN_CA
  ? new ethers.Contract(process.env.TOKEN_CA, ERC20_ABI, provider)
  : null;

const EPOCH_DURATION = 15 * 60; // 15 minutes in seconds
const MIN_CLAIM_ETH  = parseFloat(process.env.MIN_CLAIM_ETH ?? '0.005');

/* ─────────────── Score queue (in-memory, reset each epoch) ─────────────── */

// player address → { score, lines, ts }
const pendingScores = new Map();

/**
 * Called by game client after game-over via POST /submit-score
 * Verifies player signature then posts to chain.
 */
async function handleScoreSubmit(player, score, lines, nonce, signature) {
  try {
    // Verify signature: player signed keccak(player, score, lines, nonce)
    const message = ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'uint256', 'bytes32'],
      [player, score, lines, nonce]
    );
    const recovered = ethers.recoverAddress(message, signature);
    if (recovered.toLowerCase() !== player.toLowerCase()) {
      return { ok: false, error: 'invalid signature' };
    }

    // Queue to chain
    const tx = await board.submitScore(player, score, lines, nonce);
    await tx.wait();

    // Track locally for drip calc
    const existing = pendingScores.get(player.toLowerCase());
    if (!existing || score > existing.score) {
      pendingScores.set(player.toLowerCase(), { score, lines, ts: Date.now() });
    }

    console.log(`[score] ${player} score=${score} lines=${lines} tx=${tx.hash}`);
    return { ok: true, tx: tx.hash };
  } catch (e) {
    console.error('[score] error:', e.message);
    return { ok: false, error: e.message };
  }
}

/* ─────────────── Drip merkle tree ─────────────── */

/**
 * Build merkle tree from holder balances.
 * Drip amount is proportional to $CATRIS balance.
 * Only holders with balance > 0 are included.
 */
async function buildDripTree(dripPool) {
  if (!token || dripPool === 0n) {
    return { root: ethers.ZeroHash, tree: null, leaves: [] };
  }

  // Gather holders from Transfer events (simplified — in production use an indexer)
  const filter = token.filters.Transfer();
  const events = await token.queryFilter(filter, -10000); // last 10k blocks
  const holders = new Set();
  events.forEach(e => {
    if (e.args.to !== ethers.ZeroAddress) holders.add(e.args.to.toLowerCase());
  });

  // Fetch balances
  const entries = [];
  for (const holder of holders) {
    try {
      const bal = await token.balanceOf(holder);
      if (bal > 0n) entries.push({ address: holder, balance: bal });
    } catch {}
  }

  if (entries.length === 0) return { root: ethers.ZeroHash, tree: null, leaves: [] };

  const totalBalance = entries.reduce((s, e) => s + e.balance, 0n);

  // Calculate drip amounts (proportional to balance)
  const leaves = entries.map(e => {
    const amount = (dripPool * e.balance) / totalBalance;
    return {
      address: e.address,
      amount,
      leaf: keccak256(encodePacked(['address', 'uint256'], [e.address, amount])),
    };
  }).filter(l => l.amount > 0n);

  const tree = new MerkleTree(
    leaves.map(l => l.leaf),
    keccak256,
    { sortPairs: true }
  );

  return { root: tree.getHexRoot(), tree, leaves };
}

/* ─────────────── Epoch settlement ─────────────── */

async function settle() {
  try {
    const epochId = await board.currentEpoch();
    const [winner, topScore] = await board.getCurrentLeader();
    const { drip } = await vault.buckets();

    console.log(`[settle] epoch=${epochId} winner=${winner} score=${topScore} dripWei=${drip}`);

    // Build merkle tree for holder drip
    const { root, leaves } = await buildDripTree(drip);

    // Prize = up to 80% of current prize pool (keep 20% rolling)
    const prizePool = (await vault.buckets()).prize;
    const winnerPrize = winner !== ethers.ZeroAddress && prizePool > 0n
      ? (prizePool * 80n) / 100n
      : 0n;

    const tx = await vault.settleEpoch(epochId, root, winner, winnerPrize);
    await tx.wait();

    // Mark board settled
    const tx2 = await board.markSettled(epochId);
    await tx2.wait();

    // Save merkle data for API
    global.currentMerkleData = { root, leaves, epochId: epochId.toString() };

    console.log(`[settle] done tx=${tx.hash} winner=${winner} prize=${winnerPrize} merkleRoot=${root}`);
    pendingScores.clear();

  } catch (e) {
    console.error('[settle] error:', e.message);
  }
}

/* ─────────────── Escrow auto-claim ─────────────── */

async function maybeClaimEscrow() {
  try {
    const pending = await vault.pendingEscrow();
    const threshold = parseEther(String(MIN_CLAIM_ETH));
    if (pending >= threshold) {
      const tx = await vault.claimFromEscrow();
      await tx.wait();
      console.log(`[escrow] claimed ${ethers.formatEther(pending)} ETH tx=${tx.hash}`);
    }
  } catch (e) {
    console.error('[escrow] error:', e.message);
  }
}

/* ─────────────── Epoch timer ─────────────── */

function scheduleNextEpoch() {
  const now  = Math.floor(Date.now() / 1000);
  const next = (Math.floor(now / EPOCH_DURATION) + 1) * EPOCH_DURATION;
  const ms   = (next - now) * 1000 + 5000; // +5s buffer after epoch flips
  console.log(`[timer] next epoch in ${Math.round(ms/1000)}s`);
  setTimeout(async () => {
    await maybeClaimEscrow();
    await settle();
    scheduleNextEpoch();
  }, ms);
}

/* ─────────────── HTTP API ─────────────── */

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = new URL(req.url, `http://localhost`);

  // POST /submit-score  — game client posts after game-over
  if (req.method === 'POST' && url.pathname === '/submit-score') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', async () => {
      try {
        const { player, score, lines, nonce, signature } = JSON.parse(body);
        const result = await handleScoreSubmit(player, score, lines, nonce, signature);
        res.writeHead(result.ok ? 200 : 400);
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: 'bad request' }));
      }
    });
    return;
  }

  // GET /merkle-proof?player=0x...  — site fetches proof for claim UI
  if (req.method === 'GET' && url.pathname === '/merkle-proof') {
    const player = url.searchParams.get('player')?.toLowerCase();
    const data   = global.currentMerkleData;
    if (!data || !player) {
      res.writeHead(404); res.end(JSON.stringify({ ok: false })); return;
    }
    const entry = data.leaves.find(l => l.address.toLowerCase() === player);
    if (!entry) {
      res.writeHead(404); res.end(JSON.stringify({ ok: false, error: 'not in tree' })); return;
    }
    // Reconstruct tree for proof
    const tree = new MerkleTree(data.leaves.map(l => l.leaf), keccak256, { sortPairs: true });
    const proof = tree.getHexProof(entry.leaf);
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, amount: entry.amount.toString(), proof }));
    return;
  }

  // GET /status  — health + current epoch info
  if (req.method === 'GET' && url.pathname === '/status') {
    try {
      const [epochId, endsAt, leader, score] = await Promise.all([
        board.currentEpoch(),
        board.epochEndsAt(),
        board.getCurrentLeader().then(r => r[0]),
        board.getCurrentLeader().then(r => r[1]),
      ]);
      const { prize, drip } = await vault.buckets();
      res.writeHead(200);
      res.end(JSON.stringify({
        epochId: epochId.toString(),
        endsAt: endsAt.toString(),
        leader,
        leaderScore: score.toString(),
        prizeWei: prize.toString(),
        dripWei: drip.toString(),
      }));
    } catch (e) {
      res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404); res.end(JSON.stringify({ error: 'not found' }));
});

const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
  console.log(`[catris-keeper] listening on :${PORT}`);
  console.log(`[catris-keeper] vault=${process.env.VAULT_CA} board=${process.env.BOARD_CA}`);
  scheduleNextEpoch();
});
