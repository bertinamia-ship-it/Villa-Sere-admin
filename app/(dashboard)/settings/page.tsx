'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Settings, AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { t } from '@/lib/i18n/es'
import ResetDataButton from '@/app/(dashboard)/dashboard/ResetDataButton'

export default function SettingsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const supabase = createClient()

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile || profile.role !== 'admin') {
        setIsAuthorized(false)
        setCheckingAuth(false)
        return
      }

      const { data: tenant } = await supabase
        .from('tenants')
        .select('owner_id')
        .eq('id', profile.tenant_id)
        .maybeSingle()

      setIsAuthorized(tenant?.owner_id === user.id)
    } catch (error) {
      console.error('Error checking authorization:', error)
      setIsAuthorized(false)
    } finally {
      setCheckingAuth(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">{t('settings.title')}</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#64748B] mx-auto mb-2" />
            <p className="text-sm text-[#64748B]">{t('common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#0F172A]">{t('settings.title')}</h1>
        <p className="text-sm text-[#64748B] mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Advanced Section */}
      {isAuthorized && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">{t('settings.advanced')}</h2>
          
          <Card className="border-[#EF4444]/20 bg-[#FEF2F2]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#991B1B]">
                <AlertTriangle className="h-5 w-5" />
                {t('settings.dangerousActions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResetDataButton />
            </CardContent>
          </Card>
        </div>
      )}

      {/* General Settings Placeholder */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A]">{t('settings.general')}</h2>
        <Card>
          <CardContent className="py-8 text-center">
            <Settings className="h-12 w-12 text-[#E2E8F0] mx-auto mb-3" />
            <p className="text-sm text-[#64748B]">{t('settings.comingSoon')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

