'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { buildExportFilename } from '@/lib/utils/download'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { Download, BarChart3, TrendingUp, TrendingDown, DollarSign, Wrench, Package } from 'lucide-react'
import { t } from '@/lib/i18n/es'

interface MonthlyExpenseSummary {
  total: number
  byCategory: { category: string; total: number }[]
  byVendor: { vendor_name: string; total: number }[]
  maintenance: number
  other: number
}

interface MaintenanceCostSummary {
  byMonth: { month: string; total: number }[]
  byRoom: { room: string; total: number }[]
}

interface InventoryInsights {
  lowStockCount: number
  lowStockItems: { name: string; quantity: number; min_threshold: number }[]
  byCategory: { category: string; count: number }[]
  byLocation: { location: string; count: number }[]
}

export default function ReportsPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  
  // State for expense report
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [expenseSummary, setExpenseSummary] = useState<MonthlyExpenseSummary | null>(null)
  const [maintenanceSummary, setMaintenanceSummary] = useState<MaintenanceCostSummary | null>(null)
  const [inventoryInsights, setInventoryInsights] = useState<InventoryInsights | null>(null)
  const [propertyName, setPropertyName] = useState<string>('CasaPilot')

  useEffect(() => {
    loadPropertyName()
    loadReports()
  }, [selectedMonth])

  async function loadPropertyName() {
    const propertyId = await getActivePropertyId()
    if (propertyId) {
      const { data } = await supabase
        .from('properties')
        .select('name')
        .eq('id', propertyId)
        .single()
      if (data?.name) {
        setPropertyName(data.name)
      }
    }
  }

  async function loadReports() {
    setLoading(true)
    try {
      await Promise.all([
        loadExpenseSummary(),
        loadMaintenanceSummary(),
        loadInventoryInsights()
      ])
    } catch (error) {
      console.error('Error loading reports:', error)
      showToast('Error al cargar reportes', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadExpenseSummary() {
    const [year, month] = selectedMonth.split('-')
    const startDate = `${year}-${month}-01`
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

    // Get expenses for the month filtered by active property
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      setExpenseSummary({ total: 0, byCategory: [], byVendor: [], maintenance: 0, other: 0 })
      return
    }

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('amount, category, vendor_id, ticket_id, vendors(company_name)')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) throw error

    const total = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0

    // Group by category
    const categoryMap = new Map<string, number>()
    expenses?.forEach(e => {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount)
    })
    const byCategory = Array.from(categoryMap.entries()).map(([category, total]) => ({ category, total }))

    // Group by vendor
    const vendorMap = new Map<string, number>()
    expenses?.forEach(e => {
      if (e.vendors) {
        const name = (e.vendors as any).company_name
        vendorMap.set(name, (vendorMap.get(name) || 0) + e.amount)
      }
    })
    const byVendor = Array.from(vendorMap.entries()).map(([vendor_name, total]) => ({ vendor_name, total }))

    // Maintenance vs other
    const maintenance = expenses?.filter(e => e.ticket_id).reduce((sum, e) => sum + e.amount, 0) || 0
    const other = total - maintenance

    setExpenseSummary({ total, byCategory, byVendor, maintenance, other })
  }

  async function loadMaintenanceSummary() {
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      setMaintenanceSummary({ byMonth: [], byRoom: [] })
      return
    }

    // Get maintenance tickets with costs for the last 6 months (filtered by property_id)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const { data: tickets, error } = await supabase
      .from('maintenance_tickets')
      .select('date, cost, room')
      .eq('property_id', propertyId)
      .gte('date', sixMonthsAgo.toISOString().split('T')[0])
      .not('cost', 'is', null)

    if (error) throw error

    // Group by month
    const monthMap = new Map<string, number>()
    tickets?.forEach(t => {
      const month = t.date.substring(0, 7)
      monthMap.set(month, (monthMap.get(month) || 0) + (t.cost || 0))
    })
    const byMonth = Array.from(monthMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Group by room
    const roomMap = new Map<string, number>()
    tickets?.forEach(t => {
      roomMap.set(t.room, (roomMap.get(t.room) || 0) + (t.cost || 0))
    })
    const byRoom = Array.from(roomMap.entries())
      .map(([room, total]) => ({ room, total }))
      .sort((a, b) => b.total - a.total)

    setMaintenanceSummary({ byMonth, byRoom })
  }

  async function loadInventoryInsights() {
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      setInventoryInsights({ lowStockCount: 0, lowStockItems: [], byCategory: [], byLocation: [] })
      return
    }

    const { data: items, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('property_id', propertyId)

    if (error) throw error

    const lowStockItems = items?.filter(i => i.quantity <= i.min_threshold) || []
    const lowStockCount = lowStockItems.length

    // Group by category
    const categoryMap = new Map<string, number>()
    items?.forEach(i => {
      categoryMap.set(i.category, (categoryMap.get(i.category) || 0) + 1)
    })
    const byCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }))

    // Group by location
    const locationMap = new Map<string, number>()
    items?.forEach(i => {
      locationMap.set(i.location, (locationMap.get(i.location) || 0) + 1)
    })
    const byLocation = Array.from(locationMap.entries()).map(([location, count]) => ({ location, count }))

    setInventoryInsights({ lowStockCount, lowStockItems, byCategory, byLocation })
  }

  async function exportToCSV() {
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
    if (!expenseSummary) return

    const rows = [
      [t('reports.monthlyExpenseReport', { propertyName: propertyName || 'CasaPilot' })],
      [`${t('reports.month')}: ${selectedMonth}`],
      [''],
      [t('reports.summary')],
      [t('reports.totalExpenses'), expenseSummary.total.toFixed(2)],
      [t('reports.maintenance'), expenseSummary.maintenance.toFixed(2)],
      [t('reports.other'), expenseSummary.other.toFixed(2)],
      [''],
      [t('reports.byCategory')],
      [t('reports.category'), t('reports.amount')],
      ...expenseSummary.byCategory.map(c => [c.category, c.total.toFixed(2)]),
      [''],
      [t('reports.byVendor')],
      [t('reports.vendor'), t('reports.amount')],
      ...expenseSummary.byVendor.map(v => [v.vendor_name, v.total.toFixed(2)]),
    ]

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // Build filename with property name
    a.download = buildExportFilename({
      propertyName,
      reportType: 'Reporte-Gastos',
      dateRange: selectedMonth,
      ext: 'csv'
    })
    
    a.click()
    URL.revokeObjectURL(url)
    showToast(t('reports.reportExported'), 'success')
  }

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
    return { value, label }
  })

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('reports.title')}</h1>
          <p className="mt-1 text-sm text-gray-700">{t('reports.subtitle')}</p>
        </div>
      </div>

      {/* Month selector */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xs">
            <Select
              label={t('reports.selectMonth')}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={monthOptions}
            />
          </div>
          <Button onClick={exportToCSV} variant="secondary" className="ml-4">
            <Download className="h-4 w-4" />
            {t('reports.exportCSV')}
          </Button>
        </div>
      </Card>

      {/* Expense Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <CardTitle>{t('reports.monthlyExpenseSummary')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {expenseSummary && expenseSummary.total > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-600">{t('reports.totalExpenses')}</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">${expenseSummary.total.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-sm font-medium text-red-600">{t('reports.maintenance')}</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">${expenseSummary.maintenance.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-600">{t('reports.other')}</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">${expenseSummary.other.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">By Category</h4>
                  <div className="space-y-2">
                    {expenseSummary.byCategory.map((item) => (
                      <div key={item.category} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">{item.category}</span>
                        <span className="text-sm font-semibold text-gray-900">${item.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('reports.byVendor')}</h4>
                  <div className="space-y-2">
                    {expenseSummary.byVendor.length > 0 ? (
                      expenseSummary.byVendor.map((item) => (
                        <div key={item.vendor_name} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-700">{item.vendor_name}</span>
                          <span className="text-sm font-semibold text-gray-900">${item.total.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">{t('reports.noVendorExpenses')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-12 w-12" />}
              title={t('reports.noExpensesThisMonth')}
              description={t('reports.noExpensesDescription')}
            />
          )}
        </CardContent>
      </Card>

      {/* Maintenance Cost Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            <CardTitle>{t('reports.maintenanceCostSummary')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {maintenanceSummary && (maintenanceSummary.byMonth.length > 0 || maintenanceSummary.byRoom.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('reports.last6Months')}</h4>
                <div className="space-y-2">
                  {maintenanceSummary.byMonth.map((item) => (
                    <div key={item.month} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-700">
                        {new Date(item.month + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('reports.byRoom')}</h4>
                <div className="space-y-2">
                  {maintenanceSummary.byRoom.map((item) => (
                    <div key={item.room} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-700">{item.room}</span>
                      <span className="text-sm font-semibold text-gray-900">${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Wrench className="h-12 w-12" />}
              title={t('reports.noMaintenanceCosts')}
              description={t('reports.noMaintenanceCostsDescription')}
            />
          )}
        </CardContent>
      </Card>

      {/* Inventory Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            <CardTitle>{t('reports.inventoryInsights')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {inventoryInsights ? (
            <div className="space-y-6">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm font-medium text-amber-700">{t('reports.lowStockItems')}</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">{inventoryInsights.lowStockCount}</p>
                {inventoryInsights.lowStockItems.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {inventoryInsights.lowStockItems.slice(0, 5).map(item => (
                      <p key={item.name} className="text-xs text-amber-700">
                        {item.name}: {item.quantity} / {item.min_threshold}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('reports.byCategory')}</h4>
                  <div className="space-y-2">
                    {inventoryInsights.byCategory.map((item) => (
                      <div key={item.category} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">{item.category}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.count} {t('reports.items')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('reports.byLocation')}</h4>
                  <div className="space-y-2">
                    {inventoryInsights.byLocation.map((item) => (
                      <div key={item.location} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">{item.location}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.count} {t('reports.items')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title={t('reports.noInventoryData')}
              description={t('reports.noInventoryDataDescription')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
