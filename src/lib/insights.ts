import { PIPELINES } from './pipelines'
import type { Opportunity, Task } from './types'

export interface SuggestedAction {
  id: string
  title: string
  reason: string
  opportunityId?: string
  taskId?: string
  weight: number
  category: 'Revenue' | 'Follow-up' | 'Research' | 'Network' | 'Co-founder'
  due?: string
}

const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)

/**
 * Ranks today's actions from saved records only. Revenue-producing actions
 * (demos, pilots, warm follow-ups, high-fit first contact) are weighted highest.
 */
export function topActions(
  opps: Opportunity[],
  tasks: Task[],
  today: string,
): SuggestedAction[] {
  const out: SuggestedAction[] = []
  const stageIdx = (o: Opportunity) => PIPELINES[o.kind].stages.indexOf(o.stage)

  for (const t of tasks) {
    if (t.done || t.due > today) continue
    const o = opps.find((x) => x.id === t.opportunityId)
    out.push({
      id: `task-${t.id}`,
      taskId: t.id,
      title: t.title,
      reason: t.due < today ? `Overdue since ${t.due}` : 'Due today',
      opportunityId: t.opportunityId,
      weight:
        (t.priority === 'high' ? 90 : t.priority === 'medium' ? 70 : 50) +
        (o?.kind === 'customer' ? 8 : 0),
      category:
        o?.kind === 'cofounder'
          ? 'Co-founder'
          : o?.kind === 'customer'
            ? 'Revenue'
            : 'Follow-up',
      due: t.due,
    })
  }

  for (const o of opps) {
    if (o.doNotContact) continue
    const hasOpenTask = tasks.some(
      (t) => !t.done && t.opportunityId === o.id && t.due <= today,
    )
    if (hasOpenTask) continue
    if (o.kind === 'customer') {
      if (o.stage === 'Qualified' && (o.assessment?.score ?? 0) >= 70)
        out.push({
          id: `q-${o.id}`,
          opportunityId: o.id,
          title: `Contact ${o.name}`,
          reason: `Qualified, fit score ${o.assessment?.score}`,
          weight: 80 + (o.assessment?.score ?? 0) / 10,
          category: 'Revenue',
        })
      else if (
        o.stage === 'Contacted' &&
        daysBetween(o.lastTouchedAt, today) >= 4
      )
        out.push({
          id: `f-${o.id}`,
          opportunityId: o.id,
          title: `Follow up with ${o.name}`,
          reason: `No reply for ${daysBetween(o.lastTouchedAt, today)} days`,
          weight: 78,
          category: 'Follow-up',
        })
      else if (o.stage === 'Meeting Booked')
        out.push({
          id: `d-${o.id}`,
          opportunityId: o.id,
          title: `Prepare demo for ${o.name}`,
          reason: 'Meeting booked',
          weight: 92,
          category: 'Revenue',
        })
      else if (o.stage === 'New' && !o.assessment)
        out.push({
          id: `r-${o.id}`,
          opportunityId: o.id,
          title: `Research ${o.name}`,
          reason: 'Saved but not yet assessed',
          weight: 55,
          category: 'Research',
        })
    } else if (o.kind === 'referral' && stageIdx(o) <= 2) {
      out.push({
        id: `n-${o.id}`,
        opportunityId: o.id,
        title: `Reach out to ${o.name}`,
        reason: 'Potential source of customer introductions',
        weight: 62,
        category: 'Network',
      })
    }
  }

  return out.sort((a, b) => b.weight - a.weight).slice(0, 10)
}

export function funnel(opps: Opportunity[]) {
  const customers = opps.filter((o) => o.kind === 'customer')
  const stages = PIPELINES.customer.stages
  const reached = (stage: string) =>
    customers.filter((o) => stages.indexOf(o.stage) >= stages.indexOf(stage))
      .length
  return [
    { label: 'Opportunities', value: customers.length },
    { label: 'Qualified', value: reached('Qualified') },
    { label: 'Contacted', value: reached('Contacted') },
    { label: 'Responded', value: reached('Responded') },
    { label: 'Meetings', value: reached('Meeting Booked') },
    { label: 'Demos', value: reached('Demo Completed') },
    { label: 'Trials', value: reached('Trial/Pilot') },
    { label: 'Paying', value: reached('Paying Customer') },
  ]
}
