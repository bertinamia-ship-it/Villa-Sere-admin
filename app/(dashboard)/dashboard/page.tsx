import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getActiveProperty, getActivePropertyId } from '@/lib/utils/property'
import { 
  Package, 
  Wrench, 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  TrendingUp,
  ShoppingCart,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import ResetDataButton from './ResetDataButton'
import { t } from '@/lib/i18n/es'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to check role and tenant_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[Dashboard] Error fetching profile:', {
      message: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code
    })
  }

  // CRITICAL: Check for tenant_id
  if (!profile || !profile.tenant_id) {
    console.error('[Dashboard] CRITICAL: No profile or tenant_id found:', {
      user_id: user.id,
      profile_exists: !!profile,
      tenant_id: profile?.tenant_id,
      error: 'User account is missing tenant_id. This should never happen after signup.'
    })
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.overview')}</p>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">{t('dashboard.accountConfigError')}</h3>
          <p className="text-red-700 mb-4">
            {t('dashboard.accountConfigMessage', { email: user.email })}
          </p>
          <p className="text-sm text-red-600 mb-4">
            {t('dashboard.accountConfigDetails')}
          </p>
          <code className="block bg-red-100 p-3 rounded text-xs text-left overflow-x-auto mb-4">
            UPDATE profiles SET tenant_id = (SELECT id FROM tenants WHERE owner_id = '{user.id}') WHERE id = '{user.id}';
          </code>
        </div>
      </div>
    )
  }

  // Get active property ID and property object
  const propertyId = await getActivePropertyId()
  const activeProperty = await getActiveProperty()
  const propertyName = activeProperty?.name || 'CasaPilot'

  // If no property, show empty state with CTA
  if (!propertyId || !activeProperty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">{t('dashboard.overview')}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('dashboard.noPropertyTitle')}</h3>
          <p className="text-blue-700 mb-4">
            {t('dashboard.noPropertyDescription')}
          </p>
          <p className="text-sm text-blue-600">
            {t('dashboard.createProperty')}
          </p>
        </div>
      </div>
    )
  }

  // Fetch all data in parallel (with property_id filter)
  const [
    inventoryResult,
    ticketsResult,
    expensesResult,
    bookingsResult,
    purchaseItemsResult
  ] = await Promise.all([
    propertyId 
      ? supabase.from('inventory_items').select('id, name, quantity, min_threshold, category').eq('property_id', propertyId).order('name')
      : { data: [], error: null },
    propertyId
      ? supabase.from('maintenance_tickets').select('id, title, status, priority, date, room').eq('property_id', propertyId).order('date', { ascending: false })
      : { data: [], error: null },
    propertyId
      ? supabase.from('expenses').select('amount, date, category').eq('property_id', propertyId)
      : { data: [], error: null },
    propertyId
      ? supabase.from('bookings').select('id, guest_name, check_in, check_out, total_amount, status').eq('property_id', propertyId).order('check_in', { ascending: true })
      : { data: [], error: null },
    propertyId
      ? supabase.from('purchase_items').select('id, item, status').eq('property_id', propertyId).order('created_at', { ascending: false })
      : { data: [], error: null }
  ])

  // Process inventory data
  const lowStockItems = inventoryResult.data?.filter(
    item => item.quantity <= item.min_threshold
  ) || []
  const totalItems = inventoryResult.data?.length || 0

  // Process maintenance tickets
  const openTickets = ticketsResult.data?.filter(
    ticket => ticket.status !== 'done'
  ) || []
  const urgentTickets = ticketsResult.data?.filter(
    ticket => ticket.priority === 'urgent' && ticket.status !== 'done'
  ) || []
  const totalTickets = ticketsResult.data?.length || 0

  // Process bookings
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingBookings = bookingsResult.data?.filter(
    booking => {
      const checkIn = new Date(booking.check_in)
      return checkIn >= now && checkIn <= nextWeek && booking.status === 'confirmed'
    }
  ).slice(0, 5) || []

  // Calculate current month expenses and income
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthExpenses = expensesResult.data?.filter(
    exp => new Date(exp.date) >= firstDay
  ) || []
  const monthTotal = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  const monthBookings = bookingsResult.data?.filter(
    booking => {
      const checkIn = new Date(booking.check_in)
      return checkIn >= firstDay && booking.status === 'confirmed'
    }
  ) || []
  const monthIncome = monthBookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0)
  const monthProfit = monthIncome - monthTotal

  // Process purchase items
  const pendingPurchases = purchaseItemsResult.data?.filter(
    item => item.status === 'to_buy'
  ).slice(0, 5) || []

  return (
    <div className="space-y-8">
      {/* Role Info Banner */}
      {profile?.role !== 'admin' && (
        <Card padding="md" className="bg-blue-50/50 border-blue-200/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 stroke-[1.5]" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-[#0F172A]">{t('dashboard.staffAccount')}</h3>
              <p className="text-xs text-[#64748B] mt-1">
                {t('dashboard.staffAccountMessage')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Hero Summary - 3 métricas principales */}
      <Card padding="lg" className="bg-gradient-to-br from-white to-gray-50/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Ingresos */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Ingresos</p>
              <p className="text-3xl font-bold text-[#0F172A] mb-1">
                {monthIncome > 0 ? `$${monthIncome.toFixed(0)}` : '—'}
              </p>
              <p className="text-xs text-slate-500">Este mes</p>
            </div>
          </div>

          {/* Gastos */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <ArrowDownRight className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Gastos</p>
              <p className="text-3xl font-bold text-[#0F172A] mb-1">
                {monthTotal > 0 ? `$${monthTotal.toFixed(0)}` : '—'}
              </p>
              <p className="text-xs text-slate-500">Este mes</p>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${monthProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <TrendingUp className={`h-5 w-5 ${monthProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Balance</p>
              <p className={`text-3xl font-bold mb-1 ${monthProfit >= 0 ? 'text-emerald-600' : monthProfit < 0 ? 'text-red-600' : 'text-[#0F172A]'}`}>
                {monthProfit !== 0 ? `$${Math.abs(monthProfit).toFixed(0)}` : '—'}
              </p>
              <p className="text-xs text-slate-500">Este mes</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rentas */}
        <Link href="/rentals" className="block">
          <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 group" padding="md">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Rentas</p>
                <p className="text-2xl font-bold text-[#0F172A] mb-1">{monthBookings.length}</p>
                <p className="text-xs text-slate-500">Este mes</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors duration-200 shrink-0">
                <Calendar className="h-5 w-5 text-blue-600 stroke-[1.5]" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Mantenimiento */}
        <Link href="/maintenance" className="block">
          <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-amber-500 group" padding="md">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Mantenimiento</p>
                <p className="text-2xl font-bold text-[#0F172A] mb-1">{openTickets.length}</p>
                {urgentTickets.length > 0 ? (
                  <p className="text-xs text-amber-600 font-medium">{urgentTickets.length} urgentes</p>
                ) : (
                  <p className="text-xs text-slate-500">Pendientes</p>
                )}
              </div>
              <div className="p-3 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors duration-200 shrink-0">
                <Wrench className="h-5 w-5 text-amber-600 stroke-[1.5]" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Inventario */}
        <Link href="/inventory" className="block">
          <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-emerald-500 group" padding="md">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Inventario</p>
                <p className="text-2xl font-bold text-[#0F172A] mb-1">{totalItems}</p>
                {lowStockItems.length > 0 ? (
                  <p className="text-xs text-red-600 font-medium">{lowStockItems.length} bajo stock</p>
                ) : (
                  <p className="text-xs text-slate-500">Total items</p>
                )}
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors duration-200 shrink-0">
                <Package className="h-5 w-5 text-emerald-600 stroke-[1.5]" />
              </div>
            </div>
          </Card>
        </Link>

        {/* To-Buy */}
        <Link href="/to-buy" className="block">
          <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-500 group" padding="md">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Compras</p>
                <p className="text-2xl font-bold text-[#0F172A] mb-1">{pendingPurchases.length}</p>
                <p className="text-xs text-slate-500">Pendientes</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors duration-200 shrink-0">
                <ShoppingCart className="h-5 w-5 text-purple-600 stroke-[1.5]" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Próximos Eventos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A]">Próximos Eventos</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Próximas Rentas */}
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 stroke-[1.5]" />
                  Próximas Rentas
                </CardTitle>
                <Link href="/rentals">
                  <Button size="sm" variant="ghost" className="text-xs">
                    Ver todas
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-2">
                  {upcomingBookings.slice(0, 6).map((booking) => {
                    const checkIn = new Date(booking.check_in)
                    const checkOut = new Date(booking.check_out)
                    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <Link
                        key={booking.id}
                        href="/rentals"
                        className="block p-3 rounded-lg border border-gray-200/60 hover:border-blue-300/60 hover:bg-gray-50/50 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[#0F172A] truncate">{booking.guest_name || t('dashboard.guest')}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {checkIn.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} • {nights} {nights === 1 ? 'noche' : 'noches'}
                            </p>
                          </div>
                          <p className="font-semibold text-sm text-blue-600 shrink-0">${Number(booking.total_amount || 0).toFixed(0)}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">{t('dashboard.noUpcomingBookings')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tickets Urgentes */}
          <Card padding="md" className={urgentTickets.length > 0 ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 stroke-[1.5]" />
                Tickets Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentTickets.length > 0 ? (
                <div className="space-y-2">
                  {urgentTickets.slice(0, 6).map((ticket) => (
                    <Link
                      key={ticket.id}
                      href="/maintenance"
                      className="block p-3 rounded-lg bg-white border border-gray-200/60 hover:border-red-300/60 hover:bg-gray-50/50 transition-all duration-200"
                    >
                      <p className="font-medium text-sm text-[#0F172A]">{ticket.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ticket.room}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs">No hay tickets urgentes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-50/50 border-gray-200/60" padding="md">
        <CardHeader>
          <CardTitle className="text-sm">{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/rentals">
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 stroke-[1.5]" />
                {t('dashboard.newBooking')}
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 stroke-[1.5]" />
                {t('dashboard.addExpense')}
              </Button>
            </Link>
            <Link href="/maintenance">
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 stroke-[1.5]" />
                {t('dashboard.newTicket')}
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="secondary" size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4 stroke-[1.5]" />
                {t('dashboard.addItem')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Admin Tools - Only visible to admins */}
      {profile?.role === 'admin' && (
        <ResetDataButton />
      )}
    </div>
  )
}
