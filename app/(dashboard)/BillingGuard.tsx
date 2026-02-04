'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AlertCircle, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function BillingGuard({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [trialExpired, setTrialExpired] = useState(false)

  useEffect(() => {
    async function checkSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('[BillingGuard] Error fetching profile:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          setLoading(false)
          return
        }

        if (!profile || !profile.tenant_id) {
          console.warn('[BillingGuard] No profile or tenant_id found')
          setLoading(false)
          return
        }

        const { data: tenant } = await supabase
          .from('tenants')
          .select('subscription_status, trial_ends_at')
          .eq('id', profile.tenant_id)
          .single()

        if (!tenant) {
          setLoading(false)
          return
        }

        // Check if active
        const active = tenant.subscription_status === 'active' || 
          (tenant.subscription_status === 'trial' && 
           (!tenant.trial_ends_at || new Date(tenant.trial_ends_at) > new Date()))

        setIsActive(active)
        setTrialExpired(tenant.subscription_status === 'trial' && 
                       tenant.trial_ends_at && 
                       new Date(tenant.trial_ends_at) <= new Date())
      } catch (error) {
        console.error('Error checking subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Subscription Required</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              {trialExpired 
                ? 'Your trial period has expired. Please upgrade to continue using CasaPilot.'
                : 'Your subscription is not active. Please upgrade to continue using CasaPilot.'}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={() => router.push('/billing')}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4" />
                Go to Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

