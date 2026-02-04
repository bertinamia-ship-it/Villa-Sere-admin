'use client'

import { useState } from 'react'
import { Booking } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { t } from '@/lib/i18n/es'

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
      ? 'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white border-[#2563EB]/30 shadow-sm hover:from-[#1D4ED8] hover:to-[#1E40AF]'
      : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'

    const todayRing = today ? 'ring-1 ring-[#F59E0B] ring-offset-1' : ''

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
          relative overflow-hidden aspect-square p-0.5 sm:p-1 text-[10px] sm:text-xs border transition-all duration-150 ease-out
          min-h-[44px] sm:min-h-0
          ${bookingGradient}
          ${rangeClasses}
          ${todayRing}
        `}
        aria-label={booking ? `Booked: ${booking.guest_name || booking.platform} from ${new Date(booking.check_in).toDateString()} to ${new Date(booking.check_out).toDateString()}` : `Available on ${date.toDateString()}`}
      >
        <div className="flex flex-col h-full justify-start">
          <span className={`text-[10px] sm:text-[11px] font-semibold ${booking ? 'text-white' : 'text-slate-900'}`}>
            {day}
          </span>
          {booking && (
            <span className="text-[8px] sm:text-[9px] mt-0.5 sm:mt-auto truncate font-medium text-white/90 leading-tight">
              {isCheckInDay ? '✓' : isCheckOutDay ? '→' : ''}
              {(isCheckInDay || isCheckOutDay) && ' '}
              <span className="hidden sm:inline">
                {booking.guest_name || booking.platform}
              </span>
              <span className="sm:hidden">
                {(booking.guest_name || booking.platform || '').substring(0, 3)}
              </span>
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
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-600 hidden sm:block">{t('rentals.hoverForDetails')}</p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Button size="sm" variant="ghost" onClick={previousMonth} className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={nextMonth} className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center text-[10px] sm:text-xs font-semibold text-slate-500 py-1.5 sm:py-2 tracking-wide">
              {day}
            </div>
          ))}
          {days}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-slate-200/60 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-400/30" />
            <span className="text-slate-600 font-medium">{t('rentals.booked')}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-white border border-slate-200/60" />
            <span className="text-slate-600 font-medium">{t('rentals.available')}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded border border-amber-500 ring-1 ring-amber-500/30" />
            <span className="text-slate-600 font-medium">{t('rentals.today')}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
            <Info className="h-3.5 w-3.5 stroke-[1.5]" />
            <span className="text-[10px]">{t('rentals.hoverForGuestTotal')}</span>
          </div>
        </div>
      </div>

      {tooltip.visible && tooltip.booking && (
        <div
          className="absolute z-50 w-56 sm:w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200/60 bg-white p-3 shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-900">{tooltip.booking.guest_name || tooltip.booking.platform || t('rentals.guest')}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{tooltip.booking.platform}</p>
            </div>
            <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-semibold ${tooltip.booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : tooltip.booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {tooltip.booking.status === 'confirmed' ? t('rentals.confirmed') : tooltip.booking.status === 'completed' ? t('rentals.completed') : tooltip.booking.status === 'cancelled' ? t('rentals.cancelled') : tooltip.booking.status}
            </span>
          </div>
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            <p>{new Date(tooltip.booking.check_in).toLocaleDateString('es-ES')} → {new Date(tooltip.booking.check_out).toLocaleDateString('es-ES')}</p>
            <p className="font-semibold text-slate-900">${Number(tooltip.booking.total_amount || 0).toFixed(0)} {t('rentals.total')}</p>
          </div>
        </div>
      )}
    </Card>
  )
}
