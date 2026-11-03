import * as React from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
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
  Sparkles,
  Table2,
  UserRoundSearch,
} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/lib/store'
import { PREVIEW_TODAY } from '@/lib/fixtures'
import { KindBadge } from './bits'

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lead-finder', label: 'Lead Finder', icon: Compass },
  { to: '/opportunities', label: 'All Opportunities', icon: Table2 },
  { to: '/pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
  { to: '/outreach', label: 'Outreach Studio', icon: PenLine },
  { to: '/cofounders', label: 'Co-Founder Search', icon: UserRoundSearch },
  { to: '/partnerships', label: 'Partnerships & Network', icon: Handshake },
  { to: '/funding', label: 'Funding & Growth', icon: Rocket },
  { to: '/advisor', label: 'Growth Advisor', icon: BarChart3 },
  { to: '/tasks', label: 'Tasks & Follow-ups', icon: ListChecks },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-2">
      <div className="flex size-7 items-center justify-center rounded-md bg-primary font-display text-sm font-bold text-primary-foreground shadow-[0_0_20px_-4px_var(--primary)]">
        S
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">SORTED Connect</div>
        <div className="text-[11px] text-muted-foreground">Founder workspace</div>
      </div>
    </Link>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { tasks } = useWorkspace()
  const due = tasks.filter((t) => !t.done && t.due <= PREVIEW_TODAY).length
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {NAV.map((item) => {
        const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors motion-reduce:transition-none',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )}
          >
            <Icon className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
            <span className="flex-1 truncate">{item.label}</span>
            {item.to === '/tasks' && due > 0 && (
              <span className="tabular rounded bg-primary/15 px-1.5 text-[11px] font-medium text-primary">{due}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4">
      <Logo />
      <NavList onNavigate={onNavigate} />
      <div className="mt-auto rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Sparkles className="size-3.5 text-primary" /> SORTED Intelligence
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Ask questions about your pipeline. Arrives with the AI milestone.
        </p>
      </div>
    </div>
  )
}

function GlobalSearch() {
  const { opportunities } = useWorkspace()
  const navigate = useNavigate()
  const [q, setQ] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = q.trim()
    ? opportunities
        .filter((o) =>
          [o.name, o.city, o.industry, ...o.tags].join(' ').toLowerCase().includes(q.toLowerCase()),
        )
        .slice(0, 7)
    : []

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search organisations, people, tags…"
        aria-label="Global search"
        className="h-9 w-full rounded-md border border-input bg-secondary/50 pl-9 pr-14 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/30"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground sm:block">
        ⌘K
      </kbd>
      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-2xl">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No saved records match “{q}”.</p>
          ) : (
            results.map((o) => (
              <button
                key={o.id}
                type="button"
                onMouseDown={() => {
                  navigate({ to: '/opportunities/$id', params: { id: o.id } })
                  setQ('')
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
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarBody />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open navigation">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">SORTED Connect sections</SheetDescription>
              <SidebarBody onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning sm:inline-flex">
              <span className="size-1.5 rounded-full bg-warning" /> Preview workspace · sample data
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold" aria-label="Founder account">
              SF
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
