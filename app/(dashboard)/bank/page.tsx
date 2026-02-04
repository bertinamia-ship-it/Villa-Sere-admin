'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{t('bank.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1.5">{t('bank.subtitle')}</p>
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{t('bank.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1.5">{t('bank.subtitle')}</p>
        </div>
        <Button onClick={() => {
          setEditingAccount(null)
          setShowForm(true)
        }}>
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
          {accounts.map(account => (
            <Card
              key={account.id}
              padding="md"
              className="hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div onClick={() => setSelectedAccount(account)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      account.account_type === 'cash' ? 'bg-[#10B981]/10 text-[#10B981]' :
                      account.account_type === 'card' ? 'bg-[#2563EB]/10 text-[#2563EB]' :
                      'bg-[#64748B]/10 text-[#64748B]'
                    }`}>
                      {getAccountIcon(account.account_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0F172A] text-base">{account.name}</h3>
                      <p className="text-xs text-[#64748B] mt-0.5">{getAccountTypeLabel(account.account_type)}</p>
                    </div>
                  </div>
                  {!account.is_active && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      {t('bank.inactive')}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#64748B]">{t('bank.currentBalance')}</span>
                    <span className="text-lg font-bold text-[#0F172A]">
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
          ))}
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

