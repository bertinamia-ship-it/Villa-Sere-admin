'use client'

import { Booking } from '@/lib/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Edit, Trash2, Calendar, DollarSign } from 'lucide-react'

interface BookingListProps {
  bookings: Booking[]
  onEdit: (booking: Booking) => void
  onDelete: (id: string) => void
}

export default function BookingList({ bookings, onEdit, onDelete }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No bookings yet"
          description="Add your first booking to start tracking rental income"
        />
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-700 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
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
        <Card key={booking.id} padding="sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {booking.guest_name || 'Guest'}
                  </h3>
                  <p className="text-sm text-gray-600">{booking.platform}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Check-In</p>
                  <p className="font-medium text-gray-900">
                    {new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Check-Out</p>
                  <p className="font-medium text-gray-900">
                    {new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Nights</p>
                  <p className="font-medium text-gray-900">
                    {calculateNights(booking.check_in, booking.check_out)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-medium text-gray-900">
                    ${(booking.total_amount + booking.cleaning_fee).toFixed(2)}
                  </p>
                </div>
              </div>

              {booking.notes && (
                <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                  {booking.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(booking)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(booking.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
