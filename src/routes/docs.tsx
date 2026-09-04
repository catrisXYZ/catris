import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CATRIS, LINKS, PONS } from "@/lib/chain";

export const Route = createFileRoute("/docs")({ component: DocsPage });

function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">Operators</p>
      <h1 className="mt-2 font-display text-4xl italic tracking-tight">
        Launch playbook
      </h1>
      <p className="mt-4 text-muted leading-relaxed">
        Two contracts, a 15-minute keeper, and a PONS v2 launch with a 3% creator
        tax pointed at the vault — not an EOA.
      </p>

      <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
        <Row k="Site" v={LINKS.site} href={LINKS.site} />
        <Row k="GitHub" v={LINKS.github} href={LINKS.github} />
        <Row k="X" v={`@${LINKS.xHandle}`} href={LINKS.x} />
        <Row k="Telegram" v={`@${LINKS.telegramHandle}`} href={LINKS.telegram} />
      </dl>

      <Section title="What we kept, what we changed">
        <p>
          Claude’s Vault + Board + 15-minute epoch is the right on-chain shape
          for a memecoin arcade. We kept that, and hardened the bits that would
          actually brick a launch:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            RPC is <code>https://rpc.mainnet.chain.robinhood.com</code> (chain
            4663). The shorter host in some notes does not resolve.
          </li>
          <li>
            <code>claimFromEscrow</code> no longer reverts when the escrow is
            empty — the keeper can poke it every epoch.
          </li>
          <li>
            Reentrancy lock on prize, drip, team, and escrow pulls.
          </li>
          <li>
            Player score signatures use <code>personal_sign</code> (EIP-191),
            not raw <code>ecrecover</code> of a packed hash — wallets actually
            do the former.
          </li>
          <li>Buybacks stay off. Name stays Catris, ticker CATRIS.</li>
        </ul>
      </Section>

      <Section title="1. Deploy helpers (Remix, 0.8.24, 200 runs)">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <code>CatrisVault(teamWallet)</code> — this address is the PONS
            creator fee recipient.{" "}
            <a className="underline decoration-border underline-offset-4" href="/contracts/CatrisVault.sol" download>
              Download
            </a>
          </li>
          <li>
            <code>CatrisBoard</code> — no constructor args.{" "}
            <a className="underline decoration-border underline-offset-4" href="/contracts/CatrisBoard.sol" download>
              Download
            </a>
          </li>
          <li>
            On the vault: <code>setBot(keeperEOA)</code>, then{" "}
            <code className="break-all">
              setMetadata("{LINKS.site}", "{LINKS.xHandle}", "{LINKS.github}", "{LINKS.telegram}")
            </code>
            .
          </li>
          <li>
            On the board: <code>setBot(keeperEOA)</code>,{" "}
            <code>setVault(VAULT_CA)</code>.
          </li>
        </ol>
      </Section>

      <Section title="2. Launch CATRIS on PONS v2">
        <p>
          Open the{" "}
          <a className="underline decoration-border underline-offset-4" href={PONS.launch} target="_blank" rel="noreferrer">
            PONS create page
          </a>
          .
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row k="Name" v="Catris" />
          <Row k="Symbol" v={CATRIS.symbol} />
          <Row k="Creator tax" v="3.00% (300 bps)" />
          <Row k="Fee recipient" v="VAULT_CA — never an EOA" />
          <Row k="Buyback" v="off" />
          <Row k="Pair" v="ETH" />
        </dl>
        <p className="mt-3">
          Then <code>setTokenCA(TOKEN_CA)</code> on the vault. Factory{" "}
          {PONS.factory}. Escrow {PONS.feeEscrow}.
        </p>
      </Section>

      <Section title="3. Keeper">
        <p>
          A 15-minute bot claims escrow, posts the epoch winner, and publishes
          the holder-drip merkle root. Source:{" "}
          <a className="underline decoration-border underline-offset-4" href="/keeper/epoch-bot.mjs" download>
            epoch-bot.mjs
          </a>{" "}
          +{" "}
          <a className="underline decoration-border underline-offset-4" href="/keeper/package.json" download>
            package.json
          </a>
          . Env: <code>RPC_URL</code>, <code>BOT_PRIVATE_KEY</code>,{" "}
          <code>VAULT_CA</code>, <code>BOARD_CA</code>, <code>TOKEN_CA</code>,{" "}
          <code>MIN_CLAIM_ETH</code>. Fund the keeper with ~0.1 ETH for gas.
        </p>
      </Section>

      <Section title="4. Site env">
        <p>
          After deploy, set <code>VITE_VAULT_CA</code>, <code>VITE_BOARD_CA</code>,{" "}
          <code>VITE_TOKEN_CA</code>, <code>VITE_KEEPER_URL</code>. Until those
          exist the arcade, arena, and vault screens still run — scores live in
          the shared board, chain writes wait for the keeper.
        </p>
      </Section>

      <Section title="Fee flow">
        <p className="font-mono text-xs leading-relaxed">
          trade $CATRIS → 3% creator tax → PONS escrow → claimFromEscrow →
          Vault 60 / 30 / 10 → epoch winner ETH, holder drip, team
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="font-display text-2xl italic">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function Row({ k, v, href }: { k: string; v: string; href?: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-36 shrink-0 text-subtle">{k}</dt>
      <dd className="text-fg">
        {href ? (
          <a
            className="underline decoration-border underline-offset-4 hover:text-accent"
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            {v}
          </a>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}
