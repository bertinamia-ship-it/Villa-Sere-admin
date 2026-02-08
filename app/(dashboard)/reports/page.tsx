'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/Loading'

// Lazy load ReportsPage component
const ReportsPageContent = dynamic(() => import('./ReportsPageContent'), {
  loading: () => (
    <div className="py-12">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false,
})

export default function ReportsPage() {
  return <ReportsPageContent />
}
