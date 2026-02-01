'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenanceTicket, Vendor } from '@/lib/types/database'
import { ROOMS, PRIORITIES, PRIORITY_LABELS } from '@/lib/constants'
import { Plus, Search, AlertCircle } from 'lucide-react'
import TicketCard from './TicketCard'
import TicketForm from './TicketForm'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { t } from '@/lib/i18n/es'

export default function MaintenanceList() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredTickets, setFilteredTickets] = useState<MaintenanceTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [hasProperty, setHasProperty] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    const propertyId = await getActivePropertyId()
    
    if (!propertyId) {
      setTickets([])
      setVendors([])
      setHasProperty(false)
      setLoading(false)
      return
    }

    setHasProperty(true)
    
    // Get tenant_id for vendors (vendors shared by tenant, not property)
    const { data: { user } } = await supabase.auth.getUser()
    let tenantId: string | null = null
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profileError) {
        console.error('[MaintenanceList] Error fetching profile:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
      }
      
      tenantId = profile?.tenant_id || null
    }
    
    // Tickets filtered by property_id, vendors shared (only tenant_id)
    const [ticketsResult, vendorsResult] = await Promise.all([
      supabase.from('maintenance_tickets').select('*').eq('property_id', propertyId).order('created_at', { ascending: false }),
      tenantId
        ? supabase.from('vendors').select('*').eq('tenant_id', tenantId).order('company_name')
        : { data: [], error: null }
    ])

    if (ticketsResult.data) setTickets(ticketsResult.data)
    if (vendorsResult.data) setVendors(vendorsResult.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    
    // Listen for property changes
    const handlePropertyChange = () => {
      fetchData()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter, priorityFilter, roomFilter])

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
    if (!confirm('¿Estás seguro de que quieres eliminar este ticket?')) return

    const propertyId = await getActivePropertyId()
    if (!propertyId) return

    const { error } = await supabase
      .from('maintenance_tickets')
      .delete()
      .eq('id', id)
      .eq('property_id', propertyId)

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
      case 'urgent': return 'text-[#EF4444] bg-[#EF4444]/10'
      case 'high': return 'text-[#F59E0B] bg-[#F59E0B]/10'
      case 'medium': return 'text-[#F59E0B] bg-[#F59E0B]/10'
      case 'low': return 'text-[#10B981] bg-[#10B981]/10'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-[#10B981] bg-[#10B981]/10'
      case 'in_progress': return 'text-[#2563EB] bg-[#2563EB]/10'
      case 'open': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-gray-600 mt-1">Gestiona tickets de mantenimiento</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="50%" height={20} />
                  <Skeleton variant="text" width="30%" height={16} />
                </div>
                <Skeleton variant="circular" width={24} height={24} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-gray-600 mt-1">Gestiona tickets de mantenimiento</p>
        </div>
        <EmptyState
          icon={<AlertCircle className="h-12 w-12" />}
          title={t('maintenance.noPropertySelected')}
          description={t('maintenance.noPropertyDescription')}
        />
      </div>
    )
  }

  const openTickets = tickets.filter(t => t.status !== 'done').length
  const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'done').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-gray-600 mt-1">
            {openTickets} abiertos • {urgentTickets} urgentes
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          {t('maintenance.addTicket')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('maintenance.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('maintenance.status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">{t('maintenance.allStatuses')}</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="done">Completado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('maintenance.priority')}</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">{t('maintenance.allPriorities')}</option>
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('maintenance.room')}</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">{t('maintenance.allRooms')}</option>
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
          <p className="text-gray-600">{t('maintenance.noTicketsFound')}</p>
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
