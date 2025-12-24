'use client'

import { useState } from 'react'
import { Booking } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BookingCalendarProps {
  bookings: Booking[]
  onEdit: (booking: Booking) => void
}

export default function BookingCalendar({ bookings, onEdit }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

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
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(b => b.status !== 'cancelled').some(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      return date >= checkIn && date < checkOut
    })
  }

  const getBookingForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
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

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const booked = isDateBooked(date)
    const booking = getBookingForDate(date)
    const isCheckInDay = booking && isCheckIn(date, booking)

    days.push(
      <button
        key={day}
        onClick={() => booking && onEdit(booking)}
        className={`
          aspect-square p-1 text-sm rounded-lg border transition-all
          ${booked 
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
          }
          ${isCheckInDay ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <div className="flex flex-col h-full">
          <span className={`text-xs font-medium ${booked ? 'text-blue-900' : 'text-gray-700'}`}>
            {day}
          </span>
          {isCheckInDay && booking && (
            <span className="text-[10px] text-blue-700 truncate mt-auto">
              {booking.guest_name || booking.platform}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
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
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {days}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded" />
            <span className="text-gray-600">Check-in</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded" />
            <span className="text-gray-600">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded" />
            <span className="text-gray-600">Available</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
