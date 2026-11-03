import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Compass,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  Menu,
  PenLine,
  Rocket,
  Search,
  Settings,
  Table2,
  UserRoundSearch,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/lib/store";
import { PREVIEW_TODAY } from "@/lib/fixtures";
import { KindBadge } from "./bits";
import { FROG_QUIPS, Frog, SpeechBubble } from "./frog";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/lead-finder", label: "Lead Finder", icon: Compass },
  { to: "/opportunities", label: "All Opportunities", icon: Table2 },
  { to: "/pipeline", label: "Sales Pipeline", icon: KanbanSquare },
  { to: "/outreach", label: "Outreach Studio", icon: PenLine },
  { to: "/cofounders", label: "Co-Founder Search", icon: UserRoundSearch },
  { to: "/partnerships", label: "Partnerships & Network", icon: Handshake },
  { to: "/funding", label: "Funding & Growth", icon: Rocket },
  { to: "/advisor", label: "Growth Advisor", icon: BarChart3 },
  { to: "/tasks", label: "Tasks & Follow-ups", icon: ListChecks },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Logo() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 px-1"
      aria-label="Conneck home"
    >
      <Frog
        mood="smug"
        className="w-11 transition-transform group-hover:-rotate-6 motion-reduce:transition-none"
      />
      <div className="leading-none">
        <div className="font-display text-2xl tracking-wide text-primary [text-shadow:2px_2px_0_var(--ink)]">
          Conneck
        </div>
        <div className="mt-1 text-[11px] font-semibold text-muted-foreground">
          ribbit · network · repeat
        </div>
      </div>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { tasks } = useWorkspace();
  const due = tasks.filter((t) => !t.done && t.due <= PREVIEW_TODAY).length;
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {NAV.map((item) => {
        const active =
          item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg border-2 px-2.5 py-1.5 text-[13px] font-semibold transition-[color,background-color,transform] motion-reduce:transition-none",
              active
                ? "border-ink bg-primary text-primary-foreground shadow-[3px_3px_0_var(--ink)]"
                : "border-transparent text-sidebar-foreground/75 hover:translate-x-0.5 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-4",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground group-hover:text-primary",
              )}
            />
            <span className="flex-1 truncate">{item.label}</span>
            {item.to === "/tasks" && due > 0 && (
              <span
                className={cn(
                  "tabular rounded-full px-1.5 text-[11px] font-bold",
                  active ? "bg-ink text-primary" : "bg-warning text-ink",
                )}
              >
                {due}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function PondFrog() {
  const [i, setI] = React.useState(0);
  const [hop, setHop] = React.useState(0);
  return (
    <div className="mt-auto rounded-xl border-2 border-sidebar-border bg-sidebar-accent/50 p-3">
      <SpeechBubble tail="bottom" className="pop-in text-[13px]" key={i}>
        {FROG_QUIPS[i % FROG_QUIPS.length]}
      </SpeechBubble>
      <div className="mt-2 flex items-end gap-2">
        <button
          type="button"
          onClick={() => {
            setI((n) => n + 1);
            setHop((n) => n + 1);
          }}
          aria-label="Poke the frog for another tip"
          className="rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Frog
            key={hop}
            mood={i % 3 === 2 ? "happy" : "smug"}
            hoodie
            className={cn("w-14", hop > 0 && "frog-hop")}
          />
        </button>
        <p className="pb-1 text-[11px] leading-snug text-muted-foreground">
          <span className="font-bold text-sidebar-foreground">
            Pond Intelligence
          </span>
          <br />
          Ask the frog about your pipeline. Hatches with the AI milestone.
        </p>
      </div>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-4">
      <Logo />
      <div>
        <div className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          The pond
        </div>
        <NavList onNavigate={onNavigate} />
      </div>
      <PondFrog />
    </div>
  );
}

function GlobalSearch() {
  const { opportunities } = useWorkspace();
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = q.trim()
    ? opportunities
        .filter((o) =>
          [o.name, o.city, o.industry, ...o.tags]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase()),
        )
        .slice(0, 7)
    : [];

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Sniff out organisations, people, tags…"
        aria-label="Global search"
        className="h-10 w-full rounded-full border-2 border-input bg-secondary/60 font-medium pl-9 pr-14 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:block">
        ⌘K
      </kbd>
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border-2 border-ink bg-popover shadow-[4px_4px_0_var(--ink)]">
          {results.length === 0 ? (
            <div className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground">
              <Frog mood="sad" className="w-10" />
              <span>Nothing in the pond matches “{q}”.</span>
            </div>
          ) : (
            results.map((o) => (
              <button
                key={o.id}
                type="button"
                onMouseDown={() => {
                  navigate({ to: "/opportunities/$id", params: { id: o.id } });
                  setQ("");
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {o.industry} · {o.city}
                  </span>
                </span>
                <KindBadge kind={o.kind} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <div className="pond flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r-2 border-sidebar-border bg-sidebar/90 lg:block">
        <SidebarBody />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b-2 border-border/70 bg-background/80 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Conneck sections
              </SheetDescription>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden -rotate-1 items-center gap-1.5 rounded-full border-2 border-ink bg-warning px-3 py-1 text-[11px] font-bold text-ink shadow-[2px_2px_0_var(--ink)] sm:inline-flex">
              <span className="size-1.5 animate-pulse rounded-full bg-ink motion-reduce:animate-none" />{" "}
              Practice pond · sample data
            </span>
            <div
              className="flex size-9 items-center justify-center rounded-full border-2 border-ink bg-primary/20"
              role="img"
              aria-label="Founder account"
            >
              <Frog mood="happy" className="w-7" />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
