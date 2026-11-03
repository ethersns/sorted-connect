/**
 * Preview workspace state. Seeded from `fixtures.ts` and held in memory so every
 * screen is interactive. Milestone 2 swaps these actions for server functions
 * backed by Netlify Database; the component API is designed to stay the same.
 */
import * as React from 'react'
import { SAMPLE_OPPORTUNITIES, SAMPLE_TASKS } from './fixtures'
import type { Activity, DiscoveryResult, Opportunity, Task } from './types'

interface Workspace {
  opportunities: Opportunity[]
  tasks: Task[]
  getOpportunity: (id: string) => Opportunity | undefined
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void
  moveStage: (id: string, stage: string) => void
  addActivity: (id: string, activity: Omit<Activity, 'id' | 'at'>) => void
  saveDiscoveryResults: (results: DiscoveryResult[]) => number
  toggleTask: (id: string) => void
  addTask: (task: Omit<Task, 'id' | 'done'>) => void
}

const WorkspaceContext = React.createContext<Workspace | null>(null)

const uid = () => Math.random().toString(36).slice(2, 10)
const nowIso = () => new Date().toISOString()
const today = () => new Date().toISOString().slice(0, 10)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [opportunities, setOpportunities] = React.useState(SAMPLE_OPPORTUNITIES)
  const [tasks, setTasks] = React.useState(SAMPLE_TASKS)

  const value = React.useMemo<Workspace>(() => {
    const updateOpportunity = (id: string, patch: Partial<Opportunity>) =>
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, ...patch, lastTouchedAt: today() } : o,
        ),
      )

    const addActivity: Workspace['addActivity'] = (id, activity) =>
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                lastTouchedAt: today(),
                activities: [
                  ...o.activities,
                  { ...activity, id: uid(), at: nowIso() },
                ],
              }
            : o,
        ),
      )

    return {
      opportunities,
      tasks,
      getOpportunity: (id) => opportunities.find((o) => o.id === id),
      updateOpportunity,
      addActivity,
      moveStage: (id, stage) =>
        setOpportunities((prev) =>
          prev.map((o) =>
            o.id === id && o.stage !== stage
              ? {
                  ...o,
                  stage,
                  lastTouchedAt: today(),
                  activities: [
                    ...o.activities,
                    {
                      id: uid(),
                      type: 'stage',
                      title: `Moved to ${stage}`,
                      at: nowIso(),
                    },
                  ],
                }
              : o,
          ),
        ),
      saveDiscoveryResults: (results) => {
        const existingDomains = new Set(
          opportunities.map((o) => o.website?.replace(/^https?:\/\//, '')),
        )
        const fresh = results.filter((r) => !existingDomains.has(r.domain))
        const created: Opportunity[] = fresh.map((r): Opportunity => ({
          id: `opp-${uid()}`,
          name: r.name,
          kind: 'customer',
          stage: 'New',
          industry: r.industry,
          city: r.city,
          region: r.region,
          website: r.source === 'Companies House' ? null : r.url,
          companyNumber: r.companyNumber,
          companyStatus: r.companyStatus,
          size: null,
          description: r.snippet,
          facts: [
            { label: 'Public phone', value: null, provenance: 'missing' },
            { label: 'Business email', value: null, provenance: 'missing' },
          ],
          contacts: [],
          technology: [],
          tags: [],
          assessment: null,
          activities: [
            {
              id: uid(),
              type: 'research',
              title: `Saved from Lead Finder (${r.source})`,
              at: nowIso(),
            },
          ],
          sources: [
            {
              title: r.name,
              url: r.url,
              kind: r.source,
              retrievedAt: r.retrievedAt,
            },
          ],
          notes: '',
          estimatedValue: null,
          doNotContact: false,
          isSoleTrader: false,
          researchedAt: r.retrievedAt,
          lastTouchedAt: today(),
        }))
        setOpportunities((prev) => [...created, ...prev])
        return created.length
      },
      toggleTask: (id) =>
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        ),
      addTask: (task) =>
        setTasks((prev) => [{ ...task, id: uid(), done: false }, ...prev]),
    }
  }, [opportunities, tasks])

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = React.useContext(WorkspaceContext)
  if (!ctx)
    throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
