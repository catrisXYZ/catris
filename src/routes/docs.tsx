import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageWell } from "@/components/game/PageWell";
import { CATRIS, LINKS, PONS } from "@/lib/chain";

export const Route = createFileRoute("/docs")({ component: DocsPage });

function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageWell variant="docs" />
      <p className="mt-8 text-xs tracking-[0.2em] text-muted uppercase">Manual</p>
      <h1 className="mt-2 font-display text-4xl italic tracking-tight">
        Rules, mechanics, stack
      </h1>
      <p className="mt-4 text-muted leading-relaxed">
        Catris is guideline-feel Tetris with overflowing cat sprites. Stack
        cats, clear lines, post the run. Every 15 minutes the highest score
        takes 60% of the vault pot funded by a 3% PONS creator tax — paid to
        a contract, never an EOA.
      </p>

      <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
        <Row k="Play" v="catris.xyz/play" href={`${LINKS.site}/play`} />
        <Row k="Arena" v="catris.xyz/arena" href={`${LINKS.site}/arena`} />
        <Row k="GitHub" v={LINKS.github} href={LINKS.github} />
        <Row k="X / Telegram" v={`@${LINKS.xHandle}`} href={LINKS.x} />
      </dl>

      <Section title="The well">
        <p>
          Visible field is <strong className="text-fg">10 × 20</strong> with two
          hidden spawn rows above. Seven tetrominoes deal from a shuffled bag.
          A ghost marks the landing row. Hold parks one piece; specials lose
          their curse when held.
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row k="Field" v="10 columns × 20 rows (+2 hidden)" />
          <Row k="Deal" v="7-bag, no triple-repeat of the same cat" />
          <Row k="Gravity" v="900 ms at L1, −72 ms per level, floor 70 ms" />
          <Row k="Lock delay" v="520 ms, up to 15 resets" />
          <Row k="DAS / ARR" v="160 ms delay, 38 ms repeat" />
        </dl>
      </Section>

      <Section title="Controls">
        <dl className="grid gap-2 text-sm">
          <Row k="Left / right" v="← → or A / D" />
          <Row k="Soft drop" v="↓ or S  ·  +1 per row" />
          <Row k="Hard drop" v="Space  ·  +2 per row, locks on landing" />
          <Row k="Rotate" v="↑ or Z / X / W" />
          <Row k="Hold" v="C  ·  once per piece" />
          <Row k="Pause" v="P" />
        </dl>
        <p className="mt-3">
          On a phone the same six actions sit under the well. Soft drop is a
          press-and-hold; the rest are taps.
        </p>
      </Section>

      <Section title="Scoring">
        <p>
          Line clears scale with level. Combos add on top. A small clock bonus
          ticks while the run is alive.
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row k="Single" v="100 × level" />
          <Row k="Double" v="300 × level" />
          <Row k="Triple" v="500 × level" />
          <Row k="Quad" v="800 × level" />
          <Row k="Combo" v="+50 × combo × level" />
          <Row k="Clock" v="+10 every 10 seconds" />
          <Row k="Level" v="every 10 lines" />
        </dl>
      </Section>

      <Section title="Black cats">
        <p>
          After 120 points a cursed piece can spawn (~16% roll, with a score-
          scaled cooldown). They are the original specials: same sprite, black
          fur, a rule that fights you.
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row k="Still" v="UNROTATABLE — spin is dead" />
          <Row k="Lazy" v="UNMOVABLE — no slide left or right" />
          <Row k="Pounce" v="HARD DROP — slams itself every frame" />
        </dl>
        <p className="mt-3">
          Hold strips the curse. The next piece from the bag is ordinary again.
        </p>
      </Section>

      <Section title="Epochs and the arena">
        <p>
          A run ends when a cat locks above the well. Post it with a handle.
          The shared board stores every score. If a wallet is connected the
          same run is signed with <code>personal_sign</code> (EIP-191) and
          sent to the keeper for the on-chain board.
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row k="Epoch" v="15 minutes (900 s)" />
          <Row k="Winner" v="highest posted score in the window" />
          <Row k="Prize" v="60% of that epoch’s vault harvest, in ETH" />
          <Row k="Drip" v="30% merkle-claimed by $CATRIS holders" />
          <Row k="Team" v="10% to the team wallet set at deploy" />
        </dl>
      </Section>

      <Section title="Stack">
        <p>
          Client is TanStack Start + React 19 + Tailwind. The well is a canvas
          painter: original cat SVGs preloaded as blob URLs, drawn with the
          js13k overflow math so ears and tails spill the cell. Scores live in
          Postgres (Neon in prod, PGLite locally). Chain reads go through viem
          on Robinhood Chain.
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row k="Chain" v="Robinhood Chain 4663" />
          <Row k="RPC" v="https://rpc.mainnet.chain.robinhood.com" />
          <Row k="Launch" v="PONS v2 · creator tax 3% (300 bps)" />
          <Row k="Factory" v={PONS.factory} />
          <Row k="Escrow" v={PONS.feeEscrow} />
          <Row k="Ticker" v={CATRIS.symbol} />
        </dl>
      </Section>

      <Section title="Fee flow">
        <p>
          Traders pay the 3% creator tax in ETH on the bonding curve and the
          Uniswap v4 pool. PONS holds it in escrow. The vault is the only fee
          recipient.
        </p>
        <p className="font-mono text-xs leading-relaxed">
          trade $CATRIS → 3% creator tax → PONS escrow → claimFromEscrow →
          Vault 60 / 30 / 10 → epoch winner ETH, holder drip, team
        </p>
      </Section>

      <Section title="Contracts">
        <p>
          Two helpers, Solidity 0.8.24, Remix, 200 optimizer runs. Vault holds
          the pot and the split. Board holds epochs and signed scores. A
          15-minute keeper claims escrow, posts the winner, and publishes the
          drip merkle root.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <code>CatrisVault(teamWallet)</code> — PONS creator fee recipient.{" "}
            <a
              className="underline decoration-border underline-offset-4"
              href="/contracts/CatrisVault.sol"
              download
            >
              Download
            </a>
          </li>
          <li>
            <code>CatrisBoard</code> — no constructor args.{" "}
            <a
              className="underline decoration-border underline-offset-4"
              href="/contracts/CatrisBoard.sol"
              download
            >
              Download
            </a>
          </li>
          <li>
            Vault: <code>setBot(keeperEOA)</code>, then{" "}
            <code className="break-all">
              setMetadata("{LINKS.site}", "{LINKS.xHandle}", "{LINKS.github}", "{LINKS.telegram}")
            </code>
            .
          </li>
          <li>
            Board: <code>setBot(keeperEOA)</code>, <code>setVault(VAULT_CA)</code>.
          </li>
          <li>
            Launch on the{" "}
            <a
              className="underline decoration-border underline-offset-4"
              href={PONS.launch}
              target="_blank"
              rel="noreferrer"
            >
              PONS create page
            </a>
            : name Catris, symbol {CATRIS.symbol}, tax 3%, fee recipient{" "}
            <code>VAULT_CA</code>, buyback off, pair ETH. Then{" "}
            <code>setTokenCA(TOKEN_CA)</code> on the vault.
          </li>
        </ol>
      </Section>

      <Section title="Keeper and site env">
        <p>
          Bot source:{" "}
          <a
            className="underline decoration-border underline-offset-4"
            href="/keeper/epoch-bot.mjs"
            download
          >
            epoch-bot.mjs
          </a>{" "}
          +{" "}
          <a
            className="underline decoration-border underline-offset-4"
            href="/keeper/package.json"
            download
          >
            package.json
          </a>
          . Env: <code>RPC_URL</code>, <code>BOT_PRIVATE_KEY</code>,{" "}
          <code>VAULT_CA</code>, <code>BOARD_CA</code>, <code>TOKEN_CA</code>,{" "}
          <code>MIN_CLAIM_ETH</code>. Fund the keeper with ~0.1 ETH for gas.
        </p>
        <p>
          After deploy set <code>VITE_VAULT_CA</code>, <code>VITE_BOARD_CA</code>,{" "}
          <code>VITE_TOKEN_CA</code>, <code>VITE_KEEPER_URL</code>. Until those
          exist the arcade still runs — scores live on the shared board, chain
          writes wait for the keeper.
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Empty escrow no longer reverts — the keeper can poke{" "}
            <code>claimFromEscrow</code> every epoch.
          </li>
          <li>Reentrancy lock on prize, drip, team, and escrow pulls.</li>
          <li>
            Score signatures are <code>personal_sign</code>, the message wallets
            actually produce.
          </li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 border-t border-border pt-8">
      <h2 className="font-display text-2xl italic">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">
        {children}
      </div>
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
