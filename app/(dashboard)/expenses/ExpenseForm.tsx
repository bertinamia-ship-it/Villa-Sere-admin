'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Expense, Vendor, MaintenanceTicket, FinancialAccount } from '@/lib/types/database'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { X, Upload } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/lib/i18n/es'
import { insertWithPropertyClient, updateWithPropertyClient, deleteWithPropertyClient } from '@/lib/supabase/query-helpers-client'
import { logError, getUserFriendlyError } from '@/lib/utils/error-handler'

interface ExpenseFormProps {
  expense?: Expense | null
  vendors: Vendor[]
  tickets: MaintenanceTicket[]
  onClose: () => void
}

export default function ExpenseForm({ expense, vendors, tickets, onClose }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    date: expense?.date || new Date().toISOString().split('T')[0],
    amount: expense?.amount?.toString() || '',
    category: expense?.category || EXPENSE_CATEGORIES[0],
    vendor_id: expense?.vendor_id || '',
    ticket_id: expense?.ticket_id || '',
    account_id: (expense as any)?.account_id || '',
    notes: expense?.notes || '',
  })
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState(expense?.receipt_url || '')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        setAccounts([])
        setLoadingAccounts(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoadingAccounts(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        setLoadingAccounts(false)
        return
      }

      // Load accounts: property_id = current property OR property_id IS NULL (general accounts)
      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .or(`property_id.eq.${propertyId},property_id.is.null`)
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast(t('errors.propertyRequired'), 'error')
      setLoading(false)
      return
    }

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast(t('errors.amountGreaterThanZero'), 'error')
      setLoading(false)
      return
    }

    if (!formData.date) {
      showToast(t('errors.dateRequired'), 'error')
      setLoading(false)
      return
    }

    if (!formData.category) {
      showToast(t('errors.categoryRequired'), 'error')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const dataToSave = {
      ...formData,
      amount: parseFloat(formData.amount),
      vendor_id: formData.vendor_id || null,
      ticket_id: formData.ticket_id || null,
      account_id: formData.account_id || null,
      receipt_url: receiptUrl || null,
      created_by: user?.id,
      property_id: propertyId,
    }

    if (expense) {
      // Update expense
      const { error: updateError, data: updatedExpense } = await supabase
        .from('expenses')
        .update(dataToSave)
        .eq('id', expense.id)
        .eq('property_id', propertyId)
        .select()
        .single()

      if (updateError) {
        logError('ExpenseForm.update', updateError)
        showToast(getUserFriendlyError(updateError), 'error')
        setLoading(false)
        return
      }

      // Handle transaction update/creation/deletion
      const oldAccountId = (expense as any)?.account_id
      const newAccountId = formData.account_id || null
      const expenseId = expense.id
      const transactionDate = formData.date.split('T')[0]
      const transactionAmount = parseFloat(formData.amount)

      // Find existing transaction
      const { data: existingTransaction } = await supabase
        .from('account_transactions')
        .select('id, account_id')
        .eq('expense_id', expenseId)
        .maybeSingle()

      if (existingTransaction) {
        // Transaction exists
        if (newAccountId) {
          // Update transaction
          const { error: transactionError } = await updateWithPropertyClient('account_transactions', existingTransaction.id, {
            account_id: newAccountId,
            amount: transactionAmount,
            transaction_date: transactionDate,
            note: t('bank.transactionNoteExpense', { category: formData.category }),
          })
          if (transactionError) {
            logError('ExpenseForm.updateTransaction', transactionError)
            showToast(getUserFriendlyError(transactionError), 'error')
          }
        } else {
          // Delete transaction (account removed)
          const { error: deleteError } = await deleteWithPropertyClient('account_transactions', existingTransaction.id)
          if (deleteError) {
            logError('ExpenseForm.deleteTransaction', deleteError)
            showToast(getUserFriendlyError(deleteError), 'error')
          }
        }
      } else if (newAccountId) {
        // Create new transaction (account added)
        const { error: insertError } = await insertWithPropertyClient('account_transactions', {
          account_id: newAccountId,
          transaction_date: transactionDate,
          direction: 'out',
          amount: transactionAmount,
          expense_id: expenseId,
          note: t('bank.transactionNoteExpense', { category: formData.category }),
        })
        if (insertError) {
          logError('ExpenseForm.createTransaction', insertError)
          showToast(getUserFriendlyError(insertError), 'error')
        }
      }

      onClose()
    } else {
      // Insert expense
      const { error: insertError, data: newExpense } = await supabase
        .from('expenses')
        .insert([dataToSave])
        .select()
        .single()

      if (insertError) {
        logError('ExpenseForm.insert', insertError)
        showToast(getUserFriendlyError(insertError), 'error')
        setLoading(false)
        return
      }

      // Create transaction if account selected
      if (formData.account_id && newExpense) {
        const transactionDate = formData.date.split('T')[0]
        const transactionAmount = parseFloat(formData.amount)
        
        const { error: transactionError } = await insertWithPropertyClient('account_transactions', {
          account_id: formData.account_id,
          transaction_date: transactionDate,
          direction: 'out',
          amount: transactionAmount,
          expense_id: newExpense.id,
          note: t('bank.transactionNoteExpense', { category: formData.category }),
        })
        
        if (transactionError) {
          logError('ExpenseForm.createTransaction', transactionError)
          showToast(getUserFriendlyError(transactionError), 'error')
        }
      }

      onClose()
    }

    setLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(data.path)
      
      setReceiptUrl(urlData.publicUrl)
    }

    setUploading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm safe-area-y">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-t sm:border border-slate-200/60">
        <div className="sticky top-0 bg-white border-b border-slate-200/60 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between z-10 shrink-0 safe-area-top safe-area-x">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            {expense ? t('expenses.editExpense') : t('expenses.addExpense')}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-900 transition-colors p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-4 safe-area-x safe-area-bottom">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Monto *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Categoría *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('expenses.vendor')} ({t('common.optional')})
            </label>
            <select
              value={formData.vendor_id}
              onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              <option value="">{t('expenses.noVendor')}</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('expenses.linkedTicket')} ({t('common.optional')})
            </label>
            <select
              value={formData.ticket_id}
              onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              <option value="">{t('expenses.noTicket')}</option>
              {tickets.map(ticket => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.title} - {ticket.room}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('bank.paidWith')} ({t('common.optional')})
            </label>
            <select
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              disabled={loadingAccounts}
            >
              <option value="">{t('bank.noAccount')}</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.account_type === 'cash' ? t('bank.accountTypeCash') : account.account_type === 'card' ? t('bank.accountTypeCard') : t('bank.accountTypeBank')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto del Recibo
            </label>
            {receiptUrl ? (
              <div className="space-y-2">
                <img src={receiptUrl} alt="Receipt" className="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Eliminar Foto
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploading ? 'Subiendo...' : 'Haz clic para subir recibo'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-t border-slate-200/60 safe-area-bottom">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 disabled:opacity-50 transition-all duration-300 min-h-[44px]"
            >
              {loading ? 'Guardando...' : expense ? 'Actualizar Gasto' : 'Agregar Gasto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-300 min-h-[44px] sm:w-auto w-full"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
