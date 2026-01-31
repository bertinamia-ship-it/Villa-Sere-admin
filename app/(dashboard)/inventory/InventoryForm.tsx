'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InventoryItem } from '@/lib/types/database'
import { CATEGORIES, ROOMS } from '@/lib/constants'
import { X, Upload } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'

interface InventoryFormProps {
  item?: InventoryItem | null
  onClose: () => void
}

export default function InventoryForm({ item, onClose }: InventoryFormProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || CATEGORIES[0],
    location: item?.location || ROOMS[0],
    quantity: item?.quantity || 0,
    min_threshold: item?.min_threshold || 0,
    notes: item?.notes || '',
  })
  const [uploading, setUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(item?.photo_url || '')
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
      photo_url: photoUrl || null,
      created_by: user?.id,
      property_id: propertyId,
    }

    if (item) {
      // Update
      const { error } = await supabase
        .from('inventory_items')
        .update(dataToSave)
        .eq('id', item.id)
        .eq('property_id', propertyId)

      if (!error) {
        onClose()
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('inventory_items')
        .insert([dataToSave])

      if (!error) {
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
    const filePath = `inventory/${fileName}`

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
            {item ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
              placeholder="e.g., Dish Soap"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location/Room *
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              >
                {ROOMS.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Threshold
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
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
              placeholder="Additional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo
            </label>
            {photoUrl ? (
              <div className="space-y-2">
                <img src={photoUrl} alt="Item" className="w-full h-48 object-cover rounded-lg" />
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
                    {uploading ? 'Uploading...' : 'Click to upload photo'}
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
              {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
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
