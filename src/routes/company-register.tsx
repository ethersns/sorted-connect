import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  Landmark,
  Loader2,
  Play,
  Receipt,
  Save,
  Search,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState, PageHeader, SourceLink } from '@/components/bits'
import {
  checkVatNumber,
  exportRegisterCompanies,
  getRegisterStatus,
  importRegisterBatch,
  listRegisterCompanies,
  markAddedToPipeline,
  startRegisterImport,
  type RegisterCompany,
} from '@/lib/register.functions'
import { ALL_STOCK_SIC, CH_MAX_OFFSET, CH_PAGE_SIZE, STOCK_SEGMENTS, segmentLabel } from '@/lib/stock-sic'
import { downloadCsv } from '@/lib/csv'
import { useWorkspace } from '@/lib/store'
import type { DiscoveryResult } from '@/lib/types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/company-register')({ component: CompanyRegisterPage })

type Status = Awaited<ReturnType<typeof getRegisterStatus>>

const nf = new Intl.NumberFormat('en-GB')
const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong')

function CompanyRegisterPage() {
  const [status, setStatus] = React.useState<Status | null>(null)
  const [tab, setTab] = React.useState('browse')
  const [refreshKey, setRefreshKey] = React.useState(0)
  const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), [])

  React.useEffect(() => {
    getRegisterStatus()
      .then(setStatus)
      .catch((e) => toast.error('Could not load register status', { description: errMsg(e) }))
  }, [refreshKey])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="UK Company Register"
        description="Real, active UK companies whose registered business activity (SIC code) means they are likely to hold stock. Pulled from Companies House in bulk and checked against HMRC VAT records. Nothing here is sample data."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <ConnectionCard
          name="Companies House"
          connected={status?.connected.companiesHouse}
          detail="Source of all companies. Free API key, 600 requests per 5 minutes."
        />
        <ConnectionCard
          name="HMRC VAT Check"
          connected={status?.connected.hmrc}
          detail="Confirms a VAT number and its registered trading name."
        />
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
          <Database className="size-5 text-primary" />
          <div className="min-w-0">
            {status ? (
              <>
                <div className="tabular text-sm font-medium">{nf.format(status.total)} companies saved</div>
                <p className="truncate text-xs text-muted-foreground">
                  {nf.format(status.inPipeline)} in pipeline · {nf.format(status.vatChecked)} VAT-checked
                </p>
              </>
            ) : (
              <>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1.5 h-3 w-40" />
              </>
            )}
          </div>
        </div>
      </div>

      {status?.databaseError && (
        <p role="alert" className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {status.databaseError}
        </p>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="browse">
            <Building2 /> Browse leads
          </TabsTrigger>
          <TabsTrigger value="import">
            <Download /> Import from Companies House
          </TabsTrigger>
          <TabsTrigger value="hmrc">
            <Receipt /> HMRC VAT check
          </TabsTrigger>
        </TabsList>
        <TabsContent value="browse" className="mt-4">
          <BrowseTab
            refreshKey={refreshKey}
            onChanged={refresh}
            total={status?.total ?? null}
            hmrcConnected={Boolean(status?.connected.hmrc)}
            goToImport={() => setTab('import')}
          />
        </TabsContent>
        <TabsContent value="import" className="mt-4">
          <ImportTab status={status} onChanged={refresh} />
        </TabsContent>
        <TabsContent value="hmrc" className="mt-4">
          <VatTab connected={Boolean(status?.connected.hmrc)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ConnectionCard({ name, connected, detail }: { name: string; connected?: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span
            className={cn(
              'size-2 rounded-full',
              connected == null ? 'bg-muted-foreground' : connected ? 'bg-success' : 'bg-warning',
            )}
          />
          {name} · {connected == null ? 'checking…' : connected ? 'connected' : 'not connected'}
        </div>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      {connected === false && (
        <Button variant="outline" size="sm" asChild>
          <Link to="/settings">Set up</Link>
        </Button>
      )}
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Browse
// ---------------------------------------------------------------------------

type Filters = {
  q: string
  segment: string
  location: string
  pipeline: 'any' | 'not-added' | 'added'
  sort: 'name' | 'newest-company' | 'oldest-company' | 'recently-imported'
}

const PAGE_SIZE = 50

function toDiscovery(c: RegisterCompany): DiscoveryResult {
  const sic = c.sicCodes.map((s) => ALL_STOCK_SIC[s] ?? `SIC ${s}`)
  return {
    id: c.companyNumber,
    name: c.name,
    snippet: `Registered activity: ${sic.join('; ') || 'Not found'}. Registered office: ${
      [c.addressLine1, c.locality, c.postcode].filter(Boolean).join(', ') || 'Not found'
    }.`,
    url: c.sourceUrl,
    domain: '',
    city: c.locality ?? 'Not found',
    region: c.region ?? c.country ?? 'Not found',
    industry: sic[0] ?? segmentLabel(c.stockSegment),
    source: 'Companies House',
    companyNumber: c.companyNumber,
    companyStatus: c.status,
    retrievedAt: c.retrievedAt.slice(0, 10),
    alreadyInPipeline: Boolean(c.addedToPipelineAt),
  }
}

function BrowseTab({
  refreshKey,
  onChanged,
  total,
  hmrcConnected,
  goToImport,
}: {
  refreshKey: number
  onChanged: () => void
  total: number | null
  hmrcConnected: boolean
  goToImport: () => void
}) {
  const { saveDiscoveryResults } = useWorkspace()
  const [draft, setDraft] = React.useState<Filters>({ q: '', segment: 'all', location: '', pipeline: 'any', sort: 'name' })
  const [filters, setFilters] = React.useState(draft)
  const [page, setPage] = React.useState(1)
  const [data, setData] = React.useState<{ rows: RegisterCompany[]; total: number } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [exporting, setExporting] = React.useState(false)
  const [vatFor, setVatFor] = React.useState<RegisterCompany | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listRegisterCompanies({ data: { ...filters, page, pageSize: PAGE_SIZE } })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(errMsg(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [filters, page, refreshKey])

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault()
    setSelected(new Set())
    setPage(1)
    setFilters(draft)
  }

  const rows = data?.rows ?? []
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const selectedRows = rows.filter((r) => selected.has(r.companyNumber))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const sendToPipeline = async () => {
    if (!selectedRows.length) return
    const n = saveDiscoveryResults(selectedRows.map(toDiscovery))
    try {
      await markAddedToPipeline({ data: { companyNumbers: selectedRows.map((r) => r.companyNumber) } })
      toast.success(`${n} added to the customer pipeline`, {
        description:
          n < selectedRows.length ? `${selectedRows.length - n} skipped: already saved (matched by company number).` : 'Added at stage “New”.',
      })
      setSelected(new Set())
      onChanged()
    } catch (e) {
      toast.error('Saved to pipeline, but the register could not be updated', { description: errMsg(e) })
    }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await exportRegisterCompanies({ data: filters })
      const esc = (v: unknown) => {
        const s = v == null || v === '' ? 'Not found' : String(v)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const header = ['Company name', 'Company number', 'Status', 'Type', 'Incorporated', 'SIC codes', 'Activity', 'Segment', 'Address', 'Town', 'Postcode', 'VAT number (HMRC verified)', 'VAT checked', 'Source', 'Retrieved']
      const lines = all.map((c) =>
        [
          c.name,
          c.companyNumber,
          c.status,
          c.companyType,
          c.incorporatedOn,
          c.sicCodes.join(' '),
          c.sicCodes.map((s) => ALL_STOCK_SIC[s] ?? s).join('; '),
          segmentLabel(c.stockSegment),
          c.addressLine1,
          c.locality,
          c.postcode,
          c.vatNumber,
          c.vatCheckedAt?.slice(0, 10),
          c.sourceUrl,
          c.retrievedAt.slice(0, 10),
        ]
          .map(esc)
          .join(','),
      )
      downloadCsv(`sorted-register-${new Date().toISOString().slice(0, 10)}.csv`, [header.join(','), ...lines].join('\n'))
      toast.success(`Exported ${nf.format(all.length)} companies`)
    } catch (e) {
      toast.error('Export failed', { description: errMsg(e) })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={apply} className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1.2fr_1fr_1fr_auto]">
        <Field label="Company name or number" htmlFor="reg-q">
          <Input id="reg-q" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} placeholder="e.g. Midland Fasteners" />
        </Field>
        <Field label="Type of stock business">
          <Select value={draft.segment} onValueChange={(v) => setDraft({ ...draft, segment: v })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock-holding segments</SelectItem>
              {STOCK_SEGMENTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Town or postcode area" htmlFor="reg-loc">
          <Input id="reg-loc" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="e.g. Coventry or B7" />
        </Field>
        <Field label="Pipeline">
          <Select value={draft.pipeline} onValueChange={(v) => setDraft({ ...draft, pipeline: v as Filters['pipeline'] })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="not-added">Not yet added</SelectItem>
              <SelectItem value="added">Already added</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Sort">
          <Select value={draft.sort} onValueChange={(v) => setDraft({ ...draft, sort: v as Filters['sort'] })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="newest-company">Newest companies</SelectItem>
              <SelectItem value="oldest-company">Longest trading</SelectItem>
              <SelectItem value="recently-imported">Recently imported</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full"><Search /> Filter</Button>
        </div>
      </form>

      {total === 0 && !loading && !error ? (
        <EmptyState icon={Landmark} title="No companies imported yet">
          <p>Pull thousands of active stock-holding companies from Companies House, then filter them here.</p>
          <Button className="mt-4" onClick={goToImport}><Download /> Start an import</Button>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={rows.length > 0 && selectedRows.length === rows.length}
                onCheckedChange={(v) => setSelected(v ? new Set(rows.map((r) => r.companyNumber)) : new Set())}
                aria-label="Select all on this page"
              />
              {selected.size
                ? `${selected.size} selected`
                : data
                  ? `${nf.format(data.total)} companies match`
                  : 'Loading…'}
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={sendToPipeline} disabled={!selected.size}>
                <Save /> Add to pipeline
              </Button>
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={exporting || !data?.total}>
                {exporting ? <Loader2 className="animate-spin" /> : <Download />} Export CSV
              </Button>
            </div>
          </div>

          {error ? (
            <p role="alert" className="px-4 py-10 text-center text-sm text-destructive">
              {error}
            </p>
          ) : loading && !data ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="size-4" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-7 w-20" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No saved companies match these filters.</p>
          ) : (
            <ul className={cn('divide-y divide-border transition-opacity motion-reduce:transition-none', loading && 'opacity-60')}>
              {rows.map((c) => (
                <li key={c.companyNumber} className={cn('flex items-start gap-4 px-4 py-3', selected.has(c.companyNumber) && 'bg-primary/[0.04]')}>
                  <Checkbox
                    checked={selected.has(c.companyNumber)}
                    onCheckedChange={() => toggle(c.companyNumber)}
                    aria-label={`Select ${c.name}`}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      <span className="rounded border border-border px-1.5 py-px font-mono text-[11px] text-muted-foreground">{c.companyNumber}</span>
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">{segmentLabel(c.stockSegment)}</span>
                      {c.addedToPipelineAt && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] text-primary">In pipeline</span>
                      )}
                      {c.vatCheckedAt && (
                        <span className="inline-flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[11px] text-success">
                          <BadgeCheck className="size-3" /> VAT {c.vatNumber}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {c.sicCodes.map((s) => ALL_STOCK_SIC[s] ?? `SIC ${s}`).join(' · ') || 'Activity: Not found'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{[c.addressLine1, c.locality, c.postcode].filter(Boolean).join(', ') || 'Address: Not found'}</span>
                      <span>Incorporated {shortDate(c.incorporatedOn) ?? 'Not found'}</span>
                      <span>Retrieved {shortDate(c.retrievedAt)}</span>
                      <SourceLink url={c.sourceUrl} label="Companies House" />
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setVatFor(c)} disabled={!hmrcConnected} title={hmrcConnected ? undefined : 'Connect HMRC first'}>
                    <Receipt /> {c.vatCheckedAt ? 'Re-check VAT' : 'Check VAT'}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {data && data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span className="tabular">
                Page {nf.format(page)} of {nf.format(pages)}
              </span>
              <div className="flex gap-1">
                <Button size="icon-sm" variant="outline" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => { setSelected(new Set()); setPage((p) => p - 1) }}>
                  <ChevronLeft />
                </Button>
                <Button size="icon-sm" variant="outline" aria-label="Next page" disabled={page >= pages || loading} onClick={() => { setSelected(new Set()); setPage((p) => p + 1) }}>
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <VatDialog company={vatFor} onClose={() => setVatFor(null)} onSaved={onChanged} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

const TARGETS = [1000, 5000, 10000, 25000, 50000]

function ImportTab({ status, onChanged }: { status: Status | null; onChanged: () => void }) {
  const [segmentId, setSegmentId] = React.useState(STOCK_SEGMENTS[0]!.id)
  const segment = STOCK_SEGMENTS.find((s) => s.id === segmentId)!
  const [codes, setCodes] = React.useState<Set<string>>(new Set(Object.keys(segment.codes)))
  const [location, setLocation] = React.useState('')
  const [target, setTarget] = React.useState(5000)
  const [running, setRunning] = React.useState(false)
  const [progress, setProgress] = React.useState({ fetched: 0, added: 0, current: '' })
  const stopRef = React.useRef(false)

  const pickSegment = (id: string) => {
    setSegmentId(id)
    setCodes(new Set(Object.keys(STOCK_SEGMENTS.find((s) => s.id === id)!.codes)))
  }

  const run = async () => {
    const list = Object.keys(segment.codes).filter((c) => codes.has(c))
    if (!list.length) return toast.info('Pick at least one business activity.')
    stopRef.current = false
    setRunning(true)
    let fetched = 0
    let added = 0
    setProgress({ fetched, added, current: '' })
    try {
      const { importId } = await startRegisterImport({
        data: { segment: segment.id, location: location.trim() || undefined, requested: target },
      })
      outer: for (const code of list) {
        let start = 0
        for (;;) {
          if (stopRef.current || fetched >= target) break outer
          const size = Math.min(CH_PAGE_SIZE, target - fetched, CH_MAX_OFFSET - start)
          if (size <= 0) break
          setProgress({ fetched, added, current: segment.codes[code] ?? code })
          const res = await importRegisterBatch({
            data: { importId, sicCode: code, location: location.trim() || undefined, startIndex: start, size },
          })
          fetched += res.fetched
          added += res.added
          start += res.fetched
          setProgress({ fetched, added, current: segment.codes[code] ?? code })
          if (res.fetched === 0 || start >= res.hits) break
        }
      }
      toast.success(`Import ${stopRef.current ? 'stopped' : 'finished'}: ${nf.format(added)} new companies`, {
        description: `${nf.format(fetched)} retrieved from Companies House. ${nf.format(fetched - added)} were already saved and were refreshed.`,
      })
    } catch (e) {
      toast.error('Import stopped', {
        description: `${errMsg(e)} ${nf.format(added)} new companies were saved before it stopped.`,
      })
    } finally {
      setRunning(false)
      onChanged()
    }
  }

  const notConnected = status ? !status.connected.companiesHouse : false
  const pct = Math.min(100, Math.round((progress.fetched / target) * 100))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Pull stock-holding companies</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Searches the Companies House register for active companies registered under each selected activity. Companies already saved are refreshed, never duplicated.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {STOCK_SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={running}
              onClick={() => pickSegment(s.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors motion-reduce:transition-none',
                segmentId === s.id ? 'border-primary/50 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {s.label}
              {status?.bySegment[s.id] ? <span className="tabular ml-1.5 opacity-70">{nf.format(status.bySegment[s.id]!)}</span> : null}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{segment.why}</p>

        <fieldset className="mt-4" disabled={running}>
          <div className="flex items-center justify-between">
            <legend className="text-xs text-muted-foreground">Business activities (SIC codes)</legend>
            <div className="flex gap-2 text-xs">
              <button type="button" className="text-primary hover:underline" onClick={() => setCodes(new Set(Object.keys(segment.codes)))}>All</button>
              <button type="button" className="text-primary hover:underline" onClick={() => setCodes(new Set())}>None</button>
            </div>
          </div>
          <div className="mt-2 grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
            {Object.entries(segment.codes).map(([code, label]) => (
              <label key={code} className="flex items-start gap-2 rounded px-1.5 py-1 text-xs hover:bg-accent/50">
                <Checkbox
                  checked={codes.has(code)}
                  onCheckedChange={(v) =>
                    setCodes((prev) => {
                      const next = new Set(prev)
                      if (v) next.add(code)
                      else next.delete(code)
                      return next
                    })
                  }
                  className="mt-px"
                />
                <span>
                  <span className="font-mono text-muted-foreground">{code}</span> {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Location (optional, matches the registered office)" htmlFor="imp-loc">
            <Input id="imp-loc" disabled={running} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Leave blank for the whole UK, or e.g. Birmingham" />
          </Field>
          <Field label="How many companies">
            <Select value={String(target)} onValueChange={(v) => setTarget(Number(v))} disabled={running}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TARGETS.map((t) => <SelectItem key={t} value={String(t)}>Up to {nf.format(t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {running ? (
            <Button variant="secondary" onClick={() => (stopRef.current = true)}>
              <Square /> Stop after this batch
            </Button>
          ) : (
            <Button onClick={run} disabled={notConnected}>
              <Play /> Import companies
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            About {Math.ceil(target / CH_PAGE_SIZE)} Companies House request{target > CH_PAGE_SIZE ? 's' : ''} · free
          </span>
        </div>
        {notConnected && (
          <p className="mt-3 text-sm text-warning">Add a Companies House API key to start importing. It is free from developer.company-information.service.gov.uk.</p>
        )}

        {(running || progress.fetched > 0) && (
          <div className="mt-4 rounded-lg border border-border bg-background/40 p-3" aria-live="polite">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                {running && <Loader2 className="size-3.5 animate-spin text-primary" />}
                {running ? `Fetching: ${progress.current || 'starting…'}` : 'Last import'}
              </span>
              <span className="tabular text-muted-foreground">
                {nf.format(progress.fetched)} retrieved · {nf.format(progress.added)} new
              </span>
            </div>
            <Progress value={pct} className="mt-2" aria-label="Import progress" />
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Saved by segment</h3>
          {status ? (
            <ul className="mt-2 space-y-1.5 text-xs">
              {STOCK_SEGMENTS.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="tabular font-mono">{nf.format(status.bySegment[s.id] ?? 0)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Skeleton className="mt-2 h-24 w-full" />
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium">Recent imports</h3>
          {status && status.imports.length === 0 && <p className="mt-2 text-xs text-muted-foreground">None yet.</p>}
          <ul className="mt-2 space-y-2 text-xs">
            {status?.imports.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-muted-foreground">
                  {segmentLabel(i.segment)}
                  {i.location ? ` · ${i.location}` : ''} · {shortDate(i.createdAt)}
                </span>
                <span className="tabular shrink-0 font-mono">+{nf.format(i.added)}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          Companies House lists limited companies and LLPs. Sole traders and partnerships are not on any public register, so they cannot be imported in bulk.
        </p>
      </aside>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HMRC
// ---------------------------------------------------------------------------

type VatResult = Awaited<ReturnType<typeof checkVatNumber>>

function VatResultCard({ result }: { result: VatResult }) {
  if (!result.found)
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
        HMRC has no VAT registration for GB{result.vatNumber}. Checked {shortDate(result.checkedAt)}.
      </div>
    )
  return (
    <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
      <div className="flex items-center gap-2 font-medium text-success">
        <BadgeCheck className="size-4" /> Verified by HMRC
      </div>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">VAT number</dt>
        <dd className="font-mono">GB{result.vatNumber}</dd>
        <dt className="text-muted-foreground">Registered name</dt>
        <dd>{result.name}</dd>
        <dt className="text-muted-foreground">Address</dt>
        <dd>{result.address || 'Not found'}</dd>
        <dt className="text-muted-foreground">Checked</dt>
        <dd>{shortDate(result.checkedAt)} · HMRC VAT Check API</dd>
      </dl>
    </div>
  )
}

function useVatCheck() {
  const [checking, setChecking] = React.useState(false)
  const [result, setResult] = React.useState<VatResult | null>(null)
  const check = async (vatNumber: string, companyNumber?: string) => {
    setChecking(true)
    setResult(null)
    try {
      const r = await checkVatNumber({ data: { vatNumber, companyNumber } })
      setResult(r)
      return r
    } catch (e) {
      toast.error('VAT check failed', { description: errMsg(e) })
      return null
    } finally {
      setChecking(false)
    }
  }
  return { checking, result, check, reset: () => setResult(null) }
}

function VatTab({ connected }: { connected: boolean }) {
  const [vat, setVat] = React.useState('')
  const { checking, result, check } = useVatCheck()
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Check a VAT number with HMRC</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a UK VAT number from an invoice, website footer or email signature. HMRC confirms whether it is registered and returns the business’s registered name and address.
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            if (vat.trim()) void check(vat)
          }}
        >
          <div className="flex-1">
            <Field label="UK VAT number" htmlFor="vat-input">
              <Input id="vat-input" value={vat} onChange={(e) => setVat(e.target.value)} placeholder="GB123456789" inputMode="text" autoComplete="off" />
            </Field>
          </div>
          <Button type="submit" disabled={!connected || checking || !vat.trim()}>
            {checking ? <Loader2 className="animate-spin" /> : <Receipt />} Check with HMRC
          </Button>
        </form>
        {!connected && (
          <p className="mt-3 text-sm text-warning">
            Add HMRC_CLIENT_ID and HMRC_CLIENT_SECRET from an HMRC Developer Hub application subscribed to the “Check a UK VAT number” API.
          </p>
        )}
        {result && <div className="mt-4"><VatResultCard result={result} /></div>}
      </section>
      <aside className="rounded-xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        <h3 className="mb-2 text-sm font-medium text-foreground">What HMRC can and can’t provide</h3>
        <p>HMRC does not publish a searchable list of businesses, so no tool can pull leads in bulk from HMRC. Its public API verifies one VAT number at a time.</p>
        <p className="mt-2">Use it to confirm a lead is real and VAT-registered (a sign it turns over more than £90,000 a year). To verify a saved company and keep the result on its record, use <span className="text-foreground">Check VAT</span> on the Browse leads tab.</p>
      </aside>
    </div>
  )
}

function VatDialog({ company, onClose, onSaved }: { company: RegisterCompany | null; onClose: () => void; onSaved: () => void }) {
  const [vat, setVat] = React.useState('')
  const { checking, result, check, reset } = useVatCheck()

  React.useEffect(() => {
    setVat(company?.vatNumber ?? '')
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.companyNumber])

  return (
    <Dialog open={Boolean(company)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check VAT for {company?.name}</DialogTitle>
          <DialogDescription>
            Enter the VAT number shown on the company’s website or invoices. A verified result is saved to this company.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!company || !vat.trim()) return
            const r = await check(vat, company.companyNumber)
            if (r?.found) onSaved()
          }}
        >
          <Field label="UK VAT number" htmlFor="vat-dialog-input">
            <Input id="vat-dialog-input" value={vat} onChange={(e) => setVat(e.target.value)} placeholder="GB123456789" autoComplete="off" />
          </Field>
          {result && <VatResultCard result={result} />}
          {result?.found && company && result.name.toLowerCase() !== company.name.toLowerCase() && (
            <p className="text-xs text-warning">
              The HMRC name differs from the Companies House name. Check this is the same business before relying on it.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={checking || !vat.trim()}>
              {checking ? <Loader2 className="animate-spin" /> : <Receipt />} Check with HMRC
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
