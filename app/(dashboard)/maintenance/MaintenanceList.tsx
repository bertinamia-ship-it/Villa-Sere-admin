'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenanceTicket, Vendor } from '@/lib/types/database'
import { ROOMS, PRIORITIES, TICKET_STATUSES } from '@/lib/constants'
import { Plus, Search, Filter, AlertCircle } from 'lucide-react'
import TicketCard from './TicketCard'
import TicketForm from './TicketForm'

export default function MaintenanceList() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredTickets, setFilteredTickets] = useState<MaintenanceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter, priorityFilter, roomFilter])

  const fetchData = async () => {
    setLoading(true)
    const [ticketsResult, vendorsResult] = await Promise.all([
      supabase.from('maintenance_tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('vendors').select('*').order('company_name')
    ])

    if (ticketsResult.data) setTickets(ticketsResult.data)
    if (vendorsResult.data) setVendors(vendorsResult.data)
    setLoading(false)
  }

  const filterTickets = () => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter)
    }

    if (roomFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.room === roomFilter)
    }

    setFilteredTickets(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return

    const { error } = await supabase
      .from('maintenance_tickets')
      .delete()
      .eq('id', id)

    if (!error) {
      setTickets(tickets.filter(ticket => ticket.id !== id))
    }
  }

  const handleEdit = (ticket: MaintenanceTicket) => {
    setEditingTicket(ticket)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTicket(null)
    fetchData()
  }

  const getVendorName = (vendorId: string | null): string | null => {
    if (!vendorId) return null
    return vendors.find(v => v.id === vendorId)?.company_name || null
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-600 bg-green-50'
      case 'in_progress': return 'text-blue-600 bg-blue-50'
      case 'open': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  const openTickets = tickets.filter(t => t.status !== 'done').length
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'done').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-1">
            {openTickets} open • {urgentTickets} urgent
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">All Priorities</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">All Rooms</option>
              {ROOMS.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No tickets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              vendorName={getVendorName(ticket.vendor_id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <TicketForm
          ticket={editingTicket}
          vendors={vendors}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
