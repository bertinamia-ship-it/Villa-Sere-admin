'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Booking } from '@/lib/types/database'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { CalendarView } from '@/components/calendar/CalendarView'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { t } from '@/lib/i18n/es'
import BookingForm from '@/app/(dashboard)/rentals/BookingForm'
import { CalendarItemModal } from '@/components/calendar/CalendarItemModal'
import { Modal } from '@/components/ui/Modal'
import { CalendarItem } from '@/components/calendar/types'

type ViewType = 'today' | 'week' | 'month'

export default function CalendarioPage() {
  const [view, setView] = useState<ViewType>('month')
  const [singleProperty, setSingleProperty] = useState(true)
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
    
    const handlePropertyChange = () => {
      loadData()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, [view, singleProperty])

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

      // Fetch ONLY bookings
      const bookingsQuery = singleProperty && propertyId
        ? supabase
            .from('bookings')
            .select('id, check_in, check_out, guest_name, total_amount, status, platform')
            .eq('property_id', propertyId)
            .gte('check_in', startDate)
            .lte('check_in', endDate)
            .order('check_in', { ascending: true })
        : supabase
            .from('bookings')
            .select('id, check_in, check_out, guest_name, total_amount, status, platform, property_id')
            .eq('tenant_id', profile.tenant_id)
            .gte('check_in', startDate)
            .lte('check_in', endDate)
            .order('check_in', { ascending: true })

      const { data: bookingsData, error } = await bookingsQuery

      if (error) {
        console.error('Error loading bookings:', error)
        setItems([])
        setLoading(false)
        return
      }

      // Normalize bookings to calendar items
      const calendarItems: CalendarItem[] = (bookingsData || []).map(booking => ({
        id: booking.id,
        type: 'booking',
        dateStart: booking.check_in,
        dateEnd: booking.check_out,
        title: booking.guest_name || booking.platform || t('rentals.guest'),
        subtitle: `$${Number(booking.total_amount || 0).toFixed(0)}`,
        status: booking.status,
        meta: booking
      }))

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
          <p className="text-sm text-[#64748B] mt-1">{t('calendar.subtitleReservas')}</p>
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

          {/* New Booking Button */}
          <Button
            onClick={() => setShowBookingForm(true)}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            {t('calendar.newBooking')}
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="text-center py-12 text-[#64748B]">{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="h-12 w-12" />}
          title={t('calendar.noBookings')}
          description={t('calendar.noBookingsDescription')}
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

      {/* Booking Form Modal */}
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
