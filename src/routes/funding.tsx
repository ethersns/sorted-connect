import { createFileRoute, Link } from '@tanstack/react-router'
import { Compass, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/bits'
import { OpportunityTable } from '@/components/opportunity-table'

export const Route = createFileRoute('/funding')({ component: Funding })

function Funding() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Funding & Growth"
        description="Accelerators, grants, founder communities and investor networks — kept separate from paying customers."
        actions={<Button asChild><Link to="/lead-finder"><Compass /> Find programmes</Link></Button>}
      />
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        Eligibility, deadlines, costs and equity terms are shown only when found on the programme’s own pages. Nothing here implies funding is likely or guaranteed.
      </p>
      <OpportunityTable kinds={['funding']} allowKindFilter={false} />
    </div>
  )
}
