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
import { Calendar as CalendarIcon, Plus, DollarSign, TrendingUp, Percent } from 'lucide-react'
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
      showToast('Error al cargar datos', 'error')
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
        showToast('No active property selected', 'error')
        return
      }

      // Validation
      if (!booking.check_in || !booking.check_out) {
        showToast('Check-in and check-out dates are required', 'error')
        return
      }

      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)

      if (checkOut <= checkIn) {
        showToast('Check-out date must be after check-in date', 'error')
        return
      }

      if (!booking.guest_name || booking.guest_name.trim() === '') {
        showToast('Guest name is required', 'error')
        return
      }

      if (booking.total_amount && parseFloat(String(booking.total_amount)) < 0) {
        showToast('Total amount cannot be negative', 'error')
        return
      }

      console.log('📝 Saving booking:', booking)
      
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
            showToast('Booking dates overlap with an existing booking for this property', 'error')
            return
          }
        }
      }
      
      if (editingBooking) {
        console.log('✏️ Updating booking:', editingBooking.id)
        const { data, error } = await supabase
          .from('bookings')
          .update({ ...booking, property_id: propertyId })
          .eq('id', editingBooking.id)
          .eq('property_id', propertyId) // Security: ensure property matches
          .select()
        
        if (error) {
          console.error('❌ Update error:', error)
          throw error
        }
        console.log('✅ Booking updated:', data)
        showToast(t('rentals.bookingUpdated'), 'success')
      } else {
        console.log('➕ Creating new booking')
        const { data, error } = await supabase
          .from('bookings')
          .insert([{ ...booking, property_id: propertyId }])
          .select()
        
        if (error) {
          console.error('❌ Insert error:', error)
          throw error
        }
        console.log('✅ Booking created:', data)
        showToast(t('rentals.bookingCreated'), 'success')
      }
      
      setShowForm(false)
      setEditingBooking(null)
      await loadData()
    } catch (error) {
      console.error('❌ Error saving booking:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      showToast(`${t('rentals.saveError')}: ${errorMsg}`, 'error')
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
      console.error('Error deleting booking:', error)
      showToast(t('rentals.deleteError'), 'error')
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
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('rentals.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('rentals.subtitle')}</p>
        </div>
        <Button 
          onClick={() => {
            setEditingBooking(null)
            setShowForm(true)
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t('rentals.addBooking')}
        </Button>
      </div>

      {/* Monthly Stats */}
      {monthlyStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-700">{t('rentals.income')}</p>
                <p className="text-xl font-bold text-gray-900">${monthlyStats.income.toFixed(0)}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-700">{t('rentals.expenses')}</p>
                <p className="text-xl font-bold text-gray-900">${monthlyStats.expenses.toFixed(0)}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-700">{t('rentals.profit')}</p>
                <p className={`text-xl font-bold ${monthlyStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${monthlyStats.profit.toFixed(0)}
                </p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('rentals.bookings')}</p>
                <p className="text-xl font-bold text-gray-900">{monthlyStats.bookingCount}</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Percent className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-700">{t('rentals.occupancyRate')}</p>
                <p className="text-xl font-bold text-gray-900">{monthlyStats.occupancyRate.toFixed(0)}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* View Toggle */}
      <Card padding="sm">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

