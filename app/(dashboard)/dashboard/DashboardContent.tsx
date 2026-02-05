'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { 
  Package, 
  Wrench, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  TrendingUp,
  ShoppingCart,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Clock,
  LogIn,
  LogOut,
  CalendarCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { t } from '@/lib/i18n/es'
import Link from 'next/link'

interface DashboardData {
  propertyName: string
  monthIncome: number
  monthExpenses: number
  monthProfit: number
  totalInventory: number
  lowStockItems: number
  activeTickets: number
  urgentTickets: number
  todayCheckIns: number
  todayCheckOuts: number
  todayTasks: number
  todayMaintenance: number
  overdueTasks: number
  currentMonth: string
  currentYear: number
}

export default function DashboardContent({ initialData }: { initialData: DashboardData }) {
  const supabase = createClient()
  const [propertyName, setPropertyName] = useState(initialData.propertyName)
  const [data, setData] = useState(initialData)

  useEffect(() => {
    async function loadPropertyName() {
      const propertyId = await getActivePropertyId()
      if (propertyId) {
        const { data: property } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .maybeSingle()
        if (property?.name) {
          setPropertyName(property.name)
          setData(prev => ({ ...prev, propertyName: property.name }))
        }
      }
    }

    loadPropertyName()

    const handlePropertyChange = () => {
      loadPropertyName()
      // Recargar datos cuando cambia la propiedad
      window.location.reload()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, [supabase])

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Property Header - Compact and organized */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200/60 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">
              {propertyName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('dashboard.subtitleContext', { propertyName, month: data.currentMonth, year: data.currentYear })}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics - Colorful and animated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ingresos */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              {t('dashboard.income')}
            </p>
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-md">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-1">
            {data.monthIncome > 0 ? `$${data.monthIncome.toFixed(0)}` : '—'}
          </p>
          <p className="text-xs font-medium text-emerald-700/70">{t('dashboard.thisMonth')}</p>
        </div>

        {/* Gastos */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
              {t('dashboard.expenses')}
            </p>
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg shadow-md">
              <ArrowDownRight className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-900 mb-1">
            {data.monthExpenses > 0 ? `$${data.monthExpenses.toFixed(0)}` : '—'}
          </p>
          <p className="text-xs font-medium text-red-700/70">{t('dashboard.thisMonth')}</p>
        </div>

        {/* Ganancia */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              {t('dashboard.profit')}
            </p>
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold mb-1 ${data.monthProfit >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
            {data.monthProfit !== 0 ? `$${data.monthProfit.toFixed(0)}` : '—'}
          </p>
          <p className="text-xs font-medium text-blue-700/70">{t('dashboard.thisMonth')}</p>
        </div>

        {/* Inventario */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              {t('dashboard.inventory')}
            </p>
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-md">
              <Package className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-900 mb-1">
            {data.totalInventory}
          </p>
          <p className="text-xs font-medium text-amber-700/70">
            {data.lowStockItems > 0 ? `${data.lowStockItems} ${t('dashboard.lowStock')}` : t('dashboard.allStocked')}
          </p>
        </div>
      </div>

      {/* Rest of dashboard content would go here - keeping it simple for now */}
    </div>
  )
}

