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
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 text-center">
        <p className="text-sm text-[#64748B]">No hay gastos registrados este mes</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200/60">
              {filteredExpenses.map((expense, index) => {
                const vendorName = getVendorName(expense.vendor_id)
                const ticketTitle = getTicketTitle(expense.ticket_id)
                
                return (
                  <tr key={expense.id} className={`transition-colors duration-200 ease-out ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/50`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        {new Date(expense.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      ${Number(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {vendorName && <div className="text-slate-900 font-medium mb-1">{vendorName}</div>}
                      {ticketTitle && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                          <FileText className="h-3.5 w-3.5" />
                          {ticketTitle}
                        </div>
                      )}
                      {expense.notes && (
                        <div className="text-xs text-slate-600 mt-1 leading-relaxed">{expense.notes}</div>
                      )}
                      {expense.receipt_url && (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 mt-1 transition-colors font-medium"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Ver Recibo
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(expense)}
                          className="text-slate-500 hover:text-blue-600 transition-all duration-200 p-1.5 rounded-lg hover:bg-blue-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="text-slate-500 hover:text-red-600 transition-all duration-200 p-1.5 rounded-lg hover:bg-red-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredExpenses.map((expense) => {
          const vendorName = getVendorName(expense.vendor_id)
          const ticketTitle = getTicketTitle(expense.ticket_id)
          
          return (
            <div key={expense.id} className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-md p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-900">
                      {new Date(expense.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
                      {expense.category}
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ${Number(expense.amount).toFixed(2)}
                    </span>
                  </div>
                  {vendorName && (
                    <p className="text-sm font-medium text-slate-900 mb-1">{vendorName}</p>
                  )}
                  {ticketTitle && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                      <FileText className="h-3.5 w-3.5" />
                      {ticketTitle}
                    </div>
                  )}
                  {expense.notes && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{expense.notes}</p>
                  )}
                  {expense.receipt_url && (
                    <a
                      href={expense.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 mt-2 transition-colors font-medium"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Ver Recibo
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => onEdit(expense)}
                    className="text-slate-500 hover:text-blue-600 transition-all duration-200 p-2 rounded-lg hover:bg-blue-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Editar"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="text-slate-500 hover:text-red-600 transition-all duration-200 p-2 rounded-lg hover:bg-red-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
