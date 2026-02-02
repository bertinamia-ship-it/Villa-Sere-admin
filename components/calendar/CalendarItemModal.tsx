'use client'

import { CalendarItem } from './types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { useToast } from '@/components/ui/Toast'
import { t } from '@/lib/i18n/es'
import { Wrench, CheckSquare, Calendar as CalendarIcon, ExternalLink } from 'lucide-react'

interface CalendarItemModalProps {
  item: CalendarItem | null
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function CalendarItemModal({ item, isOpen, onClose, onRefresh }: CalendarItemModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  if (!item) return null

  const handleMarkPlanDone = async () => {
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('calendar.noPropertySelected'), 'error')
        return
      }

      const today = new Date().toISOString().split('T')[0]
      
      // Update last_completed_date and recalculate next_run_date
      const { error } = await supabase
        .from('maintenance_plans')
        .update({
          last_completed_date: today,
          next_run_date: calculateNextRunDate(item.meta)
        })
        .eq('id', item.id)
        .eq('property_id', propertyId)

      if (error) throw error

      showToast(t('maintenancePlans.planCompleted'), 'success')
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Error marking plan as done:', error)
      showToast(t('maintenancePlans.completeError'), 'error')
    }
  }

  const handleMarkTaskDone = async () => {
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('calendar.noPropertySelected'), 'error')
        return
      }

      const today = new Date().toISOString().split('T')[0]
      
      if (item.meta?.cadence === 'once') {
        // Mark as done
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'done',
            last_completed_date: today
          })
          .eq('id', item.id)
          .eq('property_id', propertyId)
        
        if (error) throw error
      } else {
        // Recurrent: update last_completed_date and recalculate next_due_date
        const { error } = await supabase
          .from('tasks')
          .update({
            last_completed_date: today,
            next_due_date: calculateNextDueDate(item.meta)
          })
          .eq('id', item.id)
          .eq('property_id', propertyId)
        
        if (error) throw error
      }

      showToast(t('tasks.taskCompleted'), 'success')
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Error marking task as done:', error)
      showToast(t('tasks.completeError'), 'error')
    }
  }

  const handleCreateTicket = async () => {
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('calendar.noPropertySelected'), 'error')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) return

      // Create ticket from plan
      const { error } = await supabase
        .from('maintenance_tickets')
        .insert({
          property_id: propertyId,
          tenant_id: profile.tenant_id,
          title: item.title,
          vendor_id: item.meta?.vendor_id || null,
          priority: item.priority || 'medium',
          date: new Date().toISOString().split('T')[0],
          status: 'open'
        })

      if (error) throw error

      showToast(t('maintenancePlans.ticketCreated'), 'success')
      router.push('/maintenance')
    } catch (error) {
      console.error('Error creating ticket:', error)
      showToast(t('maintenancePlans.completeError'), 'error')
    }
  }

  function calculateNextRunDate(plan: any): string {
    if (!plan?.frequency_unit || !plan?.frequency_interval) {
      return new Date().toISOString().split('T')[0]
    }

    const today = new Date()
    const next = new Date(today)

    switch (plan.frequency_unit) {
      case 'day':
        next.setDate(today.getDate() + plan.frequency_interval)
        break
      case 'week':
        next.setDate(today.getDate() + (plan.frequency_interval * 7))
        break
      case 'month':
        next.setMonth(today.getMonth() + plan.frequency_interval)
        break
      case 'year':
        next.setFullYear(today.getFullYear() + plan.frequency_interval)
        break
    }

    return next.toISOString().split('T')[0]
  }

  function calculateNextDueDate(task: any): string {
    if (!task?.cadence) {
      return new Date().toISOString().split('T')[0]
    }

    const today = new Date()
    const next = new Date(today)

    switch (task.cadence) {
      case 'daily':
        next.setDate(today.getDate() + 1)
        break
      case 'weekly':
        next.setDate(today.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(today.getMonth() + 1)
        break
      case 'yearly':
        next.setFullYear(today.getFullYear() + 1)
        break
    }

    return next.toISOString().split('T')[0]
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.title}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[#64748B] mb-2">
            {item.type === 'booking' && t('calendar.viewBooking')}
            {item.type === 'plan' && t('calendar.viewPlan')}
            {item.type === 'task' && t('calendar.viewTask')}
          </p>
          {item.subtitle && (
            <p className="text-base font-semibold text-[#0F172A]">{item.subtitle}</p>
          )}
          <p className="text-xs text-[#64748B] mt-1">
            {new Date(item.dateStart).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {item.type === 'booking' && (
            <Button
              variant="secondary"
              onClick={() => {
                router.push(`/rentals`)
                onClose()
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('calendar.viewBooking')}
            </Button>
          )}

          {item.type === 'plan' && (
            <>
              <Button
                variant="secondary"
                onClick={handleCreateTicket}
              >
                <Wrench className="h-4 w-4 mr-2" />
                {t('calendar.createTicket')}
              </Button>
              <Button
                onClick={handleMarkPlanDone}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {t('calendar.markDone')}
              </Button>
            </>
          )}

          {item.type === 'task' && (
            <>
              <Button
                onClick={handleMarkTaskDone}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {t('calendar.markDone')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  router.push(`/tasks`)
                  onClose()
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t('calendar.edit')}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

