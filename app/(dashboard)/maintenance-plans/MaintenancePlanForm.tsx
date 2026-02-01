'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenancePlan, Vendor } from '@/lib/types/database'
import { PRIORITIES, PRIORITY_LABELS } from '@/lib/constants'
import { X } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/lib/i18n/es'

interface MaintenancePlanFormProps {
  plan: MaintenancePlan | null
  vendors: Vendor[]
  onClose: () => void
}

export default function MaintenancePlanForm({ plan, vendors, onClose }: MaintenancePlanFormProps) {
  const [formData, setFormData] = useState({
    title: plan?.title || '',
    description: plan?.description || '',
    frequency_unit: plan?.frequency_unit || ('month' as 'day' | 'week' | 'month' | 'year'),
    frequency_interval: plan?.frequency_interval?.toString() || '1',
    start_date: plan?.start_date || new Date().toISOString().split('T')[0],
    vendor_id: plan?.vendor_id || '',
    estimated_cost: plan?.estimated_cost?.toString() || '',
    priority: plan?.priority || ('medium' as 'low' | 'medium' | 'high' | 'urgent'),
    is_active: plan?.is_active ?? true,
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

    const interval = parseInt(formData.frequency_interval)
    if (isNaN(interval) || interval <= 0) {
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

      // Calculate next_run_date using SQL function
      const { data: nextRunDate, error: nextDateError } = await supabase
        .rpc('calculate_next_run_date', {
          p_start_date: formData.start_date,
          p_frequency_unit: formData.frequency_unit,
          p_frequency_interval: interval,
          p_last_completed_date: null
        })

      if (nextDateError) {
        console.error('Error calculating next_run_date:', nextDateError)
        showToast('Error al calcular próxima fecha', 'error')
        setLoading(false)
        return
      }

      const dataToSave = {
        tenant_id: profile.tenant_id,
        property_id: propertyId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        frequency_unit: formData.frequency_unit,
        frequency_interval: interval,
        start_date: formData.start_date,
        next_run_date: nextRunDate || formData.start_date,
        vendor_id: formData.vendor_id || null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        priority: formData.priority,
        is_active: formData.is_active,
      }

      if (plan) {
        // Update
        const { error } = await supabase
          .from('maintenance_plans')
          .update(dataToSave)
          .eq('id', plan.id)
          .eq('property_id', propertyId)

        if (error) {
          console.error('Error updating plan:', error)
          showToast(t('maintenancePlans.saveError'), 'error')
        } else {
          showToast(t('maintenancePlans.planSaved'), 'success')
          onClose()
        }
      } else {
        // Insert
        const { error } = await supabase
          .from('maintenance_plans')
          .insert([dataToSave])

        if (error) {
          console.error('Error creating plan:', error)
          showToast(t('maintenancePlans.saveError'), 'error')
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

        <div>
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {t('maintenancePlans.planDescription')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-sm text-[#0F172A] placeholder-[#64748B] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            rows={3}
            placeholder="Descripción opcional del plan de mantenimiento"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <Input
          label={t('maintenancePlans.startDate')}
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          required
        />

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

          <Input
            label={t('maintenancePlans.estimatedCost')}
            type="number"
            min="0"
            step="0.01"
            value={formData.estimated_cost}
            onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-[#2563EB] border-[#E2E8F0] rounded focus:ring-[#2563EB]/30"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-[#0F172A]">
              {t('maintenancePlans.isActive')}
            </label>
          </div>
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

