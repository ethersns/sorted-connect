import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  CalendarRange,
  Map as MapIcon,
  MessagesSquare,
  Network,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/bits'
import { useWorkspace } from '@/lib/store'
import { funnel } from '@/lib/insights'

export const Route = createFileRoute('/advisor')({ component: Advisor })

const FUNCTIONS = [
  {
    icon: CalendarRange,
    title: 'Weekly Strategy',
    body: 'A realistic seven-day customer acquisition plan built from your open pipeline and tasks.',
  },
  {
    icon: MapIcon,
    title: 'Opportunity Analysis',
    body: 'Which industries and regions convert best for you, and where to search next.',
  },
  {
    icon: MessagesSquare,
    title: 'Sales Preparation',
    body: 'Discovery questions, demo talking points and objection handling for a specific lead.',
  },
  {
    icon: Network,
    title: 'Network Opportunities',
    body: 'Useful introductions and partnerships based on who you already know.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Review',
    body: 'A summary of outreach activity and where deals are getting stuck.',
  },
]

function Advisor() {
  const { opportunities } = useWorkspace()
  const f = funnel(opportunities)
  const biggestDrop = f.slice(1).reduce(
    (worst, s, i) => {
      const prev = f[i].value
      const rate = prev ? s.value / prev : 1
      return rate < worst.rate ? { from: f[i].label, to: s.label, rate } : worst
    },
    { from: '', to: '', rate: 1 },
  )
  const byRegion = Object.entries(
    opportunities
      .filter((o) => o.kind === 'customer')
      .reduce<Record<string, number[]>>((acc, o) => {
        ;(acc[o.region] ??= []).push(o.assessment?.score ?? 0)
        return acc
      }, {}),
  )
    .map(([region, scores]) => ({
      region,
      n: scores.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .sort((a, b) => b.avg - a.avg)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Growth Advisor"
        description="Practical, near-term business development advice grounded in your actual pipeline — not generic startup tips."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Bottleneck right now</h2>
          <p className="mt-2 text-sm text-foreground/85">
            {biggestDrop.from ? (
              <>
                The largest drop-off is{' '}
                <span className="font-medium text-primary">
                  {biggestDrop.from} → {biggestDrop.to}
                </span>{' '}
                ({Math.round(biggestDrop.rate * 100)}% carry through).
              </>
            ) : (
              'Not enough pipeline movement yet to spot a bottleneck.'
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Calculated from saved records.
          </p>
        </section>
        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Average fit by region</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {byRegion.map((r) => (
              <li
                key={r.region}
                className="grid grid-cols-[1fr_100px_40px] items-center gap-3"
              >
                <span>
                  {r.region}{' '}
                  <span className="text-xs text-muted-foreground">· {r.n}</span>
                </span>
                <div className="h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${r.avg}%` }}
                  />
                </div>
                <span className="tabular text-right font-mono text-xs">
                  {r.avg}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FUNCTIONS.map((fn) => (
          <section
            key={fn.title}
            className="flex flex-col rounded-2xl border-2 border-border bg-card p-5"
          >
            <fn.icon className="size-5 text-primary" />
            <h2 className="mt-3 font-semibold">{fn.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">
              {fn.body}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-fit"
              onClick={() =>
                toast.info(
                  `${fn.title} arrives with the Growth Advisor milestone`,
                  {
                    description:
                      'It will run on your saved records via Netlify AI Gateway.',
                  },
                )
              }
            >
              <Sparkles /> Generate
            </Button>
          </section>
        ))}
      </div>
    </div>
  )
}
