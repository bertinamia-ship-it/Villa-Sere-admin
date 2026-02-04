'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/lib/types/database'
import { PRIORITIES, PRIORITY_LABELS } from '@/lib/constants'
import { Plus, CheckSquare, Edit, Trash2, AlertCircle, Calendar } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import TaskForm from './TaskForm'
import { t } from '@/lib/i18n/es'

type FilterType = 'today' | 'week' | 'overdue' | 'all'
type TaskStatus = 'pending' | 'in_progress' | 'done'

const getStatusLabel = (status: TaskStatus): string => {
  return t(`tasks.statusLabels.${status}`)
}

const getCadenceLabel = (cadence: string): string => {
  return t(`tasks.cadence.${cadence}`) || cadence
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [hasProperty, setHasProperty] = useState(true)
  const [filter, setFilter] = useState<FilterType>('today')
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string | null }>({ isOpen: false, taskId: null })
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const supabase = createClient()
  const { showToast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    const propertyId = await getActivePropertyId()
    
    if (!propertyId) {
      setTasks([])
      setHasProperty(false)
      setLoading(false)
      return
    }

    setHasProperty(true)
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('property_id', propertyId)
      .order('next_due_date', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      showToast('Error al cargar tareas', 'error')
    } else {
      setTasks(data || [])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    
    const handlePropertyChange = () => {
      fetchData()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const getFilteredTasks = (): Task[] => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    switch (filter) {
      case 'today':
        return tasks.filter(task => {
          const dueDate = new Date(task.next_due_date)
          return dueDate <= today && task.status !== 'done'
        })
      case 'week':
        return tasks.filter(task => {
          const dueDate = new Date(task.next_due_date)
          return dueDate <= weekEnd && dueDate >= today && task.status !== 'done'
        })
      case 'overdue':
        return tasks.filter(task => {
          const dueDate = new Date(task.next_due_date)
          return dueDate < today && task.status !== 'done'
        }).sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())
      case 'all':
      default:
        return tasks
    }
  }

  const handleMarkDone = async (taskId: string) => {
    setCompletingTaskId(taskId)
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast('Por favor selecciona una propiedad primero', 'error')
      setCompletingTaskId(null)
      return
    }

    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      setCompletingTaskId(null)
      return
    }

    try {
      // Get tenant_id
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
          .eq('id', taskId)
          .eq('property_id', propertyId)

        if (error) {
          console.error('Error updating task:', error)
          showToast(t('tasks.completeError'), 'error')
        } else {
          showToast(t('tasks.taskCompleted'), 'success')
          fetchData()
        }
      } else {
        // Recurrent: calculate next_due_date using centralized helper
        const { calculateNextDueDate } = await import('@/lib/utils/date-calculations')
        const nextDueDate = calculateNextDueDate(task.cadence, task.next_due_date, today)

        // Use updateWithProperty helper for security (client-side)
        const { updateWithPropertyClient } = await import('@/lib/supabase/query-helpers-client')
        const { error } = await updateWithPropertyClient('tasks', taskId, {
          last_completed_date: today,
          next_due_date: nextDueDate,
          status: 'pending', // Reset to pending for next cycle
        })

        if (error) {
          console.error('Error updating task:', error)
          showToast(t('tasks.completeError'), 'error')
        } else {
          showToast(t('tasks.taskCompleted'), 'success')
          fetchData()
        }
      }
    } catch (error) {
      console.error('Error completing task:', error)
      showToast(t('tasks.completeError'), 'error')
    } finally {
      setCompletingTaskId(null)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const propertyId = await getActivePropertyId()
    if (!propertyId) return

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
      .eq('property_id', propertyId)

    if (!error) {
      fetchData()
    } else {
      showToast('Error al actualizar estado', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.taskId) return

    const propertyId = await getActivePropertyId()
    if (!propertyId) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', deleteConfirm.taskId)
      .eq('property_id', propertyId)

    if (!error) {
      showToast(t('tasks.taskDeleted'), 'success')
      setTasks(tasks.filter(t => t.id !== deleteConfirm.taskId))
    } else {
      showToast(t('tasks.deleteError'), 'error')
    }

    setDeleteConfirm({ isOpen: false, taskId: null })
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTask(null)
    fetchData()
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

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done': return 'text-[#10B981] bg-[#10B981]/10'
      case 'in_progress': return 'text-[#2563EB] bg-[#2563EB]/10'
      case 'pending': return 'text-slate-600 bg-slate-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  const formatDate = (date: string) => {
    // Use local date to avoid timezone issues
    const localDate = new Date(date + 'T00:00:00')
    return localDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isOverdue = (dueDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    return due < today
  }

  const filteredTasks = getFilteredTasks()

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{t('tasks.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1.5">{t('tasks.subtitle')}</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton variant="rectangular" height={100} className="rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{t('tasks.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1.5">{t('tasks.subtitle')}</p>
        </div>
        <Card padding="lg">
          <EmptyState
            icon={<AlertCircle className="h-14 w-14" />}
            title={t('tasks.noPropertySelected')}
            description={t('tasks.selectOrCreatePropertyTasks')}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A] tracking-tight">{t('tasks.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1.5">{t('tasks.subtitle')}</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          disabled={!hasProperty}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          {t('tasks.createTask')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1 border-b border-[#E2E8F0]">
        {(['today', 'week', 'overdue', 'all'] as FilterType[]).map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
              filter === filterType
                ? 'border-[#0F172A] text-[#0F172A]'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t(`tasks.filters.${filterType}`)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<CheckSquare className="h-14 w-14" />}
            title={tasks.length === 0 ? t('tasks.emptyTitle') : t('tasks.noTasks')}
            description={tasks.length === 0 ? t('tasks.emptyDescription') : t('tasks.tryDifferentFilters')}
            actionLabel={tasks.length === 0 ? t('tasks.emptyAction') : undefined}
            onAction={tasks.length === 0 ? () => setShowForm(true) : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <Card key={task.id} padding="md" className="hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base font-semibold text-[#0F172A]">{task.title}</h3>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-[#64748B] mb-3 leading-relaxed">{task.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className={isOverdue(task.next_due_date) && task.status !== 'done' ? 'text-[#EF4444] font-medium' : ''}>
                        {formatDate(task.next_due_date)}
                      </span>
                    </div>
                    <span className="text-[#CBD5E1]">•</span>
                    <span>{getCadenceLabel(task.cadence)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {task.status !== 'done' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleMarkDone(task.id)}
                      disabled={completingTaskId === task.id}
                      loading={completingTaskId === task.id}
                    >
                      <CheckSquare className="h-4 w-4" />
                      {t('tasks.markCompleted')}
                    </Button>
                  )}
                  
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                    className="px-2.5 py-1.5 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all text-[#0F172A]"
                  >
                    {(['pending', 'in_progress', 'done'] as TaskStatus[]).map((status) => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteConfirm({ isOpen: true, taskId: task.id })}
                  >
                    <Trash2 className="h-4 w-4 text-[#EF4444]" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={handleFormClose}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, taskId: null })}
        onConfirm={handleDelete}
        title={t('tasks.delete')}
        message="¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText={t('tasks.delete')}
        variant="danger"
      />
    </div>
  )
}

