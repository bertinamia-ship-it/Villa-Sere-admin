'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Settings, AlertTriangle, Trash2, Loader2, Download, Smartphone, Monitor, CheckCircle2, ChevronDown, Lock, Globe } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'
import ResetDataButton from '@/app/(dashboard)/dashboard/ResetDataButton'
import PropertyDeleteSection from '@/components/PropertyDeleteSection'
import { useToast } from '@/components/ui/Toast'

export default function SettingsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordAction, setPasswordAction] = useState<'delete' | 'reset' | null>(null)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [passwordVerified, setPasswordVerified] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()
  const { language, setLanguage, t } = useI18n()

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

  async function verifyPassword() {
    if (!password.trim()) {
      return false
    }

    setVerifying(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !user.email) {
        return false
      }

      // Verify password by attempting to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      })

      if (error) {
        return false
      }

      return true
    } catch (error) {
      console.error('Error verifying password:', error)
      return false
    } finally {
      setVerifying(false)
    }
  }

  async function handleDangerousAction(action: 'delete' | 'reset') {
    // Reset password verified state
    setPasswordVerified(false)
    setPasswordAction(action)
    setPassword('')
    setShowPasswordModal(true)
  }

  async function handlePasswordConfirm() {
    const isValid = await verifyPassword()
    
    if (!isValid) {
      showToast(language === 'en' ? 'Incorrect password. Please try again.' : 'Contraseña incorrecta. Por favor, intenta de nuevo.', 'error')
      setPassword('')
      return
    }

    // Password verified - close modal and set flag
    const action = passwordAction
    setPasswordVerified(true)
    setShowPasswordModal(false)
    setPassword('')
    
    // Trigger the action after password verification
    if (action === 'delete') {
      // Keep danger zone open and show delete section
      setDangerZoneOpen(true)
      // Small delay to show the section
      setTimeout(() => {
        const deleteSection = document.getElementById('property-delete-section')
        if (deleteSection) {
          deleteSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } else if (action === 'reset') {
      // Keep danger zone open and show reset section
      setDangerZoneOpen(true)
      // Small delay to show the section
      setTimeout(() => {
        const resetSection = document.getElementById('reset-data-section')
        if (resetSection) {
          resetSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
    
    setPasswordAction(null)
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
        <h2 className="text-lg font-semibold text-[#0F172A]">{t('settings.general')}</h2>
        
        {/* Language Selector */}
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2.5 text-[#0F172A]">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span>{t('settings.language')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-[#64748B] mb-4">{t('settings.languageDescription')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setLanguage('es')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  language === 'es'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">🇪🇸</span>
                <span className="font-medium">{t('settings.spanish')}</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">🇺🇸</span>
                <span className="font-medium">{t('settings.english')}</span>
              </button>
            </div>
          </CardContent>
        </Card>
        
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

      {/* SECCIÓN 2: Zona Peligrosa - Expandible y discreta */}
      {isAuthorized && (
        <div className="space-y-4">
          <button
            onClick={() => setDangerZoneOpen(!dangerZoneOpen)}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200/60 rounded-xl hover:border-red-300/80 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-left">
                <h2 className="text-base font-semibold text-red-700">{t('settings.dangerousActions')}</h2>
                <p className="text-xs text-red-600/70 mt-0.5">{t('settings.dangerousActionsDescription')}</p>
              </div>
            </div>
            <ChevronDown className={`h-5 w-5 text-red-600 transition-transform duration-200 ${dangerZoneOpen ? 'rotate-180' : ''}`} />
          </button>

          {dangerZoneOpen && (
            <div className="space-y-4 pt-2">
              {/* Eliminar Propiedades - Discreto y profesional */}
              <button
                onClick={() => handleDangerousAction('delete')}
                className="w-full flex items-center gap-3 p-3.5 bg-white border border-red-200/50 rounded-lg hover:bg-red-50/50 hover:border-red-300/60 transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                  <Trash2 className="h-4.5 w-4.5 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-slate-900">{language === 'en' ? 'Delete Properties' : 'Eliminar Propiedades'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{language === 'en' ? 'Permanently delete properties' : 'Elimina propiedades permanentemente'}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 rotate-[-90deg]" />
              </button>

              {/* Resetear Datos - Discreto y profesional */}
              <button
                onClick={() => handleDangerousAction('reset')}
                className="w-full flex items-center gap-3 p-3.5 bg-white border border-red-200/50 rounded-lg hover:bg-red-50/50 hover:border-red-300/60 transition-all duration-200 group shadow-sm hover:shadow-md"
              >
                <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-slate-900">{language === 'en' ? 'Reset All Data' : 'Resetear Todos los Datos'}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{language === 'en' ? 'Delete inventory, expenses and more' : 'Borra inventario, gastos y más'}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 rotate-[-90deg]" />
              </button>

              {/* Sección de eliminar propiedades - Solo visible después de verificar contraseña */}
              {passwordVerified && passwordAction === 'delete' && (
                <div id="property-delete-section" className="pt-2 border-t border-red-200/50">
                  <Card className="border-red-200/60 bg-red-50/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2.5 text-red-700">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                        <span>{language === 'en' ? 'Delete Properties' : 'Eliminar Propiedades'}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-slate-600 mb-4">
                        {language === 'en' ? 'Permanently delete properties. This action cannot be undone.' : 'Elimina propiedades de forma permanente. Esta acción no se puede deshacer.'}
                      </p>
                      <PropertyDeleteSection />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Sección de resetear datos - Solo visible después de verificar contraseña */}
              {passwordVerified && passwordAction === 'reset' && (
                <div id="reset-data-section" className="pt-2 border-t border-red-200/50">
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
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de verificación de contraseña */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setPassword('')
          setPasswordAction(null)
        }}
        title={
          <div className="flex items-center gap-2 text-red-600">
            <Lock className="h-5 w-5" />
            <span className="font-semibold">{language === 'en' ? 'Verification Required' : 'Verificación Requerida'}</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-900 mb-1">
              {language === 'en' ? 'Dangerous action detected' : 'Acción peligrosa detectada'}
            </p>
            <p className="text-sm text-red-700">
              {language === 'en' 
                ? `To ${passwordAction === 'delete' ? 'delete properties' : 'reset all data'}, you need to confirm your password.`
                : `Para ${passwordAction === 'delete' ? 'eliminar propiedades' : 'resetear todos los datos'}, necesitas confirmar tu contraseña.`
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {language === 'en' ? 'Password' : 'Contraseña'}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === 'en' ? 'Enter your password' : 'Ingresa tu contraseña'}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && password.trim() && !verifying) {
                  handlePasswordConfirm()
                }
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowPasswordModal(false)
                setPassword('')
                setPasswordAction(null)
              }}
              className="flex-1"
              disabled={verifying}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handlePasswordConfirm}
              disabled={verifying || !password.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {verifying ? (language === 'en' ? 'Verifying...' : 'Verificando...') : t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
