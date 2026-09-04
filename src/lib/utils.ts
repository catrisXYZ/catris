import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(address: string, size = 4) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function formatEth(wei: bigint, digits = 4) {
  const n = Number(wei) / 1e18;
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatScore(n: number) {
  return Math.max(0, Math.floor(n)).toLocaleString();
}
