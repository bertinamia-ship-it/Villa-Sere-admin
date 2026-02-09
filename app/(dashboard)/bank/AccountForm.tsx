'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FinancialAccount } from '@/lib/types/database'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { insertWithPropertyClient, updateWithPropertyClient } from '@/lib/supabase/query-helpers-client'
import { useI18n } from '@/components/I18nProvider'
import { logError, getUserFriendlyError } from '@/lib/utils/error-handler'
import { useTrialGuard } from '@/hooks/useTrialGuard'

interface AccountFormProps {
  account: FinancialAccount | null
  onClose: () => void
  onSave: () => void
}

export default function AccountForm({ account, onClose, onSave }: AccountFormProps) {
  const { t } = useI18n()
  const { canWrite, showTrialBlockedToast } = useTrialGuard()
  const [formData, setFormData] = useState({
    name: account?.name || '',
    account_type: account?.account_type || ('cash' as 'cash' | 'card' | 'bank'),
    currency: account?.currency || 'USD',
    opening_balance: account?.opening_balance?.toString() || '0',
    is_active: account?.is_active ?? true,
    notes: account?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check trial guard
    if (!canWrite) {
      showTrialBlockedToast()
      return
    }
    
    setLoading(true)

    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast(t('errors.propertyRequired'), 'error')
      setLoading(false)
      return
    }

    if (!formData.name.trim()) {
      showToast(t('bank.nameRequired'), 'error')
      setLoading(false)
      return
    }

    const openingBalance = parseFloat(formData.opening_balance)
    if (isNaN(openingBalance)) {
      showToast(t('errors.amountGreaterThanZero'), 'error')
      setLoading(false)
      return
    }

    try {
      const dataToSave = {
        name: formData.name.trim(),
        account_type: formData.account_type,
        currency: formData.currency,
        opening_balance: openingBalance,
        current_balance: account ? account.current_balance : openingBalance,
        is_active: formData.is_active,
        notes: formData.notes.trim() || null,
      }

      if (account) {
        const { error } = await updateWithPropertyClient('financial_accounts', account.id, dataToSave)
        if (error) {
          logError('AccountForm.update', error)
          showToast(getUserFriendlyError(error, t), 'error')
        } else {
          showToast(t('bank.accountSaved'), 'success')
          onSave()
        }
      } else {
        const { error } = await insertWithPropertyClient('financial_accounts', dataToSave)
        if (error) {
          logError('AccountForm.insert', error)
          showToast(getUserFriendlyError(error, t), 'error')
        } else {
          showToast(t('bank.accountSaved'), 'success')
          onSave()
        }
      }
    } catch (error) {
      logError('AccountForm.save', error)
      showToast(getUserFriendlyError(error, t), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={account ? t('bank.editAccount') : t('bank.newAccount')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('bank.accountName')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('bank.accountNamePlaceholder')}
          required
        />

        <div>
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {t('bank.accountType')} *
          </label>
          <select
            value={formData.account_type}
            onChange={(e) => setFormData({ ...formData, account_type: e.target.value as 'cash' | 'card' | 'bank' })}
            className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg sm:rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all min-h-[44px] sm:min-h-0"
            required
          >
            <option value="cash">{t('bank.accountTypeCash')}</option>
            <option value="card">{t('bank.accountTypeCard')}</option>
            <option value="bank">{t('bank.accountTypeBank')}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
              {t('bank.currency')} *
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-3 py-3 sm:py-2 text-base sm:text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg sm:rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all min-h-[44px] sm:min-h-0"
            >
              <option value="USD">USD</option>
              <option value="MXN">MXN</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <Input
            label={t('bank.openingBalance')}
            type="number"
            step="0.01"
            value={formData.opening_balance}
            onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 text-[#2563EB] border-[#E2E8F0] rounded focus:ring-[#2563EB]/30"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-[#0F172A]">
            {t('bank.isActive')}
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {t('bank.notes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 text-sm text-[#0F172A] placeholder-[#64748B] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            rows={3}
            placeholder={t('bank.notesPlaceholder')}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:flex-1 min-h-[44px] justify-center"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full sm:flex-1 min-h-[44px] justify-center"
          >
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}


