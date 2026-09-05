import { encodePacked, keccak256, type Address, type Hex } from "viem";
import { CREAM_SNAP } from "@/lib/keeper/cream-snap";

function hashPair(a: Hex, b: Hex): Hex {
  return (a.toLowerCase() < b.toLowerCase()
    ? keccak256(encodePacked(["bytes32", "bytes32"], [a, b]))
    : keccak256(encodePacked(["bytes32", "bytes32"], [b, a]))) as Hex;
}

function buildLayers(leaves: Hex[]): Hex[][] {
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
  return layers;
}

function proofAt(layers: Hex[][], index: number): Hex[] {
  const proof: Hex[] = [];
  let i = index;
  for (let l = 0; l < layers.length - 1; l++) {
    const layer = layers[l]!;
    proof.push(layer[i ^ 1] ?? layer[i]!);
    i = Math.floor(i / 2);
  }
  return proof;
}

const layers = buildLayers(CREAM_SNAP.leaves.map((l) => l.leaf as Hex));

export function localCreamProof(player: string) {
  const idx = CREAM_SNAP.leaves.findIndex((l) => l.address.toLowerCase() === player.toLowerCase());
  if (idx < 0) return null;
  const leaf = CREAM_SNAP.leaves[idx]!;
  return {
    ok: true as const,
    root: CREAM_SNAP.root,
    amount: leaf.amount,
    proof: proofAt(layers, idx),
    address: leaf.address as Address,
  };
}
