import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { HeroWell } from "@/components/game/HeroWell";
import { HOUSE } from "@/lib/house";
import { LETSCASH, LINKS } from "@/lib/chain";
import { ArrowRight } from "lucide-react";
import { ContractStrip } from "@/components/ContractStrip";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
        <div>
          <p className="text-xs tracking-[0.22em] text-muted uppercase">
            Tetris with cats · Robinhood Chain
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] tracking-tight italic sm:text-6xl lg:text-7xl">
            Cats fall.
            <br />
            Lines clear.
            <br />
            The cats always land.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Original js13k kittens, overflowing the cell on purpose. Ten by
            twenty. Fifteen-minute pots. Treats land in a bowl contract — never
            a personal wallet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="accent" size="lg" asChild>
              <Link to="/play">
                Play Catris
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/house" search={{ room: "bowl" }}>Tour the house</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <a href={LINKS.telegram} target="_blank" rel="noreferrer">
                Join @CatrisRH
              </a>
            </Button>
          </div>
          <ContractStrip />
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
            title="The well"
            body="Ten across, twenty down. A 15-minute clock. Highest stack takes Pounce. Game over is Litter full."
          />
          <Feature
            kicker="03"
            title="The bowl"
            body="The creator stream feeds a vault contract. Pounce drinks first, cream for holders, whiskers for the crew."
          />
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-3xl italic tracking-tight">Five rooms</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Two contracts at launch. Three more rooms live inside the Bowl.
            The weekly PONS drafts stay in the attic.
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {HOUSE.map((room) => (
              <li key={room.id}>
                <Link
                  to="/house"
                  search={{ room: room.id }}
                  className="block h-full rounded-xl border border-border bg-surface p-5 transition-colors duration-150 hover:border-border-strong hover:bg-elevated"
                >
                  <p className="text-xs tracking-widest text-muted uppercase">{room.kicker}</p>
                  <p className="mt-2 font-display text-xl italic">{room.name}</p>
                  <p className="mt-2 text-sm text-subtle">
                    {room.deploy === "launch" ? room.contract : "Inside the Bowl"}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-muted">
            $CATRIS launches on{" "}
            <a
              className="underline decoration-border underline-offset-4 hover:text-fg"
              href={LETSCASH.launch}
              target="_blank"
              rel="noreferrer"
            >
              letscash.fun
            </a>
            . LP locked. No bonding curve.
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
