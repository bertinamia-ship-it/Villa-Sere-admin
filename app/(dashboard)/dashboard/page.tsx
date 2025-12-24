import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Wrench, DollarSign, AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // Fetch summary data
  const [inventoryResult, ticketsResult, expensesResult] = await Promise.all([
    supabase.from('inventory_items').select('id, quantity, min_threshold'),
    supabase.from('maintenance_tickets').select('id, status, priority'),
    supabase.from('expenses').select('amount', { count: 'exact' })
  ])

  const lowStockItems = inventoryResult.data?.filter(
    item => item.quantity <= item.min_threshold
  ).length || 0

  const openTickets = ticketsResult.data?.filter(
    ticket => ticket.status !== 'done'
  ).length || 0

  const urgentTickets = ticketsResult.data?.filter(
    ticket => ticket.priority === 'urgent' && ticket.status !== 'done'
  ).length || 0

  const totalItems = inventoryResult.data?.length || 0
  const totalTickets = ticketsResult.data?.length || 0

  // Calculate current month expenses
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', firstDay.toISOString().split('T')[0])

  const monthTotal = monthExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Villa Sere Management Overview</p>
      </div>

      {/* Role Info Banner */}
      {profile?.role !== 'admin' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Staff Account</h3>
              <p className="text-sm text-blue-700 mt-1">
                You're logged in as a staff member. To upgrade to admin, go to Supabase → Table Editor → profiles → change your role to 'admin'.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/inventory" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalItems}</p>
                {lowStockItems > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {lowStockItems} low stock
                  </p>
                )}
              </div>
              <Package className="h-12 w-12 text-blue-500" />
            </div>
          </div>
        </Link>

        <Link href="/maintenance" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{openTickets}</p>
                {urgentTickets > 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    {urgentTickets} urgent
                  </p>
                )}
              </div>
              <Wrench className="h-12 w-12 text-orange-500" />
            </div>
          </div>
        </Link>

        <Link href="/expenses" className="block">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${monthTotal.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500" />
            </div>
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">All Tickets</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalTickets}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(lowStockItems > 0 || urgentTickets > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Alerts</h3>
          <ul className="space-y-1 text-sm text-yellow-800">
            {lowStockItems > 0 && (
              <li>• {lowStockItems} inventory {lowStockItems === 1 ? 'item' : 'items'} below minimum threshold</li>
            )}
            {urgentTickets > 0 && (
              <li>• {urgentTickets} urgent maintenance {urgentTickets === 1 ? 'ticket' : 'tickets'} pending</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
