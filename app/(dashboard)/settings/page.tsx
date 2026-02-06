'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Settings, AlertTriangle, Trash2, Loader2, Download, Smartphone, Monitor, CheckCircle2, ChevronDown, Lock } from 'lucide-react'
import { t } from '@/lib/i18n/es'
import ResetDataButton from '@/app/(dashboard)/dashboard/ResetDataButton'
import PropertyDeleteSection from '@/components/PropertyDeleteSection'
import { useToast } from '@/components/ui/Toast'

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

      {/* SECCIÓN 1: Configuraciones Básicas */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-[#0F172A]">Configuraciones Básicas</h2>
        
        {/* Install App Section - Profesional */}
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-[#0F172A]">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Download className="h-5 w-5 text-white" />
              </div>
              <span>{t('settings.installApp')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isInstalled ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">{t('settings.alreadyInstalled')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#64748B]">{t('settings.installAppDescription')}</p>
                
                {deferredPrompt && getDeviceType() !== 'ios' ? (
                  <Button
                    onClick={handleInstallClick}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('settings.installApp')}
                  </Button>
                ) : (
                  <div className="space-y-3 pt-2">
                    {getDeviceType() === 'ios' && (
                      <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Smartphone className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-[#0F172A] mb-1.5">
                              {t('settings.installIOS')}
                            </h3>
                            <p className="text-xs text-[#64748B] whitespace-pre-line leading-relaxed">
                              {t('settings.installIOSSteps')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {getDeviceType() === 'android' && (
                      <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Smartphone className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-[#0F172A] mb-1.5">
                              {t('settings.installAndroid')}
                            </h3>
                            <p className="text-xs text-[#64748B] whitespace-pre-line leading-relaxed">
                              {t('settings.installAndroidSteps')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {getDeviceType() === 'desktop' && (
                      <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Monitor className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-[#0F172A] mb-1.5">
                              {t('settings.installDesktop')}
                            </h3>
                            <p className="text-xs text-[#64748B] whitespace-pre-line leading-relaxed">
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

      {/* SECCIÓN 2: Zona Peligrosa - Eliminar/Resetear */}
      {isAuthorized && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Zona Peligrosa</h2>
            <p className="text-xs text-[#64748B]">Acciones que no se pueden deshacer</p>
          </div>
          
          <div className="space-y-4">
            {/* Eliminar Propiedades */}
            <Card className="border-red-200/60 bg-red-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-red-700">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <span>Eliminar Propiedades</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-600 mb-4">
                  Elimina propiedades de forma permanente. Esta acción no se puede deshacer.
                </p>
                <PropertyDeleteSection />
              </CardContent>
            </Card>

            {/* Resetear Datos */}
            <Card className="border-[#EF4444]/20 bg-[#FEF2F2]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-[#991B1B]">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <span>{t('settings.dangerousActions')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResetDataButton />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

