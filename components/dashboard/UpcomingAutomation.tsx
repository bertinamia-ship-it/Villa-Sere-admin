'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/lib/types/database'
import { PRIORITY_LABELS } from '@/lib/constants'
import { CheckCircle2, Calendar, Wrench, CheckSquare, ArrowRight } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import { t } from '@/lib/i18n/es'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  done: 'Hecho',
}

interface UpcomingMaintenancePlan {
  id: string
  title: string
  next_run_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_active: boolean
  start_date: string
  frequency_unit: 'day' | 'week' | 'month' | 'year'
  frequency_interval: number
}

interface UpcomingMaintenancePlansProps {
  plans: UpcomingMaintenancePlan[]
}

export function UpcomingMaintenancePlans({ plans }: UpcomingMaintenancePlansProps) {
  const [completingPlanId, setCompletingPlanId] = useState<string | null>(null)
  const supabase = createClient()
  const { showToast } = useToast()

  const handleMarkCompleted = async (plan: UpcomingMaintenancePlan) => {
    setCompletingPlanId(plan.id)
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast('Por favor selecciona una propiedad primero', 'error')
      setCompletingPlanId(null)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!profile?.tenant_id) {
        showToast('Error: No se encontró tenant_id', 'error')
        setCompletingPlanId(null)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      // Calculate next_run_date
      const { data: nextDateResult, error: nextDateError } = await supabase
        .rpc('calculate_next_run_date', {
          p_start_date: plan.start_date,
          p_frequency_unit: plan.frequency_unit,
          p_frequency_interval: plan.frequency_interval,
          p_last_completed_date: today
        })

      if (nextDateError) {
        console.error('Error calculating next_run_date:', nextDateError)
        showToast('Error al calcular próxima fecha', 'error')
        setCompletingPlanId(null)
        return
      }

      const nextRunDate = nextDateResult || today

      // Create run record
      await supabase
        .from('maintenance_plan_runs')
        .insert({
          tenant_id: profile.tenant_id,
          property_id: propertyId,
          plan_id: plan.id,
          scheduled_date: plan.next_run_date,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })

      // Update plan
      const { error } = await supabase
        .from('maintenance_plans')
        .update({
          last_completed_date: today,
          next_run_date: nextRunDate,
        })
        .eq('id', plan.id)
        .eq('property_id', propertyId)

      if (error) {
        console.error('Error updating plan:', error)
        showToast(t('maintenancePlans.completeError'), 'error')
      } else {
        showToast(t('maintenancePlans.planCompleted'), 'success')
        // Dispatch propertyChanged event to trigger refresh in parent
        window.dispatchEvent(new CustomEvent('propertyChanged'))
        // Refresh page after a short delay to show updated data
        setTimeout(() => {
          window.location.reload()
        }, 800)
      }
    } catch (error) {
      console.error('Error completing plan:', error)
      showToast(t('maintenancePlans.completeError'), 'error')
    } finally {
      setCompletingPlanId(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-[#EF4444] bg-[#EF4444]/10'
      case 'high': return 'text-[#F59E0B] bg-[#F59E0B]/10'
      case 'medium': return 'text-[#2563EB] bg-[#2563EB]/10'
      case 'low': return 'text-[#10B981] bg-[#10B981]/10'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  return (
    <div className="space-y-2">
      {plans.length > 0 ? (
        <>
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200/60 hover:bg-gray-50/50 transition-all duration-200"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#0F172A] truncate">{plan.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">{formatDate(plan.next_run_date)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPriorityColor(plan.priority)}`}>
                    {PRIORITY_LABELS[plan.priority]}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMarkCompleted(plan)}
                disabled={completingPlanId === plan.id}
                loading={completingPlanId === plan.id}
                className="shrink-0"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Link href="/maintenance-plans" className="block pt-2">
            <Button size="sm" variant="ghost" className="w-full text-xs">
              {t('dashboard.viewAll')}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </>
      ) : (
        <div className="text-center py-4 text-slate-500">
          <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-xs mb-2">No hay mantenimientos próximos</p>
          <Link href="/maintenance-plans">
            <Button size="sm" variant="ghost" className="text-xs">
              {t('maintenancePlans.createPlan')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

interface UpcomingTask {
  id: string
  title: string
  next_due_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'done'
  cadence: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
}

interface UpcomingTasksProps {
  tasks: UpcomingTask[]
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const supabase = createClient()
  const { showToast } = useToast()

  const handleMarkDone = async (task: UpcomingTask) => {
    setCompletingTaskId(task.id)
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast('Por favor selecciona una propiedad primero', 'error')
      setCompletingTaskId(null)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!profile?.tenant_id) {
        showToast('Error: No se encontró tenant_id', 'error')
        setCompletingTaskId(null)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      if (task.cadence === 'once') {
        // Once: just mark as done
        const { error } = await supabase
          .from('tasks')
          .update({
            status: 'done',
            last_completed_date: today,
          })
          .eq('id', task.id)
          .eq('property_id', propertyId)

        if (error) {
          console.error('Error updating task:', error)
          showToast(t('tasks.completeError'), 'error')
        } else {
          showToast(t('tasks.taskCompleted'), 'success')
          // Dispatch propertyChanged event to trigger refresh in parent
          window.dispatchEvent(new CustomEvent('propertyChanged'))
          // Refresh page after a short delay to show updated data
          setTimeout(() => {
            window.location.reload()
          }, 800)
        }
      } else {
        // Recurrent: calculate next_due_date
        const { data: nextDateResult, error: nextDateError } = await supabase
          .rpc('calculate_next_due_date', {
            p_cadence: task.cadence,
            p_last_completed_date: today,
            p_current_due_date: task.next_due_date
          })

        if (nextDateError) {
          console.error('Error calculating next_due_date:', nextDateError)
          showToast('Error al calcular próxima fecha', 'error')
          setCompletingTaskId(null)
          return
        }

        const nextDueDate = nextDateResult || today

        const { error } = await supabase
          .from('tasks')
          .update({
            last_completed_date: today,
            next_due_date: nextDueDate,
            status: 'pending',
          })
          .eq('id', task.id)
          .eq('property_id', propertyId)

        if (error) {
          console.error('Error updating task:', error)
          showToast(t('tasks.completeError'), 'error')
        } else {
          showToast(t('tasks.taskCompleted'), 'success')
          // Dispatch propertyChanged event to trigger refresh in parent
          window.dispatchEvent(new CustomEvent('propertyChanged'))
          // Refresh page after a short delay to show updated data
          setTimeout(() => {
            window.location.reload()
          }, 800)
        }
      }
    } catch (error) {
      console.error('Error completing task:', error)
      showToast(t('tasks.completeError'), 'error')
    } finally {
      setCompletingTaskId(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-[#EF4444] bg-[#EF4444]/10'
      case 'high': return 'text-[#F59E0B] bg-[#F59E0B]/10'
      case 'medium': return 'text-[#2563EB] bg-[#2563EB]/10'
      case 'low': return 'text-[#10B981] bg-[#10B981]/10'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-[#10B981] bg-[#10B981]/10'
      case 'in_progress': return 'text-[#2563EB] bg-[#2563EB]/10'
      case 'pending': return 'text-slate-600 bg-slate-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  return (
    <div className="space-y-2">
      {tasks.length > 0 ? (
        <>
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200/60 hover:bg-gray-50/50 transition-all duration-200"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#0F172A] truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">{formatDate(task.next_due_date)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getPriorityColor(task.priority)}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(task.status)}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMarkDone(task)}
                disabled={completingTaskId === task.id}
                loading={completingTaskId === task.id}
                className="shrink-0"
              >
                <CheckSquare className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Link href="/tasks" className="block pt-2">
            <Button size="sm" variant="ghost" className="w-full text-xs">
              {t('dashboard.viewAll')}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </>
      ) : (
        <div className="text-center py-4 text-slate-500">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-xs mb-2">No hay tareas próximas</p>
          <Link href="/tasks">
            <Button size="sm" variant="ghost" className="text-xs">
              {t('tasks.createTask')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

