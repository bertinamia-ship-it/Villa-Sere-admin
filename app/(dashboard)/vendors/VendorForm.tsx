'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vendor } from '@/lib/types/database'
import { X } from 'lucide-react'
import { getCurrentTenantId } from '@/lib/utils/tenant'
import { useI18n } from '@/components/I18nProvider'
import { useToast } from '@/components/ui/Toast'
import { useTrialGuard } from '@/hooks/useTrialGuard'

interface VendorFormProps {
  vendor?: Vendor | null
  onClose: () => void
}

export default function VendorForm({ vendor, onClose }: VendorFormProps) {
  const { t } = useI18n()
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
  const { canWrite, showTrialBlockedToast } = useTrialGuard()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check trial guard
    if (!canWrite) {
      showTrialBlockedToast()
      return
    }
    
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
        const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
        logError('VendorForm.fetchProfile', profileError)
        showToast(getUserFriendlyError(profileError, t), 'error')
        setLoading(false)
        return
      }

      if (!profile || !profile.tenant_id) {
        // Only log in dev - this is expected for some users
        if (process.env.NODE_ENV === 'development') {
          console.warn('[VendorForm] No profile or tenant_id found')
        }
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
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm safe-area-y">
      <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-t sm:border border-slate-200/60">
        <div className="sticky top-0 bg-white border-b border-slate-200/60 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between z-10 shrink-0 safe-area-top safe-area-x">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
            {vendor ? t('vendors.editVendor') : t('vendors.addVendor')}
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
              {t('vendors.companyName')} *
            </label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
              placeholder="ej. Fontanería ABC"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('vendors.specialty')}
            </label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
              placeholder="ej. Fontanería, Electricidad, Servicio de Piscina"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('vendors.phone')}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('vendors.whatsapp')}
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
                placeholder="+52 624 123 4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('vendors.email')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all min-h-[44px] sm:min-h-0"
              placeholder="contact@vendor.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t('vendors.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full border border-slate-200/60 rounded-lg px-3.5 sm:px-3 py-3 sm:py-2.5 text-base sm:text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              placeholder={t('vendors.notesPlaceholder')}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 border-t border-slate-200/60 safe-area-bottom">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-700 disabled:opacity-50 transition-all duration-300 min-h-[44px] justify-center"
            >
              {loading ? t('vendors.saving') : vendor ? t('vendors.updateVendor') : t('vendors.addVendor')}
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
