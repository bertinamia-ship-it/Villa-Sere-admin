'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { CreditCard, Calendar, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
    if (isActive()) return 'text-green-600 bg-green-50'
    return 'text-red-600 bg-red-50'
  }

  const getStatusIcon = () => {
    if (isActive()) return <CheckCircle2 className="h-5 w-5" />
    return <XCircle className="h-5 w-5" />
  }

  const getStatusLabel = () => {
    if (!tenant) return 'Unknown'
    if (tenant.subscription_status === 'active') return 'Active'
    if (tenant.subscription_status === 'trial') {
      if (tenant.trial_ends_at && new Date(tenant.trial_ends_at) <= new Date()) {
        return 'Trial Expired'
      }
      return 'Trial'
    }
    return tenant.subscription_status.charAt(0).toUpperCase() + tenant.subscription_status.slice(1)
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
        <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
        <Card>
          <CardContent className="py-12">
            <p className="text-gray-600 text-center">Unable to load billing information</p>
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
        <h1 className="text-2xl font-semibold text-gray-900">Billing & Subscription</h1>
        <p className="mt-1 text-sm text-gray-700">Manage your subscription and billing</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscription Status</CardTitle>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusLabel()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{tenant.subscription_plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{tenant.subscription_status}</p>
            </div>
          </div>

          {isTrial && tenant.trial_ends_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-blue-900">Trial Period</p>
              </div>
              <p className="text-sm text-blue-700">
                {trialExpired ? (
                  <>Your trial expired on {new Date(tenant.trial_ends_at).toLocaleDateString()}</>
                ) : (
                  <>Trial ends on {new Date(tenant.trial_ends_at).toLocaleDateString()}</>
                )}
              </p>
            </div>
          )}

          {!active && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="font-medium text-red-900">Subscription Required</p>
              </div>
              <p className="text-sm text-red-700 mb-3">
                Your subscription is not active. Please upgrade to continue using CasaPilot.
              </p>
              <Button onClick={() => {
                // Placeholder: Link to Stripe checkout or payment page
                alert('Payment integration coming soon. For now, contact support to upgrade.')
              }}>
                <CreditCard className="h-4 w-4" />
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Properties</p>
                <p className="text-sm text-gray-600">
                  {propertyCount} / {limits.maxProperties === Infinity ? '∞' : limits.maxProperties}
                </p>
              </div>
              {limits.maxProperties !== Infinity && propertyCount >= limits.maxProperties && (
                <p className="text-xs text-red-600">Limit reached. Upgrade to add more properties.</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Users</p>
                <p className="text-sm text-gray-600">
                  {userCount} / {limits.maxUsers === Infinity ? '∞' : limits.maxUsers}
                </p>
              </div>
              {limits.maxUsers !== Infinity && userCount >= limits.maxUsers && (
                <p className="text-xs text-red-600">Limit reached. Upgrade to add more users.</p>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade to Continue</h3>
              <p className="text-sm text-gray-700 mb-4">
                Unlock unlimited properties and users with a paid plan.
              </p>
              <Button onClick={() => {
                alert('Payment integration coming soon. For now, contact support to upgrade.')
              }}>
                <CreditCard className="h-4 w-4" />
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

