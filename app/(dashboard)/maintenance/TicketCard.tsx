'use client'

import { MaintenanceTicket } from '@/lib/types/database'
import { Pencil, Trash2, Calendar, DollarSign, Image as ImageIcon } from 'lucide-react'
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/constants'
import { useI18n } from '@/components/I18nProvider'

interface TicketCardProps {
  ticket: MaintenanceTicket
  vendorName: string | null
  onEdit: (ticket: MaintenanceTicket) => void
  onDelete: (id: string) => void
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: string) => string
}

export default function TicketCard({
  ticket,
  vendorName,
  onEdit,
  onDelete,
  getPriorityColor,
  getStatusColor
}: TicketCardProps) {
  const { t } = useI18n()
  return (
    <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-md hover:border-[#D1D5DB] transition-all duration-200 ease-out p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-base mb-2">{ticket.title}</h3>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
              {STATUS_LABELS[ticket.status] || ticket.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {PRIORITY_LABELS[ticket.priority] || ticket.priority}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-50">
              {ticket.room}
            </span>
          </div>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button
            onClick={() => onEdit(ticket)}
            className="p-2 sm:p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded transition-all duration-150 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label={t('common.edit')}
          >
            <Pencil className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
          <button
            onClick={() => onDelete(ticket.id)}
            className="p-2 sm:p-1.5 text-slate-500 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-all duration-150 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2.5 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>{new Date(ticket.date).toLocaleDateString()}</span>
        </div>

        {vendorName && (
          <div className="text-slate-700">
            <span className="font-medium">{t('maintenance.provider')}</span> {vendorName}
          </div>
        )}

        {ticket.cost && (
          <div className="flex items-center gap-2 text-[#10B981]">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">${Number(ticket.cost).toFixed(2)}</span>
          </div>
        )}

        {ticket.notes && (
          <p className="text-slate-600 mt-3 pt-3 border-t border-[#E5E7EB]">
            {ticket.notes}
          </p>
        )}

        {ticket.photo_url && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={ticket.photo_url} 
              alt={t('maintenance.ticketPhoto')} 
              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
              onClick={() => window.open(ticket.photo_url!, '_blank')}
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
      </div>
    </div>
  )
}
