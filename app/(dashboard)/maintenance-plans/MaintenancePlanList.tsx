'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenancePlan, Vendor } from '@/lib/types/database'
import { PRIORITIES, PRIORITY_LABELS, MAINTENANCE_TEMPLATES, MaintenanceTemplate } from '@/lib/constants'
import { Plus, Calendar, CheckCircle2, Edit, Trash2, Power, PowerOff, AlertCircle, Wrench, ExternalLink, FileText, CalendarCheck } from 'lucide-react'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import MaintenancePlanForm from './MaintenancePlanForm'
import { t } from '@/lib/i18n/es'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

type TabType = 'pending' | 'all'

export default function MaintenancePlanList() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [hasProperty, setHasProperty] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [showForm, setShowForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null)
  const [templateData, setTemplateData] = useState<MaintenanceTemplate | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; planId: string | null }>({ isOpen: false, planId: null })
  const [completingPlanId, setCompletingPlanId] = useState<string | null>(null)
  const [creatingTicketPlanId, setCreatingTicketPlanId] = useState<string | null>(null)
  const supabase = createClient()
  const { showToast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  const fetchData = async () => {
    setLoading(true)
    const propertyId = await getActivePropertyId()
    
    if (!propertyId) {
      setPlans([])
      setVendors([])
      setHasProperty(false)
      setLoading(false)
      return
    }

    setHasProperty(true)
    
    // Get tenant_id for vendors
    const { data: { user } } = await supabase.auth.getUser()
    let tenantId: string | null = null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()
      
      tenantId = profile?.tenant_id || null
    }
    
    // Fetch plans and vendors
    const [plansResult, vendorsResult] = await Promise.all([
      supabase
        .from('maintenance_plans')
        .select('*')
        .eq('property_id', propertyId)
        .order('next_run_date', { ascending: true }),
      tenantId
        ? supabase.from('vendors').select('*').eq('tenant_id', tenantId).order('company_name')
        : { data: [], error: null }
    ])

    if (plansResult.data) setPlans(plansResult.data)
    if (vendorsResult.data) setVendors(vendorsResult.data)
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

  // Filter plans based on active tab
  const getFilteredPlans = (): MaintenancePlan[] => {
    if (activeTab === 'all') {
      return plans
    }
    
    // Pending: active plans with next_run_date <= today + 60 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 60)
    
    return plans.filter(plan => {
      if (!plan.is_active) return false
      const nextRun = new Date(plan.next_run_date + 'T00:00:00')
      nextRun.setHours(0, 0, 0, 0)
      return nextRun <= futureDate
    })
  }

  const getDateStatus = (nextRunDate: string): 'overdue' | 'upcoming' | 'future' => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextRun = new Date(nextRunDate + 'T00:00:00')
    nextRun.setHours(0, 0, 0, 0)
    
    if (nextRun < today) return 'overdue'
    if (nextRun <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'upcoming'
    return 'future'
  }

  const handleMarkCompleted = async (planId: string) => {
    setCompletingPlanId(planId)
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast('Por favor selecciona una propiedad primero', 'error')
      setCompletingPlanId(null)
      return
    }

    const plan = plans.find(p => p.id === planId)
    if (!plan) {
      setCompletingPlanId(null)
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
        setCompletingPlanId(null)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      // Check if plan is recurrent (has frequency)
      const isRecurrent = plan.frequency_unit && plan.frequency_interval > 0

      let nextRunDate: string
      let shouldDeactivate = false

      if (isRecurrent) {
        // Calculate next_run_date using SQL function
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

        nextRunDate = nextDateResult || today
      } else {
        // Not recurrent: deactivate
        nextRunDate = plan.next_run_date
        shouldDeactivate = true
      }

      // Create run record
      const { error: runError } = await supabase
        .from('maintenance_plan_runs')
        .insert({
          tenant_id: profile.tenant_id,
          property_id: propertyId,
          plan_id: planId,
          scheduled_date: plan.next_run_date,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })

      if (runError) {
        console.error('Error creating run:', runError)
        showToast(t('maintenancePlans.completeError'), 'error')
        setCompletingPlanId(null)
        return
      }

      // Update plan
      const { error: updateError } = await supabase
        .from('maintenance_plans')
        .update({
          last_completed_date: today,
          next_run_date: nextRunDate,
          is_active: shouldDeactivate ? false : plan.is_active,
        })
        .eq('id', planId)
        .eq('property_id', propertyId)

      if (updateError) {
        console.error('Error updating plan:', updateError)
        showToast(t('maintenancePlans.completeError'), 'error')
        setCompletingPlanId(null)
        return
      }

      if (shouldDeactivate) {
        showToast('Listo. Se archivó porque no es recurrente.', 'success')
      } else {
        showToast(t('maintenancePlans.planCompleted'), 'success')
      }
      fetchData()
    } catch (error) {
      console.error('Error completing plan:', error)
      showToast(t('maintenancePlans.completeError'), 'error')
    } finally {
      setCompletingPlanId(null)
    }
  }

  const handleCreateTicket = async (plan: MaintenancePlan) => {
    setCreatingTicketPlanId(plan.id)
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      showToast('Por favor selecciona una propiedad primero', 'error')
      setCreatingTicketPlanId(null)
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
        setCreatingTicketPlanId(null)
        return
      }

      // Create maintenance ticket from plan
      const { data: ticket, error } = await supabase
        .from('maintenance_tickets')
        .insert({
          tenant_id: profile.tenant_id,
          property_id: propertyId,
          title: plan.title,
          vendor_id: plan.vendor_id,
          priority: plan.priority,
          status: 'open',
          date: new Date().toISOString().split('T')[0],
          notes: plan.description || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating ticket:', error)
        showToast('Error al crear ticket', 'error')
      } else {
        showToast('Ticket creado exitosamente', 'success')
        // Navigate to maintenance page
        router.push('/maintenance')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      showToast('Error al crear ticket', 'error')
    } finally {
      setCreatingTicketPlanId(null)
    }
  }

  const handleToggleActive = async (plan: MaintenancePlan) => {
    const propertyId = await getActivePropertyId()
    if (!propertyId) return

    const { error } = await supabase
      .from('maintenance_plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id)
      .eq('property_id', propertyId)

    if (!error) {
      fetchData()
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.planId) return

    const propertyId = await getActivePropertyId()
    if (!propertyId) return

    const { error } = await supabase
      .from('maintenance_plans')
      .delete()
      .eq('id', deleteConfirm.planId)
      .eq('property_id', propertyId)

    if (!error) {
      showToast(t('maintenancePlans.planDeleted'), 'success')
      setPlans(plans.filter(p => p.id !== deleteConfirm.planId))
    } else {
      showToast(t('maintenancePlans.deleteError'), 'error')
    }

    setDeleteConfirm({ isOpen: false, planId: null })
  }

  const handleEdit = (plan: MaintenancePlan) => {
    setEditingPlan(plan)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPlan(null)
    setTemplateData(null)
    fetchData()
  }

  const handleSelectTemplate = (template: MaintenanceTemplate) => {
    setTemplateData(template)
    setShowTemplates(false)
    setShowForm(true)
  }

  const getVendorName = (vendorId: string | null): string | null => {
    if (!vendorId) return null
    return vendors.find(v => v.id === vendorId)?.company_name || null
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

  const getDateStatusColor = (status: 'overdue' | 'upcoming' | 'future') => {
    switch (status) {
      case 'overdue': return 'text-[#EF4444] bg-[#EF4444]/10'
      case 'upcoming': return 'text-[#F59E0B] bg-[#F59E0B]/10'
      case 'future': return 'text-[#64748B] bg-slate-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  const getFrequencyLabel = (plan: MaintenancePlan): string | null => {
    if (!plan.frequency_unit || !plan.frequency_interval) return null
    const units: Record<string, { singular: string; plural: string }> = {
      day: { singular: t('maintenancePlans.frequencyUnits.day'), plural: t('maintenancePlans.frequencyUnits.days') },
      week: { singular: t('maintenancePlans.frequencyUnits.week'), plural: t('maintenancePlans.frequencyUnits.weeks') },
      month: { singular: t('maintenancePlans.frequencyUnits.month'), plural: t('maintenancePlans.frequencyUnits.months') },
      year: { singular: t('maintenancePlans.frequencyUnits.year'), plural: t('maintenancePlans.frequencyUnits.years') },
    }
    
    const unit = units[plan.frequency_unit]
    if (!unit) return null
    const label = plan.frequency_interval === 1 ? unit.singular : unit.plural
    return `Cada ${plan.frequency_interval} ${label}`
  }

  const formatDate = (date: string) => {
    // Use local date to avoid timezone issues
    const localDate = new Date(date + 'T00:00:00')
    return localDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">{t('maintenancePlans.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('maintenancePlans.subtitle')}</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={120} />
          ))}
        </div>
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">{t('maintenancePlans.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('maintenancePlans.subtitle')}</p>
        </div>
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title={t('maintenancePlans.noPropertySelected')}
          description={t('maintenancePlans.selectOrCreatePropertyPlans')}
        />
      </div>
    )
  }

  const filteredPlans = getFilteredPlans()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">{t('maintenancePlans.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('maintenancePlans.subtitle')}</p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <Link
            href="/maintenance"
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
              pathname === '/maintenance'
                ? 'border-[#0F172A] text-[#0F172A]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <span>Tickets</span>
            </div>
          </Link>
          <Link
            href="/maintenance-plans"
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
              pathname === '/maintenance-plans'
                ? 'border-[#0F172A] text-[#0F172A]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span>Recurrentes</span>
            </div>
          </Link>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowTemplates(true)}
            variant="secondary"
            disabled={!hasProperty}
          >
            <FileText className="h-4 w-4" />
            {t('maintenancePlans.addTemplate')}
          </Button>
          <Button 
            onClick={() => {
              setTemplateData(null)
              setShowForm(true)
            }}
            disabled={!hasProperty}
          >
            <Plus className="h-4 w-4" />
            {t('maintenancePlans.createPlan')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
            activeTab === 'pending'
              ? 'border-[#0F172A] text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A]'
          }`}
        >
          {t('maintenancePlans.tabs.pending')}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
            activeTab === 'all'
              ? 'border-[#0F172A] text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A]'
          }`}
        >
          {t('maintenancePlans.tabs.all')}
        </button>
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title={activeTab === 'pending' ? t('maintenancePlans.noPendingPlans') : t('maintenancePlans.noPlans')}
          description={activeTab === 'pending' ? t('maintenancePlans.noPendingPlansDescription') : t('maintenancePlans.noPlansDescription')}
        />
      ) : (
        <div className="space-y-3">
          {filteredPlans.map(plan => {
            const dateStatus = getDateStatus(plan.next_run_date)
            const frequencyLabel = getFrequencyLabel(plan)
            
            return (
              <Card key={plan.id} padding="md" className="hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-[#0F172A] mb-1">{plan.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(plan.priority)}`}>
                      {PRIORITY_LABELS[plan.priority]}
                    </span>
                    {activeTab === 'all' && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${plan.is_active ? 'text-[#10B981] bg-[#10B981]/10' : 'text-slate-500 bg-slate-50'}`}>
                        {plan.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Próximo:</span>
                    <span>{formatDate(plan.next_run_date)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ml-2 ${getDateStatusColor(dateStatus)}`}>
                      {dateStatus === 'overdue' ? 'Vencido' : dateStatus === 'upcoming' ? 'Próximo' : 'En el futuro'}
                    </span>
                  </div>
                  {frequencyLabel && (
                    <div className="text-sm text-slate-600">
                      {frequencyLabel}
                    </div>
                  )}
                  {getVendorName(plan.vendor_id) && (
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">{t('maintenancePlans.vendor')}:</span>{' '}
                      {getVendorName(plan.vendor_id)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMarkCompleted(plan.id)}
                    disabled={completingPlanId === plan.id || !plan.is_active}
                    loading={completingPlanId === plan.id}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t('maintenancePlans.markCompleted')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCreateTicket(plan)}
                    disabled={creatingTicketPlanId === plan.id}
                    loading={creatingTicketPlanId === plan.id}
                    title={t('maintenancePlans.createTicket')}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {activeTab === 'all' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(plan)}
                        title={plan.is_active ? t('maintenancePlans.deactivate') : t('maintenancePlans.activate')}
                      >
                        {plan.is_active ? (
                          <PowerOff className="h-4 w-4 text-slate-500" />
                        ) : (
                          <Power className="h-4 w-4 text-slate-500" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirm({ isOpen: true, planId: plan.id })}
                      >
                        <Trash2 className="h-4 w-4 text-[#EF4444]" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <Modal
          isOpen={true}
          onClose={() => setShowTemplates(false)}
          title={t('maintenancePlans.selectTemplate')}
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {MAINTENANCE_TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="p-4 text-left border border-[#E2E8F0] rounded-lg hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all duration-150"
              >
                <h3 className="font-semibold text-[#0F172A] mb-1">{template.title}</h3>
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <span>Cada {template.default_frequency_interval} {template.default_frequency_unit === 'month' ? 'meses' : template.default_frequency_unit === 'week' ? 'semanas' : template.default_frequency_unit === 'year' ? 'años' : 'días'}</span>
                  <span>•</span>
                  <span>{PRIORITY_LABELS[template.default_priority]}</span>
                </div>
                {template.suggested_notes && (
                  <p className="text-xs text-[#64748B] mt-2 line-clamp-2">{template.suggested_notes}</p>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Form Modal */}
      {showForm && (
        <MaintenancePlanForm
          plan={editingPlan}
          template={templateData}
          vendors={vendors}
          onClose={handleFormClose}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, planId: null })}
        onConfirm={handleDelete}
        title={t('maintenancePlans.deletePlanTitle')}
        message={t('maintenancePlans.deletePlanMessage')}
        confirmText={t('maintenancePlans.delete')}
      />
    </div>
  )
}
