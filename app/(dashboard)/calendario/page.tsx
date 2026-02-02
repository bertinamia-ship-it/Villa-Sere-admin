'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Booking, MaintenancePlan, Task } from '@/lib/types/database'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { CalendarView } from '@/components/calendar/CalendarView'
import { Plus, Calendar as CalendarIcon, Wrench, CheckSquare, CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/lib/i18n/es'
import BookingForm from '@/app/(dashboard)/rentals/BookingForm'
import TaskForm from '@/app/(dashboard)/tasks/TaskForm'
import TicketForm from '@/app/(dashboard)/maintenance/TicketForm'
import MaintenancePlanForm from '@/app/(dashboard)/maintenance-plans/MaintenancePlanForm'
import { CalendarItemModal } from '@/components/calendar/CalendarItemModal'
import { Vendor } from '@/lib/types/database'
import { Modal } from '@/components/ui/Modal'
import { CalendarItem } from '@/components/calendar/types'

type ViewType = 'today' | 'week' | 'month'

export default function CalendarioPage() {
  const [view, setView] = useState<ViewType>('month')
  const [singleProperty, setSingleProperty] = useState(true)
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadData()
    loadVendors()
    
    const handlePropertyChange = () => {
      loadData()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, [view, singleProperty])

  async function loadVendors() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.tenant_id) return

    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('company_name')

    setVendors(data || [])
  }

  async function loadData() {
    setLoading(true)
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId && singleProperty) {
        setItems([])
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        setLoading(false)
        return
      }

      // Calculate date range based on view
      const { startDate, endDate } = getDateRange(view)

      // Build filter
      const propertyFilter = singleProperty && propertyId
        ? { property_id: propertyId }
        : { tenant_id: profile.tenant_id }

      // Fetch bookings
      const bookingsQuery = singleProperty && propertyId
        ? supabase
            .from('bookings')
            .select('id, check_in, check_out, guest_name, total_amount, status, platform')
            .eq('property_id', propertyId)
            .gte('check_in', startDate)
            .lte('check_in', endDate)
        : supabase
            .from('bookings')
            .select('id, check_in, check_out, guest_name, total_amount, status, platform, property_id')
            .eq('tenant_id', profile.tenant_id)
            .gte('check_in', startDate)
            .lte('check_in', endDate)

      // Fetch maintenance plans
      const plansQuery = singleProperty && propertyId
        ? supabase
            .from('maintenance_plans')
            .select('id, title, next_run_date, priority, vendor_id, estimated_cost, is_active')
            .eq('property_id', propertyId)
            .eq('is_active', true)
            .gte('next_run_date', startDate)
            .lte('next_run_date', endDate)
        : supabase
            .from('maintenance_plans')
            .select('id, title, next_run_date, priority, vendor_id, estimated_cost, is_active, property_id')
            .eq('tenant_id', profile.tenant_id)
            .eq('is_active', true)
            .gte('next_run_date', startDate)
            .lte('next_run_date', endDate)

      // Fetch tasks
      const tasksQuery = singleProperty && propertyId
        ? supabase
            .from('tasks')
            .select('id, title, next_due_date, priority, status, cadence')
            .eq('property_id', propertyId)
            .neq('status', 'done')
            .gte('next_due_date', startDate)
            .lte('next_due_date', endDate)
        : supabase
            .from('tasks')
            .select('id, title, next_due_date, priority, status, cadence, property_id')
            .eq('tenant_id', profile.tenant_id)
            .neq('status', 'done')
            .gte('next_due_date', startDate)
            .lte('next_due_date', endDate)

      const [bookingsResult, plansResult, tasksResult] = await Promise.all([
        bookingsQuery,
        plansQuery,
        tasksQuery
      ])

      const calendarItems: CalendarItem[] = []

      // Normalize bookings
      if (bookingsResult.data) {
        bookingsResult.data.forEach(booking => {
          calendarItems.push({
            id: booking.id,
            type: 'booking',
            dateStart: booking.check_in,
            dateEnd: booking.check_out,
            title: booking.guest_name || booking.platform || t('rentals.guest'),
            subtitle: `$${Number(booking.total_amount || 0).toFixed(0)}`,
            status: booking.status,
            meta: booking
          })
        })
      }

      // Normalize maintenance plans
      if (plansResult.data) {
        plansResult.data.forEach(plan => {
          calendarItems.push({
            id: plan.id,
            type: 'plan',
            dateStart: plan.next_run_date,
            title: plan.title,
            priority: plan.priority,
            meta: plan
          })
        })
      }

      // Normalize tasks
      if (tasksResult.data) {
        tasksResult.data.forEach(task => {
          calendarItems.push({
            id: task.id,
            type: 'task',
            dateStart: task.next_due_date,
            title: task.title,
            priority: task.priority,
            status: task.status,
            meta: task
          })
        })
      }

      setItems(calendarItems)
    } catch (error) {
      console.error('Error loading calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getDateRange(viewType: ViewType): { startDate: string; endDate: string } {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    if (viewType === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (viewType === 'week') {
      const dayOfWeek = now.getDay()
      const diff = now.getDate() - dayOfWeek
      startDate = new Date(now.getFullYear(), now.getMonth(), diff)
      endDate = new Date(now.getFullYear(), now.getMonth(), diff + 6)
    } else {
      // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    // Add buffer of +/- 3 days
    startDate.setDate(startDate.getDate() - 3)
    endDate.setDate(endDate.getDate() + 3)

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const handleNewBooking = () => {
    setShowNewMenu(false)
    setShowBookingForm(true)
  }

  const handleNewTask = () => {
    setShowNewMenu(false)
    setShowTaskForm(true)
  }

  const handleNewTicket = () => {
    setShowNewMenu(false)
    setShowTicketForm(true)
  }

  const handleNewPlan = () => {
    setShowNewMenu(false)
    setShowPlanForm(true)
  }

  const handleBookingSave = async (booking: Partial<Booking>) => {
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        alert(t('calendar.noPropertySelected'))
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

      const { error } = await supabase
        .from('bookings')
        .insert({
          ...booking,
          property_id: propertyId,
          tenant_id: profile.tenant_id
        })

      if (error) throw error

      setShowBookingForm(false)
      loadData()
    } catch (error) {
      console.error('Error saving booking:', error)
      alert(t('rentals.failedToSaveBooking'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">{t('calendar.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('calendar.subtitle')}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Selector */}
          <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-lg p-1">
            {(['today', 'week', 'month'] as ViewType[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  view === v
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                {v === 'today' ? t('calendar.today') : v === 'week' ? t('calendar.week') : t('calendar.month')}
              </button>
            ))}
          </div>

          {/* Toggle */}
          <label className="flex items-center gap-2 text-xs text-[#64748B] cursor-pointer">
            <input
              type="checkbox"
              checked={singleProperty}
              onChange={(e) => setSingleProperty(e.target.checked)}
              className="w-4 h-4 rounded border-[#E2E8F0] text-[#0F172A] focus:ring-[#2563EB]/30"
            />
            <span>{t('calendar.singleProperty')}</span>
          </label>

          {/* New Button */}
          <div className="relative">
            <Button
              onClick={() => setShowNewMenu(!showNewMenu)}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              {t('calendar.new')}
            </Button>
            {showNewMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNewMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-[#E2E8F0] shadow-lg py-1 z-50">
                  <button
                    onClick={handleNewBooking}
                    className="w-full text-left px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                  >
                    <CalendarIcon className="h-4 w-4 text-[#2563EB]" />
                    <span>{t('calendar.newBooking')}</span>
                  </button>
                  <button
                    onClick={handleNewTask}
                    className="w-full text-left px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                  >
                    <CheckSquare className="h-4 w-4 text-[#8B5CF6]" />
                    <span>{t('calendar.newTask')}</span>
                  </button>
                  <button
                    onClick={handleNewTicket}
                    className="w-full text-left px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                  >
                    <Wrench className="h-4 w-4 text-[#F59E0B]" />
                    <span>{t('calendar.newTicket')}</span>
                  </button>
                  <button
                    onClick={handleNewPlan}
                    className="w-full text-left px-3 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                  >
                    <CalendarCheck className="h-4 w-4 text-[#F59E0B]" />
                    <span>{t('calendar.newPlan')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-12 w-12" />}
          title={t('calendar.noEvents')}
          description={t('calendar.noEventsDescription')}
        />
      ) : (
        <CalendarView
          items={items}
          view={view}
          onItemClick={(item) => {
            setSelectedItem(item)
          }}
          onRefresh={loadData}
        />
      )}

      {/* Modals */}
      {showBookingForm && (
        <Modal
          isOpen={true}
          onClose={() => setShowBookingForm(false)}
          title={t('rentals.addBooking')}
          size="lg"
        >
          <BookingForm
            booking={null}
            onSave={handleBookingSave}
            onCancel={() => setShowBookingForm(false)}
          />
        </Modal>
      )}

      {showTaskForm && (
        <TaskForm
          task={null}
          onClose={() => {
            setShowTaskForm(false)
            loadData()
          }}
        />
      )}

      {showTicketForm && (
        <TicketForm
          ticket={null}
          vendors={vendors}
          onClose={() => {
            setShowTicketForm(false)
            loadData()
          }}
        />
      )}

      {showPlanForm && (
        <MaintenancePlanForm
          plan={null}
          vendors={vendors}
          onClose={() => {
            setShowPlanForm(false)
            loadData()
          }}
        />
      )}

      {/* Item Detail Modal */}
      <CalendarItemModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onRefresh={loadData}
      />
    </div>
  )
}

