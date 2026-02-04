'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/lib/types/database'
import { PRIORITIES, PRIORITY_LABELS } from '@/lib/constants'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/lib/i18n/es'

const getStatusLabel = (status: string): string => {
  return t(`tasks.statusLabels.${status}`)
}

const CADENCE_OPTIONS = [
  { value: 'once', label: t('tasks.cadence.once') },
  { value: 'daily', label: t('tasks.cadence.daily') },
  { value: 'weekly', label: t('tasks.cadence.weekly') },
  { value: 'monthly', label: t('tasks.cadence.monthly') },
  { value: 'yearly', label: t('tasks.cadence.yearly') },
]

interface TaskFormProps {
  task: Task | null
  onClose: () => void
}

export default function TaskForm({ task, onClose }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    cadence: task?.cadence || ('once' as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'),
    due_date: task?.due_date || '',
    start_date: task?.next_due_date || new Date().toISOString().split('T')[0],
    priority: task?.priority || ('medium' as 'low' | 'medium' | 'high' | 'urgent'),
    status: task?.status || ('pending' as 'pending' | 'in_progress' | 'done'),
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

    if (formData.cadence === 'once' && !formData.due_date) {
      showToast('La fecha es requerida para tareas de una vez', 'error')
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

      // Calculate next_due_date using centralized helper
      const { calculateNextDueDate } = await import('@/lib/utils/date-calculations')
      
      let nextDueDate: string

      if (formData.cadence === 'once') {
        // Once: use due_date
        if (!formData.due_date) {
          showToast('La fecha de vencimiento es requerida para tareas de una vez', 'error')
          setLoading(false)
          return
        }
        nextDueDate = formData.due_date
      } else {
        // Recurrent: calculate using helper
        if (!formData.start_date) {
          showToast('La fecha de inicio es requerida para tareas recurrentes', 'error')
          setLoading(false)
          return
        }
        nextDueDate = calculateNextDueDate(formData.cadence, formData.start_date, null)
      }

      // Validate interval/frequency for recurrent tasks
      if (formData.cadence !== 'once' && !formData.start_date) {
        showToast('La fecha de inicio es requerida para tareas recurrentes', 'error')
        setLoading(false)
        return
      }

      // Prepare data (helpers will add tenant_id and property_id)
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        cadence: formData.cadence,
        due_date: formData.cadence === 'once' ? formData.due_date : null,
        next_due_date: nextDueDate,
        priority: formData.priority,
        status: formData.status,
      }

      // Use query helpers for security (client-side)
      const { insertWithPropertyClient, updateWithPropertyClient } = await import('@/lib/supabase/query-helpers-client')

      if (task) {
        // Update using helper
        const { error } = await updateWithPropertyClient('tasks', task.id, dataToSave)

        if (error) {
          console.error('Error updating task:', error, {
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            code: (error as any)?.code,
            status: (error as any)?.status
          })
          const errorMsg = (error as any)?.message || t('tasks.saveError')
          showToast(errorMsg, 'error')
        } else {
          showToast(t('tasks.taskSaved'), 'success')
          onClose()
        }
      } else {
        // Insert using helper
        const { error } = await insertWithPropertyClient('tasks', dataToSave)

        if (error) {
          console.error('Error creating task:', error, {
            message: (error as any)?.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            code: (error as any)?.code,
            status: (error as any)?.status
          })
          const errorMsg = (error as any)?.message || t('tasks.saveError')
          showToast(errorMsg, 'error')
        } else {
          showToast(t('tasks.taskSaved'), 'success')
          onClose()
        }
      }
    } catch (error) {
      console.error('Error saving task:', error)
      showToast(t('tasks.saveError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={task ? t('tasks.editTask') : t('tasks.createTask')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('tasks.taskTitle')}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="ej. Revisar filtro de piscina"
          required
        />

        <div>
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {t('tasks.taskDescription')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 text-sm text-[#0F172A] placeholder-[#64748B] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            rows={3}
            placeholder="Descripción opcional de la tarea"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
            {t('tasks.taskType')} *
          </label>
          <select
            value={formData.cadence}
            onChange={(e) => setFormData({ ...formData, cadence: e.target.value as 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' })}
            className="w-full px-3 py-2 text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            required
          >
            {CADENCE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {formData.cadence === 'once' ? (
          <Input
            label={t('tasks.dueDate')}
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            required
          />
        ) : (
          <Input
            label={t('tasks.startDate')}
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
              {t('tasks.priority')}
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

          <div>
            <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
              {t('tasks.status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pending' | 'in_progress' | 'done' })}
              className="w-full px-3 py-2 text-sm text-[#0F172A] bg-white border border-[#E2E8F0] rounded-md focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
            >
              {(['pending', 'in_progress', 'done'] as const).map((status) => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
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

