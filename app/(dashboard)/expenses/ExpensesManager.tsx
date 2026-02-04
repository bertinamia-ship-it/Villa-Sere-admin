'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Expense, Vendor, MaintenanceTicket } from '@/lib/types/database'
import { Plus, Download } from 'lucide-react'
import ExpenseForm from './ExpenseForm'
import ExpenseList from './ExpenseList'
import MonthlySummary from './MonthlySummary'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { buildExportFilename } from '@/lib/utils/download'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { t } from '@/lib/i18n/es'

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [hasProperty, setHasProperty] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; expenseId: string | null }>({ isOpen: false, expenseId: null })
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    const propertyId = await getActivePropertyId()
    
    if (!propertyId) {
      setExpenses([])
      setVendors([])
      setTickets([])
      setHasProperty(false)
      setLoading(false)
      return
    }

    setHasProperty(true)
    
    // Get tenant_id for vendors (vendors shared by tenant, not property)
    const { data: { user } } = await supabase.auth.getUser()
    let tenantId: string | null = null
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profileError) {
        console.error('[ExpensesManager] Error fetching profile:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
      }
      
      tenantId = profile?.tenant_id || null
    }
    
    // Expenses and tickets filtered by property_id, vendors shared (only tenant_id)
    const [expensesResult, vendorsResult, ticketsResult] = await Promise.all([
      supabase.from('expenses').select('*').eq('property_id', propertyId).order('date', { ascending: false }),
      tenantId
        ? supabase.from('vendors').select('*').eq('tenant_id', tenantId).order('company_name')
        : { data: [], error: null },
      supabase.from('maintenance_tickets').select('*').eq('property_id', propertyId).order('title')
    ])

    if (!expensesResult.error && expensesResult.data) {
      setExpenses(expensesResult.data)
    }
    if (!vendorsResult.error && vendorsResult.data) {
      setVendors(vendorsResult.data)
    }
    if (!ticketsResult.error && ticketsResult.data) {
      setTickets(ticketsResult.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    
    // Listen for property changes
    const handlePropertyChange = () => {
      fetchData()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, expenseId: id })
  }

  const handleDelete = async () => {
    if (!deleteConfirm.expenseId) return

    setDeleting(true)
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      setDeleting(false)
      setDeleteConfirm({ isOpen: false, expenseId: null })
      return
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', deleteConfirm.expenseId)
      .eq('property_id', propertyId)

    if (!error) {
      setExpenses(expenses.filter(expense => expense.id !== deleteConfirm.expenseId))
    }
    
    setDeleting(false)
    setDeleteConfirm({ isOpen: false, expenseId: null })
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingExpense(null)
    fetchData()
  }

  const exportToCSV = async () => {
    // Get active property name
    const propertyId = await getActivePropertyId()
    let propertyName: string | null = null
    if (propertyId) {
      const { data: property } = await supabase
        .from('properties')
        .select('name')
        .eq('id', propertyId)
        .maybeSingle()
      propertyName = property?.name || null
    }

    const headers = ['Date', 'Amount', 'Category', 'Vendor', 'Ticket', 'Notes']
    const rows = expenses.map(expense => {
      const vendor = vendors.find(v => v.id === expense.vendor_id)
      const ticket = tickets.find(t => t.id === expense.ticket_id)
      return [
        expense.date,
        expense.amount,
        expense.category,
        vendor?.company_name || '',
        ticket?.title || '',
        expense.notes || ''
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // Build filename with property name
    const dateRange = new Date().toISOString().split('T')[0]
    a.download = buildExportFilename({
      propertyName,
      reportType: 'Gastos',
      dateRange,
      ext: 'csv'
    })
    
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{t('expenses.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1.5">{t('expenses.subtitle')}</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="60%" height={16} />
                </div>
                <Skeleton variant="text" width="80px" height={20} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{t('expenses.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1.5">{t('expenses.subtitle')}</p>
        </div>
        <Card padding="lg">
          <EmptyState
            icon={<Download className="h-14 w-14" />}
            title={t('expenses.noPropertySelected')}
            description={t('expenses.selectOrCreatePropertyExpenses')}
          />
        </Card>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{t('expenses.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1.5">
            {expenses.length === 0 
              ? t('expenses.emptyTitle')
              : t('expenses.totalExpenses', { count: expenses.length })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4" />
            {t('expenses.exportCSV')}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" />
            {t('expenses.addExpense')}
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Card padding="md">
        <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">
          {t('expenses.selectMonth')}
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] bg-white focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
        />
      </Card>

      {/* Monthly Summary */}
      <MonthlySummary
        expenses={expenses}
        vendors={vendors}
        selectedMonth={selectedMonth}
      />

      {/* Expenses List */}
      <ExpenseList
        expenses={expenses}
        vendors={vendors}
        tickets={tickets}
        selectedMonth={selectedMonth}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Form Modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          vendors={vendors}
          tickets={tickets}
          onClose={handleFormClose}
        />
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, expenseId: null })}
        onConfirm={handleDelete}
        title={t('expenses.editExpense')}
        message="¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer."
        confirmText={t('common.delete')}
        loading={deleting}
      />
    </div>
    </>
  )
}
