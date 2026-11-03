import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CalendarClock, Compass, PoundSterling } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { PageHeader, SampleBanner, formatGBP } from '@/components/bits'
import { useWorkspace } from '@/lib/store'
import { PREVIEW_TODAY as TODAY } from '@/lib/fixtures'
import { funnel, topActions } from '@/lib/insights'
import { PIPELINES } from '@/lib/pipelines'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({ component: Dashboard })


function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="tabular mt-1 font-display text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}

const CATEGORY_TONE: Record<string, string> = {
  Revenue: 'text-primary bg-primary/10',
  'Follow-up': 'text-warning bg-warning/10',
  Research: 'text-muted-foreground bg-muted',
  Network: 'text-chart-2 bg-chart-2/10',
  'Co-founder': 'text-chart-5 bg-chart-5/10',
}

function Dashboard() {
  const { opportunities, tasks, toggleTask } = useWorkspace()
  const [doneIds, setDoneIds] = React.useState<Set<string>>(new Set())
  // Keep actions ticked off in this view visible (struck through) until the next visit.
  const actions = topActions(
    opportunities,
    tasks.map((t) => (t.done && doneIds.has(`task-${t.id}`) ? { ...t, done: false } : t)),
    TODAY,
  )
  const f = funnel(opportunities)
  const customers = opportunities.filter((o) => o.kind === 'customer')
  const stageCount = (stages: string[]) => customers.filter((o) => stages.includes(o.stage)).length
  const pipelineValue = customers
    .filter((o) => !['Not Interested', 'Disqualified', 'Paying Customer'].includes(o.stage))
    .reduce((s, o) => s + (o.estimatedValue ?? 0), 0)
  const followUps = tasks.filter((t) => !t.done && t.due <= TODAY).length
  const max = Math.max(...f.map((x) => x.value), 1)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="What should I do today to move SORTED forward?"
        description="Tuesday 3 November · priorities ranked from your saved pipeline, with revenue-producing work first."
        actions={
          <Button asChild>
            <Link to="/lead-finder">
              <Compass /> Find opportunities
            </Link>
          </Button>
        }
      />

      <SampleBanner>
        You’re viewing the preview workspace. The figures below are calculated from clearly labelled sample records so you can try every
        workflow; live discovery and your own persistent records replace them as the roadmap lands.
      </SampleBanner>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="New this week" value={stageCount(['New', 'Researching'])} />
        <Stat label="High-priority qualified" value={customers.filter((o) => o.stage === 'Qualified' && (o.assessment?.score ?? 0) >= 75).length} />
        <Stat label="Contacted" value={f[2].value} hint={`${f[3].value} replied`} />
        <Stat label="Meetings & demos" value={stageCount(['Meeting Booked', 'Demo Completed'])} />
        <Stat label="Active pilots" value={stageCount(['Trial/Pilot'])} />
        <Stat label="Paying customers" value={stageCount(['Paying Customer'])} />
        <Stat label="Follow-ups due" value={followUps} />
        <Stat label="Partnerships" value={opportunities.filter((o) => o.kind === 'partner' || o.kind === 'referral').length} />
        <Stat label="Co-founder conversations" value={opportunities.filter((o) => o.kind === 'cofounder' && PIPELINES.cofounder.stages.indexOf(o.stage) >= 4).length} />
        <Stat label="Est. pipeline value" value={formatGBP(pipelineValue)} hint="Your manual estimates · not revenue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Today’s Top 10 Actions</h2>
              <p className="text-xs text-muted-foreground">Ranked by revenue impact, then urgency.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks">
                All tasks <ArrowRight />
              </Link>
            </Button>
          </div>
          <ol className="divide-y divide-border">
            {actions.map((a, i) => {
              const done = doneIds.has(a.id)
              return (
                <li key={a.id} className={cn('flex items-start gap-3 px-5 py-3 transition-opacity', done && 'opacity-45')}>
                  <span className="tabular mt-0.5 w-4 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <Checkbox
                    checked={done}
                    aria-label={`Mark “${a.title}” done`}
                    onCheckedChange={() => {
                      setDoneIds((prev) => {
                        const next = new Set(prev)
                        if (next.has(a.id)) next.delete(a.id)
                        else next.add(a.id)
                        return next
                      })
                      if (a.taskId) toggleTask(a.taskId)
                    }}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    {a.opportunityId ? (
                      <Link
                        to="/opportunities/$id"
                        params={{ id: a.opportunityId }}
                        className={cn('text-sm font-medium hover:text-primary', done && 'line-through')}
                      >
                        {a.title}
                      </Link>
                    ) : (
                      <span className={cn('text-sm font-medium', done && 'line-through')}>{a.title}</span>
                    )}
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="size-3" /> {a.reason}
                    </div>
                  </div>
                  <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', CATEGORY_TONE[a.category])}>{a.category}</span>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Customer funnel</h2>
            <p className="text-xs text-muted-foreground">Records that have reached each stage.</p>
            <div className="mt-4 flex flex-col gap-2">
              {f.map((s, i) => (
                <div key={s.label} className="grid grid-cols-[84px_1fr_48px] items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{s.label}</span>
                  <div className="h-5 rounded bg-secondary/60">
                    <div
                      className="h-5 rounded bg-primary transition-[width] duration-500 motion-reduce:transition-none"
                      style={{ width: `${(s.value / max) * 100}%`, opacity: 1 - i * 0.08 }}
                    />
                  </div>
                  <span className="tabular text-right font-mono">
                    {s.value}
                    {i > 0 && f[i - 1].value > 0 && (
                      <span className="ml-1 text-muted-foreground">{Math.round((s.value / f[i - 1].value) * 100)}%</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <PoundSterling className="size-4 text-muted-foreground" />
              <h2 className="font-semibold">Revenue</h2>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Confirmed MRR</dt>
                <dd className="tabular mt-1 font-display text-xl font-semibold">£0</dd>
                <dd className="text-[11px] text-muted-foreground">Entered by you in Settings</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Estimated pipeline</dt>
                <dd className="tabular mt-1 font-display text-xl font-semibold text-muted-foreground">{formatGBP(pipelineValue)}/yr</dd>
                <dd className="text-[11px] text-muted-foreground">Estimate only</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  )
}
