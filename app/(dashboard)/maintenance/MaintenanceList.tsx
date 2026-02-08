'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MaintenanceTicket, Vendor } from '@/lib/types/database'
import { ROOMS, PRIORITIES, PRIORITY_LABELS } from '@/lib/constants'
import { Plus, Search, AlertCircle, Wrench, CalendarCheck } from 'lucide-react'
import TicketCard from './TicketCard'
import TicketForm from './TicketForm'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/components/I18nProvider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type TabType = 'tickets' | 'recurrent'

export default function MaintenanceList() {
  const { t } = useI18n()
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
  const [activeTab, setActiveTab] = useState<TabType>('tickets')
  const pathname = usePathname()
  const supabase = createClient()

  // Determine active tab based on pathname
  useEffect(() => {
    if (pathname === '/maintenance-plans') {
      setActiveTab('recurrent')
    } else {
      setActiveTab('tickets')
    }
  }, [pathname])

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
        const { logError } = await import('@/lib/utils/error-handler')
        logError('MaintenanceList.loadTickets.profile', profileError)
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

  const handleEdit = (ticket: MaintenanceTicket) => {
    setEditingTicket(ticket)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTicket(null)
    fetchData()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-[#EF4444] bg-[#EF4444]/10'
      case 'high': return 'text-[#F59E0B] bg-[#F59E0B]/10'
      case 'medium': return 'text-[#2563EB] bg-[#2563EB]/10'
      case 'low': return 'text-[#10B981] bg-[#10B981]/10'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-[#10B981] bg-[#10B981]/10'
      case 'in_progress': return 'text-[#2563EB] bg-[#2563EB]/10'
      case 'open': return 'text-slate-600 bg-slate-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader title={t('maintenance.title')} subtitle={t('maintenance.subtitle')} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton variant="rectangular" height={120} className="rounded-lg" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader title={t('maintenance.title')} subtitle={t('maintenance.subtitle')} />
        <Card padding="lg">
          <EmptyState
            icon={<AlertCircle className="h-14 w-14" />}
            title={t('maintenance.noPropertySelected')}
            description={t('maintenance.selectOrCreatePropertyMaintenance')}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <PageHeader
        title={t('maintenance.title')}
        subtitle={t('maintenance.subtitle')}
        rightSlot={
          activeTab === 'tickets' ? (
            <Button
              onClick={() => {
                setEditingTicket(null)
                setShowForm(true)
              }}
              size="sm"
              className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
            >
              <Plus className="h-4 w-4" />
              {t('maintenance.newTicket')}
            </Button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E2E8F0] -mb-px">
        <Link
          href="/maintenance"
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
            activeTab === 'tickets'
              ? 'border-[#0F172A] text-[#0F172A]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span>{t('maintenance.tickets')}</span>
          </div>
        </Link>
        <Link
          href="/maintenance-plans"
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
            activeTab === 'recurrent'
              ? 'border-[#0F172A] text-[#0F172A]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span>{t('maintenancePlans.title')}</span>
          </div>
        </Link>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'tickets' ? (
        <>
          {/* Filters */}
          <Card padding="md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5 space-y-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none" />
                <input
                  type="text"
                  placeholder={t('maintenance.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 sm:py-2.5 text-base sm:text-sm border border-[#E2E8F0] rounded-lg bg-white focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all text-[#0F172A] placeholder-[#94A3B8] min-h-[44px] sm:min-h-0"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-3 sm:py-2.5 text-base sm:text-sm border border-[#E2E8F0] rounded-lg bg-white focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all text-[#0F172A] min-h-[44px] sm:min-h-0"
              >
                <option value="all">{t('maintenance.allStatuses')}</option>
                <option value="open">{t('status.open')}</option>
                <option value="in_progress">{t('status.inProgress')}</option>
                <option value="done">{t('status.done')}</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-3 sm:py-2.5 text-base sm:text-sm border border-[#E2E8F0] rounded-lg bg-white focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all text-[#0F172A] min-h-[44px] sm:min-h-0"
              >
                <option value="all">{t('maintenance.allPriorities')}</option>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="px-3 py-3 sm:py-2.5 text-base sm:text-sm border border-[#E2E8F0] rounded-lg bg-white focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all text-[#0F172A] min-h-[44px] sm:min-h-0"
              >
                <option value="all">{t('maintenance.allRooms')}</option>
                {ROOMS.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Tickets List */}
          {filteredTickets.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={<Wrench className="h-14 w-14" />}
                title={tickets.length === 0 ? t('maintenance.emptyTitle') : t('maintenance.noTicketsFound')}
                description={tickets.length === 0 ? t('maintenance.emptyDescription') : t('maintenance.tryDifferentFilters')}
                actionLabel={tickets.length === 0 ? t('maintenance.emptyAction') : undefined}
                onAction={tickets.length === 0 ? () => setShowForm(true) : undefined}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  vendorName={vendors.find(v => v.id === ticket.vendor_id)?.company_name || null}
                  onEdit={handleEdit}
                  onDelete={async (id: string) => {
                    const propertyId = await getActivePropertyId()
                    if (!propertyId) return
                    const { error } = await supabase
                      .from('maintenance_tickets')
                      .delete()
                      .eq('id', id)
                      .eq('property_id', propertyId)
                    if (!error) {
                      fetchData()
                    }
                  }}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-[#64748B]">
          <p>{t('maintenancePlans.redirecting')}</p>
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
