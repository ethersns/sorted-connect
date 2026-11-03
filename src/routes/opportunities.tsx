import { createFileRoute, Link } from '@tanstack/react-router'
import { Compass, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/bits'
import { OpportunityTable } from '@/components/opportunity-table'

export const Route = createFileRoute('/opportunities')({ component: AllOpportunities })

function AllOpportunities() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="All Opportunities"
        description="Every organisation and person you’ve saved, across customers, referrers, partners, co-founders and funding."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info('CSV import arrives with persistent storage', { description: 'Export already works today.' })}>
              <Upload /> Import CSV
            </Button>
            <Button asChild><Link to="/lead-finder"><Compass /> Find more</Link></Button>
          </>
        }
      />
      <OpportunityTable />
    </div>
  )
}
