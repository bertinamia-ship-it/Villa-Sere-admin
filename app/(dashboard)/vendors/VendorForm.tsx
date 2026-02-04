'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vendor } from '@/lib/types/database'
import { X } from 'lucide-react'
import { getCurrentTenantId } from '@/lib/utils/tenant'
import { t } from '@/lib/i18n/es'
import { useToast } from '@/components/ui/Toast'

interface VendorFormProps {
  vendor?: Vendor | null
  onClose: () => void
}

export default function VendorForm({ vendor, onClose }: VendorFormProps) {
  const [formData, setFormData] = useState({
    company_name: vendor?.company_name || '',
    specialty: vendor?.specialty || '',
    phone: vendor?.phone || '',
    whatsapp: vendor?.whatsapp || '',
    email: vendor?.email || '',
    notes: vendor?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get tenant_id (vendors are shared by tenant, not by property)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('[VendorForm] Error fetching profile:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
        logError('VendorForm.fetchProfile', profileError)
        showToast(getUserFriendlyError(profileError), 'error')
        setLoading(false)
        return
      }

      if (!profile || !profile.tenant_id) {
        console.error('[VendorForm] No profile or tenant_id found')
        showToast(t('errors.tenantRequired'), 'error')
        setLoading(false)
        return
      }

      const dataToSave = {
        ...formData,
        created_by: user.id,
        tenant_id: profile.tenant_id,
      }

      if (vendor) {
        // Update: filter by id + tenant_id for security
        const { error } = await supabase
          .from('vendors')
          .update(dataToSave)
          .eq('id', vendor.id)
          .eq('tenant_id', profile.tenant_id)

        if (error) {
          const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
          logError('VendorForm.update', error)
          showToast(getUserFriendlyError(error), 'error')
        } else {
          showToast(t('vendors.vendorSaved'), 'success')
          onClose()
        }
      } else {
        // Insert: include tenant_id (vendors shared across all properties in tenant)
        const { error } = await supabase
          .from('vendors')
          .insert([dataToSave])

        if (error) {
          const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
          logError('VendorForm.insert', error)
          showToast(getUserFriendlyError(error), 'error')
        } else {
          showToast(t('vendors.vendorSaved'), 'success')
          onClose()
        }
      }
    } catch (error) {
      const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
      logError('VendorForm.save', error)
      showToast(getUserFriendlyError(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {vendor ? t('vendors.editVendor') : t('vendors.addVendor')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa/Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
              placeholder="ej. Fontanería ABC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('vendors.specialty')}
            </label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
              placeholder="ej. Fontanería, Electricidad, Servicio de Piscina"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
                placeholder="+52 624 123 4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
              placeholder="contact@vendor.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400"
              placeholder="Notas adicionales sobre este proveedor..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? t('vendors.saving') : vendor ? t('vendors.updateVendor') : t('vendors.addVendor')}
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
