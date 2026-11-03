import { createFileRoute, Link } from '@tanstack/react-router'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/bits'
import { OpportunityTable } from '@/components/opportunity-table'

export const Route = createFileRoute('/partnerships')({
  component: Partnerships,
})

function Partnerships() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Partnerships & Network"
        description="Referral sources who can introduce you to buyers, and complementary businesses for integrations and co-marketing."
        actions={
          <Button asChild>
            <Link to="/lead-finder">
              <Compass /> Find partners
            </Link>
          </Button>
        }
      />
      <OpportunityTable kinds={['referral', 'partner']} />
    </div>
  )
}
