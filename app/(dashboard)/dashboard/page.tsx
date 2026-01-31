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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">CasaPilot Management Overview</p>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Account Configuration Error</h3>
          <p className="text-red-700 mb-4">
            Your account ({user.email}) is missing tenant information.
          </p>
          <p className="text-sm text-red-600 mb-4">
            This usually happens when your account was created before the tenant system was set up.
            Please contact support or run this SQL in Supabase:
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">CasaPilot Management Overview</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">No Property Selected</h3>
          <p className="text-blue-700 mb-4">
            Create your first property to start managing inventory, bookings, and expenses.
          </p>
          <p className="text-sm text-blue-600">
            Use the property selector in the header to create a new property.
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">{propertyName} Management Overview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/rentals">
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Booking</span>
              <span className="sm:hidden">Booking</span>
            </Button>
          </Link>
          <Link href="/expenses">
            <Button size="sm" variant="secondary" className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Expense</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Role Info Banner */}
      {profile?.role !== 'admin' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Staff Account</h3>
              <p className="text-sm text-blue-700 mt-1">
                You&apos;re logged in as a staff member. To upgrade to admin, go to Supabase → Table Editor → profiles → change your role to &apos;admin&apos;.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/inventory" className="block">
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalItems}</p>
                {lowStockItems.length > 0 && (
                  <p className="text-sm text-red-600 mt-1 font-medium">
                    {lowStockItems.length} need restocking
                  </p>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/maintenance" className="block">
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Open Tickets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{openTickets.length}</p>
                {urgentTickets.length > 0 && (
                  <p className="text-sm text-orange-600 mt-1 font-medium">
                    {urgentTickets.length} urgent
                  </p>
                )}
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Wrench className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/expenses" className="block">
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${monthTotal.toFixed(0)}
                </p>
                <p className="text-xs text-gray-700 mt-1">Expenses</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/rentals" className="block">
          <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${monthIncome.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Income</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Profit Card */}
      {monthProfit !== 0 && (
        <Card className={`border-l-4 ${monthProfit >= 0 ? 'border-l-emerald-500 bg-emerald-50/30' : 'border-l-red-500 bg-red-50/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Net Profit (This Month)</p>
              <p className={`text-4xl font-bold mt-2 ${monthProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${Math.abs(monthProfit).toFixed(0)}
              </p>
            </div>
            <TrendingUp className={`h-12 w-12 ${monthProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
          </div>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Upcoming Bookings (Next 7 Days)
              </CardTitle>
              <Link href="/rentals">
                <Button size="sm" variant="ghost">
                  View All
                  <ArrowRight className="h-4 w-4" />
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
                      className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{booking.guest_name || 'Guest'}</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {nights} {nights === 1 ? 'night' : 'nights'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">${Number(booking.total_amount || 0).toFixed(0)}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No upcoming bookings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Urgent Tickets */}
          {urgentTickets.length > 0 && (
            <Card className="border-l-4 border-l-red-500 bg-red-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Urgent Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {urgentTickets.slice(0, 3).map((ticket) => (
                    <Link
                      key={ticket.id}
                      href="/maintenance"
                      className="block p-3 rounded-lg bg-white border border-red-200 hover:border-red-300 transition"
                    >
                      <p className="font-medium text-sm text-gray-900">{ticket.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{ticket.room}</p>
                    </Link>
                  ))}
                  {urgentTickets.length > 3 && (
                    <Link href="/maintenance" className="text-sm text-red-600 font-medium hover:underline">
                      +{urgentTickets.length - 3} more urgent tickets
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Items */}
          {lowStockItems.length > 0 && (
            <Card className="border-l-4 border-l-amber-500 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Package className="h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href="/inventory"
                      className="block p-3 rounded-lg bg-white border border-amber-200 hover:border-amber-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-900">{item.name}</p>
                        <p className="text-xs font-bold text-amber-600">{item.quantity} left</p>
                      </div>
                    </Link>
                  ))}
                  {lowStockItems.length > 3 && (
                    <Link href="/inventory" className="text-sm text-amber-600 font-medium hover:underline">
                      +{lowStockItems.length - 3} more items
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* To Buy List */}
          {pendingPurchases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-indigo-600" />
                  To Buy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingPurchases.slice(0, 3).map((item) => (
                    <Link
                      key={item.id}
                      href="/to-buy"
                      className="block p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition"
                    >
                      <p className="font-medium text-sm text-gray-900">{item.item}</p>
                    </Link>
                  ))}
                  {pendingPurchases.length > 3 && (
                    <Link href="/to-buy" className="text-sm text-indigo-600 font-medium hover:underline">
                      +{pendingPurchases.length - 3} more items
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/rentals">
              <Button variant="secondary" className="w-full justify-start">
                <Plus className="h-4 w-4" />
                New Booking
              </Button>
            </Link>
            <Link href="/expenses">
              <Button variant="secondary" className="w-full justify-start">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </Link>
            <Link href="/maintenance">
              <Button variant="secondary" className="w-full justify-start">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </Link>
            <Link href="/inventory">
              <Button variant="secondary" className="w-full justify-start">
                <Plus className="h-4 w-4" />
                Add Item
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
