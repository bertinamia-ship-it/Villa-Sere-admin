'use client'

import { useEffect } from 'react'
import { useTrialGuard } from '@/hooks/useTrialGuard'
import { useI18n } from './I18nProvider'

/**
 * QA Mode Component
 * Only active when NEXT_PUBLIC_QA_MODE=true
 * Shows badge and logs trial status to console (once per module)
 */
export default function QAMode() {
  const { canWrite, isTrialExpired, isTrialActive, daysRemaining } = useTrialGuard()
  const { language } = useI18n()

  useEffect(() => {
    // Only in development and if QA mode is enabled
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    const qaMode = process.env.NEXT_PUBLIC_QA_MODE === 'true'
    if (!qaMode) {
      return
    }

    // Log trial status once per module load (not on every render)
    const logKey = `qa-logged-${window.location.pathname}`
    if (!sessionStorage.getItem(logKey)) {
      console.log('[QA MODE] Trial Status:', {
        canWrite,
        isTrialExpired,
        isTrialActive,
        daysRemaining,
        language,
        pathname: window.location.pathname,
      })
      sessionStorage.setItem(logKey, 'true')
    }
  }, [canWrite, isTrialExpired, isTrialActive, daysRemaining, language])

  // Only show badge in development with QA mode
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const qaMode = process.env.NEXT_PUBLIC_QA_MODE === 'true'
  if (!qaMode) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold">
        QA MODE
      </div>
    </div>
  )
}

