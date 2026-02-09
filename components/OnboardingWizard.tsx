'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/components/I18nProvider'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { useToast } from './ui/Toast'
import { Building2, Wallet, Receipt, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { insertWithPropertyClient } from '@/lib/supabase/query-helpers-client'
import { logError, getUserFriendlyError } from '@/lib/utils/error-handler'
import { cache, CACHE_KEYS } from '@/lib/utils/cache'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

interface OnboardingWizardProps {
  tenantId: string
  onComplete: () => void
}

export default function OnboardingWizard({ tenantId, onComplete }: OnboardingWizardProps) {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Property
  const [propertyName, setPropertyName] = useState('')
  const [propertyLocation, setPropertyLocation] = useState('')

  // Step 2: Account
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<'cash' | 'card' | 'bank'>('cash')

  // Step 3: Expense
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])

  const handleStep1 = async () => {
    if (!propertyName.trim()) {
      showToast(t('propertySelector.propertyNameRequired'), 'error')
      return
    }

    setLoading(true)
    try {
      const { data: newProperty, error } = await supabase
        .from('properties')
        .insert({
          tenant_id: tenantId,
          name: propertyName.trim(),
          location: propertyLocation.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      // Invalidate cache
      cache.invalidate(CACHE_KEYS.properties(tenantId))
      
      // Set as active property
      if (newProperty) {
        localStorage.setItem('activePropertyId', newProperty.id)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ preferred_property_id: newProperty.id })
            .eq('id', user.id)
        }
        // Dispatch event
        window.dispatchEvent(new Event('propertyChanged'))
      }

      showToast(t('onboarding.propertyCreated'), 'success')
      setStep(2)
    } catch (error) {
      logError('OnboardingWizard.createProperty', error)
      showToast(getUserFriendlyError(error, t), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async () => {
    if (!accountName.trim()) {
      showToast(t('bank.nameRequired'), 'error')
      return
    }

    setLoading(true)
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('errors.propertyRequired'), 'error')
        return
      }

      const { error } = await insertWithPropertyClient('financial_accounts', {
        name: accountName.trim(),
        account_type: accountType,
        currency: 'USD',
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        notes: null,
      })

      if (error) throw error

      showToast(t('onboarding.accountCreated'), 'success')
      setStep(3)
    } catch (error) {
      logError('OnboardingWizard.createAccount', error)
      showToast(getUserFriendlyError(error, t), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStep3 = async () => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      showToast(t('errors.amountGreaterThanZero'), 'error')
      return
    }

    if (!expenseCategory) {
      showToast(t('errors.categoryRequired'), 'error')
      return
    }

    setLoading(true)
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('errors.propertyRequired'), 'error')
        return
      }

      // Get first account
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) return

      const { data: accounts } = await supabase
        .from('financial_accounts')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('property_id', propertyId)
        .limit(1)

      const accountId = accounts?.[0]?.id || null

      const { error } = await insertWithPropertyClient('expenses', {
        date: expenseDate,
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        vendor_id: null,
        ticket_id: null,
        account_id: accountId,
        notes: null,
        receipt_url: null,
      })

      if (error) throw error

      showToast(t('onboarding.expenseCreated'), 'success')
      // Complete onboarding - show completion screen
      setStep(4)
    } catch (error) {
      logError('OnboardingWizard.createExpense', error)
      showToast(getUserFriendlyError(error, t), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onComplete()
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Card padding="lg" className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {t('onboarding.welcome')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('onboarding.welcomeDescription')}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-all ${
                s === step
                  ? 'bg-blue-600 w-8'
                  : s < step
                  ? 'bg-green-500'
                  : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Create Property */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{t('onboarding.step1Title')}</h2>
                <p className="text-xs text-slate-600">{t('onboarding.step1Description')}</p>
              </div>
            </div>

            <Input
              label={t('propertySelector.propertyName')}
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder={t('propertySelector.propertyNamePlaceholder')}
              required
            />

            <Input
              label={t('propertySelector.propertyLocation')}
              value={propertyLocation}
              onChange={(e) => setPropertyLocation(e.target.value)}
              placeholder={t('propertySelector.propertyLocationPlaceholder')}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={handleSkip}
                className="flex-1"
                disabled={loading}
              >
                {t('onboarding.skip')}
              </Button>
              <Button
                onClick={handleStep1}
                className="flex-1"
                disabled={loading || !propertyName.trim()}
              >
                {loading ? '...' : t('onboarding.next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Create Account */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{t('onboarding.step2Title')}</h2>
                <p className="text-xs text-slate-600">{t('onboarding.step2Description')}</p>
              </div>
            </div>

            <Input
              label={t('bank.accountName')}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={t('bank.accountNamePlaceholder')}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('bank.accountType')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['cash', 'card', 'bank'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      accountType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t(`bank.accountType${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('onboarding.back')}
              </Button>
              <Button
                onClick={handleStep2}
                className="flex-1"
                disabled={loading || !accountName.trim()}
              >
                {loading ? '...' : t('onboarding.next')}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Create Expense */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Receipt className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{t('onboarding.step3Title')}</h2>
                <p className="text-xs text-slate-600">{t('onboarding.step3Description')}</p>
              </div>
            </div>

            <Input
              type="date"
              label={t('expenses.date')}
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />

            <Input
              type="number"
              label={t('expenses.amount')}
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('expenses.category')}
              </label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">{t('common.select')} {t('expenses.category').toLowerCase()}</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t('onboarding.back')}
              </Button>
              <Button
                onClick={handleStep3}
                className="flex-1"
                disabled={loading || !expenseAmount || !expenseCategory}
              >
                {loading ? '...' : t('onboarding.createExpense')}
              </Button>
            </div>
          </div>
        )}

        {/* Completion screen */}
        {step === 4 && (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{t('onboarding.allDone')}</h2>
            <p className="text-slate-600">{t('onboarding.allDoneDescription')}</p>
            <Button onClick={onComplete} className="w-full mt-6">
              {t('onboarding.goToDashboard')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

