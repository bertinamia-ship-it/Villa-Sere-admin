'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FinancialAccount, AccountTransaction } from '@/lib/types/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { ArrowLeft, Plus, Minus, Edit, Trash2 } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { insertWithPropertyClient, deleteWithPropertyClient } from '@/lib/supabase/query-helpers-client'
import { useI18n } from '@/components/I18nProvider'
import { logError, getUserFriendlyError } from '@/lib/utils/error-handler'
import { formatDate, formatCurrency } from '@/lib/utils/formatters'
import TransactionForm from './TransactionForm'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface AccountDetailProps {
  account: FinancialAccount
  onBack: () => void
  onEdit: (account: FinancialAccount) => void
  onDelete: (accountId: string) => void
  onRefresh: () => void
}

export default function AccountDetail({ account, onBack, onEdit, onDelete, onRefresh }: AccountDetailProps) {
  const { t } = useI18n()
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<AccountTransaction[]>([])
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [transactionDirection, setTransactionDirection] = useState<'in' | 'out'>('in')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; transactionId: string | null }>({ isOpen: false, transactionId: null })
  const [currentAccount, setCurrentAccount] = useState<FinancialAccount>(account)

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        setTransactions([])
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        setLoading(false)
        return
      }

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('account_transactions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('property_id', propertyId)
        .eq('account_id', account.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

      // Refresh account balance
      const { data: accountData, error: accountError } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('id', account.id)
        .single()

      if (!accountError && accountData) {
        setCurrentAccount(accountData)
      }
    } catch (error) {
      const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
      logError('AccountDetail.loadTransactions', error)
      showToast(getUserFriendlyError(error, t), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [account.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteTransaction = async () => {
    if (!deleteConfirm.transactionId) return

    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('errors.propertyRequired'), 'error')
        return
      }

      const { error } = await deleteWithPropertyClient('account_transactions', deleteConfirm.transactionId)
      if (error) {
        logError('AccountDetail.deleteTransaction', error)
        showToast(getUserFriendlyError(error, t), 'error')
      } else {
        showToast(t('bank.transactionDeleted'), 'success')
        loadTransactions()
      }
    } catch (error) {
      logError('AccountDetail.deleteTransaction', error)
      showToast(getUserFriendlyError(error), 'error')
    } finally {
      setDeleteConfirm({ isOpen: false, transactionId: null })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currentAccount.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" onClick={onBack} className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight truncate">{currentAccount.name}</h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">{t('bank.transactions')}</p>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-2">
          <Button variant="secondary" onClick={() => onEdit(currentAccount)} className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="danger" onClick={() => onDelete(currentAccount.id)} className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Account Summary */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#64748B]">{t('bank.currentBalance')}</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1">{formatCurrency(currentAccount.current_balance)}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => {
                setTransactionDirection('in')
                setShowTransactionForm(true)
              }}
              className="w-full sm:w-auto min-h-[44px] justify-center"
            >
              <Plus className="h-4 w-4" />
              {t('bank.addMoney')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTransactionDirection('out')
                setShowTransactionForm(true)
              }}
              className="w-full sm:w-auto min-h-[44px] justify-center"
            >
              <Minus className="h-4 w-4" />
              {t('bank.registerOutgoing')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions List */}
      {loading ? (
        <LoadingSpinner />
      ) : transactions.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Minus className="h-14 w-14" />}
            title={t('bank.noTransactions')}
            description={t('bank.noTransactionsDescription')}
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card padding="none" className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-200/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      {t('bank.transactionDate')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      {t('bank.direction')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      {t('bank.amount')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      {t('bank.transactionNote')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {transactions.map(transaction => (
                    <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900">{formatDate(transaction.transaction_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.direction === 'in'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.direction === 'in' ? t('bank.directionIn') : t('bank.directionOut')}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold text-right ${
                        transaction.direction === 'in' ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {transaction.direction === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{transaction.note || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({ isOpen: true, transactionId: transaction.id })}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {transactions.map(transaction => (
              <Card key={transaction.id} padding="md" className="hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">{formatDate(transaction.transaction_date)}</span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        transaction.direction === 'in'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.direction === 'in' ? t('bank.directionIn') : t('bank.directionOut')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-lg font-bold ${
                        transaction.direction === 'in' ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {transaction.direction === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                    {transaction.note && (
                      <p className="text-sm text-slate-600 pt-2 border-t border-slate-200">{transaction.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm({ isOpen: true, transactionId: transaction.id })}
                    className="shrink-0 min-w-[44px] min-h-[44px]"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {showTransactionForm && (
        <TransactionForm
          account={currentAccount}
          direction={transactionDirection}
          onClose={() => {
            setShowTransactionForm(false)
            setTransactionDirection('in')
          }}
          onSave={() => {
            setShowTransactionForm(false)
            setTransactionDirection('in')
            loadTransactions()
          }}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, transactionId: null })}
        onConfirm={handleDeleteTransaction}
        title={t('bank.confirmDeleteTransaction')}
        message={t('bank.confirmDeleteTransactionMessage')}
        variant="danger"
      />
    </div>
  )
}


