'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Booking } from '@/lib/types/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { Calendar as CalendarIcon, Plus, DollarSign, TrendingUp, Percent, X } from 'lucide-react'
import BookingForm from './BookingForm'
import BookingList from './BookingList'
import BookingCalendar from './BookingCalendar'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { t } from '@/lib/i18n/es'

interface MonthlyStats {
  income: number
  expenses: number
  profit: number
  bookingCount: number
  occupancyRate: number
}

export default function RentalsPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [hasProperty, setHasProperty] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; bookingId: string | null }>({ isOpen: false, bookingId: null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadData()
    
    // Listen for property changes
    const handlePropertyChange = () => {
      loadData()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, [selectedMonth])

  async function loadData() {
    setLoading(true)
    try {
      await Promise.all([loadBookings(), loadMonthlyStats()])
    } catch (error) {
      console.error('Error loading data:', error)
      showToast(t('rentals.loadError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadBookings() {
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      setBookings([])
      setHasProperty(false)
      return
    }

    setHasProperty(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId)
      .order('check_in', { ascending: false })

    if (error) throw error
    setBookings(data || [])
  }

  async function loadMonthlyStats() {
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      setMonthlyStats({ income: 0, expenses: 0, profit: 0, bookingCount: 0, occupancyRate: 0 })
      return
    }

    const [year, month] = selectedMonth.split('-')
    const startDate = `${year}-${month}-01`
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

    // Get bookings for the month (filtered by property_id)
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('property_id', propertyId)
      .gte('check_in', startDate)
      .lte('check_in', endDate)
      .eq('status', 'confirmed')

    if (bookingsError) throw bookingsError

    const income = bookingsData?.reduce((sum, b) => sum + b.total_amount + b.cleaning_fee, 0) || 0
    const bookingCount = bookingsData?.length || 0

    // Get expenses for the month (filtered by property_id)
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (expensesError) throw expensesError

    const expenses = expensesData?.reduce((sum, e) => sum + e.amount, 0) || 0
    const profit = income - expenses

    // Calculate occupancy rate (assuming single property)
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    const bookedDays = bookingsData?.reduce((sum, b) => {
      const checkIn = new Date(b.check_in)
      const checkOut = new Date(b.check_out)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      return sum + nights
    }, 0) || 0
    const occupancyRate = (bookedDays / daysInMonth) * 100

    setMonthlyStats({ income, expenses, profit, bookingCount, occupancyRate })
  }

  async function handleSave(booking: Partial<Booking>) {
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('errors.propertyRequired'), 'error')
        return
      }

      // Validation
      if (!booking.check_in || !booking.check_out) {
        showToast(t('rentals.datesRequired'), 'error')
        return
      }

      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)

      if (checkOut <= checkIn) {
        showToast(t('rentals.checkOutAfterCheckIn'), 'error')
        return
      }

      if (!booking.guest_name || booking.guest_name.trim() === '') {
        showToast(t('rentals.guestNameRequired'), 'error')
        return
      }

      if (booking.total_amount && parseFloat(String(booking.total_amount)) < 0) {
        showToast(t('rentals.amountCannotBeNegative'), 'error')
        return
      }

      // Validate date overlap for same property (only for new bookings or if dates changed)
      if (!editingBooking || booking.check_in !== editingBooking.check_in || booking.check_out !== editingBooking.check_out) {
        if (booking.check_in && booking.check_out) {
          const { data: overlappingBookings } = await supabase
            .from('bookings')
            .select('id, check_in, check_out, guest_name')
            .eq('property_id', propertyId)
            .eq('status', 'confirmed')
            .neq('id', editingBooking?.id || '') // Exclude current booking if editing
          
          const checkIn = new Date(booking.check_in)
          const checkOut = new Date(booking.check_out)
          
          const hasOverlap = overlappingBookings?.some(existing => {
            const existingCheckIn = new Date(existing.check_in)
            const existingCheckOut = new Date(existing.check_out)
            
            // Check if dates overlap
            return (checkIn < existingCheckOut && checkOut > existingCheckIn)
          })
          
          if (hasOverlap) {
            showToast(t('rentals.overlappingDates'), 'error')
            return
          }
        }
      }
      
      if (editingBooking) {
        const { data, error } = await supabase
          .from('bookings')
          .update({ ...booking, property_id: propertyId })
          .eq('id', editingBooking.id)
          .eq('property_id', propertyId) // Security: ensure property matches
          .select()
        
        if (error) {
          const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
          logError('RentalsPage.update', error)
          showToast(getUserFriendlyError(error), 'error')
          return
        }
        showToast(t('rentals.bookingUpdated'), 'success')
      } else {
        const { data, error } = await supabase
          .from('bookings')
          .insert([{ ...booking, property_id: propertyId }])
          .select()
        
        if (error) {
          const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
          logError('RentalsPage.insert', error)
          showToast(getUserFriendlyError(error), 'error')
          return
        }
        showToast(t('rentals.bookingCreated'), 'success')
      }
      
      setShowForm(false)
      setEditingBooking(null)
      await loadData()
    } catch (error) {
      const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
      logError('RentalsPage.save', error)
      showToast(getUserFriendlyError(error), 'error')
    }
  }

  function handleDeleteClick(id: string) {
    setDeleteConfirm({ isOpen: true, bookingId: id })
  }

  async function handleDelete() {
    if (!deleteConfirm.bookingId) return

    setDeleting(true)
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('rentals.noActiveProperty'), 'error')
        setDeleting(false)
        setDeleteConfirm({ isOpen: false, bookingId: null })
        return
      }

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', deleteConfirm.bookingId)
        .eq('property_id', propertyId) // Security: ensure property matches
      
      if (error) throw error
      showToast(t('rentals.bookingDeleted'), 'success')
      loadData()
    } catch (error) {
      const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
      logError('RentalsPage.delete', error)
      showToast(getUserFriendlyError(error), 'error')
    } finally {
      setDeleting(false)
      setDeleteConfirm({ isOpen: false, bookingId: null })
    }
  }

  function handleEdit(booking: Booking) {
    setEditingBooking(booking)
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('rentals.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('rentals.subtitle')}</p>
        </div>
        <EmptyState
          icon={<CalendarIcon className="h-12 w-12" />}
          title={t('rentals.noPropertySelected')}
          description={t('rentals.noPropertyDescription')}
        />
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{t('rentals.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5">{t('rentals.subtitle')}</p>
        </div>
        <Button 
          onClick={() => {
            setEditingBooking(null)
            setShowForm(true)
          }}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
        >
          <Plus className="h-4 w-4" />
          {t('rentals.addBooking')}
        </Button>
      </div>

      {/* Monthly Stats */}
      {monthlyStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card padding="md" className="hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#10B981]/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-[#10B981]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{t('rentals.income')}</p>
                <p className="text-xl font-bold text-[#0F172A] truncate">${monthlyStats.income.toFixed(0)}</p>
              </div>
            </div>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#EF4444]/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-[#EF4444]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{t('rentals.expenses')}</p>
                <p className="text-xl font-bold text-[#0F172A] truncate">${monthlyStats.expenses.toFixed(0)}</p>
              </div>
            </div>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${monthlyStats.profit >= 0 ? 'bg-[#10B981]/10' : 'bg-[#EF4444]/10'}`}>
                <TrendingUp className={`h-5 w-5 ${monthlyStats.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{t('rentals.profit')}</p>
                <p className={`text-xl font-bold truncate ${monthlyStats.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  ${Math.abs(monthlyStats.profit).toFixed(0)}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#8B5CF6]/10 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-[#8B5CF6]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{t('rentals.bookings')}</p>
                <p className="text-xl font-bold text-[#0F172A]">{monthlyStats.bookingCount}</p>
              </div>
            </div>
          </Card>

          <Card padding="md" className="hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#F59E0B]/10 rounded-lg">
                <Percent className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-1">{t('rentals.occupancyRate')}</p>
                <p className="text-xl font-bold text-[#0F172A]">{monthlyStats.occupancyRate.toFixed(0)}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* View Toggle */}
      <Card padding="md">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={view === 'calendar' ? 'primary' : 'ghost'}
            onClick={() => setView('calendar')}
          >
            <CalendarIcon className="h-4 w-4" />
            {t('rentals.calendar')}
          </Button>
          <Button
            size="sm"
            variant={view === 'list' ? 'primary' : 'ghost'}
            onClick={() => setView('list')}
          >
            {t('rentals.list')}
          </Button>
        </div>
      </Card>

      {/* Calendar or List View */}
      {view === 'calendar' ? (
        <BookingCalendar bookings={bookings} onEdit={handleEdit} />
      ) : (
        <BookingList bookings={bookings} onEdit={handleEdit} onDelete={handleDeleteClick} />
      )}

      {/* Booking Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm safe-area-y">
          <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full h-[95vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl border-t sm:border border-slate-200/60 flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200/60 px-4 py-3 flex items-center justify-between z-10 safe-area-top">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingBooking ? 'Editar Reserva' : 'Nueva Reserva'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingBooking(null)
                }}
                className="p-2 -mr-2 text-slate-500 hover:text-slate-900 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 safe-area-x">
              <BookingForm
                booking={editingBooking}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false)
                  setEditingBooking(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, bookingId: null })}
        onConfirm={handleDelete}
        title={t('rentals.deleteBookingTitle')}
        message={t('rentals.deleteBookingMessage')}
        confirmText={t('common.delete')}
        loading={deleting}
      />
    </>
  )
}

