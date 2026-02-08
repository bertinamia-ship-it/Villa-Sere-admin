'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/Loading'

// Lazy load InventoryList component
const InventoryList = dynamic(() => import('./InventoryList'), {
  loading: () => (
    <div className="py-12">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false,
})

export default function InventoryClient() {
  return <InventoryList />
}

