import type { Opportunity } from './types'

const esc = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function opportunitiesToCsv(rows: Opportunity[]) {
  const header = ['Name', 'Pipeline', 'Stage', 'Industry', 'City', 'Region', 'Website', 'Company number', 'Status', 'Fit score', 'Confidence', 'Tags', 'Estimated value (GBP)', 'Do not contact', 'Researched', 'Primary source']
  const lines = rows.map((o) =>
    [o.name, o.kind, o.stage, o.industry, o.city, o.region, o.website, o.companyNumber, o.companyStatus, o.assessment?.score, o.assessment?.confidence, o.tags.join('; '), o.estimatedValue, o.doNotContact ? 'yes' : 'no', o.researchedAt, o.sources[0]?.url]
      .map(esc)
      .join(','),
  )
  return [header.join(','), ...lines].join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
