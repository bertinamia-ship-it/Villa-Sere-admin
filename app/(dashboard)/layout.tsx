'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  DollarSign, 
  Users, 
  LogOut,
  Menu,
  X,
  BarChart3,
  Calendar,
  ShoppingCart,
  CreditCard,
  Home,
  User
} from 'lucide-react'
import { useState, useEffect } from 'react'
import PropertySelector from '@/components/PropertySelector'
import BillingGuard from './BillingGuard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { getActivePropertyId } from '@/lib/utils/property-client'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventario', href: '/inventory', icon: Package },
  { name: 'Compras', href: '/to-buy', icon: ShoppingCart },
  { name: 'Mantenimiento', href: '/maintenance', icon: Wrench },
  { name: 'Gastos', href: '/expenses', icon: DollarSign },
  { name: 'Proveedores', href: '/vendors', icon: Users },
  { name: 'Reportes', href: '/reports', icon: BarChart3 },
  { name: 'Rentas', href: '/rentals', icon: Calendar },
  { name: 'Facturación', href: '/billing', icon: CreditCard },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeProperty, setActiveProperty] = useState<{ name: string; location: string | null } | null>(null)

  // Load active property info
  useEffect(() => {
    async function loadActiveProperty() {
      try {
        const activePropertyId = await getActivePropertyId()
        if (!activePropertyId) {
          setActiveProperty(null)
          return
        }

        // Fetch property info from Supabase
        const { data: property, error } = await supabase
          .from('properties')
          .select('name, location')
          .eq('id', activePropertyId)
          .maybeSingle()

        if (error) {
          console.error('[Layout] Error fetching property:', error)
          setActiveProperty(null)
          return
        }

        setActiveProperty(property ? { name: property.name, location: property.location } : null)
      } catch (error) {
        console.error('[Layout] Error loading property:', error)
        setActiveProperty(null)
      }
    }

    loadActiveProperty()

    // Listen for property changes
    const handlePropertyChange = () => {
      loadActiveProperty()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <BillingGuard>
    <ErrorBoundary moduleName="Dashboard">
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-4 overflow-y-auto bg-white border-r border-[#E2E8F0] px-4 py-4">
          {/* Branding */}
          <div className="shrink-0 pb-4 border-b border-[#E2E8F0]">
            <h1 className="text-base font-semibold text-[#0F172A] tracking-tight mb-3">CasaPilot</h1>
            <PropertySelector />
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group relative flex items-center gap-x-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-150 ease-out ${
                        isActive
                          ? 'bg-[#0F172A] text-white'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                      )}
                      <item.icon className={`h-4 w-4 shrink-0 stroke-[1.5] ${isActive ? 'text-white' : 'text-[#64748B] group-hover:text-[#0F172A]'}`} aria-hidden="true" />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* User Menu */}
            <div className="mt-auto pt-3 border-t border-[#E2E8F0]">
              <button
                onClick={handleLogout}
                className="group flex w-full items-center gap-x-2 rounded-md px-2.5 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#EF4444] transition-all duration-150 ease-out"
              >
                <User className="h-4 w-4 shrink-0 stroke-[1.5] text-[#64748B] group-hover:text-[#EF4444] transition-colors duration-150" aria-hidden="true" />
                <span className="flex-1 text-left">Cuenta</span>
                <LogOut className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150 ease-out text-[#EF4444]" />
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-[#E2E8F0] z-40 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-[#0F172A] tracking-tight">CasaPilot</h1>
            <div className="h-4 w-px bg-[#E2E8F0]" />
            <PropertySelector />
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-700 hover:text-slate-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-[#E2E8F0] bg-white max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <nav className="px-3 py-3 space-y-0.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`relative flex items-center gap-x-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-150 ease-out ${
                      isActive
                        ? 'bg-[#0F172A] text-white'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r-full" />
                    )}
                    <item.icon className={`h-4 w-4 stroke-[1.5] ${isActive ? 'text-white' : 'text-[#64748B]'}`} />
                    {item.name}
                  </Link>
                )
              })}
              <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-x-2 rounded-md px-2.5 py-2 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#EF4444] transition-all duration-150 ease-out"
                >
                  <User className="h-4 w-4 stroke-[1.5] text-[#64748B] group-hover:text-[#EF4444] transition-colors duration-150" />
                  <span className="flex-1 text-left">Cuenta</span>
                  <LogOut className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all duration-150 ease-out text-[#EF4444]" />
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-4 px-4 sm:px-6 lg:px-6 pt-16 lg:pt-6 pb-16 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-40 shadow-lg">
        <nav className="flex justify-around py-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium rounded-md transition-all duration-150 ease-out ${
                  isActive ? 'text-[#0F172A] bg-[#F8FAFC]' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <item.icon className="h-4 w-4 stroke-[1.5]" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
    </ErrorBoundary>
    </BillingGuard>
  )
}
