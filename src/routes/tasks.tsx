import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/bits'
import { useWorkspace } from '@/lib/store'
import { PREVIEW_TODAY as TODAY } from '@/lib/fixtures'
import type { Task } from '@/lib/types'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/tasks')({ component: Tasks })


function Tasks() {
  const { tasks, opportunities, toggleTask, addTask } = useWorkspace()
  const [title, setTitle] = React.useState('')
  const [due, setDue] = React.useState(TODAY)
  const [priority, setPriority] = React.useState<Task['priority']>('medium')
  const [oppId, setOppId] = React.useState('none')

  const groups: { label: string; items: Task[] }[] = [
    { label: 'Overdue', items: tasks.filter((t) => !t.done && t.due < TODAY) },
    { label: 'Today', items: tasks.filter((t) => !t.done && t.due === TODAY) },
    { label: 'Upcoming', items: tasks.filter((t) => !t.done && t.due > TODAY).sort((a, b) => a.due.localeCompare(b.due)) },
    { label: 'Completed', items: tasks.filter((t) => t.done) },
  ]
  const done = tasks.filter((t) => t.done).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Tasks & Follow-ups" description={`${done} of ${tasks.length} completed. Revenue-producing follow-ups are flagged high priority.`} />

      <form
        className="flex flex-wrap gap-2 rounded-2xl border-2 border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          addTask({ title: title.trim(), due, priority, opportunityId: oppId === 'none' ? undefined : oppId })
          setTitle('')
          toast.success('Task created')
        }}
      >
        <Input className="min-w-60 flex-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task or follow-up…" aria-label="Task title" />
        <Select value={oppId} onValueChange={setOppId}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No linked record</SelectItem>
            {opportunities.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-40" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
        <Button type="submit"><CalendarPlus /> Add</Button>
      </form>

      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <section key={g.label}>
            <h2 className={cn('mb-2 text-xs font-medium uppercase tracking-wider', g.label === 'Overdue' ? 'text-destructive' : 'text-muted-foreground')}>
              {g.label} · {g.items.length}
            </h2>
            <ul className="divide-y divide-border rounded-2xl border-2 border-border bg-card">
              {g.items.map((t) => {
                const o = opportunities.find((x) => x.id === t.opportunityId)
                return (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <Checkbox checked={t.done} onCheckedChange={() => toggleTask(t.id)} aria-label={`Complete ${t.title}`} />
                    <span className={cn('size-1.5 rounded-full', t.priority === 'high' ? 'bg-primary' : t.priority === 'medium' ? 'bg-warning' : 'bg-muted-foreground')} aria-label={`${t.priority} priority`} />
                    <span className={cn('flex-1', t.done && 'text-muted-foreground line-through')}>{t.title}</span>
                    {o && <Link to="/opportunities/$id" params={{ id: o.id }} className="hidden text-xs text-muted-foreground hover:text-primary sm:inline">{o.name}</Link>}
                    <span className="tabular w-20 text-right font-mono text-xs text-muted-foreground">{t.due.slice(5)}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        ),
      )}
    </div>
  )
}
