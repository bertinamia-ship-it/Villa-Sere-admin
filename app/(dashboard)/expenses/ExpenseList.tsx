'use client'

import { Expense, Vendor, MaintenanceTicket } from '@/lib/types/database'
import { Pencil, Trash2, Calendar, FileText, Image as ImageIcon } from 'lucide-react'

interface ExpenseListProps {
  expenses: Expense[]
  vendors: Vendor[]
  tickets: MaintenanceTicket[]
  selectedMonth: string
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export default function ExpenseList({
  expenses,
  vendors,
  tickets,
  selectedMonth,
  onEdit,
  onDelete
}: ExpenseListProps) {
  const [year, month] = selectedMonth.split('-')
  
  const filteredExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date)
    return expDate.getFullYear() === parseInt(year) && 
           expDate.getMonth() === parseInt(month) - 1
  })

  const getVendorName = (vendorId: string | null) => {
    if (!vendorId) return null
    return vendors.find(v => v.id === vendorId)?.company_name
  }

  const getTicketTitle = (ticketId: string | null) => {
    if (!ticketId) return null
    return tickets.find(t => t.id === ticketId)?.title
  }

  if (filteredExpenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No hay gastos este mes</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Detalles
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E5E7EB]">
            {filteredExpenses.map((expense, index) => {
              const vendorName = getVendorName(expense.vendor_id)
              const ticketTitle = getTicketTitle(expense.ticket_id)
              
              return (
                <tr key={expense.id} className={`transition-colors duration-150 ease-out ${index % 2 === 0 ? 'bg-white' : 'bg-[#F7F8FA]/30'} hover:bg-[#2563EB]/5`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-[#2563EB]/10 text-[#2563EB]">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    ${Number(expense.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {vendorName && <div className="text-slate-900 font-medium">{vendorName}</div>}
                    {ticketTitle && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <FileText className="h-3 w-3" />
                        {ticketTitle}
                      </div>
                    )}
                    {expense.notes && (
                      <div className="text-xs text-slate-500 mt-1">{expense.notes}</div>
                    )}
                    {expense.receipt_url && (
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] mt-1 transition-colors"
                      >
                        <ImageIcon className="h-3 w-3" />
                        Ver Recibo
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(expense)}
                        className="text-slate-500 hover:text-[#2563EB] transition-colors duration-150 p-1 rounded hover:bg-[#2563EB]/10"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="text-slate-500 hover:text-[#EF4444] transition-colors duration-150 p-1 rounded hover:bg-[#EF4444]/10"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
