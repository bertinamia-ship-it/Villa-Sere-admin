'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FinancialAccount } from '@/lib/types/database'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { insertWithPropertyClient } from '@/lib/supabase/query-helpers-client'
import { useI18n } from '@/components/I18nProvider'
import { logError, getUserFriendlyError } from '@/lib/utils/error-handler'

interface TransactionFormProps {
  account: FinancialAccount
  direction: 'in' | 'out'
  onClose: () => void
  onSave: () => void
}

export default function TransactionForm({ account, direction, onClose, onSave }: TransactionFormProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast(t('errors.propertyRequired'), 'error')
      setLoading(false)
      return
    }

    if (!formData.transaction_date) {
      showToast(t('bank.dateRequired'), 'error')
      setLoading(false)
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      showToast(t('bank.amountGreaterThanZero'), 'error')
      setLoading(false)
      return
    }

    try {
      const dataToSave = {
        account_id: account.id,
        transaction_date: formData.transaction_date,
        direction: direction,
        amount: amount,
        note: formData.note.trim() || null,
      }

      const { error } = await insertWithPropertyClient('account_transactions', dataToSave)
      if (error) {
        logError('TransactionForm.insert', error)
        showToast(getUserFriendlyError(error), 'error')
      } else {
        showToast(t('bank.transactionSaved'), 'success')
        onSave()
      }
    } catch (error) {
      logError('TransactionForm.save', error)
      showToast(getUserFriendlyError(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={direction === 'in' ? t('bank.addMoney') : t('bank.registerOutgoing')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('bank.transactionDate')}
          type="date"
          value={formData.transaction_date}
          onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
          required
        />

        <Input
          label={t('bank.amount')}
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />

        <div>
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {t('bank.transactionNote')}
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="w-full px-3 py-2 text-sm text-[#0F172A] placeholder-[#64748B] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            rows={3}
            placeholder="Nota opcional"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}


