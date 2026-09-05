import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageWell } from "@/components/game/PageWell";
import { HOUSE, HOUSE_NAV, roomById, type RoomId } from "@/lib/house";
import { CATRIS, explorerAddress, isDeployed, LETSCASH } from "@/lib/chain";
import { cn } from "@/lib/utils";
import { CreamClaim } from "@/components/house/CreamClaim";

const ROOMS: RoomId[] = ["bowl", "well", "pounce", "cream", "whiskers"];

export const Route = createFileRoute("/house")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search.room === "string" ? search.room : "bowl";
    return { room: (ROOMS.includes(raw as RoomId) ? raw : "bowl") as RoomId };
  },
  component: HousePage,
});

function HousePage() {
  const { room: roomId } = Route.useSearch();
  const room = roomById(roomId);
  const download =
    room.contract.endsWith(".sol") ? `/contracts/${room.contract}` : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="seal">The house</p>
      <h1 className="mt-2 font-display text-4xl italic tracking-tight sm:text-5xl">
        Five rooms. A quiet courtyard.
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        Cats in the well. Treats in the bowl. Pounce drinks first, cream for
        holders, whiskers for the crew. The old weekly drafts — Treasury,
        Arena, Rewards — stay in the repo and off the chain.
      </p>

      <nav
        className="-mx-4 mt-8 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        aria-label="House rooms"
      >
        {HOUSE_NAV.map((item) => {
          const active = item.id === room.id;
          return (
            <Link
              key={item.id}
              to="/house"
              search={{ room: item.id }}
              className={cn(
                "shrink-0 rounded-sm px-3 py-2 text-sm transition-colors duration-150",
                active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-xs tracking-[0.2em] text-muted uppercase">{room.kicker}</p>
          <h2 className="mt-2 font-display text-3xl italic tracking-tight">{room.title}</h2>
          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
            {room.body.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <dl className="mt-6 grid gap-2 text-sm">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="w-28 shrink-0 text-subtle">Room</dt>
              <dd className="text-fg">{room.name}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="w-28 shrink-0 text-subtle">Contract</dt>
              <dd className="font-mono text-xs text-fg sm:text-sm">{room.contract}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="w-28 shrink-0 text-subtle">Launch</dt>
              <dd className="text-fg">
                {room.deploy === "launch" ? "Deploy this" : "Already inside the Bowl"}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-subtle">{room.footnote}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {download && (
              <Button variant="outline" asChild>
                <a href={download} download>
                  Download {room.contract}
                </a>
              </Button>
            )}
            {room.id === "well" && (
              <Button variant="accent" asChild>
                <Link to="/arena">Open the live well</Link>
              </Button>
            )}
            {room.id === "bowl" && (
              <Button variant="ghost" asChild>
                <a href={LETSCASH.docs} target="_blank" rel="noreferrer">
                  letscash hook docs
                </a>
              </Button>
            )}
          </div>
          {room.id === "cream" && <CreamClaim />}
        </div>
        <PageWell variant={room.well} />
      </div>

      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-display text-2xl italic">Opening night</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {OPENING.map((step, i) => (
            <li key={step} className="rounded-xl border border-border bg-surface p-5">
              <p className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-sm leading-relaxed text-fg">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-2xl italic">Addresses</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Addr label="letscash factory" value={LETSCASH.factory} />
          <Addr label="letscash hook" value={LETSCASH.hook} />
          <Addr label="The Bowl" value={CATRIS.vault} />
          <Addr label="The Well" value={CATRIS.board} />
          <Addr label="CATRIS" value={CATRIS.token} />
        </dl>
      </section>
    </div>
  );
}

const OPENING = [
  "Deploy the Bowl with the Whiskers wallet. Verify on Blockscout.",
  "Deploy the Well. No constructor args. Verify.",
  "Bowl: setBot(keeper), setMetadata(site, X, GitHub, Telegram).",
  "Well: setBot(keeper), setVault(Bowl).",
  "Launch Catris / CATRIS on letscash.fun. Pair ETH. Image: token-logo.jpg.",
  "From the launch wallet: updateCreator(poolId, Bowl). Never an EOA.",
  "Bowl: setPoolId, setTokenCA.",
  "Site env, host the keeper, fund it with a little ETH for gas.",
];

function Addr({ label, value }: { label: string; value: string }) {
  const live = isDeployed(value);
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-xs break-all">
        {live ? (
          <a
            className="underline decoration-border underline-offset-4 hover:text-accent"
            href={explorerAddress(value)}
            target="_blank"
            rel="noreferrer"
          >
            {value}
          </a>
        ) : (
          <span className="text-subtle">after Remix</span>
        )}
      </dd>
    </div>
  );
}
