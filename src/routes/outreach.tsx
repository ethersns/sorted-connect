import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Copy,
  PenLine,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  EmptyState,
  KindBadge,
  PageHeader,
  ProvenanceTag,
} from '@/components/bits'
import {
  OUTPUT_TYPES,
  TONES,
  compose,
  type OutputType,
  type Tone,
} from '@/lib/compose'
import { useWorkspace } from '@/lib/store'

export const Route = createFileRoute('/outreach')({
  validateSearch: z.object({ id: z.string().optional() }),
  component: OutreachStudio,
})

const SORTED_PROFILE = {
  oneLiner:
    'Simple warehouse and inventory software for UK small and medium-sized businesses.',
  founder: 'SORTED founder',
}

const DEFAULT_TYPE: Record<string, OutputType> = {
  customer: 'Cold business introduction email',
  referral: 'Referral request',
  partner: 'Partnership introduction',
  cofounder: 'Co-founder networking introduction',
  funding: 'Cold business introduction email',
}

function OutreachStudio() {
  const { id } = Route.useSearch()
  const { opportunities, addActivity } = useWorkspace()
  const eligible = opportunities.filter((o) => !o.doNotContact)
  const [targetId, setTargetId] = React.useState(id ?? eligible[0]?.id ?? '')
  const target = opportunities.find((o) => o.id === targetId)
  const [type, setType] = React.useState<OutputType>(
    DEFAULT_TYPE[target?.kind ?? 'customer'],
  )
  const [tone, setTone] = React.useState<Tone>('Founder-to-founder')
  const [variant, setVariant] = React.useState(0)
  const [draft, setDraft] = React.useState('')
  const [generating, setGenerating] = React.useState(false)

  const generate = (nextVariant = variant) => {
    if (!target) return
    setGenerating(true)
    window.setTimeout(() => {
      setDraft(compose(target, type, tone, nextVariant, SORTED_PROFILE))
      setGenerating(false)
    }, 500)
  }

  const verified =
    target?.facts.filter((f) => f.provenance === 'verified') ?? []
  const emailType = type.toLowerCase().includes('email')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Outreach Studio"
        description="Personal, human drafts built only from verified facts and your approved SORTED positioning. You review and send every message yourself."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-2xl border-2 border-border bg-card p-5">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Recipient</Label>
              <Select
                value={targetId}
                onValueChange={(v) => {
                  setTargetId(v)
                  setDraft('')
                  const o = opportunities.find((x) => x.id === v)
                  if (o) setType(DEFAULT_TYPE[o.kind])
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a record" />
                </SelectTrigger>
                <SelectContent>
                  {eligible.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Message type
              </Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as OutputType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tone</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`rounded-md border px-2 py-1.5 text-left text-xs transition-colors ${tone === t ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => generate()} disabled={!target || generating}>
              <Sparkles /> {generating ? 'Drafting…' : 'Generate draft'}
            </Button>
          </section>

          {target && (
            <section className="rounded-2xl border-2 border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <Link
                  to="/opportunities/$id"
                  params={{ id: target.id }}
                  className="text-sm font-semibold hover:text-primary"
                >
                  {target.name}
                </Link>
                <KindBadge kind={target.kind} />
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                Facts the draft may use
              </p>
              <ul className="flex flex-col gap-1.5 text-xs">
                {verified.map((f) => (
                  <li key={f.label} className="flex justify-between gap-2">
                    <span>{f.label}</span>
                    <ProvenanceTag provenance="verified" />
                  </li>
                ))}
                {target.assessment?.evidence.map((e) => (
                  <li key={e.text} className="text-foreground/80">
                    {e.text}
                  </li>
                ))}
                {verified.length === 0 && !target.assessment && (
                  <li className="text-muted-foreground">
                    Only name, industry and location are known — research this
                    record for a more personal draft.
                  </li>
                )}
              </ul>
            </section>
          )}
        </aside>

        <section className="flex flex-col gap-3">
          {target?.isSoleTrader && emailType && (
            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/[0.06] px-4 py-3 text-sm">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              <p>
                This is a sole trader or individual. Under PECR, unsolicited
                marketing email to individuals needs prior consent — consider a
                LinkedIn note, a phone call, or a warm introduction instead.
              </p>
            </div>
          )}
          {!draft ? (
            <EmptyState icon={PenLine} title="No draft yet">
              Choose a recipient, message type and tone, then generate.
            </EmptyState>
          ) : (
            <div className="rounded-2xl border-2 border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
                <span>
                  {type} · {tone}
                </span>
                <span>{draft.length} characters</span>
              </div>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={16}
                className="min-h-80 resize-y rounded-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed focus-visible:ring-0 dark:bg-transparent"
                aria-label="Draft message"
              />
              <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
                <Button
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(draft)
                    toast.success('Copied to clipboard')
                  }}
                >
                  <Copy /> Copy
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const v = variant + 1
                    setVariant(v)
                    generate(v)
                  }}
                >
                  <RefreshCw /> Regenerate
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (target) {
                      addActivity(target.id, {
                        type: 'email',
                        title: `Draft saved: ${type}`,
                        detail: draft.slice(0, 140) + '…',
                      })
                      toast.success('Draft saved to record')
                    }
                  }}
                >
                  <Save /> Save draft
                </Button>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  Edit freely above · sent manually by you
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
