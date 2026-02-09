'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from './I18nProvider'
import { Button } from './ui/Button'
import { X, Clock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TrialBanner() {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = createClient()
  const [trialInfo, setTrialInfo] = useState<{
    isActive: boolean
    isExpired: boolean
    daysRemaining: number | null
    trialEndsAt: string | null
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrialInfo()
  }, [])

  const loadTrialInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        setLoading(false)
        return
      }

      const { data: tenant } = await supabase
        .from('tenants')
        .select('subscription_status, trial_ends_at, trial_start_at')
        .eq('id', profile.tenant_id)
        .maybeSingle()

      if (!tenant || tenant.subscription_status !== 'trial') {
        setLoading(false)
        return
      }

      const trialEndsAt = tenant.trial_ends_at
      if (!trialEndsAt) {
        setTrialInfo({
          isActive: true,
          isExpired: false,
          daysRemaining: null,
          trialEndsAt: null,
        })
        setLoading(false)
        return
      }

      const now = new Date()
      const endsAt = new Date(trialEndsAt)
      const isExpired = endsAt <= now
      const isActive = !isExpired

      const diffTime = endsAt.getTime() - now.getTime()
      const daysRemaining = isActive ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0

      setTrialInfo({
        isActive,
        isExpired,
        daysRemaining: isActive ? daysRemaining : null,
        trialEndsAt,
      })
    } catch (error) {
      // Only log in dev
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading trial info:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Don't show if loading, dismissed, or no trial info
  if (loading || dismissed || !trialInfo) {
    return null
  }

  // Don't show if trial expired (will show in read-only mode instead)
  if (trialInfo.isExpired) {
    return null
  }

  // Only show if trial is active with days remaining
  if (!trialInfo.isActive || trialInfo.daysRemaining === null) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/60 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-sm text-blue-900 font-medium truncate">
            {trialInfo.daysRemaining === 1
              ? t('trial.daysRemainingSingular')
              : t('trial.daysRemaining', { days: String(trialInfo.daysRemaining) })
            }
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/settings')}
            className="text-xs min-h-[32px] px-3"
          >
            {t('trial.activatePlan')}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 text-blue-600" />
          </button>
        </div>
      </div>
    </div>
  )
}

