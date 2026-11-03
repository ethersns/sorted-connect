import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  ArrowLeft, Ban, CalendarPlus, CheckCircle2, FileText, Globe, Mail, MessageSquare, PenLine, Phone, Plus, Sparkles, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ConfidencePill, EmptyState, KindBadge, ProvenanceTag, ScoreRing, SourceLink, formatDate,
} from '@/components/bits'
import { PIPELINES } from '@/lib/pipelines'
import { useWorkspace } from '@/lib/store'
import type { Activity, Opportunity } from '@/lib/types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/opportunities_/$id')({
  component: Profile,
})

const ACTIVITY_ICON: Record<Activity['type'], React.ElementType> = {
  note: FileText, email: Mail, call: Phone, meeting: Users, stage: CheckCircle2, research: Sparkles,
}

function Profile() {
  const { id } = Route.useParams()
  const { getOpportunity } = useWorkspace()
  const o = getOpportunity(id)
  if (!o) {
    return (
      <EmptyState icon={Users} title="Record not found">
        It may have been removed. <Link to="/opportunities" className="text-primary hover:underline">Back to all opportunities</Link>
      </EmptyState>
    )
  }
  return <ProfileView key={o.id} o={o} />
}

function ProfileView({ o }: { o: Opportunity }) {
  const { moveStage, updateOpportunity, addActivity, tasks, addTask, toggleTask } = useWorkspace()
  const pipeline = PIPELINES[o.kind]
  const [notes, setNotes] = React.useState(o.notes)
  const [logType, setLogType] = React.useState<Activity['type']>('note')
  const [logText, setLogText] = React.useState('')
  const [taskTitle, setTaskTitle] = React.useState('')
  const [taskDue, setTaskDue] = React.useState('2026-11-06')
  const myTasks = tasks.filter((t) => t.opportunityId === o.id)

  return (
    <div className="flex flex-col gap-6">
      <Link to="/opportunities" className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All opportunities
      </Link>

      <header className="flex flex-col gap-5 rounded-2xl border-2 border-border bg-card p-5 md:flex-row md:items-start">
        <ScoreRing score={o.assessment?.score ?? null} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{o.name}</h1>
            <KindBadge kind={o.kind} />
            {o.assessment && <ConfidencePill confidence={o.assessment.confidence} />}
            {o.doNotContact && <span className="rounded bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">Do not contact</span>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{o.industry} · {o.city}, {o.region}</p>
          <p className="mt-3 max-w-reading text-sm text-foreground/85">{o.description}</p>
          {o.website && (
            <a href={o.website} target="_blank" rel="noreferrer noopener" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Globe className="size-3.5" /> {o.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 md:w-56">
          <Label className="text-xs text-muted-foreground">Stage</Label>
          <Select value={o.stage} onValueChange={(s) => { moveStage(o.id, s); toast.success(`Moved to ${s}`) }}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[...pipeline.stages, ...pipeline.closedStages].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <OutreachButton o={o} label="Generate outreach" />
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          {['overview', 'analysis', 'contacts', 'timeline', 'outreach', 'tasks', 'sources', 'notes'].map((t) => (
            <TabsTrigger key={t} value={t} className="flex-none capitalize">
              {t === 'analysis' ? 'AI Analysis' : t === 'timeline' ? 'Activity' : t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 md:grid-cols-2">
          <Panel title="Business details">
            <dl className="divide-y divide-border text-sm">
              <Row k="Company number" v={o.companyNumber} />
              <Row k="Company status" v={o.companyStatus} />
              <Row k="Approximate size" v={o.size} />
              <Row k="Industry" v={o.industry} />
              <Row k="Researched" v={o.researchedAt} />
              <Row k="Technology mentioned" v={o.technology.join(', ') || null} />
            </dl>
          </Panel>
          <Panel title="Commercial">
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Estimated annual value (£, your estimate)</Label>
                <Input
                  type="number"
                  defaultValue={o.estimatedValue ?? ''}
                  onBlur={(e) => updateOpportunity(o.id, { estimatedValue: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Not set"
                />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
                <span>
                  <span className="flex items-center gap-1.5 font-medium"><Ban className="size-3.5" /> Do not contact</span>
                  <span className="text-xs text-muted-foreground">Blocks outreach drafts and removes from daily actions.</span>
                </span>
                <Switch checked={o.doNotContact} onCheckedChange={(v) => updateOpportunity(o.id, { doNotContact: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
                <span>
                  <span className="font-medium">Sole trader / individual</span>
                  <span className="block text-xs text-muted-foreground">PECR: requires prior consent for unsolicited marketing email.</span>
                </span>
                <Switch checked={o.isSoleTrader} onCheckedChange={(v) => updateOpportunity(o.id, { isSoleTrader: v })} />
              </label>
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          {o.assessment ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
              <Panel title={`${o.kind === 'cofounder' ? 'Co-Founder Fit' : 'SORTED Fit'} · ${o.assessment.score}/100`}>
                <p className="mb-4 text-sm text-foreground/85">{o.assessment.summary}</p>
                <div className="flex flex-col gap-3">
                  {o.assessment.factors.map((f) => (
                    <div key={f.label}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>{f.label} <span className="text-muted-foreground">· {f.weight}%</span></span>
                        <span className="tabular font-mono">{f.score}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${f.score}%` }} /></div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-muted-foreground">
                  {o.assessment.model} · {o.assessment.assessedAt} · Preliminary assessment from retrieved pages only.
                </p>
              </Panel>
              <div className="grid gap-4 sm:grid-cols-2">
                <ListPanel title="Why relevant" items={o.assessment.relevance} />
                <Panel title="Evidence">
                  <ul className="flex flex-col gap-2 text-sm">
                    {o.assessment.evidence.length === 0 && <li className="text-muted-foreground">None recorded.</li>}
                    {o.assessment.evidence.map((e) => (
                      <li key={e.text}><p>{e.text}</p><SourceLink url={e.sourceUrl} /></li>
                    ))}
                  </ul>
                </Panel>
                <ListPanel title="Problems SORTED could address" items={o.assessment.problems} />
                <ListPanel title="Main unknowns" items={o.assessment.unknowns} muted />
                <Panel title="Best approach"><p className="text-sm">{o.assessment.approach || '—'}</p></Panel>
                <Panel title="Recommended next action"><p className="text-sm text-primary">{o.assessment.nextAction}</p></Panel>
                <ListPanel title="Potential objections" items={o.assessment.objections} />
              </div>
            </div>
          ) : (
            <EmptyState icon={Sparkles} title="Not assessed yet">
              <p>Fit assessments read the retrieved website and registry data, then score with stated evidence and confidence.</p>
              <Button className="mt-4" size="sm" onClick={() => toast.info('AI assessment connects in the AI research milestone', { description: 'It will use DeepSeek V4.1 Flash via Netlify AI Gateway and cache results.' })}>
                <Sparkles /> Run fit assessment
              </Button>
            </EmptyState>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="mt-4 grid gap-4 md:grid-cols-2">
          <Panel title="Public business contact details">
            <ul className="divide-y divide-border text-sm">
              {o.facts.length === 0 && <li className="py-2 text-muted-foreground">No contact details researched yet.</li>}
              {o.facts.map((f) => (
                <li key={f.label} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="text-right">
                    <span className={cn('block', !f.value && 'italic text-muted-foreground')}>{f.value ?? 'Not found'}</span>
                    <span className="flex items-center justify-end gap-2"><ProvenanceTag provenance={f.provenance} />{f.sourceUrl && <SourceLink url={f.sourceUrl} label="source" />}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Verified professional contacts">
            {o.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No named decision-maker found on public pages yet.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {o.contacts.map((c) => (
                  <li key={c.name} className="flex items-center justify-between gap-3">
                    <span><span className="font-medium">{c.name}</span><span className="block text-xs text-muted-foreground">{c.role}</span></span>
                    <SourceLink url={c.sourceUrl} label="source" />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Activity timeline">
            <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
              {[...o.activities].reverse().map((a) => {
                const Icon = ACTIVITY_ICON[a.type]
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[29px] flex size-4 items-center justify-center rounded-full border border-border bg-card"><Icon className="size-2.5 text-muted-foreground" /></span>
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.detail && <p className="text-sm text-muted-foreground">{a.detail}</p>}
                    <p className="text-[11px] text-muted-foreground">{new Date(a.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </li>
                )
              })}
              {o.activities.length === 0 && <li className="text-sm text-muted-foreground">No activity yet.</li>}
            </ol>
          </Panel>
          <Panel title="Log activity">
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                if (!logText.trim()) return
                addActivity(o.id, { type: logType, title: logText.trim() })
                setLogText('')
                toast.success('Activity logged')
              }}
            >
              <Select value={logType} onValueChange={(v) => setLogType(v as Activity['type'])}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
              <Textarea value={logText} onChange={(e) => setLogText(e.target.value)} placeholder="e.g. Called — spoke to ops director, send pricing" rows={3} />
              <Button type="submit" size="sm"><Plus /> Add to timeline</Button>
            </form>
          </Panel>
        </TabsContent>

        <TabsContent value="outreach" className="mt-4">
          <Panel title="Outreach">
            {o.activities.filter((a) => a.type === 'email').length === 0 ? (
              <p className="text-sm text-muted-foreground">No drafts or sent messages recorded yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {o.activities.filter((a) => a.type === 'email').map((a) => (
                  <li key={a.id} className="flex items-center gap-2"><MessageSquare className="size-3.5 text-muted-foreground" />{a.title} · <span className="text-muted-foreground">{formatDate(a.at)}</span></li>
                ))}
              </ul>
            )}
            <div className="mt-4"><OutreachButton o={o} label="Open in Outreach Studio" /></div>
          </Panel>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Panel title="Follow-ups & next actions">
            <form
              className="mb-4 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!taskTitle.trim()) return
                addTask({ title: taskTitle.trim(), due: taskDue, priority: o.kind === 'customer' ? 'high' : 'medium', opportunityId: o.id })
                setTaskTitle('')
                toast.success('Follow-up created', { description: `Due ${taskDue}` })
              }}
            >
              <Input className="min-w-56 flex-1" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Follow up by phone" />
              <Input type="date" className="w-40" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} aria-label="Due date" />
              <Button type="submit"><CalendarPlus /> Add task</Button>
            </form>
            <ul className="divide-y divide-border">
              {myTasks.length === 0 && <li className="py-2 text-sm text-muted-foreground">No tasks yet.</li>}
              {myTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} aria-label={`Complete ${t.title}`} />
                  <span className={cn('flex-1', t.done && 'text-muted-foreground line-through')}>{t.title}</span>
                  <span className="tabular text-xs text-muted-foreground">{t.due}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <Panel title="Research sources">
            <ul className="divide-y divide-border">
              {o.sources.map((s) => (
                <li key={s.url + s.title} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span><span className="font-medium">{s.title}</span><span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">{s.kind}</span></span>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">Retrieved {s.retrievedAt}<SourceLink url={s.url} /></span>
                </li>
              ))}
            </ul>
          </Panel>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Panel title="Founder notes">
            <Textarea rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Private notes about this relationship…" />
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={() => { updateOpportunity(o.id, { notes }); toast.success('Notes saved') }} disabled={notes === o.notes}>Save notes</Button>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-border bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function ListPanel({ title, items, muted }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <Panel title={title}>
      <ul className={cn('flex list-disc flex-col gap-1.5 pl-4 text-sm', muted && 'text-muted-foreground')}>
        {items.length === 0 ? <li className="list-none pl-0 text-muted-foreground">—</li> : items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </Panel>
  )
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn('text-right', !v && 'italic text-muted-foreground')}>{v ?? 'Not found'}</dd>
    </div>
  )
}

function OutreachButton({ o, label }: { o: Opportunity; label: string }) {
  if (o.doNotContact)
    return (
      <Button disabled variant="secondary">
        <Ban /> Do not contact
      </Button>
    )
  return (
    <Button asChild>
      <Link to="/outreach" search={{ id: o.id }}>
        <PenLine /> {label}
      </Link>
    </Button>
  )
}
