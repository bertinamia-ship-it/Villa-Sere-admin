'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'

interface OnboardingWrapperProps {
  tenantId: string
}

export default function OnboardingWrapper({ tenantId }: OnboardingWrapperProps) {
  const router = useRouter()
  const [completed, setCompleted] = useState(false)

  const handleComplete = () => {
    setCompleted(true)
    router.refresh()
  }

  if (completed) {
    return null // Let server component handle the redirect
  }

  return <OnboardingWizard tenantId={tenantId} onComplete={handleComplete} />
}

