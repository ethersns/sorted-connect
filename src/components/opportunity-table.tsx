import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ArrowDownUp, Ban, Download, Search, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState, KindBadge, ScoreRing, formatDate } from '@/components/bits'
import { PIPELINES, PIPELINE_ORDER } from '@/lib/pipelines'
import { useWorkspace } from '@/lib/store'
import { downloadCsv, opportunitiesToCsv } from '@/lib/csv'
import type { PipelineKind } from '@/lib/types'

type SortKey = 'score' | 'name' | 'recent'

export function OpportunityTable({ kinds, allowKindFilter = true }: { kinds?: PipelineKind[]; allowKindFilter?: boolean }) {
  const { opportunities, updateOpportunity } = useWorkspace()
  const [q, setQ] = React.useState('')
  const [kind, setKind] = React.useState<'all' | PipelineKind>('all')
  const [sort, setSort] = React.useState<SortKey>('score')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const rows = opportunities
    .filter((o) => (kinds ? kinds.includes(o.kind) : true))
    .filter((o) => (kind === 'all' ? true : o.kind === kind))
    .filter((o) => [o.name, o.city, o.region, o.industry, o.stage, ...o.tags].join(' ').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : sort === 'recent'
          ? b.lastTouchedAt.localeCompare(a.lastTouchedAt)
          : (b.assessment?.score ?? -1) - (a.assessment?.score ?? -1),
    )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const bulkTag = () => {
    const tag = window.prompt('Tag to add to selected records')?.trim()
    if (!tag) return
    for (const r of rows) {
      if (selected.has(r.id) && !r.tags.includes(tag)) updateOpportunity(r.id, { tags: [...r.tags, tag] })
    }
    toast.success(`Tagged ${selected.size} record${selected.size > 1 ? 's' : ''} “${tag}”`)
  }

  const bulkDnc = () => {
    rows.filter((r) => selected.has(r.id)).forEach((r) => updateOpportunity(r.id, { doNotContact: true }))
    toast.success(`${selected.size} marked do-not-contact`)
    setSelected(new Set())
  }

  const exportCsv = () => {
    const target = selected.size ? rows.filter((r) => selected.has(r.id)) : rows
    downloadCsv(`sorted-connect-${new Date().toISOString().slice(0, 10)}.csv`, opportunitiesToCsv(target))
    toast.success(`Exported ${target.length} record${target.length === 1 ? '' : 's'} to CSV`)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, city, stage, tag…" className="pl-9" />
        </div>
        {allowKindFilter && (
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All pipelines</SelectItem>
              {PIPELINE_ORDER.filter((k) => !kinds || kinds.includes(k)).map((k) => (
                <SelectItem key={k} value={k}>{PIPELINES[k].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-40"><ArrowDownUp className="size-3.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Fit score</SelectItem>
            <SelectItem value="recent">Recently active</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}><Download /> Export CSV</Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <Button size="xs" variant="secondary" onClick={bulkTag}><Tag /> Add tag</Button>
          <Button size="xs" variant="secondary" onClick={bulkDnc}><Ban /> Do not contact</Button>
          <Button size="xs" variant="ghost" onClick={() => setSelected(new Set())} className="ml-auto">Clear</Button>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={Search} title="Nothing matches">Adjust your filters or discover new records in Lead Finder.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    aria-label="Select all"
                    checked={selected.size === rows.length}
                    onCheckedChange={(v) => setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())}
                  />
                </th>
                <th className="px-2 py-2.5 font-medium">Organisation / person</th>
                <th className="px-2 py-2.5 font-medium">Pipeline</th>
                <th className="px-2 py-2.5 font-medium">Stage</th>
                <th className="px-2 py-2.5 font-medium">Location</th>
                <th className="px-2 py-2.5 font-medium">Tags</th>
                <th className="px-2 py-2.5 font-medium">Last activity</th>
                <th className="px-4 py-2.5 text-right font-medium">Fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((o) => (
                <tr key={o.id} className="group hover:bg-accent/40">
                  <td className="px-4 py-2.5">
                    <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} aria-label={`Select ${o.name}`} />
                  </td>
                  <td className="px-2 py-2.5">
                    <Link to="/opportunities/$id" params={{ id: o.id }} className="font-medium hover:text-primary">
                      {o.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {o.industry}
                      {o.doNotContact && <span className="rounded bg-destructive/15 px-1 text-[10px] font-medium text-destructive">DNC</span>}
                    </div>
                  </td>
                  <td className="px-2 py-2.5"><KindBadge kind={o.kind} /></td>
                  <td className="px-2 py-2.5 text-muted-foreground">{o.stage}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{o.city}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {o.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="tabular px-2 py-2.5 text-muted-foreground">{formatDate(o.lastTouchedAt)}</td>
                  <td className="px-4 py-2"><div className="flex justify-end"><ScoreRing score={o.assessment?.score ?? null} size={36} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
