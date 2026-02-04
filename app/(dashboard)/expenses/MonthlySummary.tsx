'use client'

import { Expense, Vendor } from '@/lib/types/database'
import { useMemo } from 'react'

interface MonthlySummaryProps {
  expenses: Expense[]
  vendors: Vendor[]
  selectedMonth: string
}

export default function MonthlySummary({ expenses, vendors, selectedMonth }: MonthlySummaryProps) {
  const monthlyData = useMemo(() => {
    const filtered = expenses.filter(expense => 
      expense.date.startsWith(selectedMonth)
    )

    const total = filtered.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Group by category
    const byCategory = filtered.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount)
      return acc
    }, {} as Record<string, number>)

    // Group by vendor
    const byVendor = filtered.reduce((acc, expense) => {
      if (expense.vendor_id) {
        acc[expense.vendor_id] = (acc[expense.vendor_id] || 0) + Number(expense.amount)
      }
      return acc
    }, {} as Record<string, number>)

    return { total, byCategory, byVendor, count: filtered.length }
  }, [expenses, selectedMonth])

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight mb-6">
        Resumen Mensual: {new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
      </h2>

      {/* Total */}
      <div className="bg-[#2563EB]/5 rounded-xl p-6 mb-6 border border-[#2563EB]/10">
        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-2">Total de Gastos</p>
        <p className="text-3xl font-bold text-[#2563EB] mb-1">${monthlyData.total.toFixed(2)}</p>
        <p className="text-sm text-[#64748B]">{monthlyData.count} {monthlyData.count === 1 ? 'transacción' : 'transacciones'}</p>
      </div>

      {/* By Category */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[#0F172A] mb-4 tracking-tight">Por Categoría</h3>
        <div className="space-y-2">
          {Object.entries(monthlyData.byCategory).length === 0 ? (
            <p className="text-sm text-[#64748B]">No hay gastos este mes</p>
          ) : (
            Object.entries(monthlyData.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0] last:border-0">
                  <span className="text-sm text-[#0F172A]">{category}</span>
                  <span className="text-sm font-semibold text-[#0F172A]">${amount.toFixed(2)}</span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* By Vendor */}
      {Object.keys(monthlyData.byVendor).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A] mb-4 tracking-tight">Por Proveedor</h3>
          <div className="space-y-2">
            {Object.entries(monthlyData.byVendor)
              .sort(([, a], [, b]) => b - a)
              .map(([vendorId, amount]) => {
                const vendor = vendors.find(v => v.id === vendorId)
                return (
                  <div key={vendorId} className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0] last:border-0">
                    <span className="text-sm text-[#0F172A]">{vendor?.company_name || 'Desconocido'}</span>
                    <span className="text-sm font-semibold text-[#0F172A]">${amount.toFixed(2)}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
