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
  User
} from 'lucide-react'
import { useState } from 'react'
import Header from '@/components/Header'
import BillingGuard from './BillingGuard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <BillingGuard>
    <ErrorBoundary moduleName="Dashboard">
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-white border-r border-gray-200/60 px-6 py-6">
          {/* Branding */}
          <div className="shrink-0 mb-8">
            <h1 className="text-lg font-semibold text-[#0F172A] tracking-tight">CasaPilot</h1>
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
                      className={`group relative flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                        isActive
                          ? 'bg-gray-50 text-[#0F172A]'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50/50'
                      }`}
                    >
                      {/* Active indicator lateral izquierdo (estilo Mac) */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#0F172A] rounded-r-full transition-all duration-200" />
                      )}
                      <item.icon className={`h-4 w-4 shrink-0 stroke-[1.5] transition-colors duration-200 ${
                        isActive ? 'text-[#0F172A]' : 'text-[#64748B] group-hover:text-[#0F172A]'
                      }`} aria-hidden="true" />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200/60 z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-base font-semibold text-[#0F172A]">CasaPilot</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200/60 bg-white max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <nav className="px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group relative flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                      isActive
                        ? 'bg-gray-50 text-[#0F172A]'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50/50'
                    }`}
                  >
                    {/* Active indicator lateral izquierdo (estilo Mac) */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#0F172A] rounded-r-full transition-all duration-200" />
                    )}
                    <item.icon className={`h-4 w-4 stroke-[1.5] ${isActive ? 'text-[#0F172A]' : 'text-[#64748B]'}`} />
                    {item.name}
                  </Link>
                )
              })}
              <div className="pt-4 mt-4 border-t border-gray-200/60">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#64748B] hover:bg-gray-50 hover:text-[#EF4444] transition-all duration-200 ease-out"
                >
                  <LogOut className="h-4 w-4 stroke-[1.5]" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Header />
        <main className="py-6 px-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200/60 z-40 shadow-lg">
        <nav className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded-lg transition-all duration-200 ease-out ${
                  isActive ? 'text-[#0F172A] bg-gray-50' : 'text-[#64748B] hover:text-[#0F172A] hover:bg-gray-50'
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
