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
  const [bookings, setBookings] = useState<Booking[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  async function loadData() {
    setLoading(true)
    try {
      await Promise.all([loadBookings(), loadMonthlyStats()])
    } catch (error) {
      console.error('Error loading data:', error)
      showToast('Failed to load data', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('check_in', { ascending: false })

    if (error) throw error
    setBookings(data || [])
  }

  async function loadMonthlyStats() {
    const [year, month] = selectedMonth.split('-')
    const startDate = `${year}-${month}-01`
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

    // Get bookings for the month
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .gte('check_in', startDate)
      .lte('check_in', endDate)
      .eq('status', 'confirmed')

    if (bookingsError) throw bookingsError

    const income = bookingsData?.reduce((sum, b) => sum + b.total_amount + b.cleaning_fee, 0) || 0
    const bookingCount = bookingsData?.length || 0

    // Get expenses for the month
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
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
      console.log('📝 Saving booking:', booking)
      
      if (editingBooking) {
        console.log('✏️ Updating booking:', editingBooking.id)
        const { data, error } = await supabase
          .from('bookings')
          .update(booking)
          .eq('id', editingBooking.id)
          .select()
        
        if (error) {
          console.error('❌ Update error:', error)
          throw error
        }
        console.log('✅ Booking updated:', data)
        showToast('Booking updated successfully', 'success')
      } else {
        console.log('➕ Creating new booking')
        const { data, error } = await supabase
          .from('bookings')
          .insert([booking])
          .select()
        
        if (error) {
          console.error('❌ Insert error:', error)
          throw error
        }
        console.log('✅ Booking created:', data)
        showToast('Booking created successfully', 'success')
      }
      
      setShowForm(false)
      setEditingBooking(null)
      await loadData()
    } catch (error) {
      console.error('❌ Error saving booking:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      showToast(`Failed to save booking: ${errorMsg}`, 'error')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this booking?')) return

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      showToast('Booking deleted successfully', 'success')
      loadData()
    } catch (error) {
      console.error('Error deleting booking:', error)
      showToast('Failed to delete booking', 'error')
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rental Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track bookings, income, and occupancy</p>
        </div>
        <Button onClick={() => {
          setEditingBooking(null)
          setShowForm(true)
        }}>
          <Plus className="h-4 w-4" />
          Add Booking
        </Button>
      </div>

      {/* Monthly Stats */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Income</p>
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
                <p className="text-sm text-gray-600">Expenses</p>
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
                <p className="text-sm text-gray-600">Profit</p>
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
                <p className="text-sm text-gray-600">Bookings</p>
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
                <p className="text-sm text-gray-600">Occupancy</p>
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
            Calendar
          </Button>
          <Button
            size="sm"
            variant={view === 'list' ? 'primary' : 'ghost'}
            onClick={() => setView('list')}
          >
            List
          </Button>
        </div>
      </Card>

      {/* Calendar or List View */}
      {view === 'calendar' ? (
        <BookingCalendar bookings={bookings} onEdit={handleEdit} />
      ) : (
        <BookingList bookings={bookings} onEdit={handleEdit} onDelete={handleDelete} />
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
  )
}
