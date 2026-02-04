'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Settings, AlertTriangle, Trash2, Loader2, Download, Smartphone, Monitor, CheckCircle2 } from 'lucide-react'
import { t } from '@/lib/i18n/es'
import ResetDataButton from '@/app/(dashboard)/dashboard/ResetDataButton'

export default function SettingsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    checkAuthorization()
    checkPWAInstallation()
  }, [])

  function checkPWAInstallation() {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (isIOS) {
      // On iOS, we can't detect installation, but we can show instructions
      setIsInstalled(false)
      return
    }

    // Listen for beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    
    setDeferredPrompt(null)
  }

  function getDeviceType() {
    if (typeof window === 'undefined') return 'unknown'
    
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
    if (/Android/.test(ua)) return 'android'
    return 'desktop'
  }

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

      {/* Install App Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A]">{t('settings.installApp')}</h2>
        <Card>
          <CardContent className="py-6">
            {isInstalled ? (
              <div className="flex items-center gap-3 text-[#10B981]">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">{t('settings.alreadyInstalled')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#64748B]">{t('settings.installAppDescription')}</p>
                
                {deferredPrompt && getDeviceType() !== 'ios' ? (
                  <Button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('settings.installApp')}
                  </Button>
                ) : (
                  <div className="space-y-4 pt-2">
                    {getDeviceType() === 'ios' && (
                      <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                        <div className="flex items-start gap-3 mb-2">
                          <Smartphone className="h-5 w-5 text-[#2563EB] mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
                              {t('settings.installIOS')}
                            </h3>
                            <p className="text-xs text-[#64748B] whitespace-pre-line">
                              {t('settings.installIOSSteps')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {getDeviceType() === 'android' && (
                      <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                        <div className="flex items-start gap-3 mb-2">
                          <Smartphone className="h-5 w-5 text-[#2563EB] mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
                              {t('settings.installAndroid')}
                            </h3>
                            <p className="text-xs text-[#64748B] whitespace-pre-line">
                              {t('settings.installAndroidSteps')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {getDeviceType() === 'desktop' && (
                      <div className="border border-[#E2E8F0] rounded-lg p-4 bg-[#F8FAFC]">
                        <div className="flex items-start gap-3 mb-2">
                          <Monitor className="h-5 w-5 text-[#2563EB] mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-[#0F172A] mb-1">
                              {t('settings.installDesktop')}
                            </h3>
                            <p className="text-xs text-[#64748B] whitespace-pre-line">
                              {t('settings.installDesktopSteps')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

