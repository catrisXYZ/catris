import {
  type Address,
  type Hex,
  createPublicClient,
  encodePacked,
  getAddress,
  http,
  keccak256,
  parseAbiItem,
  zeroAddress,
} from "viem";
import { CATRIS, LETSCASH, robinhoodChain } from "@/lib/chain";

export type CreamLeaf = { address: Address; amount: bigint; leaf: Hex };

const TRANSFER = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);
const TOKEN_START = 54700000n;
const SKIP = new Set(
  [zeroAddress, CATRIS.vault, CATRIS.board, LETSCASH.hook].map((a) => a.toLowerCase()),
);

function hashPair(a: Hex, b: Hex): Hex {
  return (a.toLowerCase() < b.toLowerCase()
    ? keccak256(encodePacked(["bytes32", "bytes32"], [a, b]))
    : keccak256(encodePacked(["bytes32", "bytes32"], [b, a]))) as Hex;
}

function leafHash(address: Address, amount: bigint): Hex {
  return keccak256(encodePacked(["address", "uint256"], [address, amount])) as Hex;
}

export function buildTree(leaves: Hex[]): { root: Hex; layers: Hex[][] } {
  if (leaves.length === 0) {
    return {
      root: "0x0000000000000000000000000000000000000000000000000000000000000000",
      layers: [],
    };
  }
  let layer = [...leaves];
  if (layer.length % 2 === 1) layer.push(layer[layer.length - 1]!);
  const layers = [layer];
  while (layer.length > 1) {
    const next: Hex[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      next.push(hashPair(layer[i]!, layer[i + 1]!));
    }
    if (next.length % 2 === 1 && next.length > 1) next.push(next[next.length - 1]!);
    layer = next;
    layers.push(layer);
  }
  return { root: layer[0]!, layers };
}

export function getProof(layers: Hex[][], index: number): Hex[] {
  const proof: Hex[] = [];
  let i = index;
  for (let l = 0; l < layers.length - 1; l++) {
    const layer = layers[l]!;
    const pair = i ^ 1;
    proof.push(layer[pair] ?? layer[i]!);
    i = Math.floor(i / 2);
  }
  return proof;
}

export async function snapshotHolders() {
  const client = createPublicClient({
    chain: robinhoodChain,
    transport: http(robinhoodChain.rpcUrls.default.http[0]),
  });
  const latest = await client.getBlockNumber();
  const seen = new Set<Address>();
  const chunk = 8000n;
  for (let from = TOKEN_START; from <= latest; from += chunk) {
    const to = from + chunk - 1n > latest ? latest : from + chunk - 1n;
    try {
      const logs = await client.getLogs({
        address: CATRIS.token,
        event: TRANSFER,
        fromBlock: from,
        toBlock: to,
      });
      for (const log of logs) {
        if (log.args.to && log.args.to !== zeroAddress) seen.add(log.args.to);
        if (log.args.from && log.args.from !== zeroAddress) seen.add(log.args.from);
      }
    } catch {
      /* skip a noisy chunk */
    }
  }
  const erc = [parseAbiItem("function balanceOf(address) view returns (uint256)")];
  const entries: { address: Address; balance: bigint }[] = [];
  for (const raw of seen) {
    if (SKIP.has(raw.toLowerCase())) continue;
    const address = getAddress(raw);
    const code = await client.getCode({ address });
    if (code && code !== "0x") continue;
    const balance = await client.readContract({
      address: CATRIS.token,
      abi: erc,
      functionName: "balanceOf",
      args: [address],
    });
    if (balance > 0n) entries.push({ address, balance });
  }
  entries.sort((a, b) => a.address.toLowerCase().localeCompare(b.address.toLowerCase()));
  return entries;
}

export async function buildCreamTree(dripPool: bigint) {
  if (dripPool === 0n) return { root: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, leaves: [] as CreamLeaf[], layers: [] as Hex[][] };
  const holders = await snapshotHolders();
  const total = holders.reduce((s, h) => s + h.balance, 0n);
  if (total === 0n) {
    return { root: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, leaves: [] as CreamLeaf[], layers: [] as Hex[][] };
  }
  const leaves: CreamLeaf[] = holders
    .map((h) => {
      const amount = (dripPool * h.balance) / total;
      return { address: h.address, amount, leaf: leafHash(h.address, amount) };
    })
    .filter((l) => l.amount > 0n);
  const { root, layers } = buildTree(leaves.map((l) => l.leaf));
  return { root, leaves, layers };
}

const g = globalThis as typeof globalThis & {
  __catrisCream?: { root: Hex; leaves: CreamLeaf[]; layers: Hex[][] };
};

export function rememberCream(data: { root: Hex; leaves: CreamLeaf[]; layers: Hex[][] }) {
  g.__catrisCream = data;
}

export function recalledCream() {
  return g.__catrisCream ?? null;
}

export function proofFor(player: string) {
  const snap = g.__catrisCream;
  if (!snap) return null;
  const addr = player.toLowerCase();
  const idx = snap.leaves.findIndex((l) => l.address.toLowerCase() === addr);
  if (idx < 0) return null;
  const leaf = snap.leaves[idx]!;
  return {
    root: snap.root,
    amount: leaf.amount.toString(),
    proof: getProof(snap.layers, idx),
  };
}
