export function scoreMessage(player: string, score: number, lines: number, nonce: string) {
  return `Catris score v1:${player.toLowerCase()}:${score}:${lines}:${nonce}`;
}

export function randomNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function utf8Hex(message: string) {
  const bytes = new TextEncoder().encode(message);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export async function signAndSubmitScore(opts: {
  player: string;
  score: number;
  lines: number;
}): Promise<{ ok: boolean; tx?: string; error?: string; skipped?: boolean }> {
  const eth =
    (typeof window !== "undefined"
      ? (window as unknown as { ethereum?: Eth }).ethereum
      : undefined) ?? null;
  if (!eth) return { ok: false, skipped: true, error: "no wallet" };

  const nonce = randomNonce();
  const message = scoreMessage(opts.player, opts.score, opts.lines, nonce);
  const signature = (await eth.request({
    method: "personal_sign",
    params: [utf8Hex(message), opts.player],
  })) as string;

  const res = await fetch("/api/keeper/submit-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      player: opts.player,
      score: opts.score,
      lines: opts.lines,
      nonce,
      signature,
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    tx?: string;
    error?: string;
  };
  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error ?? `keeper ${res.status}` };
  }
  return { ok: true, tx: body.tx };
}
