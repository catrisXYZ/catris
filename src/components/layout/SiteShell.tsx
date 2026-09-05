import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { WalletButton } from "@/components/wallet/WalletButton";
import { LINKS } from "@/lib/chain";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Nest" },
  { to: "/play", label: "Stack" },
  { to: "/arena", label: "Well" },
  { to: "/house", label: "House" },
  { to: "/docs", label: "Manual" },
] as const;

const SOCIAL = [
  { href: LINKS.site, label: "catris.xyz" },
  { href: LINKS.launchpad, label: "letscash.fun" },
  { href: LINKS.x, label: "X" },
  { href: LINKS.telegram, label: "TG community" },
  { href: LINKS.github, label: "GitHub" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="inline-block size-2.5 rounded-sm bg-accent" aria-hidden />
            <span className="font-display text-xl italic tracking-tight sm:text-2xl">
              Catris
            </span>
            <span className="hidden seal sm:inline">garden</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto text-sm">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to) ||
                    (item.to === "/house" && pathname.startsWith("/treasury"));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  search={item.to === "/house" ? { room: "bowl" } : undefined}
                  className={cn(
                    "rounded-sm px-2.5 py-1.5 transition-colors duration-150",
                    active ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <WalletButton />
        </div>
      </header>
      <main>{children}</main>
      {pathname !== "/play" && (
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>A garden of falling cats. The Bowl pays. The cats always land.</p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {SOCIAL.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="text-muted underline decoration-border underline-offset-4 hover:text-fg"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
      )}
    </div>
  );
}
