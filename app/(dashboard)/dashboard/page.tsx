import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getActiveProperty, getActivePropertyId } from '@/lib/utils/property'
import { 
  Package, 
  Wrench, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  TrendingUp,
  ShoppingCart,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Clock,
  LogIn,
  LogOut,
  CalendarCheck,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0F172A]">{t('dashboard.title')}</h1>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">{t('dashboard.accountConfigError')}</h3>
          <p className="text-red-700 mb-4">
            {t('dashboard.accountConfigMessage', { email: user.email })}
          </p>
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
          <h1 className="text-2xl font-semibold text-[#0F172A]">{t('dashboard.title')}</h1>
          <p className="text-sm text-[#64748B] mt-1">{t('dashboard.overview')}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('dashboard.noPropertyTitle')}</h3>
          <p className="text-blue-700 mb-4">
            {t('dashboard.noPropertyDescription')}
          </p>
        </div>
      </div>
    )
  }

  // Calculate date ranges
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayStr = today.toISOString().split('T')[0]
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const next30Days = new Date(today)
  next30Days.setDate(next30Days.getDate() + 30)
  const next7Days = new Date(today)
  next7Days.setDate(next7Days.getDate() + 7)

  // Fetch all data in parallel
  const [
    inventoryResult,
    ticketsResult,
    expensesResult,
    bookingsResult,
    purchaseItemsResult,
    maintenancePlansResult,
    tasksResult
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
      : { data: [], error: null },
    propertyId
      ? supabase
          .from('maintenance_plans')
          .select('id, title, next_run_date, priority, is_active')
          .eq('property_id', propertyId)
          .eq('is_active', true)
          .lte('next_run_date', next30Days.toISOString().split('T')[0])
          .order('next_run_date', { ascending: true })
      : { data: [], error: null },
    propertyId
      ? supabase
          .from('tasks')
          .select('id, title, next_due_date, priority, status, cadence')
          .eq('property_id', propertyId)
          .neq('status', 'done')
          .lte('next_due_date', next7Days.toISOString().split('T')[0])
          .order('next_due_date', { ascending: true })
      : { data: [], error: null }
  ])

  // Process data
  const lowStockItems = inventoryResult.data?.filter(
    item => item.quantity <= item.min_threshold
  ) || []
  const openTickets = ticketsResult.data?.filter(
    ticket => ticket.status !== 'done'
  ) || []
  const urgentTickets = ticketsResult.data?.filter(
    ticket => ticket.priority === 'urgent' && ticket.status !== 'done'
  ) || []

  // TODAY'S EVENTS
  const todayCheckIns = bookingsResult.data?.filter(booking => {
    const checkIn = new Date(booking.check_in)
    return checkIn.toISOString().split('T')[0] === todayStr && booking.status === 'confirmed'
  }) || []
  
  const todayCheckOuts = bookingsResult.data?.filter(booking => {
    const checkOut = new Date(booking.check_out)
    return checkOut.toISOString().split('T')[0] === todayStr && booking.status === 'confirmed'
  }) || []

  const todayTasks = tasksResult.data?.filter(task => {
    return task.next_due_date === todayStr && task.status !== 'done'
  }) || []

  const todayMaintenance = maintenancePlansResult.data?.filter(plan => {
    return plan.next_run_date === todayStr
  }) || []

  // OVERDUE TASKS
  const overdueTasks = tasksResult.data?.filter(task => {
    const dueDate = new Date(task.next_due_date)
    return dueDate < today && task.status !== 'done'
  }) || []

  // Current month calculations
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

  // Calculate occupancy (current bookings)
  const currentBookings = bookingsResult.data?.filter(booking => {
    const checkIn = new Date(booking.check_in)
    const checkOut = new Date(booking.check_out)
    return checkIn <= now && checkOut > now && booking.status === 'confirmed'
  }) || []
  const totalBookings = bookingsResult.data?.length || 0
  const occupancyRate = totalBookings > 0 
    ? (currentBookings.length / totalBookings) * 100 
    : 0

  // Month name in Spanish
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const currentMonth = monthNames[now.getMonth()]
  const currentYear = now.getFullYear()

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Visual - Home Image */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-6 sm:mb-8 relative overflow-hidden rounded-b-2xl lg:rounded-2xl shadow-xl">
        <div className="relative h-64 sm:h-80 lg:h-96 w-full bg-slate-900">
          <Image
            src="/splash-screen.png"
            alt={propertyName}
            fill
            priority
            quality={85}
            className="object-cover"
            sizes="100vw"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-transparent" />
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex items-end lg:items-center justify-center pb-6 lg:pb-0 px-4 sm:px-6 safe-area-bottom">
            <div className="text-center space-y-3 max-w-2xl w-full">
              <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {propertyName}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-white/90 drop-shadow-md">
                  {t('dashboard.subtitleContext', { propertyName, month: currentMonth, year: currentYear })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Colorful and animated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ingresos */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              {t('dashboard.income')}
            </p>
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-md">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-1">
            {monthIncome > 0 ? `$${monthIncome.toFixed(0)}` : '—'}
          </p>
          <p className="text-xs font-medium text-emerald-700/70">{t('dashboard.thisMonth')}</p>
        </div>

        {/* Gastos */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/50 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
              {t('dashboard.expenses')}
            </p>
            <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg shadow-md">
              <ArrowDownRight className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-900 mb-1">
            {monthTotal > 0 ? `$${monthTotal.toFixed(0)}` : '—'}
          </p>
          <p className="text-xs font-medium text-red-700/70">{t('dashboard.thisMonth')}</p>
        </div>

        {/* Balance */}
        <div className={`border rounded-xl p-4 sm:p-6 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 ease-out ${
          monthProfit >= 0 
            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50' 
            : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              monthProfit >= 0 ? 'text-blue-700' : 'text-orange-700'
            }`}>
              {t('dashboard.balance')}
            </p>
            <div className={`p-2.5 rounded-lg shadow-md ${
              monthProfit >= 0 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-500' 
                : 'bg-gradient-to-br from-orange-500 to-amber-500'
            }`}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold mb-1 ${
            monthProfit >= 0 ? 'text-blue-900' : 'text-orange-900'
          }`}>
            {monthProfit !== 0 ? `$${Math.abs(monthProfit).toFixed(0)}` : '—'}
          </p>
          <p className={`text-xs font-medium ${
            monthProfit >= 0 ? 'text-blue-700/70' : 'text-orange-700/70'
          }`}>
            {t('dashboard.thisMonth')}
          </p>
        </div>

        {/* Ocupación */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/50 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 ease-out">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
              {t('dashboard.occupancy')}
            </p>
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">
            {occupancyRate > 0 ? `${Math.round(occupancyRate)}%` : '0%'}
          </p>
          <p className="text-xs font-medium text-purple-700/70">{t('dashboard.current')}</p>
        </div>
      </div>

      {/* TODAY SECTION - Most Important */}
      {(todayCheckIns.length > 0 || todayCheckOuts.length > 0 || todayTasks.length > 0 || todayMaintenance.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0F172A]">{t('dashboard.today')}</h2>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl divide-y divide-slate-200/60 shadow-lg">
            {/* Check-ins */}
            {todayCheckIns.map(booking => (
              <Link
                key={`checkin-${booking.id}`}
                href="/rentals"
                className="flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors group"
              >
                <div className="p-2 bg-[#2563EB]/10 rounded-md group-hover:bg-[#2563EB]/15 transition-colors">
                  <LogIn className="h-4 w-4 text-[#2563EB]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">
                    {t('dashboard.checkIn')}: {booking.guest_name || t('dashboard.guest')}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t('dashboard.total')}: ${Number(booking.total_amount || 0).toFixed(0)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-[#2563EB] transition-colors shrink-0" />
              </Link>
            ))}

            {/* Check-outs */}
            {todayCheckOuts.map(booking => (
              <Link
                key={`checkout-${booking.id}`}
                href="/rentals"
                className="flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors group"
              >
                <div className="p-2 bg-[#10B981]/10 rounded-md group-hover:bg-[#10B981]/15 transition-colors">
                  <LogOut className="h-4 w-4 text-[#10B981]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">
                    {t('dashboard.checkOut')}: {booking.guest_name || t('dashboard.guest')}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t('dashboard.total')}: ${Number(booking.total_amount || 0).toFixed(0)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-[#10B981] transition-colors shrink-0" />
              </Link>
            ))}

            {/* Tasks */}
            {todayTasks.map(task => (
              <Link
                key={`task-${task.id}`}
                href="/tasks"
                className="flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors group"
              >
                <div className="p-2 bg-[#8B5CF6]/10 rounded-md group-hover:bg-[#8B5CF6]/15 transition-colors">
                  <CheckSquare className="h-4 w-4 text-[#8B5CF6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">{task.title}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{t('dashboard.dueToday')}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-[#8B5CF6] transition-colors shrink-0" />
              </Link>
            ))}

            {/* Maintenance */}
            {todayMaintenance.map(plan => (
              <Link
                key={`plan-${plan.id}`}
                href="/maintenance-plans"
                className="flex items-center gap-3 p-4 hover:bg-[#F8FAFC] transition-colors group"
              >
                <div className="p-2 bg-[#F59E0B]/10 rounded-md group-hover:bg-[#F59E0B]/15 transition-colors">
                  <CalendarCheck className="h-4 w-4 text-[#F59E0B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">{plan.title}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{t('dashboard.scheduledToday')}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-[#F59E0B] transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Alerts - Only if there are alerts */}
      {(overdueTasks.length > 0 || lowStockItems.length > 0 || urgentTickets.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A]">{t('dashboard.attention')}</h2>

          <div className="space-y-2">
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#92400E] mb-1">
                      {t('dashboard.overdueTasks', { count: overdueTasks.length })}
                    </p>
                    <Link href="/tasks" className="text-xs text-[#92400E] hover:underline">
                      {t('dashboard.viewAll')} →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Low Stock */}
            {lowStockItems.length > 0 && (
              <div className="bg-[#FEE2E2] border border-[#EF4444]/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#991B1B] mb-1">
                      {t('dashboard.lowStockAlert', { count: lowStockItems.length })}
                    </p>
                    <Link href="/inventory" className="text-xs text-[#991B1B] hover:underline">
                      {t('dashboard.viewAll')} →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Urgent Tickets */}
            {urgentTickets.length > 0 && (
              <div className="bg-[#FEE2E2] border border-[#EF4444]/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#991B1B] mb-1">
                      {t('dashboard.urgentTickets', { count: urgentTickets.length })}
                    </p>
                    <Link href="/maintenance" className="text-xs text-[#991B1B] hover:underline">
                      {t('dashboard.viewAll')} →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
