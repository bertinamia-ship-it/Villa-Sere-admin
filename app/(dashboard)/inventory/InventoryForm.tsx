'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InventoryItem } from '@/lib/types/database'
import { CATEGORIES, ROOMS } from '@/lib/constants'
import { X, Upload } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/components/I18nProvider'
import { useTrialGuard } from '@/hooks/useTrialGuard'

interface InventoryFormProps {
  item?: InventoryItem | null
  onClose: () => void
}

export default function InventoryForm({ item, onClose }: InventoryFormProps) {
  const { t } = useI18n()
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
  const { showToast } = useToast()
  const { canWrite, showTrialBlockedToast } = useTrialGuard()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check trial guard
    if (!canWrite) {
      showTrialBlockedToast()
      return
    }
    
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

      if (error) {
        const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
        logError('InventoryForm.update', error)
        showToast(getUserFriendlyError(error, t), 'error')
      } else {
        onClose()
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('inventory_items')
        .insert([dataToSave])

      if (error) {
        const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
        logError('InventoryForm.insert', error)
        showToast(getUserFriendlyError(error, t), 'error')
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
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm safe-area-y">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-t sm:border border-slate-200/60">
        <div className="sticky top-0 bg-white border-b border-slate-200/60 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between z-10 shrink-0 safe-area-top safe-area-x">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            {item ? t('inventory.editItem') : t('inventory.addItem')}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-900 transition-colors p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 space-y-4 safe-area-x safe-area-bottom">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('inventory.name')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
              placeholder="ej. Detergente"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('inventory.category')} *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('inventory.location')} *
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
              >
                {ROOMS.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('inventory.quantity')} *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('inventory.minThreshold')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 0 })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('inventory.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              placeholder={t('inventory.notesPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('inventory.photo')}
            </label>
            {photoUrl ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Item" className="w-full h-48 object-cover rounded-lg" loading="lazy" decoding="async" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="text-sm text-red-600 hover:text-red-700 min-h-[44px] px-3"
                >
                  {t('inventory.removePhoto')}
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    {uploading ? t('common.uploading') : t('inventory.uploadPhoto')}
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
              className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 disabled:opacity-50 transition-all duration-300 min-h-[44px] justify-center"
            >
              {loading ? t('common.saving') : item ? t('inventory.updateItem') : t('inventory.addItem')}
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
