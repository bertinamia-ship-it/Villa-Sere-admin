'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/Loading'

// Lazy load ExpensesManager component
const ExpensesManager = dynamic(() => import('./ExpensesManager'), {
  loading: () => (
    <div className="py-12">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false,
})

export default function ExpensesClient() {
  return <ExpensesManager />
}

