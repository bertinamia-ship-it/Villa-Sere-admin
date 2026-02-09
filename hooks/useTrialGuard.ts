'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/components/I18nProvider'
import { useToast } from '@/components/ui/Toast'

interface TrialGuardResult {
  isTrialActive: boolean
  isTrialExpired: boolean
  daysRemaining: number | null
  blockAction: (actionName?: string) => boolean
  canWrite: boolean // Helper to check if user can write (create/edit/delete)
  showTrialBlockedToast: () => void // Helper to show blocked toast
}

/**
 * Hook to guard against actions when trial is expired
 * Returns a function to block actions and show CTA
 */
export function useTrialGuard(): TrialGuardResult {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [trialInfo, setTrialInfo] = useState<{
    isActive: boolean
    isExpired: boolean
    daysRemaining: number | null
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrialInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTrialInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setTrialInfo({ isActive: true, isExpired: false, daysRemaining: null })
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        setTrialInfo({ isActive: true, isExpired: false, daysRemaining: null })
        setLoading(false)
        return
      }

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('subscription_status, trial_ends_at')
        .eq('id', profile.tenant_id)
        .maybeSingle()

      // Silently handle errors (expected if tenant doesn't exist or RLS blocks)
      // Don't log to console - we handle this gracefully
      if (tenantError) {
        setTrialInfo({ isActive: true, isExpired: false, daysRemaining: null })
        setLoading(false)
        return
      }

      // If not trial, allow actions
      if (!tenant || tenant.subscription_status !== 'trial') {
        setTrialInfo({ isActive: true, isExpired: false, daysRemaining: null })
        setLoading(false)
        return
      }

      const trialEndsAt = tenant.trial_ends_at
      if (!trialEndsAt) {
        setTrialInfo({ isActive: true, isExpired: false, daysRemaining: null })
        setLoading(false)
        return
      }

      const now = new Date()
      const endsAt = new Date(trialEndsAt)
      const isExpired = endsAt <= now
      const isActive = !isExpired

      const diffTime = endsAt.getTime() - now.getTime()
      const daysRemaining = isActive ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null

      setTrialInfo({
        isActive,
        isExpired,
        daysRemaining,
      })
    } catch (error) {
      // On error, allow actions (fail open)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading trial info:', error)
      }
      setTrialInfo({ isActive: true, isExpired: false, daysRemaining: null })
    } finally {
      setLoading(false)
    }
  }

  const blockAction = (actionName?: string): boolean => {
    // If still loading, allow (fail open)
    if (loading || !trialInfo) {
      return false
    }

    // If trial expired, block and show CTA
    if (trialInfo.isExpired) {
      showToast(
        t('trial.actionBlocked') + ' ' + t('trial.upgradeToContinue'),
        'error'
      )
      // Navigate to settings after a short delay
      setTimeout(() => {
        router.push('/settings')
      }, 2000)
      return true // Block the action
    }

    return false // Allow the action
  }

  const canWrite = !(trialInfo?.isExpired ?? false)

  const showTrialBlockedToast = () => {
    if (trialInfo?.isExpired) {
      showToast(
        t('trial.actionBlocked') + ' ' + t('trial.upgradeToContinue'),
        'error'
      )
      setTimeout(() => {
        router.push('/settings')
      }, 2000)
    }
  }

  return {
    isTrialActive: trialInfo?.isActive ?? true,
    isTrialExpired: trialInfo?.isExpired ?? false,
    daysRemaining: trialInfo?.daysRemaining ?? null,
    blockAction,
    canWrite,
    showTrialBlockedToast,
  }
}

