'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenanceTicket, Vendor } from '@/lib/types/database'
import { ROOMS, PRIORITIES, TICKET_STATUSES } from '@/lib/constants'
import { X, Upload } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'

interface TicketFormProps {
  ticket?: MaintenanceTicket | null
  vendors: Vendor[]
  onClose: () => void
}

export default function TicketForm({ ticket, vendors, onClose }: TicketFormProps) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      alert('Please select a property first')
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

    if (ticket) {
      // Update: filter by id + property_id for security
      const { error } = await supabase
        .from('maintenance_tickets')
        .update(dataToSave)
        .eq('id', ticket.id)
        .eq('property_id', propertyId)

      if (!error) onClose()
    } else {
      // Insert: property_id included automatically
      const { error } = await supabase
        .from('maintenance_tickets')
        .insert([dataToSave])

      if (!error) onClose()
    }

    setLoading(false)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {ticket ? 'Edit Ticket' : 'New Maintenance Ticket'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
              placeholder="e.g., Fix leaking faucet"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room *
              </label>
              <select
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                {ROOMS.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'open' | 'in_progress' | 'done' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                {TICKET_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={formData.vendor_id}
                onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="">None</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
              placeholder="Additional details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo / Receipt
            </label>
            {photoUrl ? (
              <div className="space-y-2">
                <img src={photoUrl} alt="Upload" className="w-full h-48 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploading ? 'Uploading...' : 'Click to upload'}
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
              {loading ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
