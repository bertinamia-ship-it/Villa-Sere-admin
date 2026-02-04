'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Expense, Vendor, MaintenanceTicket } from '@/lib/types/database'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { X, Upload } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { t } from '@/lib/i18n/es'

interface ExpenseFormProps {
  expense?: Expense | null
  vendors: Vendor[]
  tickets: MaintenanceTicket[]
  onClose: () => void
}

export default function ExpenseForm({ expense, vendors, tickets, onClose }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    date: expense?.date || new Date().toISOString().split('T')[0],
    amount: expense?.amount?.toString() || '',
    category: expense?.category || EXPENSE_CATEGORIES[0],
    vendor_id: expense?.vendor_id || '',
    ticket_id: expense?.ticket_id || '',
    notes: expense?.notes || '',
  })
  const [uploading, setUploading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState(expense?.receipt_url || '')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast(t('errors.propertyRequired'), 'error')
      setLoading(false)
      return
    }

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast('El monto debe ser mayor que 0', 'error')
      setLoading(false)
      return
    }

    if (!formData.date) {
      showToast('La fecha es requerida', 'error')
      setLoading(false)
      return
    }

    if (!formData.category) {
      showToast('La categoría es requerida', 'error')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const dataToSave = {
      ...formData,
      amount: parseFloat(formData.amount),
      vendor_id: formData.vendor_id || null,
      ticket_id: formData.ticket_id || null,
      receipt_url: receiptUrl || null,
      created_by: user?.id,
      property_id: propertyId,
    }

    if (expense) {
      // Update: filter by id + property_id for security
      const { error } = await supabase
        .from('expenses')
        .update(dataToSave)
        .eq('id', expense.id)
        .eq('property_id', propertyId)

      if (error) {
        const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
        logError('ExpenseForm.update', error)
        showToast(getUserFriendlyError(error), 'error')
      } else {
        onClose()
      }
    } else {
      // Insert: property_id included automatically
      const { error } = await supabase
        .from('expenses')
        .insert([dataToSave])

      if (error) {
        const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
        logError('ExpenseForm.insert', error)
        showToast(getUserFriendlyError(error), 'error')
      } else {
        onClose()
      }
    }

    setLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(data.path)
      
      setReceiptUrl(urlData.publicUrl)
    }

    setUploading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {expense ? t('expenses.editExpense') : t('expenses.addExpense')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Monto *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Categoría *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('expenses.vendor')} ({t('common.optional')})
            </label>
            <select
              value={formData.vendor_id}
              onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              <option value="">{t('expenses.noVendor')}</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('expenses.linkedTicket')} ({t('common.optional')})
            </label>
            <select
              value={formData.ticket_id}
              onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              <option value="">{t('expenses.noTicket')}</option>
              {tickets.map(ticket => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.title} - {ticket.room}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-lg px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto del Recibo
            </label>
            {receiptUrl ? (
              <div className="space-y-2">
                <img src={receiptUrl} alt="Receipt" className="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setReceiptUrl('')}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Eliminar Foto
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploading ? 'Subiendo...' : 'Haz clic para subir recibo'}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Guardando...' : expense ? 'Actualizar Gasto' : 'Agregar Gasto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
                {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
