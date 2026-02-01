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
  ArrowRight
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
          <h1 className="text-lg font-semibold text-[#0F172A]">{t('dashboard.title')}</h1>
          <p className="text-xs text-[#64748B] mt-0.5">{t('dashboard.subtitle', { propertyName })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/rentals">
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.newBooking')}</span>
              <span className="sm:hidden">{t('rentals.title')}</span>
            </Button>
          </Link>
          <Link href="/expenses">
            <Button size="sm" variant="secondary" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.addExpense')}</span>
              <span className="sm:hidden">{t('dashboard.expenses')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Role Info Banner */}
      {profile?.role !== 'admin' && (
        <div className="bg-[#2563EB]/10 border border-[#2563EB]/20 rounded-md p-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-[#2563EB] mt-0.5 stroke-[1.5]" />
            <div className="flex-1">
              <h3 className="text-xs font-medium text-[#0F172A]">{t('dashboard.staffAccount')}</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                {t('dashboard.staffAccountMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/inventory" className="block">
          <Card className="hover:shadow-sm transition-all duration-150 border-l-2 border-l-[#2563EB] group" padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Inventario</p>
                <p className="text-xl font-bold text-[#0F172A] mt-1">{totalItems}</p>
                {lowStockItems.length > 0 && (
                  <p className="text-[10px] text-[#EF4444] mt-1 font-medium">
                    {lowStockItems.length} necesitan reabastecimiento
                  </p>
                )}
              </div>
              <div className="p-2 bg-[#2563EB]/10 rounded-md group-hover:bg-[#2563EB]/15 transition-colors duration-150">
                <Package className="h-5 w-5 text-[#2563EB] stroke-[1.5]" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/maintenance" className="block">
          <Card className="hover:shadow-sm transition-all duration-150 border-l-2 border-l-[#F59E0B] group" padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Mantenimiento</p>
                <p className="text-xl font-bold text-[#0F172A] mt-1">{openTickets.length}</p>
                {urgentTickets.length > 0 && (
                  <p className="text-[10px] text-[#F59E0B] mt-1 font-medium">
                    {urgentTickets.length} urgentes
                  </p>
                )}
              </div>
              <div className="p-2 bg-[#F59E0B]/10 rounded-md group-hover:bg-[#F59E0B]/15 transition-colors duration-150">
                <Wrench className="h-5 w-5 text-[#F59E0B] stroke-[1.5]" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/expenses" className="block">
          <Card className="hover:shadow-sm transition-all duration-150 border-l-2 border-l-[#22C55E] group" padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Este Mes</p>
                <p className="text-xl font-bold text-[#0F172A] mt-1">
                  ${monthTotal.toFixed(0)}
                </p>
                <p className="text-[10px] text-[#64748B] mt-1">Gastos</p>
              </div>
              <div className="p-2 bg-[#22C55E]/10 rounded-md group-hover:bg-[#22C55E]/15 transition-colors duration-150">
                <DollarSign className="h-5 w-5 text-[#22C55E] stroke-[1.5]" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/rentals" className="block">
          <Card className="hover:shadow-sm transition-all duration-150 border-l-2 border-l-[#2563EB] group" padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Este Mes</p>
                <p className="text-xl font-bold text-[#0F172A] mt-1">
                  ${monthIncome.toFixed(0)}
                </p>
                <p className="text-[10px] text-[#64748B] mt-1">Ingresos</p>
              </div>
              <div className="p-2 bg-[#2563EB]/10 rounded-md group-hover:bg-[#2563EB]/15 transition-colors duration-150">
                <TrendingUp className="h-5 w-5 text-[#2563EB] stroke-[1.5]" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Profit Card */}
      {monthProfit !== 0 && (
        <Card className={`border-l-2 ${monthProfit >= 0 ? 'border-l-[#22C55E] bg-[#22C55E]/5' : 'border-l-[#EF4444] bg-[#EF4444]/5'}`} padding="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">Ganancia Neta</p>
              <p className={`text-2xl font-bold mt-1 ${monthProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                ${Math.abs(monthProfit).toFixed(0)}
              </p>
              <p className="text-[10px] text-[#64748B] mt-1">Este Mes</p>
            </div>
            <div className={`p-2 rounded-md ${monthProfit >= 0 ? 'bg-[#22C55E]/10' : 'bg-[#EF4444]/10'}`}>
              <TrendingUp className={`h-5 w-5 stroke-[1.5] ${monthProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`} />
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Bookings */}
        <Card className="lg:col-span-2" padding="sm">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-[#2563EB] stroke-[1.5]" />
                {t('dashboard.upcomingBookings')} ({t('dashboard.upcomingBookingsSubtitle')})
              </CardTitle>
              <Link href="/rentals">
                <Button size="sm" variant="ghost" className="text-xs">
                  {t('dashboard.viewAll')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const checkIn = new Date(booking.check_in)
                  const checkOut = new Date(booking.check_out)
                  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <Link
                      key={booking.id}
                      href="/rentals"
                      className="block p-3 rounded-md border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#0F172A]">{booking.guest_name || t('dashboard.guest')}</p>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {checkIn.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} - {checkOut.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} • {nights} {nights === 1 ? 'noche' : 'noches'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-[#2563EB]">${Number(booking.total_amount || 0).toFixed(0)}</p>
        </div>
      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-[#64748B]">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-[#E2E8F0]" />
                <p className="text-xs">{t('dashboard.noUpcomingBookings')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-4">
          {/* Urgent Tickets */}
          {urgentTickets.length > 0 && (
            <Card className="border-l-2 border-l-[#EF4444] bg-[#EF4444]/5" padding="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-[#EF4444]">
                  <AlertTriangle className="h-4 w-4 stroke-[1.5]" />
                  Tickets Urgentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {urgentTickets.slice(0, 3).map((ticket) => (
                    <Link
                      key={ticket.id}
                      href="/maintenance"
                      className="block p-2 rounded-md bg-white border border-[#E2E8F0] hover:border-[#EF4444] transition-all duration-150"
                    >
                      <p className="font-medium text-xs text-[#0F172A]">{ticket.title}</p>
                      <p className="text-[10px] text-[#64748B] mt-0.5">{ticket.room}</p>
                    </Link>
                  ))}
                  {urgentTickets.length > 3 && (
                    <Link href="/maintenance" className="text-xs text-[#EF4444] font-medium hover:underline">
                      +{t('dashboard.moreUrgentTickets', { count: urgentTickets.length - 3 })}
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Items */}
          {lowStockItems.length > 0 && (
            <Card className="border-l-2 border-l-[#F59E0B] bg-[#F59E0B]/5" padding="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-[#F59E0B]">
                  <Package className="h-4 w-4 stroke-[1.5]" />
                  {t('dashboard.lowStockAlert')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href="/inventory"
                      className="block p-2 rounded-md bg-white border border-[#E2E8F0] hover:border-[#F59E0B] transition-all duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-xs text-[#0F172A]">{item.name}</p>
                        <p className="text-[10px] font-bold text-[#F59E0B]">{item.quantity} {t('dashboard.left')}</p>
                      </div>
                    </Link>
                  ))}
                  {lowStockItems.length > 3 && (
                    <Link href="/inventory" className="text-xs text-[#F59E0B] font-medium hover:underline">
                      +{t('dashboard.moreItems', { count: lowStockItems.length - 3 })}
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* To Buy List */}
          {pendingPurchases.length > 0 && (
            <Card padding="sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="h-4 w-4 text-[#2563EB] stroke-[1.5]" />
                  Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {pendingPurchases.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href="/to-buy"
                      className="block p-2 rounded-md border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all duration-150"
                    >
                      <p className="font-medium text-xs text-[#0F172A]">{item.item}</p>
                    </Link>
                  ))}
                  {pendingPurchases.length > 3 && (
                    <Link href="/to-buy" className="text-xs text-[#2563EB] font-medium hover:underline">
                      +{pendingPurchases.length - 3} artículos más
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[#F8FAFC] border-[#E2E8F0]" padding="sm">
        <CardHeader>
          <CardTitle className="text-sm">{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link href="/rentals">
              <Button variant="secondary" size="sm" className="w-full justify-start text-xs">
                <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                {t('dashboard.newBooking')}
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="secondary" size="sm" className="w-full justify-start text-xs">
                <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                {t('dashboard.addExpense')}
              </Button>
            </Link>
            <Link href="/maintenance">
              <Button variant="secondary" size="sm" className="w-full justify-start text-xs">
                <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
                {t('dashboard.newTicket')}
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="secondary" size="sm" className="w-full justify-start text-xs">
                <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
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
