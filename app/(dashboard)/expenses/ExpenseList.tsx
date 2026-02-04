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
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Detalles
              </th>
              <th className="px-6 py-3.5 text-right text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E2E8F0]">
            {filteredExpenses.map((expense, index) => {
              const vendorName = getVendorName(expense.vendor_id)
              const ticketTitle = getTicketTitle(expense.ticket_id)
              
              return (
                <tr key={expense.id} className={`transition-colors duration-200 ease-out ${index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]/50'} hover:bg-[#2563EB]/5`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0F172A]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#64748B]" />
                      {new Date(expense.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0F172A]">
                    ${Number(expense.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {vendorName && <div className="text-[#0F172A] font-medium mb-1">{vendorName}</div>}
                    {ticketTitle && (
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B] mb-1">
                        <FileText className="h-3.5 w-3.5" />
                        {ticketTitle}
                      </div>
                    )}
                    {expense.notes && (
                      <div className="text-xs text-[#64748B] mt-1 leading-relaxed">{expense.notes}</div>
                    )}
                    {expense.receipt_url && (
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] mt-1 transition-colors font-medium"
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
                        className="text-[#64748B] hover:text-[#2563EB] transition-all duration-200 p-1.5 rounded-lg hover:bg-[#2563EB]/10"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="text-[#64748B] hover:text-[#EF4444] transition-all duration-200 p-1.5 rounded-lg hover:bg-[#EF4444]/10"
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
