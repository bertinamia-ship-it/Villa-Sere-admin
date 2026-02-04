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
import { t } from '@/lib/i18n/es'
import { logError, getUserFriendlyError } from '@/lib/utils/error-handler'
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
      console.error('Error loading transactions:', error)
      showToast(t('bank.loadError'), 'error')
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
        showToast(getUserFriendlyError(error), 'error')
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{currentAccount.name}</h1>
            <p className="text-sm text-[#64748B] mt-1.5">{t('bank.transactions')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onEdit(currentAccount)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="danger" onClick={() => onDelete(currentAccount.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Account Summary */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#64748B]">{t('bank.currentBalance')}</p>
            <p className="text-3xl font-bold text-[#0F172A] mt-1">{formatCurrency(currentAccount.current_balance)}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setTransactionDirection('in')
                setShowTransactionForm(true)
              }}
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
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">
                    {t('bank.transactionDate')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">
                    {t('bank.direction')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#64748B] uppercase tracking-wider">
                    {t('bank.amount')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">
                    {t('bank.transactionNote')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#64748B] uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-[#0F172A]">{formatDate(transaction.transaction_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.direction === 'in'
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : 'bg-[#EF4444]/10 text-[#EF4444]'
                      }`}>
                        {transaction.direction === 'in' ? t('bank.directionIn') : t('bank.directionOut')}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold text-right ${
                      transaction.direction === 'in' ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}>
                      {transaction.direction === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748B]">{transaction.note || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm({ isOpen: true, transactionId: transaction.id })}
                      >
                        <Trash2 className="h-4 w-4 text-[#EF4444]" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
        message={t('bank.confirmDeleteTransaction')}
        variant="danger"
      />
    </div>
  )
}

