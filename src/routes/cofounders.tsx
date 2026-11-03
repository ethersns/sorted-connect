import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Compass, HelpCircle, ListChecks, Shuffle, UserRoundSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfidencePill, EmptyState, PageHeader, ProvenanceTag, ScoreRing, SourceLink } from '@/components/bits'
import { PIPELINES } from '@/lib/pipelines'
import { useWorkspace } from '@/lib/store'

export const Route = createFileRoute('/cofounders')({ component: CoFounders })

const QUESTION_BANK = [
  'What made you interested in warehousing and logistics in the first place?',
  'Tell me about a deal you closed that took longer than expected — what kept it moving?',
  'How do you prefer to split decisions between product and commercial?',
  'What does your ideal week look like 12 months into a startup?',
  'What financial runway do you have, and what would you need to commit full-time?',
  'Which people in the UK warehouse space would take your call this week?',
  'How have you handled disagreement with a business partner before?',
  'What would make you walk away from an early-stage company?',
  'How would you approach landing SORTED’s next five paying customers?',
  'What do you expect around equity, vesting and roles — and when should we discuss it?',
]

const CHECKLIST = [
  'Met at least three times in different settings',
  'Worked together on a small, real task (e.g. a customer call)',
  'Discussed time commitment and financial runway openly',
  'Agreed on vision for the next 2–3 years',
  'Spoken to two references who have worked with them',
  'Discussed roles, decision rights and how to resolve conflict',
  'Taken independent advice before any equity discussion',
  'Agreed a trial period with clear goals',
]

const COMMUNITIES = [
  { name: 'Local founder meetups & tech weeks', why: 'In-person rapport with commercially minded founders.' },
  { name: 'Accelerator alumni networks', why: 'People with startup context who may be between ventures.' },
  { name: 'Logistics & supply chain trade associations', why: 'Commercial leaders with existing warehouse relationships.' },
  { name: 'Co-founder matching platforms', why: 'Explicit signal that someone is actively looking.' },
]

function CoFounders() {
  const { opportunities } = useWorkspace()
  const candidates = opportunities.filter((o) => o.kind === 'cofounder')
  const [activeId, setActiveId] = React.useState(candidates[0]?.id)
  const active = candidates.find((c) => c.id === activeId)
  const [questions, setQuestions] = React.useState(QUESTION_BANK.slice(0, 5))
  const [checks, setChecks] = React.useState<Set<number>>(new Set())

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Co-Founder Search"
        description="A careful, evidence-led search for a commercial co-founder. Assessments are preliminary and never a judgement about a person."
        actions={<Button asChild><Link to="/lead-finder"><Compass /> Discover candidates</Link></Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-2">
          {candidates.length === 0 && <EmptyState icon={UserRoundSearch} title="No candidates yet">Use Lead Finder with “Co-founder candidates”.</EmptyState>}
          {candidates.map((c) => (
            <button key={c.id} type="button" onClick={() => setActiveId(c.id)} className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${activeId === c.id ? 'border-primary/50 bg-primary/[0.06]' : 'border-border bg-card hover:border-primary/30'}`}>
              <ScoreRing score={c.assessment?.score ?? null} size={38} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.stage} · {c.city}</span>
              </span>
            </button>
          ))}
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Where to look</h2>
            <ul className="flex flex-col gap-2.5 text-xs">
              {COMMUNITIES.map((c) => <li key={c.name}><span className="font-medium">{c.name}</span><span className="block text-muted-foreground">{c.why}</span></li>)}
            </ul>
          </div>
        </aside>

        {active && (
          <div className="flex flex-col gap-4">
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link to="/opportunities/$id" params={{ id: active.id }} className="font-display text-lg font-semibold hover:text-primary">{active.name}</Link>
                  <p className="text-sm text-muted-foreground">{active.industry} · {active.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  {active.assessment && <ConfidencePill confidence={active.assessment.confidence} />}
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">{active.stage}</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-foreground/85">{active.description}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground">Evidence & public links</h3>
                  <ul className="flex flex-col gap-2 text-sm">
                    {active.facts.map((f) => (
                      <li key={f.label} className="flex items-center justify-between gap-2">
                        <span>{f.label}: <span className={f.value ? '' : 'italic text-muted-foreground'}>{f.value ?? 'Not found'}</span></span>
                        <span className="flex items-center gap-2"><ProvenanceTag provenance={f.provenance} />{f.sourceUrl && <SourceLink url={f.sourceUrl} label="source" />}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-medium text-muted-foreground">Missing information</h3>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground">{active.assessment?.unknowns.map((u) => <li key={u}>{u}</li>)}</ul>
                  <h3 className="mb-1 mt-3 text-xs font-medium text-muted-foreground">Next step</h3>
                  <p className="text-sm text-primary">{active.assessment?.nextAction ?? 'Research this candidate'}</p>
                </div>
              </div>
            </section>

            {active.assessment && (
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-4 text-sm font-semibold">Co-Founder Fit Assessment <span className="font-normal text-muted-foreground">· preliminary</span></h2>
                <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {active.assessment.factors.map((f) => (
                    <div key={f.label}>
                      <div className="mb-1 flex justify-between text-xs"><span>{f.label}</span><span className="tabular font-mono">{f.score}</span></div>
                      <div className="h-1.5 rounded-full bg-secondary"><div className="h-1.5 rounded-full" style={{ width: `${f.score}%`, background: PIPELINES.cofounder.colorVar }} /></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold"><HelpCircle className="size-4 text-muted-foreground" /> First-meeting questions</h2>
                  <Button size="xs" variant="ghost" onClick={() => { setQuestions([...QUESTION_BANK].sort(() => Math.random() - 0.5).slice(0, 5)); toast('New question set') }}><Shuffle /> Shuffle</Button>
                </div>
                <ol className="flex list-decimal flex-col gap-2 pl-4 text-sm">{questions.map((q) => <li key={q}>{q}</li>)}</ol>
              </section>
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListChecks className="size-4 text-muted-foreground" /> Validation checklist <span className="tabular ml-auto font-mono text-xs font-normal text-muted-foreground">{checks.size}/{CHECKLIST.length}</span></h2>
                <ul className="flex flex-col gap-2 text-sm">
                  {CHECKLIST.map((c, i) => (
                    <li key={c}>
                      <label className="flex items-start gap-2.5">
                        <Checkbox className="mt-0.5" checked={checks.has(i)} onCheckedChange={() => setChecks((p) => { const n = new Set(p); if (n.has(i)) n.delete(i); else n.add(i); return n })} />
                        <span className={checks.has(i) ? 'text-muted-foreground line-through' : ''}>{c}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-muted-foreground">SORTED Connect never offers equity or makes commitments on your behalf.</p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
