'use client'

import { useState } from 'react'
import { Booking } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'

interface BookingCalendarProps {
  bookings: Booking[]
  onEdit: (booking: Booking) => void
}

export default function BookingCalendar({ bookings, onEdit }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; booking?: Booking | null; dateLabel?: string }>({
    visible: false,
    x: 0,
    y: 0,
    booking: null,
    dateLabel: undefined,
  })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1))
  }

  const isDateBooked = (date: Date) => {
    return bookings.filter(b => b.status !== 'cancelled').some(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      return date >= checkIn && date < checkOut
    })
  }

  const getBookingForDate = (date: Date) => {
    return bookings
      .filter(b => b.status !== 'cancelled')
      .find(booking => {
        const checkIn = new Date(booking.check_in)
        const checkOut = new Date(booking.check_out)
        return date >= checkIn && date < checkOut
      })
  }

  const isCheckIn = (date: Date, booking: Booking) => {
    const checkIn = new Date(booking.check_in)
    return date.toDateString() === checkIn.toDateString()
  }

  const isCheckOut = (date: Date, booking: Booking) => {
    const checkOut = new Date(booking.check_out)
    const lastNight = new Date(checkOut)
    lastNight.setDate(lastNight.getDate() - 1)
    return date.toDateString() === lastNight.toDateString()
  }

  const isToday = (date: Date) => {
    const now = new Date()
    return date.toDateString() === now.toDateString()
  }

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const booked = isDateBooked(date)
    const booking = getBookingForDate(date)
    const isCheckInDay = booking ? isCheckIn(date, booking) : false
    const isCheckOutDay = booking ? isCheckOut(date, booking) : false
    const today = isToday(date)

    const rangeClasses = booking
      ? isCheckInDay && isCheckOutDay
        ? 'rounded-xl'
        : isCheckInDay
          ? 'rounded-l-xl'
          : isCheckOutDay
            ? 'rounded-r-xl'
            : 'rounded-none'
      : 'rounded-lg'

    const bookingGradient = booking
      ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-100 hover:from-indigo-500 hover:to-indigo-400'
      : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:shadow-sm'

    const todayRing = today ? 'ring-2 ring-offset-2 ring-amber-400' : ''

    days.push(
      <button
        key={day}
        onClick={() => booking && onEdit(booking)}
        onMouseEnter={(event) => {
          if (!booking) return
          const rect = event.currentTarget.getBoundingClientRect()
          setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY - 12,
            booking,
            dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          })
        }}
        onMouseLeave={() => setTooltip(prev => ({ ...prev, visible: false }))}
        onFocus={(event) => {
          if (!booking) return
          const rect = event.currentTarget.getBoundingClientRect()
          setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY - 12,
            booking,
            dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          })
        }}
        onBlur={() => setTooltip(prev => ({ ...prev, visible: false }))}
        className={`
          relative overflow-hidden aspect-square p-1 text-sm border transition-all duration-200
          ${bookingGradient}
          ${rangeClasses}
          ${todayRing}
        `}
        aria-label={booking ? `Booked: ${booking.guest_name || booking.platform} from ${new Date(booking.check_in).toDateString()} to ${new Date(booking.check_out).toDateString()}` : `Available on ${date.toDateString()}`}
      >
        <div className="flex flex-col h-full">
          <span className={`text-xs font-semibold ${booking ? 'text-white' : 'text-gray-800'}`}>
            {day}
          </span>
          {booking && (
            <span className="text-[11px] mt-auto truncate font-medium text-white/90">
              {isCheckInDay ? 'Check-in · ' : isCheckOutDay ? 'Checkout · ' : ''}
              {booking.guest_name || booking.platform}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <Card className="relative">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-sm text-gray-500">Hover or click a booked day to view details.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2 tracking-wide">
              {day}
            </div>
          ))}
          {days}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-600 to-indigo-500 border border-indigo-400" />
            <span className="text-gray-700">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border border-gray-200" />
            <span className="text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-amber-400 ring-2 ring-amber-300/60" />
            <span className="text-gray-700">Today</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Info className="h-4 w-4" />
            <span>Hover or click a booked date for guest + total.</span>
          </div>
        </div>
      </div>

      {tooltip.visible && tooltip.booking && (
        <div
          className="absolute z-50 w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-gray-200 bg-white p-3 shadow-xl shadow-indigo-100/70"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{tooltip.booking.guest_name || tooltip.booking.platform || 'Guest'}</p>
              <p className="text-xs text-gray-500">{tooltip.booking.platform}</p>
            </div>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-semibold ${tooltip.booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : tooltip.booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {tooltip.booking.status}
            </span>
          </div>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            <p>{new Date(tooltip.booking.check_in).toLocaleDateString()} → {new Date(tooltip.booking.check_out).toLocaleDateString()}</p>
            <p className="font-semibold text-gray-900">${Number(tooltip.booking.total_amount || 0).toFixed(0)} total</p>
          </div>
        </div>
      )}
    </Card>
  )
}
