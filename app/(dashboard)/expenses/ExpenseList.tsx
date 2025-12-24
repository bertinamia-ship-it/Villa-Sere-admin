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
        <p className="text-gray-600">No expenses for this month</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses.map(expense => {
              const vendorName = getVendorName(expense.vendor_id)
              const ticketTitle = getTicketTitle(expense.ticket_id)
              
              return (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(expense.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${Number(expense.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {vendorName && <div className="text-gray-900 font-medium">{vendorName}</div>}
                    {ticketTitle && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FileText className="h-3 w-3" />
                        {ticketTitle}
                      </div>
                    )}
                    {expense.notes && (
                      <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                    )}
                    {expense.receipt_url && (
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        <ImageIcon className="h-3 w-3" />
                        View Receipt
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(expense)}
                        className="text-gray-600 hover:text-blue-600 transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="text-gray-600 hover:text-red-600 transition"
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
