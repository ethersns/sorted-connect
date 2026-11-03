import type { PipelineKind } from './types'

export interface PipelineConfig {
  kind: PipelineKind
  label: string
  short: string
  description: string
  stages: string[]
  closedStages: string[]
  colorVar: string
}

export const PIPELINES: Record<PipelineKind, PipelineConfig> = {
  customer: {
    kind: 'customer',
    label: 'Potential customers',
    short: 'Customer',
    description: 'Businesses that could pay for SORTED directly.',
    stages: [
      'New',
      'Researching',
      'Qualified',
      'Contacted',
      'Responded',
      'Meeting Booked',
      'Demo Completed',
      'Trial/Pilot',
      'Paying Customer',
    ],
    closedStages: ['Follow Up Later', 'Not Interested', 'Disqualified'],
    colorVar: 'var(--chart-1)',
  },
  referral: {
    kind: 'referral',
    label: 'Referral & introductions',
    short: 'Referral',
    description: 'People and firms who can introduce SORTED to buyers.',
    stages: [
      'Identified',
      'Researching',
      'Contact Planned',
      'Connected',
      'Relationship Building',
      'Introductions Made',
      'Active Referrer',
    ],
    closedStages: ['Not a Fit', 'Dormant'],
    colorVar: 'var(--chart-2)',
  },
  partner: {
    kind: 'partner',
    label: 'Strategic partners',
    short: 'Partner',
    description: 'Complementary businesses for integrations and co-marketing.',
    stages: [
      'Identified',
      'Researching',
      'Contact Planned',
      'Exploratory Call',
      'Proposal Discussed',
      'Agreement',
      'Active Partner',
    ],
    closedStages: ['Not a Fit', 'Dormant'],
    colorVar: 'var(--chart-3)',
  },
  cofounder: {
    kind: 'cofounder',
    label: 'Co-founder candidates',
    short: 'Co-founder',
    description: 'Commercial people who might build SORTED with you.',
    stages: [
      'Identified',
      'Researching',
      'Contact Planned',
      'Connected',
      'Initial Conversation',
      'Exploring Fit',
      'Serious Discussions',
      'Decision',
    ],
    closedStages: ['Not a Fit', 'Paused'],
    colorVar: 'var(--chart-5)',
  },
  funding: {
    kind: 'funding',
    label: 'Funding & growth',
    short: 'Funding',
    description: 'Accelerators, grants, programmes and investor networks.',
    stages: [
      'Identified',
      'Checking Eligibility',
      'Preparing Application',
      'Applied',
      'Shortlisted',
      'Outcome',
    ],
    closedStages: ['Not Eligible', 'Missed Deadline'],
    colorVar: 'var(--chart-4)',
  },
}

export const PIPELINE_ORDER: PipelineKind[] = [
  'customer',
  'referral',
  'partner',
  'cofounder',
  'funding',
]

export const UK_REGIONS = [
  'UK nationwide',
  'West Midlands',
  'London',
  'Birmingham',
  'Manchester',
  'Coventry',
  'Leeds',
  'Bristol',
  'East Midlands',
  'North West',
  'Yorkshire',
  'Scotland',
  'Wales',
]

export const CUSTOMER_INDUSTRIES = [
  'Independent warehouse / 3PL',
  'Storage & fulfilment',
  'E-commerce with own stock',
  'Electrical wholesaler',
  'Plumbing & heating wholesaler',
  'Industrial parts distributor',
  'Automotive parts',
  'Trade distributor / merchant',
  'Manufacturer (stock & components)',
]
