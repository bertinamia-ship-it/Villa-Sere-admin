'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'
import { FinancialAccount } from '@/lib/types/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { Plus, Wallet, CreditCard, Building2, Coins } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { t } from '@/lib/i18n/es'
import AccountForm from './AccountForm'
import AccountDetail from './AccountDetail'

export default function BankPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null)

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        setAccounts([])
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

      const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error loading accounts:', error)
      showToast(t('bank.loadError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()

    const handlePropertyChange = () => {
      loadAccounts()
      setSelectedAccount(null)
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = (account: FinancialAccount) => {
    setEditingAccount(account)
    setShowForm(true)
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm(t('bank.confirmDeleteAccount'))) return

    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('errors.propertyRequired'), 'error')
        return
      }

      const { error } = await supabase
        .from('financial_accounts')
        .delete()
        .eq('id', accountId)
        .eq('property_id', propertyId)

      if (error) throw error
      showToast(t('bank.accountDeleted'), 'success')
      loadAccounts()
      if (selectedAccount?.id === accountId) {
        setSelectedAccount(null)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      showToast(t('bank.deleteError'), 'error')
    }
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Coins className="h-5 w-5" />
      case 'card':
        return <CreditCard className="h-5 w-5" />
      case 'bank':
        return <Building2 className="h-5 w-5" />
      default:
        return <Wallet className="h-5 w-5" />
    }
  }

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return t('bank.accountTypeCash')
      case 'card':
        return t('bank.accountTypeCard')
      case 'bank':
        return t('bank.accountTypeBank')
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{t('bank.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5">{t('bank.subtitle')}</p>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (selectedAccount) {
    return (
      <AccountDetail
        account={selectedAccount}
        onBack={() => setSelectedAccount(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={loadAccounts}
      />
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{t('bank.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5">{t('bank.subtitle')}</p>
        </div>
        <Button 
          onClick={() => {
            setEditingAccount(null)
            setShowForm(true)
          }}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
        >
          <Plus className="h-4 w-4" />
          {t('bank.newAccount')}
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Wallet className="h-14 w-14" />}
            title={t('bank.noAccounts')}
            description={t('bank.noAccountsDescription')}
            actionLabel={t('bank.newAccount')}
            onAction={() => {
              setEditingAccount(null)
              setShowForm(true)
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => {
            const accountColors: Record<string, { bg: string; border: string; icon: string; text: string }> = {
              'cash': { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200/50', icon: 'bg-gradient-to-br from-emerald-500 to-green-500', text: 'text-emerald-700' },
              'card': { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200/50', icon: 'bg-gradient-to-br from-blue-500 to-indigo-500', text: 'text-blue-700' },
              'bank': { bg: 'from-slate-50 to-gray-50', border: 'border-slate-200/50', icon: 'bg-gradient-to-br from-slate-500 to-gray-500', text: 'text-slate-700' },
            }
            const colors = accountColors[account.account_type] || accountColors['bank']
            
            return (
            <Card
              key={account.id}
              padding="md"
              className={`bg-gradient-to-br ${colors.bg} ${colors.border} hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer`}
            >
              <div onClick={() => setSelectedAccount(account)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${colors.icon} rounded-xl shadow-md`}>
                      <div className="text-white">
                        {getAccountIcon(account.account_type)}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{account.name}</h3>
                      <p className={`text-xs font-medium mt-0.5 ${colors.text}`}>{getAccountTypeLabel(account.account_type)}</p>
                    </div>
                  </div>
                  {!account.is_active && (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg">
                      {t('bank.inactive')}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${colors.text}`}>{t('bank.currentBalance')}</span>
                    <span className="text-xl font-bold text-slate-900">
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: account.currency || 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(account.current_balance)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
            )
          })}
        </div>
      )}

      {showForm && (
        <AccountForm
          account={editingAccount}
          onClose={() => {
            setShowForm(false)
            setEditingAccount(null)
          }}
          onSave={() => {
            setShowForm(false)
            setEditingAccount(null)
            loadAccounts()
          }}
        />
      )}
    </div>
  )
}

