export type PipelineKind =
  'customer' | 'referral' | 'partner' | 'cofounder' | 'funding'

export type Confidence = 'High' | 'Medium' | 'Low'

/** How a single piece of information was obtained. */
export type Provenance = 'verified' | 'inferred' | 'missing'

export interface Fact {
  label: string
  value: string | null
  provenance: Provenance
  sourceUrl?: string
}

export interface ScoreFactor {
  label: string
  weight: number // percentage weight, totals 100
  score: number // 0–100 within the factor
}

export interface Assessment {
  score: number
  confidence: Confidence
  summary: string
  relevance: string[]
  evidence: { text: string; sourceUrl: string }[]
  problems: string[]
  unknowns: string[]
  approach: string
  nextAction: string
  objections: string[]
  factors: ScoreFactor[]
  model: string
  assessedAt: string
}

export interface Contact {
  name: string
  role: string
  sourceUrl: string
  linkedin?: string
}

export interface Activity {
  id: string
  type: 'note' | 'email' | 'call' | 'meeting' | 'stage' | 'research'
  title: string
  detail?: string
  at: string
}

export interface Task {
  id: string
  opportunityId?: string
  title: string
  due: string // ISO date
  done: boolean
  priority: 'high' | 'medium' | 'low'
}

export interface Source {
  title: string
  url: string
  kind: 'Website' | 'Companies House' | 'Brave Search' | 'Directory' | 'Manual'
  retrievedAt: string
}

export interface Opportunity {
  id: string
  name: string
  kind: PipelineKind
  stage: string
  industry: string
  city: string
  region: string
  website: string | null
  companyNumber: string | null
  companyStatus: string | null
  size: string | null
  description: string
  facts: Fact[]
  contacts: Contact[]
  technology: string[]
  tags: string[]
  assessment: Assessment | null
  activities: Activity[]
  sources: Source[]
  notes: string
  estimatedValue: number | null // £ per year, manually entered estimate
  doNotContact: boolean
  isSoleTrader: boolean
  researchedAt: string
  lastTouchedAt: string
}

export interface DiscoveryResult {
  id: string
  name: string
  snippet: string
  url: string
  domain: string
  city: string
  region: string
  industry: string
  source: Source['kind']
  companyNumber: string | null
  companyStatus: string | null
  retrievedAt: string
  alreadyInPipeline: boolean
  quickScore?: number
  quickConfidence?: Confidence
  quickReason?: string
}
