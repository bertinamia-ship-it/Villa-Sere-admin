'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenanceTicket, Vendor } from '@/lib/types/database'
import { ROOMS, PRIORITIES, TICKET_STATUSES, PRIORITY_LABELS, STATUS_LABELS } from '@/lib/constants'
import { X, Upload } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { useI18n } from '@/components/I18nProvider'
import { useToast } from '@/components/ui/Toast'

interface TicketFormProps {
  ticket?: MaintenanceTicket | null
  vendors: Vendor[]
  onClose: () => void
}

export default function TicketForm({ ticket, vendors, onClose }: TicketFormProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    room: ticket?.room || ROOMS[0],
    priority: ticket?.priority || ('medium' as 'low' | 'medium' | 'high' | 'urgent'),
    status: ticket?.status || ('open' as 'open' | 'in_progress' | 'done'),
    vendor_id: ticket?.vendor_id || '',
    date: ticket?.date || new Date().toISOString().split('T')[0],
    notes: ticket?.notes || '',
    cost: ticket?.cost?.toString() || '',
  })
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(ticket?.photo_url || '')
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

    const { data: { user } } = await supabase.auth.getUser()

    const dataToSave = {
      ...formData,
      vendor_id: formData.vendor_id || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      photo_url: photoUrl || null,
      created_by: user?.id,
      property_id: propertyId,
    }

    try {
      if (ticket) {
        // Update: filter by id + property_id for security
        const { error } = await supabase
          .from('maintenance_tickets')
          .update(dataToSave)
          .eq('id', ticket.id)
          .eq('property_id', propertyId)

        if (error) {
          const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
          logError('TicketForm.update', error)
          showToast(getUserFriendlyError(error, t), 'error')
          setLoading(false)
          return
        }
        showToast(t('maintenance.ticketSaved'), 'success')
        onClose()
      } else {
        // Insert: property_id included automatically
        const { error } = await supabase
          .from('maintenance_tickets')
          .insert([dataToSave])

        if (error) {
          const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
          logError('TicketForm.insert', error)
          showToast(getUserFriendlyError(error, t), 'error')
          setLoading(false)
          return
        }
        showToast(t('maintenance.ticketSaved'), 'success')
        onClose()
      }
    } catch (error) {
      const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
      logError('TicketForm.save', error)
      showToast(getUserFriendlyError(error, t), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `maintenance/${fileName}`

    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (!error && data) {
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(data.path)
      
      setPhotoUrl(urlData.publicUrl)
    }

    setUploading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm safe-area-y">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-t sm:border border-slate-200/60">
        <div className="sticky top-0 bg-white border-b border-slate-200/60 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between z-10 shrink-0 safe-area-top safe-area-x">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            {ticket ? t('maintenance.editTicket') : t('maintenance.addTicket')}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-900 transition-colors p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-4 safe-area-x">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('maintenance.titleLabel')} *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-slate-200/60 rounded-lg px-3.5 py-3 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[44px] sm:min-h-0"
              placeholder="ej. Arreglar grifo que gotea"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('maintenance.room')} *
              </label>
              <select
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[44px] sm:min-h-0"
              >
                {ROOMS.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('maintenance.date')} *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('maintenance.priority')} *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[44px] sm:min-h-0"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('maintenance.status')} *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'open' | 'in_progress' | 'done' })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[44px] sm:min-h-0"
              >
                {TICKET_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Proveedor
              </label>
              <select
                value={formData.vendor_id}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 py-3 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[44px] sm:min-h-0"
              >
                <option value="">Ninguno</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Costo
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 py-3 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 min-h-[44px] sm:min-h-0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('maintenance.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-slate-200/60 rounded-lg px-3.5 py-3 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('maintenance.photo')} / Recibo
            </label>
            {photoUrl ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Upload" className="w-full h-48 object-cover rounded-lg" loading="lazy" decoding="async" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="text-sm text-red-600 hover:text-red-700 font-medium min-h-[44px] sm:min-h-0"
                >
                  Eliminar Foto
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors min-h-[120px]">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    {uploading ? 'Subiendo...' : 'Haz clic para subir'}
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

          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-t border-slate-200/60 safe-area-bottom">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 disabled:opacity-50 transition-all duration-300 min-h-[44px]"
            >
              {loading ? 'Guardando...' : ticket ? 'Actualizar Ticket' : 'Crear Ticket'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-300 min-h-[44px] sm:w-auto w-full"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
