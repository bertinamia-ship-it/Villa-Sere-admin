'use client'

import { CalendarItem } from './types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { t } from '@/lib/i18n/es'
import { ExternalLink, Calendar as CalendarIcon } from 'lucide-react'

interface CalendarItemModalProps {
  item: CalendarItem | null
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function CalendarItemModal({ item, isOpen, onClose, onRefresh }: CalendarItemModalProps) {
  const router = useRouter()

  if (!item || item.type !== 'booking') return null

  const booking = item.meta

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item.title}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-[#64748B] mb-2">
            {t('calendar.bookingDetails')}
          </p>
          {item.subtitle && (
            <p className="text-base font-semibold text-[#0F172A] mb-2">
              {t('calendar.total')}: {item.subtitle}
            </p>
          )}
          <div className="space-y-1 text-sm text-[#64748B]">
            <p>
              <span className="font-medium text-[#0F172A]">{t('rentals.checkIn')}:</span>{' '}
              {new Date(item.dateStart).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {item.dateEnd && (
              <p>
                <span className="font-medium text-[#0F172A]">{t('rentals.checkOut')}:</span>{' '}
                {new Date(item.dateEnd).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
            {booking?.platform && (
              <p>
                <span className="font-medium text-[#0F172A]">{t('rentals.platform')}:</span>{' '}
                {booking.platform}
              </p>
            )}
            {item.status && (
              <p>
                <span className="font-medium text-[#0F172A]">{t('common.status')}:</span>{' '}
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  item.status === 'confirmed' 
                    ? 'bg-[#10B981]/10 text-[#10B981]'
                    : item.status === 'cancelled'
                    ? 'bg-[#64748B]/10 text-[#64748B]'
                    : 'bg-[#2563EB]/10 text-[#2563EB]'
                }`}>
                  {item.status === 'confirmed' ? t('rentals.statusConfirmed') : 
                   item.status === 'cancelled' ? t('rentals.statusCancelled') : 
                   t('rentals.statusCompleted')}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2E8F0]">
          <Button
            variant="secondary"
            onClick={() => {
              router.push(`/rentals`)
              onClose()
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('calendar.viewBooking')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
