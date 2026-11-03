import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Bot, Building, KeyRound, Lock, Receipt, Search, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/bits'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

type FeatureStatus = 'Live' | 'Beta' | 'Planned'

const INITIAL_FEATURES: { name: string; status: FeatureStatus }[] = [
  { name: 'Products, SKUs & product numbers', status: 'Live' },
  { name: 'Inventory & stock levels', status: 'Live' },
  { name: 'Warehouses & storage locations', status: 'Live' },
  { name: 'Stock movements', status: 'Beta' },
  { name: 'Orders, picking & packing', status: 'Beta' },
  { name: 'Product imports & catalogue management', status: 'Live' },
  { name: 'Suppliers & categories', status: 'Live' },
  { name: 'User access & visibility', status: 'Beta' },
  { name: 'E-commerce integrations', status: 'Planned' },
]

const INTEGRATIONS = [
  { icon: Search, name: 'Brave Search API', env: 'BRAVE_SEARCH_API_KEY', cost: 'Free tier available', steps: ['Create an account at api-dashboard.search.brave.com', 'Choose the free “Data for AI / Search” plan', 'Copy the API key', 'Add it as a Netlify environment variable'] },
  { icon: Building, name: 'Companies House API', env: 'COMPANIES_HOUSE_API_KEY', cost: 'Free', steps: ['Register at developer.company-information.service.gov.uk', 'Create an application → REST API key', 'Add it as a Netlify environment variable', 'Used by UK Company Register to import stock-holding companies in bulk'] },
  { icon: Receipt, name: 'HMRC VAT Check API', env: 'HMRC_CLIENT_ID · HMRC_CLIENT_SECRET', cost: 'Free', steps: ['Sign in at developer.service.hmrc.gov.uk', 'Create a production application and subscribe it to “Check a UK VAT number” (v2.0)', 'Copy the client ID and client secret into Netlify environment variables', 'Optional: set HMRC_API_BASE to https://test-api.service.hmrc.gov.uk to use the sandbox'] },
  { icon: Bot, name: 'Netlify AI Gateway', env: 'Provisioned automatically', cost: 'Pay per use · cheap model by default', steps: ['No key needed — Netlify injects credentials server-side', 'Default model: deepseek/deepseek-v4.1-flash (configurable)'] },
  { icon: Lock, name: 'Netlify Identity', env: 'Invite-only', cost: 'Included', steps: ['Enabled with invite-only registration', 'You’ll receive an invite email to set your password'] },
]

function Section({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-border py-8 last:border-0 lg:grid-cols-[260px_1fr]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><Icon className="size-4 text-muted-foreground" />{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

function SettingsPage() {
  const [features, setFeatures] = React.useState(INITIAL_FEATURES)
  const [positioning, setPositioning] = React.useState('Simple warehouse and inventory software for UK small and medium-sized businesses.')
  const [targets, setTargets] = React.useState('Independent warehouses and small 3PLs, e-commerce businesses holding stock, trade wholesalers and parts distributors.')
  const [pricing, setPricing] = React.useState('Assumption: £50–£350 per month depending on users and warehouses.')
  const [mrr, setMrr] = React.useState('0')
  const [daily, setDaily] = React.useState('1.00')
  const [monthly, setMonthly] = React.useState('10.00')

  const save = () => toast.success('Settings updated for this session', { description: 'Persistent storage arrives with the database milestone.' })

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" description="SORTED positioning, integrations and spending limits." actions={<Button onClick={save}>Save changes</Button>} />

      <Section icon={Building} title="About SORTED" description="Outreach only uses what you approve here. Features marked Planned are never mentioned as available.">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">One-line positioning</Label><Input value={positioning} onChange={(e) => setPositioning(e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">Target customers</Label><Textarea rows={2} value={targets} onChange={(e) => setTargets(e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">Pricing assumptions (internal only)</Label><Input value={pricing} onChange={(e) => setPricing(e.target.value)} /></div>
          <div>
            <Label className="text-xs text-muted-foreground">Feature availability</Label>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {features.map((f, i) => (
                <li key={f.name} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                  {f.name}
                  <div className="flex rounded-md border border-border p-0.5">
                    {(['Live', 'Beta', 'Planned'] as const).map((s) => (
                      <button key={s} type="button" onClick={() => setFeatures((prev) => prev.map((x, j) => (j === i ? { ...x, status: s } : x)))}
                        className={cn('rounded px-2 py-0.5 text-xs transition-colors', f.status === s ? (s === 'Live' ? 'bg-success/15 text-success' : s === 'Beta' ? 'bg-warning/15 text-warning' : 'bg-secondary text-foreground') : 'text-muted-foreground hover:text-foreground')}>
                        {s}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section icon={KeyRound} title="Integrations" description="Secrets live only in Netlify environment variables and are never sent to the browser.">
        <div className="grid gap-3 md:grid-cols-2">
          {INTEGRATIONS.map((it) => (
            <div key={it.name} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium"><it.icon className="size-4 text-primary" />{it.name}</span>
                <span className="text-[11px] text-muted-foreground">{it.cost}</span>
              </div>
              <code className="mt-2 inline-block rounded bg-secondary px-1.5 py-0.5 text-[11px]">{it.env}</code>
              <ol className="mt-3 flex list-decimal flex-col gap-1 pl-4 text-xs text-muted-foreground">{it.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Wallet} title="Revenue & budget" description="Paid searches and AI calls stop automatically once a limit is reached.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">Actual MRR (£, confirmed)</Label><Input type="number" value={mrr} onChange={(e) => setMrr(e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">Daily AI & search limit (£)</Label><Input value={daily} onChange={(e) => setDaily(e.target.value)} /></div>
          <div className="flex flex-col gap-1.5"><Label className="text-xs text-muted-foreground">Monthly limit (£)</Label><Input value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Spent this month</span><span className="tabular font-mono">£0.00 of £{monthly}</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-secondary"><div className="h-1.5 w-0 rounded-full bg-primary" /></div>
        </div>
      </Section>
    </div>
  )
}
