'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { t } from '@/lib/i18n/es'

export default function ResetDataButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    checkAuthorization()
  }, [])

  async function checkAuthorization() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAuthorized(false)
        setCheckingAuth(false)
        return
      }

      // Check if user is admin AND owner of tenant
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[ResetDataButton] Error fetching profile:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
        }
        setIsAuthorized(false)
        setCheckingAuth(false)
        return
      }

      if (!profile || profile.role !== 'admin') {
        setIsAuthorized(false)
        setCheckingAuth(false)
        return
      }

      // Check if user is tenant owner
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('owner_id')
        .eq('id', profile.tenant_id)
        .maybeSingle()

      // Silently handle errors (expected if tenant doesn't exist or RLS blocks)
      if (tenantError && process.env.NODE_ENV === 'development') {
        console.warn('[ResetDataButton] Tenant query error (handled gracefully):', tenantError.message)
      }

      setIsAuthorized(tenant?.owner_id === user.id)
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking authorization:', error)
      }
      setIsAuthorized(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  async function handleReset() {
    if (confirmation !== 'RESET') {
      showToast(t('resetData.confirmationRequired'), 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/reset-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmation: 'RESET' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset data')
      }

      showToast(t('resetData.resetSuccess'), 'success')
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Reset error:', error)
      }
      showToast(
        error instanceof Error ? error.message : t('resetData.resetError'),
        'error'
      )
    } finally {
      setLoading(false)
      setShowConfirm(false)
      setConfirmation('')
    }
  }

  if (checkingAuth) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="py-4">
          <p className="text-sm text-gray-600">Checking authorization...</p>
        </CardContent>
      </Card>
    )
  }

  if (!isAuthorized) {
    return null // Don't show button if not authorized
  }

  if (!showConfirm) {
    return (
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            {t('resetData.adminTools')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            {t('resetData.description')}
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t('resetData.resetAllData')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-red-300 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          {t('resetData.confirmTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-100 border border-red-300 rounded-lg p-3">
          <p className="text-sm font-semibold text-red-900 mb-2">
            ⚠️ {t('resetData.warning')}
          </p>
          <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
            <li>{t('resetData.expenses')}</li>
            <li>{t('resetData.maintenanceTickets')}</li>
            <li>{t('resetData.bookings')}</li>
            <li>{t('resetData.purchaseItems')}</li>
            <li>{t('resetData.inventoryItems')}</li>
            <li>{t('resetData.vendors')}</li>
            <li>{t('resetData.allFilesInStorage')}</li>
          </ul>
          <p className="text-xs text-red-700 mt-2 font-medium">
            {t('resetData.cannotUndone')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" dangerouslySetInnerHTML={{ __html: t('resetData.typeReset') }}>
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="RESET"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={loading}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={handleReset}
            disabled={loading || confirmation !== 'RESET'}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('resetData.resetting')}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {t('resetData.confirmReset')}
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setShowConfirm(false)
              setConfirmation('')
            }}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

