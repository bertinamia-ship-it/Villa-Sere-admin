'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { CreditCard, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { t } from '@/lib/i18n/es'

interface Tenant {
  id: string
  name: string
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  subscription_plan: 'free' | 'basic' | 'premium'
  trial_ends_at: string | null
  created_at: string
}

export default function BillingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [propertyCount, setPropertyCount] = useState(0)
  const [userCount, setUserCount] = useState(0)

  const loadBillingData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get tenant from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('[Billing] Error fetching profile:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        setLoading(false)
        return
      }

      if (!profile || !profile.tenant_id) {
        console.warn('[Billing] No profile or tenant_id found')
        setLoading(false)
        return
      }

      // Get tenant details
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, name, subscription_status, subscription_plan, trial_ends_at, created_at')
        .eq('id', profile.tenant_id)
        .single()

      if (tenantData) {
        setTenant(tenantData as Tenant)

        // Get property count
        const { count: propCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantData.id)

        setPropertyCount(propCount || 0)

        // Get user count (profiles in tenant)
        const { count: userCountData, error: userCountError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantData.id)

        if (userCountError) {
          console.error('[Billing] Error counting users:', userCountError)
        }

        setUserCount(userCountData || 0)
      }
    } catch (error) {
      console.error('Error loading billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBillingData()
  }, [loadBillingData])

  const isActive = () => {
    if (!tenant) return false
    if (tenant.subscription_status === 'active') return true
    if (tenant.subscription_status === 'trial') {
      if (!tenant.trial_ends_at) return true
      return new Date(tenant.trial_ends_at) > new Date()
    }
    return false
  }

  const getStatusColor = () => {
    if (isActive()) return 'text-[#10B981] bg-[#10B981]/10'
    return 'text-[#EF4444] bg-[#EF4444]/10'
  }

  const getStatusIcon = () => {
    if (isActive()) return <CheckCircle2 className="h-5 w-5" />
    return <XCircle className="h-5 w-5" />
  }

  const getStatusLabel = () => {
    if (!tenant) return 'Desconocido'
    if (tenant.subscription_status === 'active') return t('billing.active')
    if (tenant.subscription_status === 'trial') {
      if (tenant.trial_ends_at && new Date(tenant.trial_ends_at) <= new Date()) {
        return 'Trial Expirado'
      }
      return t('billing.trial')
    }
    if (tenant.subscription_status === 'past_due') return t('billing.pastDue')
    if (tenant.subscription_status === 'cancelled') return t('billing.cancelled')
    if (tenant.subscription_status === 'expired') return t('billing.expired')
    const status = String(tenant.subscription_status)
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getLimits = () => {
    if (!tenant) return { maxProperties: 0, maxUsers: 0 }
    if (tenant.subscription_plan === 'free' || tenant.subscription_status === 'trial') {
      return { maxProperties: 1, maxUsers: 1 }
    }
    return { maxProperties: Infinity, maxUsers: Infinity }
  }

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('billing.title')}</h1>
        <Card>
          <CardContent className="py-12">
            <p className="text-gray-600 text-center">No se pudo cargar la información de facturación</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const limits = getLimits()
  const active = isActive()
  const isTrial = tenant.subscription_status === 'trial'
  const trialExpired = isTrial && tenant.trial_ends_at && new Date(tenant.trial_ends_at) <= new Date()

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{t('billing.title')}</h1>
        <p className="mt-1 text-sm text-gray-700">Gestiona tu suscripción y facturación</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('billing.subscriptionStatus')}</CardTitle>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusLabel()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">{t('billing.plan')}</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {tenant.subscription_plan === 'free' ? t('billing.free') : 
                 tenant.subscription_plan === 'basic' ? t('billing.basic') :
                 tenant.subscription_plan === 'premium' ? t('billing.premium') : 
                 String(tenant.subscription_plan)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('billing.status')}</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{getStatusLabel()}</p>
            </div>
          </div>

          {isTrial && tenant.trial_ends_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-blue-900">{t('billing.trialEnds')}</p>
              </div>
              <p className="text-sm text-blue-700">
                {trialExpired ? (
                  <>Tu trial expiró el {new Date(tenant.trial_ends_at).toLocaleDateString('es-ES')}</>
                ) : (
                  <>El trial termina el {new Date(tenant.trial_ends_at).toLocaleDateString('es-ES')}</>
                )}
              </p>
            </div>
          )}

          {!active && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="font-medium text-red-900">{t('billing.upgradeRequired')}</p>
              </div>
              <p className="text-sm text-red-700 mb-3">
                {t('billing.upgradeMessage')}
              </p>
              <Button onClick={() => {
                // Placeholder: Link to Stripe checkout or payment page
                alert('La integración de pagos llegará pronto. Por ahora, contacta soporte para actualizar.')
              }}>
                <CreditCard className="h-4 w-4" />
                {t('billing.upgrade')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>{t('billing.usage')} & {t('billing.limits')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{t('billing.properties')}</p>
                <p className="text-sm text-gray-600">
                  {propertyCount} / {limits.maxProperties === Infinity ? '∞' : limits.maxProperties}
                </p>
              </div>
              {limits.maxProperties !== Infinity && propertyCount >= limits.maxProperties && (
                <p className="text-xs text-red-600">Límite alcanzado. Actualiza para agregar más propiedades.</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{t('billing.users')}</p>
                <p className="text-sm text-gray-600">
                  {userCount} / {limits.maxUsers === Infinity ? '∞' : limits.maxUsers}
                </p>
              </div>
              {limits.maxUsers !== Infinity && userCount >= limits.maxUsers && (
                <p className="text-xs text-red-600">Límite alcanzado. Actualiza para agregar más usuarios.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      {!active && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="py-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('billing.upgradeRequired')}</h3>
              <p className="text-sm text-gray-700 mb-4">
                Desbloquea propiedades y usuarios ilimitados con un plan de pago.
              </p>
              <Button onClick={() => {
                alert('La integración de pagos llegará pronto. Por ahora, contacta soporte para actualizar.')
              }}>
                <CreditCard className="h-4 w-4" />
                {t('billing.upgrade')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

