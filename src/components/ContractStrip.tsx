import { CATRIS, explorerAddress, isDeployed } from "@/lib/chain";

function shortAddr(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

const ROWS = [
  { label: "$CATRIS", value: CATRIS.token },
  { label: "Bowl", value: CATRIS.vault },
  { label: "Well", value: CATRIS.board },
] as const;

export function ContractStrip() {
  return (
    <div className="mt-8 grid gap-2 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
      {ROWS.map((row) => {
        const live = isDeployed(row.value);
        return (
          <div key={row.label}>
            <p className="text-[11px] tracking-widest text-muted uppercase">{row.label}</p>
            {live ? (
              <a
                className="mt-1 block font-mono text-sm text-fg underline decoration-border underline-offset-4 hover:text-accent"
                href={explorerAddress(row.value)}
                target="_blank"
                rel="noreferrer"
              >
                {shortAddr(row.value)}
              </a>
            ) : (
              <p className="mt-1 font-mono text-sm text-subtle">on letscash</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
