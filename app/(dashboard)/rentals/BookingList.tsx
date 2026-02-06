'use client'

import { Booking } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Edit, Trash2, Calendar, DollarSign } from 'lucide-react'
import { useI18n } from '@/components/I18nProvider'

interface BookingListProps {
  bookings: Booking[]
  onEdit: (booking: Booking) => void
  onDelete: (id: string) => void
}

export default function BookingList({ bookings, onEdit, onDelete }: BookingListProps) {
  const { t } = useI18n()
  
  if (bookings.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title={t('rentals.noBookings')}
          description={t('rentals.noBookingsDescription')}
        />
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20'
      case 'completed': return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
      case 'cancelled': return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Card key={booking.id} padding="md" className="hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">
                    {booking.guest_name || t('rentals.guest')}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">{booking.platform}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                  {booking.status === 'confirmed' ? t('rentals.confirmed') : booking.status === 'completed' ? t('rentals.completed') : booking.status === 'cancelled' ? t('rentals.cancelled') : booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('rentals.checkIn')}</p>
                  <p className="font-medium text-slate-900">
                    {new Date(booking.check_in).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('rentals.checkOut')}</p>
                  <p className="font-medium text-slate-900">
                    {new Date(booking.check_out).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('rentals.nights')}</p>
                  <p className="font-medium text-slate-900">
                    {calculateNights(booking.check_in, booking.check_out)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{t('rentals.total')}</p>
                  <p className="font-medium text-slate-900">
                    ${(booking.total_amount + booking.cleaning_fee).toFixed(2)}
                  </p>
                </div>
              </div>

              {booking.notes && (
                <p className="text-sm text-slate-600 pt-3 border-t border-[#E5E7EB]">
                  {booking.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(booking)}
                className="hover:bg-blue-50 hover:text-blue-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              >
                <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(booking.id)}
                className="hover:bg-red-50 hover:text-red-600 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
              >
                <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
