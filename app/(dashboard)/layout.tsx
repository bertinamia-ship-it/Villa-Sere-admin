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
  CalendarCheck,
  Settings,
  ArrowRight
} from 'lucide-react'
import { useState } from 'react'
import Header from '@/components/Header'
import BillingGuard from './BillingGuard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Navigation structure: compact and organized
type NavItem = 
  | { name: string; href: string; icon: typeof LayoutDashboard }
  | { name: string; children: Array<{ name: string; href: string; icon: typeof Wrench }> }

const navigation: NavItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendario', href: '/calendar', icon: Calendar },
  {
    name: 'Operación',
    children: [
      { name: 'Mantenimiento', href: '/maintenance', icon: Wrench },
      { name: 'Inventario', href: '/inventory', icon: Package },
      { name: 'Compras', href: '/to-buy', icon: ShoppingCart },
      { name: 'Proveedores', href: '/vendors', icon: Users },
    ]
  },
  {
    name: 'Finanzas',
    children: [
      { name: 'Movimientos', href: '/expenses', icon: DollarSign },
      { name: 'Reportes', href: '/reports', icon: BarChart3 },
    ]
  },
  { name: 'Ajustes', href: '/settings', icon: Settings },
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Operación', 'Finanzas']))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName)
    } else {
      newExpanded.add(sectionName)
    }
    setExpandedSections(newExpanded)
  }

  const isActive = (href: string) => pathname === href

  return (
    <BillingGuard>
    <ErrorBoundary moduleName="Dashboard">
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-white border-r border-gray-200/60 px-4 py-4">
          {/* Branding */}
          <div className="shrink-0 mb-6">
            <h1 className="text-base font-semibold text-[#0F172A] tracking-tight">CasaPilot</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col space-y-1">
            {navigation.map((item) => {
              if ('href' in item && item.href) {
                // Single item
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center gap-x-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ease-out ${
                      active
                        ? 'bg-[#F8FAFC] text-[#0F172A]'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#2563EB] rounded-r-full" />
                    )}
                    <item.icon className={`h-4 w-4 shrink-0 stroke-[1.5] ${
                      active ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#2563EB]'
                    }`} />
                    <span>{item.name}</span>
                  </Link>
                )
              } else {
                // Section with children
                const isExpanded = expandedSections.has(item.name)
                const hasActiveChild = item.children.some(child => isActive(child.href))
                
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`w-full flex items-center justify-between gap-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                        hasActiveChild
                          ? 'text-[#0F172A] bg-[#F8FAFC]'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span>{item.name}</span>
                      <ArrowRight
                        className={`h-3.5 w-3.5 transition-transform duration-150 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {item.children.map((child) => {
                          const active = isActive(child.href)
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`flex items-center gap-x-2.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150 ${
                                active
                                  ? 'text-[#2563EB] bg-[#2563EB]/10 font-medium'
                                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                              }`}
                            >
                              <child.icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
                              <span>{child.name}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
            })}
          </nav>

          {/* User Menu at bottom */}
          <div className="mt-auto pt-4 border-t border-gray-200/60">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-x-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[#64748B] hover:text-[#EF4444] hover:bg-[#F8FAFC] transition-all duration-150"
            >
              <LogOut className="h-4 w-4 stroke-[1.5]" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200/60 z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <h1 className="text-sm font-semibold text-[#0F172A]">CasaPilot</h1>
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
                if ('href' in item) {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        active
                          ? 'bg-[#F8FAFC] text-[#0F172A]'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <item.icon className="h-4 w-4 stroke-[1.5]" />
                      {item.name}
                    </Link>
                  )
                } else {
                  return (
                    <div key={item.name} className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                        {item.name}
                      </div>
                      {item.children.map((child) => {
                        const active = isActive(child.href)
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                              active
                                ? 'bg-[#2563EB]/10 text-[#2563EB]'
                                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <child.icon className="h-4 w-4 stroke-[1.5]" />
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )
                }
              })}
              <div className="pt-4 mt-4 border-t border-gray-200/60">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#EF4444] transition-all duration-150"
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
        <main className="py-6 px-4 sm:px-6">
          {children}
        </main>
      </div>
    </div>
    </ErrorBoundary>
    </BillingGuard>
  )
}
