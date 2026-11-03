import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Building2, Compass, Copy, Loader2, PenLine, Save, Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfidencePill, EmptyState, KindBadge, PageHeader, SampleTag, ScoreRing, SourceLink } from '@/components/bits'
import { CUSTOMER_INDUSTRIES, PIPELINES, PIPELINE_ORDER, UK_REGIONS } from '@/lib/pipelines'
import { SAMPLE_DISCOVERY, SAMPLE_QUICK_ASSESSMENTS } from '@/lib/fixtures'
import { useWorkspace } from '@/lib/store'
import type { DiscoveryResult, PipelineKind } from '@/lib/types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/lead-finder')({ component: LeadFinder })

const QUICK_REGIONS = ['UK nationwide', 'West Midlands', 'London', 'Birmingham', 'Manchester', 'Coventry']

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function LeadFinder() {
  const { opportunities, saveDiscoveryResults } = useWorkspace()
  const navigate = useNavigate()
  const [kind, setKind] = React.useState<PipelineKind>('customer')
  const [region, setRegion] = React.useState('West Midlands')
  const [industry, setIndustry] = React.useState('any')
  const [keywords, setKeywords] = React.useState('stock control, warehouse')
  const [size, setSize] = React.useState('any')
  const [urgency, setUrgency] = React.useState('any')
  const [count, setCount] = React.useState('10')
  const [excludeKnown, setExcludeKnown] = React.useState(true)

  const [status, setStatus] = React.useState<'idle' | 'searching' | 'done'>('idle')
  const [researching, setResearching] = React.useState(false)
  const [results, setResults] = React.useState<DiscoveryResult[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const knownDomains = React.useMemo(
    () => new Set(opportunities.map((o) => o.website?.replace(/^https?:\/\//, ''))),
    [opportunities],
  )

  const runSearch = (overrides?: { industry?: string; region?: string }) => {
    setStatus('searching')
    setSelected(new Set())
    const ind = overrides?.industry ?? industry
    const reg = overrides?.region ?? region
    window.setTimeout(() => {
      let pool = SAMPLE_DISCOVERY.map((r) => ({ ...r, alreadyInPipeline: knownDomains.has(r.domain) }))
      if (ind !== 'any') pool = pool.filter((r) => r.industry === ind)
      if (!['UK nationwide'].includes(reg)) {
        pool = pool.filter((r) => r.region === reg || r.city === reg)
        if (pool.length === 0) pool = SAMPLE_DISCOVERY.filter((r) => ind === 'any' || r.industry === ind)
      }
      if (excludeKnown) pool = pool.filter((r) => !r.alreadyInPipeline)
      setResults(pool.slice(0, Number(count)))
      setStatus('done')
    }, 900)
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectedResults = results.filter((r) => selected.has(r.id))

  const research = () => {
    if (!selectedResults.length) return toast.info('Select at least one result to research.')
    setResearching(true)
    window.setTimeout(() => {
      setResults((prev) =>
        prev.map((r) => {
          if (!selected.has(r.id)) return r
          const q = SAMPLE_QUICK_ASSESSMENTS[r.id]
          return q ? { ...r, quickScore: q.score, quickConfidence: q.confidence, quickReason: q.reason } : r
        }),
      )
      setResearching(false)
      toast.success(`Assessed ${selectedResults.length} result${selectedResults.length > 1 ? 's' : ''}`, {
        description: 'Preview scores. Live AI assessment runs on retrieved pages once the AI milestone ships.',
      })
    }, 1200)
  }

  const save = () => {
    if (!selectedResults.length) return toast.info('Select results to save.')
    const n = saveDiscoveryResults(selectedResults)
    const skipped = selectedResults.length - n
    setResults((prev) => prev.map((r) => (selected.has(r.id) ? { ...r, alreadyInPipeline: true } : r)))
    setSelected(new Set())
    toast.success(`${n} saved to pipeline`, {
      description: skipped ? `${skipped} skipped — already saved (matched by domain).` : 'Added at stage “New”.',
    })
  }

  const findSimilar = () => {
    const first = selectedResults[0]
    if (!first) return toast.info('Select one result to find similar businesses.')
    setIndustry(first.industry)
    runSearch({ industry: first.industry, region: 'UK nationwide' })
    toast(`Searching for businesses similar to ${first.name}`)
  }

  const generateOutreach = () => {
    const first = selectedResults[0]
    const saved = first && opportunities.find((o) => o.website?.includes(first.domain))
    if (!saved) return toast.info('Save a result to your pipeline first, then generate outreach for it.')
    navigate({ to: '/outreach', search: { id: saved.id } })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lead Finder"
        description="Discover real UK businesses and people across all five pipelines. Every result keeps its source link and research date."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <IntegrationStatus name="Brave Search" detail="Live web discovery. Free tier covers ~2,000 queries/month." />
        <IntegrationStatus name="Companies House" detail="Registration, status and SIC codes. Free API key." />
      </div>

      <section className="rounded-2xl border-2 border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Opportunity type">
            <Select value={kind} onValueChange={(v) => setKind(v as PipelineKind)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIPELINE_ORDER.map((k) => (
                  <SelectItem key={k} value={k}>{PIPELINES[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Region, city or postcode area">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {UK_REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Industry">
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any relevant industry</SelectItem>
                {CUSTOMER_INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Business keywords">
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. pick and pack, spares" />
          </Field>
          <Field label="Company size">
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any size</SelectItem>
                <SelectItem value="micro">Micro (1–9)</SelectItem>
                <SelectItem value="small">Small (10–49)</SelectItem>
                <SelectItem value="medium">Medium (50–249)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Customer fit & urgency">
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="outgrown">Signs of outgrowing spreadsheets</SelectItem>
                <SelectItem value="hiring">Hiring warehouse staff</SelectItem>
                <SelectItem value="growing">Growing / new site</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Results requested">
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['5', '10', '20', '50'].map((n) => <SelectItem key={n} value={n}>{n} results</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-end">
            <label className="flex h-9 w-full items-center justify-between gap-3 rounded-md border border-input bg-input/30 px-3 text-sm">
              Exclude already researched
              <Switch checked={excludeKnown} onCheckedChange={setExcludeKnown} />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick locations:</span>
          {QUICK_REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                region === r ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button onClick={() => runSearch()} disabled={status === 'searching'}>
            {status === 'searching' ? <Loader2 className="animate-spin" /> : <Compass />} Find Opportunities
          </Button>
          <Button variant="secondary" onClick={research} disabled={researching || !selected.size}>
            {researching ? <Loader2 className="animate-spin" /> : <Sparkles />} Research Selected
          </Button>
          <Button variant="secondary" onClick={save} disabled={!selected.size}>
            <Save /> Save to Pipeline
          </Button>
          <Button variant="outline" onClick={findSimilar} disabled={!selected.size}>
            <Copy /> Find Similar Businesses
          </Button>
          <Button variant="outline" onClick={generateOutreach} disabled={!selected.size}>
            <PenLine /> Generate Outreach
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            Est. cost: <span className="font-mono">{count === '50' ? '5' : '1'} search · £0.00</span>
          </span>
        </div>
      </section>

      <section>
        {status === 'idle' && (
          <EmptyState icon={Wand2} title="Set your filters and find opportunities">
            Start small (5–10 results) to keep searches cheap, then widen once a segment looks promising.
          </EmptyState>
        )}
        {status === 'searching' && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border-2 border-border bg-card p-4">
                <Skeleton className="size-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="size-11 rounded-full" />
              </div>
            ))}
          </div>
        )}
        {status === 'done' && results.length === 0 && (
          <EmptyState icon={Building2} title="No new results for these filters">
            Try a wider region, another industry or switch off “Exclude already researched”.
          </EmptyState>
        )}
        {status === 'done' && results.length > 0 && (
          <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={selected.size === results.length}
                  onCheckedChange={(v) => setSelected(v ? new Set(results.map((r) => r.id)) : new Set())}
                  aria-label="Select all results"
                />
                {selected.size ? `${selected.size} selected` : `${results.length} results`}
              </label>
              <span className="flex items-center gap-2">
                <SampleTag /> Preview results until Brave Search is connected
              </span>
            </div>
            <ul className="divide-y divide-border">
              {results.map((r) => (
                <li key={r.id} className={cn('flex items-start gap-4 px-4 py-4 transition-colors', selected.has(r.id) && 'bg-primary/[0.04]')}>
                  <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.name}</span>
                      <KindBadge kind={kind} />
                      {r.alreadyInPipeline && (
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">In pipeline</span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.snippet}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{r.industry}</span>
                      <span>{r.city}, {r.region}</span>
                      <span>Co. no: {r.companyNumber ?? <em>Not found</em>}</span>
                      <span>Via {r.source} · {r.retrievedAt}</span>
                      <SourceLink url={r.url} />
                    </div>
                    {r.quickReason && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-foreground/80">
                        <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" /> {r.quickReason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <ScoreRing score={r.quickScore ?? null} />
                    {r.quickConfidence && <ConfidencePill confidence={r.quickConfidence} />}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}

function IntegrationStatus({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="size-2 rounded-full bg-warning" /> {name} · not connected
        </div>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button variant="outline" size="sm" asChild>
        <Link to="/settings">Set up</Link>
      </Button>
    </div>
  )
}
