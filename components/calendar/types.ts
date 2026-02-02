export type CalendarItemType = 'booking' | 'plan' | 'task'

export interface CalendarItem {
  id: string
  type: CalendarItemType
  dateStart: string
  dateEnd?: string
  title: string
  subtitle?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: string
  meta?: any
}

