import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWell } from "@/components/game/PageWell";
import { CATRIS, LETSCASH, LINKS } from "@/lib/chain";
import { HOUSE } from "@/lib/house";

export const Route = createFileRoute("/docs")({ component: DocsPage });

function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageWell variant="docs" />
      <p className="mt-8 seal">Manual</p>
      <h1 className="mt-2 font-display text-4xl italic tracking-tight">
        How the cats behave
      </h1>
      <p className="mt-4 text-muted leading-relaxed">
        Catris is guideline-feel Tetris with overflowing cat sprites. Stack
        cats, clear lines, post the run. Every fifteen minutes the highest
        score takes Pounce. Cream drips to holders. Treats land in a bowl
        contract — never an EOA.
      </p>

      <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
        <Row k="Play" v="catris.xyz/play" href={`${LINKS.site}/play`} />
        <Row k="Well" v="catris.xyz/arena" href={`${LINKS.site}/arena`} />
        <Row k="House" v="catris.xyz/house" href={`${LINKS.site}/house`} />
        <Row k="X" v={`@${LINKS.xHandle}`} href={LINKS.x} />
        <Row k="GitHub" v={LINKS.githubUser} href={LINKS.github} />
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
          ticks while the run is alive. Overlay <span className="text-fg">LITTER CLEAR</span> on
          a quad, <span className="text-fg">TRIPLE</span> on three. Game over:{" "}
          <span className="text-fg">Litter full</span>.
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

      <Section title="The house">
        <p>
          Five named rooms. Two contracts on opening night.{" "}
          <Link to="/house" search={{ room: "bowl" }} className="text-fg underline decoration-border underline-offset-4">
            Tour them
          </Link>
          .
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          {HOUSE.map((r) => (
            <Row
              key={r.id}
              k={r.name}
              v={r.deploy === "launch" ? r.contract : `${r.kicker} · inside the Bowl`}
            />
          ))}
        </dl>
        <p className="mt-3">
          Epochs last 15 minutes. The keeper harvests the Bowl, pays Pounce
          (previous window), and posts the Cream merkle root. Players pay no
          gas. CatrisTreasury / Arena / Rewards are weekly PONS drafts — do not
          deploy.
        </p>
      </Section>

      <Section title="Stack">
        <p>
          Client is TanStack Start + React 19 + Tailwind. The well is a canvas
          painter: original cat SVGs preloaded as blob URLs, drawn with the
          js13k overflow math so ears and tails spill the cell. Scores live in
          Postgres. Chain reads go through viem on Robinhood Chain.
        </p>
        <dl className="mt-3 grid gap-2 text-sm">
          <Row k="Chain" v="Robinhood Chain 4663" />
          <Row k="RPC" v="https://rpc.mainnet.chain.robinhood.com" />
          <Row k="Door" v="letscash.fun" href={LETSCASH.launch} />
          <Row k="Factory" v={LETSCASH.factory} />
          <Row k="Hook" v={LETSCASH.hook} />
          <Row k="Ticker" v={CATRIS.symbol} />
        </dl>
      </Section>

      <Section title="Opening night">
        <p>
          Compiler 0.8.24, 200 runs, network 4663. Three keys: deployer, Whiskers
          wallet, keeper. Do not mix them. Stream goes to the Bowl, never an EOA.
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <code>CatrisVault(whiskersWallet)</code>{" "}
            <a className="underline decoration-border underline-offset-4" href="/contracts/CatrisVault.sol" download>
              Download
            </a>
          </li>
          <li>
            <code>CatrisBoard()</code>{" "}
            <a className="underline decoration-border underline-offset-4" href="/contracts/CatrisBoard.sol" download>
              Download
            </a>
          </li>
          <li>
            Bowl: <code>setBot(keeperEOA)</code>, then{" "}
            <code className="break-all">
              setMetadata("{LINKS.site}", "{LINKS.xHandle}", "{LINKS.github}", "")
            </code>
          </li>
          <li>
            Well: <code>setBot(keeperEOA)</code>, <code>setVault(BOWL_CA)</code>
          </li>
          <li>
            Launch on{" "}
            <a
              className="underline decoration-border underline-offset-4"
              href={LETSCASH.launch}
              target="_blank"
              rel="noreferrer"
            >
              letscash.fun/launch
            </a>
            : name Catris, symbol {CATRIS.symbol}, pair ETH, image{" "}
            <code>https://www.catris.xyz/token-logo.jpg</code>. Then{" "}
            <code>updateCreator(poolId, BOWL_CA)</code>.
          </li>
          <li>
            Bowl: <code>setPoolId</code>, <code>setTokenCA</code>. Site env:{" "}
            <code>VITE_VAULT_CA</code> <code>VITE_BOARD_CA</code>{" "}
            <code>VITE_TOKEN_CA</code> <code>VITE_KEEPER_URL</code>.
          </li>
        </ol>
        <p className="mt-3 text-sm">
          letscash takes a platform cut on every trade and leaves a creator
          stream on the hook. The Bowl claims that stream. Pounce / Cream /
          Whiskers split whatever lands. The launch form fee is fixed by the
          pad — we do not advertise a rate on the cabinet.
        </p>
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
