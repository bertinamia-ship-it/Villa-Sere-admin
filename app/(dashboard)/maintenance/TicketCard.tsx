'use client'

import { MaintenanceTicket } from '@/lib/types/database'
import { Pencil, Trash2, Calendar, DollarSign, Image as ImageIcon } from 'lucide-react'

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
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-2">{ticket.title}</h3>
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-50">
              {ticket.room}
            </span>
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => onEdit(ticket)}
            className="p-1 text-gray-600 hover:text-blue-600 transition"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(ticket.id)}
            className="p-1 text-gray-600 hover:text-red-600 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{new Date(ticket.date).toLocaleDateString()}</span>
        </div>

        {vendorName && (
          <div className="text-gray-700">
            <span className="font-medium">Vendor:</span> {vendorName}
          </div>
        )}

        {ticket.cost && (
          <div className="flex items-center gap-2 text-green-700">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">${Number(ticket.cost).toFixed(2)}</span>
          </div>
        )}

        {ticket.notes && (
          <p className="text-gray-600 mt-2 pt-2 border-t border-gray-200">
            {ticket.notes}
          </p>
        )}

        {ticket.photo_url && (
          <div className="mt-3">
            <img 
              src={ticket.photo_url} 
              alt="Ticket photo" 
              className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
              onClick={() => window.open(ticket.photo_url!, '_blank')}
            />
          </div>
        )}
      </div>
    </div>
  )
}
