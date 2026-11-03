import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { GripVertical } from 'lucide-react'
import { PageHeader, ScoreRing, formatGBP } from '@/components/bits'
import { PIPELINES, PIPELINE_ORDER } from '@/lib/pipelines'
import { useWorkspace } from '@/lib/store'
import type { Opportunity, PipelineKind } from '@/lib/types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/pipeline')({ component: Pipeline })

function Pipeline() {
  const { opportunities, moveStage } = useWorkspace()
  const [kind, setKind] = React.useState<PipelineKind>('customer')
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [over, setOver] = React.useState<string | null>(null)
  const cfg = PIPELINES[kind]
  const items = opportunities.filter((o) => o.kind === kind)

  const drop = (stage: string) => {
    if (!dragId) return
    const o = items.find((i) => i.id === dragId)
    if (o && o.stage !== stage) {
      moveStage(dragId, stage)
      toast.success(`${o.name} → ${stage}`)
    }
    setDragId(null)
    setOver(null)
  }

  const zone = (stage: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      setOver(stage)
    },
    onDragLeave: () => setOver((s) => (s === stage ? null : s)),
    onDrop: () => drop(stage),
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Sales Pipeline" description="Drag cards between stages. Each move is logged on the record’s activity timeline." />

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1" role="tablist" aria-label="Pipeline">
        {PIPELINE_ORDER.map((k) => {
          const n = opportunities.filter((o) => o.kind === k).length
          return (
            <button
              key={k}
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                kind === k ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="size-1.5 rounded-full" style={{ background: PIPELINES[k].colorVar }} />
              {PIPELINES[k].label}
              <span className="tabular font-mono text-[11px] text-muted-foreground">{n}</span>
            </button>
          )
        })}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        <div className="flex gap-3">
          {cfg.stages.map((stage) => {
            const cards = items.filter((o) => o.stage === stage)
            const value = cards.reduce((s, o) => s + (o.estimatedValue ?? 0), 0)
            return (
              <div
                key={stage}
                {...zone(stage)}
                className={cn(
                  'flex w-64 shrink-0 flex-col rounded-xl border bg-card/60 transition-colors',
                  over === stage ? 'border-primary/60 bg-primary/[0.05]' : 'border-border',
                )}
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs font-medium">{stage}</span>
                  <span className="tabular font-mono text-[11px] text-muted-foreground">
                    {cards.length}
                    {value > 0 && ` · ${formatGBP(value)}`}
                  </span>
                </div>
                <div className="flex min-h-24 flex-col gap-2 px-2 pb-2">
                  {cards.map((o) => (
                    <Card key={o.id} o={o} dragging={dragId === o.id} onDragStart={() => setDragId(o.id)} onDragEnd={() => { setDragId(null); setOver(null) }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Drop here to close out</p>
        <div className="flex flex-wrap gap-2">
          {cfg.closedStages.map((stage) => {
            const n = items.filter((o) => o.stage === stage).length
            return (
              <div
                key={stage}
                {...zone(stage)}
                className={cn(
                  'rounded-lg border border-dashed px-4 py-2.5 text-xs transition-colors',
                  over === stage ? 'border-primary/60 bg-primary/[0.05] text-foreground' : 'border-border text-muted-foreground',
                )}
              >
                {stage} <span className="tabular ml-1 font-mono">{n}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Card({ o, dragging, onDragStart, onDragEnd }: { o: Opportunity; dragging: boolean; onDragStart: () => void; onDragEnd: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'group cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-[opacity,border-color] hover:border-primary/40 active:cursor-grabbing',
        dragging && 'opacity-40',
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <Link to="/opportunities/$id" params={{ id: o.id }} className="block truncate text-sm font-medium hover:text-primary" draggable={false}>
            {o.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{o.city} · {o.industry}</p>
          {o.estimatedValue != null && <p className="tabular mt-1.5 font-mono text-[11px] text-muted-foreground">est. {formatGBP(o.estimatedValue)}/yr</p>}
        </div>
        <ScoreRing score={o.assessment?.score ?? null} size={32} />
      </div>
    </div>
  )
}
