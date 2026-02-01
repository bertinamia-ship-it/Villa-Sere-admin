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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Resumen Mensual: {new Date(selectedMonth + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
      </h2>

      {/* Total */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 mb-1">Total de Gastos</p>
        <p className="text-3xl font-bold text-blue-600">${monthlyData.total.toFixed(2)}</p>
        <p className="text-sm text-gray-600 mt-1">{monthlyData.count} transacciones</p>
      </div>

      {/* By Category */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Por Categoría</h3>
        <div className="space-y-2">
          {Object.entries(monthlyData.byCategory).length === 0 ? (
            <p className="text-sm text-gray-500">No hay gastos este mes</p>
          ) : (
            Object.entries(monthlyData.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">{category}</span>
                  <span className="text-sm font-semibold text-gray-900">${amount.toFixed(2)}</span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* By Vendor */}
      {Object.keys(monthlyData.byVendor).length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Por Proveedor</h3>
          <div className="space-y-2">
            {Object.entries(monthlyData.byVendor)
              .sort(([, a], [, b]) => b - a)
              .map(([vendorId, amount]) => {
                const vendor = vendors.find(v => v.id === vendorId)
                return (
                  <div key={vendorId} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-700">{vendor?.company_name || 'Desconocido'}</span>
                    <span className="text-sm font-semibold text-gray-900">${amount.toFixed(2)}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
