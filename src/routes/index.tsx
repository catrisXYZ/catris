import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { HeroWell } from "@/components/game/HeroWell";
import { CATRIS, FEE_SPLIT, LETSCASH } from "@/lib/chain";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
        <div>
          <p className="text-xs tracking-[0.22em] text-muted uppercase">
            Robinhood Chain · letscash.fun · 3% trade tax
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight italic sm:text-6xl lg:text-7xl">
            Cats fall.
            <br />
            Lines clear.
            <br />
            Tax feeds the litter.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Catris is the original js13k kitten tetris, rebuilt as a DApp. Launch
            $CATRIS on letscash.fun, hand the creator ETH stream to a vault —
            never an EOA — and pay a 15-minute epoch winner plus holder drip
            from the same pot.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="accent" size="lg" asChild>
              <Link to="/play">
                Play Catris
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={LETSCASH.launch} target="_blank" rel="noreferrer">
                Launch on letscash.fun
              </a>
            </Button>
          </div>
        </div>
        <HeroWell />
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          <Feature
            kicker="01"
            title="Play"
            body="Guideline-feel tetris with overflowing cat anatomy, ghost piece, hold, and black cats that refuse to spin, slide, or wait."
          />
          <Feature
            kicker="02"
            title="Tax"
            body="Launch at 3% on letscash.fun. Point the creator stream at the Catris vault contract, not a private wallet."
          />
          <Feature
            kicker="03"
            title="Split"
            body="Every harvested drop splits 60% epoch prize, 30% holder drip (merkle), 10% team. Epochs last 15 minutes."
          />
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl italic tracking-tight">Fee anatomy</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Every trade on the Uniswap v4 pool pays the 3% tax in ETH — no
            bonding curve, no migration. The creator share streams to the
            vault. The vault splits every epoch.
          </p>
          <ol className="mt-8 grid gap-3 md:grid-cols-3">
            {FEE_SPLIT.map((s) => (
              <li key={s.key} className="rounded-xl border border-border bg-surface p-5">
                <p className="font-display text-3xl tabular text-accent">{s.share}</p>
                <p className="mt-2 text-sm text-fg">{s.label}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted">
            Token {CATRIS.symbol} · tax {CATRIS.creatorTaxBps / 100}% ·{" "}
            <a
              className="underline decoration-border underline-offset-4 hover:text-fg"
              href={LETSCASH.launch}
              target="_blank"
              rel="noreferrer"
            >
              letscash.fun
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

function Feature({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <article>
      <p className="font-mono text-xs text-subtle">{kicker}</p>
      <h3 className="mt-2 font-display text-2xl italic">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </article>
  );
}
