'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenancePlan, Vendor } from '@/lib/types/database'
import { PRIORITIES, PRIORITY_LABELS, MaintenanceTemplate } from '@/lib/constants'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/lib/i18n/es'

interface MaintenancePlanFormProps {
  plan: MaintenancePlan | null
  template?: MaintenanceTemplate | null
  vendors: Vendor[]
  onClose: () => void
}

export default function MaintenancePlanForm({ plan, template, vendors, onClose }: MaintenancePlanFormProps) {
  const [formData, setFormData] = useState({
    title: plan?.title || template?.title || '',
    next_run_date: plan?.next_run_date || new Date().toISOString().split('T')[0],
    is_recurrent: plan ? (plan.frequency_unit && plan.frequency_interval > 0) : (template ? true : false),
    frequency_unit: plan?.frequency_unit || template?.default_frequency_unit || ('month' as 'day' | 'week' | 'month' | 'year'),
    frequency_interval: plan?.frequency_interval?.toString() || template?.default_frequency_interval?.toString() || '1',
    vendor_id: plan?.vendor_id || '',
    priority: plan?.priority || template?.default_priority || ('medium' as 'low' | 'medium' | 'high' | 'urgent'),
    notes: plan?.description || template?.suggested_notes || '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast('Por favor selecciona una propiedad primero', 'error')
      setLoading(false)
      return
    }

    // Validations
    if (!formData.title.trim()) {
      showToast('El título es requerido', 'error')
      setLoading(false)
      return
    }

    if (!formData.next_run_date) {
      showToast('La próxima fecha es requerida', 'error')
      setLoading(false)
      return
    }

    const interval = formData.is_recurrent ? parseInt(formData.frequency_interval) : 0
    if (formData.is_recurrent && (isNaN(interval) || interval <= 0)) {
      showToast('El intervalo debe ser mayor que 0', 'error')
      setLoading(false)
      return
    }

    try {
      // Get tenant_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Error: Usuario no encontrado', 'error')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        showToast('Error: No se encontró tenant_id', 'error')
        setLoading(false)
        return
      }

      // Use next_run_date as start_date for calculation purposes
      const startDate = formData.next_run_date

      // If recurrent, ensure we have valid frequency_unit and frequency_interval
      if (formData.is_recurrent && (!formData.frequency_unit || interval <= 0)) {
        showToast('Para mantenimientos recurrentes, el intervalo debe ser mayor que 0', 'error')
        setLoading(false)
        return
      }

      // Prepare data (helpers will add tenant_id and property_id)
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.notes.trim() || null,
        frequency_unit: formData.is_recurrent ? formData.frequency_unit : null,
        frequency_interval: formData.is_recurrent ? interval : null,
        start_date: startDate,
        next_run_date: formData.next_run_date,
        vendor_id: formData.vendor_id || null,
        estimated_cost: null,
        priority: formData.priority,
        is_active: true,
      }

      // Use query helpers for security (client-side)
      const { insertWithPropertyClient, updateWithPropertyClient } = await import('@/lib/supabase/query-helpers-client')

      if (plan) {
        // Update using helper
        const { error } = await updateWithPropertyClient('maintenance_plans', plan.id, dataToSave)

        if (error) {
          console.error('Error updating plan:', error, {
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            code: (error as any)?.code,
            status: (error as any)?.status
          })
          const errorMsg = (error as any)?.message || t('maintenancePlans.saveError')
          showToast(errorMsg, 'error')
        } else {
          showToast(t('maintenancePlans.planSaved'), 'success')
          onClose()
        }
      } else {
        // Insert using helper
        const { error } = await insertWithPropertyClient('maintenance_plans', dataToSave)

        if (error) {
          console.error('Error creating plan:', error, {
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            code: (error as any)?.code,
            status: (error as any)?.status
          })
          const errorMsg = (error as any)?.message || t('maintenancePlans.saveError')
          showToast(errorMsg, 'error')
        } else {
          showToast(t('maintenancePlans.planSaved'), 'success')
          onClose()
        }
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      showToast(t('maintenancePlans.saveError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={plan ? t('maintenancePlans.editPlan') : t('maintenancePlans.createPlan')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('maintenancePlans.planTitle')}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="ej. Limpieza de piscina"
          required
        />

        <Input
          label={t('maintenancePlans.nextRunDate')}
          type="date"
          value={formData.next_run_date}
          onChange={(e) => setFormData({ ...formData, next_run_date: e.target.value })}
          required
        />

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="is_recurrent"
            checked={formData.is_recurrent}
            onChange={(e) => setFormData({ ...formData, is_recurrent: e.target.checked })}
            className="h-4 w-4 text-[#2563EB] border-[#E2E8F0] rounded focus:ring-[#2563EB]/30"
          />
          <label htmlFor="is_recurrent" className="text-sm font-medium text-[#0F172A]">
            {t('maintenancePlans.repeat')}
          </label>
        </div>

        {formData.is_recurrent && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div>
              <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                {t('maintenancePlans.frequencyInterval')}
              </label>
              <input
                type="number"
                min="1"
                value={formData.frequency_interval}
                onChange={(e) => setFormData({ ...formData, frequency_interval: e.target.value })}
                className="w-full px-3 py-2 text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                {t('maintenancePlans.frequencyUnit')}
              </label>
              <select
                value={formData.frequency_unit}
                onChange={(e) => setFormData({ ...formData, frequency_unit: e.target.value as 'day' | 'week' | 'month' | 'year' })}
                className="w-full px-3 py-2 text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
              >
                <option value="day">{t('maintenancePlans.frequencyUnitOptions.day')}</option>
                <option value="week">{t('maintenancePlans.frequencyUnitOptions.week')}</option>
                <option value="month">{t('maintenancePlans.frequencyUnitOptions.month')}</option>
                <option value="year">{t('maintenancePlans.frequencyUnitOptions.year')}</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
              {t('maintenancePlans.vendorOptional')}
            </label>
            <select
              value={formData.vendor_id}
              onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
              className="w-full px-3 py-2 text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              <option value="">{t('maintenancePlans.vendorOptional')}</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
              {t('maintenancePlans.priority')}
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
              className="w-full px-3 py-2 text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {t('maintenancePlans.notes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 text-sm text-[#0F172A] placeholder-[#64748B] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            rows={3}
            placeholder="Notas opcionales"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="flex-1"
          >
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
