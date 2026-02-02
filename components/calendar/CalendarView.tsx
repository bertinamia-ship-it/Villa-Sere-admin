'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { t } from '@/lib/i18n/es'
import { CalendarItem } from './types'

interface CalendarViewProps {
  items: CalendarItem[]
  view: 'today' | 'week' | 'month'
  onItemClick: (item: CalendarItem) => void
  onRefresh: () => void
}

export function CalendarView({ items, view, onItemClick, onRefresh }: CalendarViewProps) {
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

  const getItemsForDate = (date: Date): CalendarItem[] => {
    const dateStr = date.toISOString().split('T')[0]
    return items.filter(item => {
      const start = new Date(item.dateStart)
      const end = item.dateEnd ? new Date(item.dateEnd) : new Date(item.dateStart)
      const checkDate = new Date(dateStr)
      return checkDate >= start && checkDate <= end
    })
  }

  const getItemColor = (type: string, status?: string) => {
    // Only bookings are shown, but handle status for visual distinction
    if (type === 'booking') {
      switch (status) {
        case 'confirmed':
          return 'bg-[#2563EB] text-white border-[#2563EB]/30'
        case 'cancelled':
          return 'bg-[#64748B] text-white border-[#64748B]/30 opacity-60'
        case 'completed':
          return 'bg-[#10B981] text-white border-[#10B981]/30'
        default:
          return 'bg-[#2563EB] text-white border-[#2563EB]/30'
      }
    }
    return 'bg-[#2563EB] text-white border-[#2563EB]/30'
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
    const dayItems = getItemsForDate(date)
    const today = isToday(date)
    const maxVisible = 3

    days.push(
      <div
        key={day}
        className={`relative aspect-square p-1 border border-[#E2E8F0] rounded-lg transition-all duration-150 ${
          today ? 'ring-1 ring-[#F59E0B] ring-offset-1' : ''
        } ${dayItems.length > 0 ? 'bg-[#F8FAFC]' : 'bg-white hover:bg-[#F8FAFC]'}`}
      >
        <div className="flex flex-col h-full">
          <span className={`text-[11px] font-semibold mb-1 ${today ? 'text-[#F59E0B]' : 'text-[#0F172A]'}`}>
            {day}
          </span>
          <div className="flex-1 space-y-0.5 overflow-hidden">
            {dayItems.slice(0, maxVisible).map(item => (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium truncate ${getItemColor(item.type, item.status)} hover:opacity-90 transition-opacity`}
                title={item.title}
              >
                {item.title}
              </button>
            ))}
            {dayItems.length > maxVisible && (
              <button
                onClick={() => {
                  // Show all items for this date
                  const allItems = getItemsForDate(date)
                  if (allItems.length > 0) {
                    onItemClick(allItems[0])
                  }
                }}
                className="w-full text-left px-1.5 py-0.5 rounded text-[9px] font-medium text-[#64748B] hover:text-[#0F172A]"
              >
                +{dayItems.length - maxVisible} más
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#0F172A]">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-xs text-[#64748B]">{t('calendar.subtitle')}</p>
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
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-[#64748B] py-2 tracking-wide">
              {day}
            </div>
          ))}
          {days}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E2E8F0] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#2563EB]" />
            <span className="text-[#64748B] font-medium">{t('calendar.legendConfirmed')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#10B981]" />
            <span className="text-[#64748B] font-medium">{t('calendar.legendCompleted')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#64748B] opacity-60" />
            <span className="text-[#64748B] font-medium">{t('calendar.legendCancelled')}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

