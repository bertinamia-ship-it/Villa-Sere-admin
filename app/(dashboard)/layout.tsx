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
  ArrowRight,
  Sparkles,
  Wallet
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import BillingGuard from './BillingGuard'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Navigation structure: compact and organized
type NavItem = 
  | { name: string; href: string; icon: React.ComponentType<{ className?: string }> }
  | { name: string; children: Array<{ name: string; href: string; icon: React.ComponentType<{ className?: string }> }> }

const navigation: NavItem[] = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Calendario', href: '/calendario', icon: Calendar },
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
      { name: 'Banco', href: '/bank', icon: Wallet },
      { name: 'Reportes', href: '/reports', icon: BarChart3 },
    ]
  },
  { name: 'Configuración', href: '/settings', icon: Settings },
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

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <BillingGuard>
    <ErrorBoundary moduleName="Dashboard">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 px-4 py-6 shadow-2xl">
          {/* Branding */}
          <div className="shrink-0 mb-8 pb-6 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-blue-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-white tracking-tight">CasaPilot</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col space-y-1.5">
            {navigation.map((item) => {
              if ('href' in item) {
                // Single item
                const active = isActive(item.href)
                // Color mapping for icons
                const iconColors: Record<string, string> = {
                  '/dashboard': 'text-blue-400',
                  '/calendario': 'text-purple-400',
                  '/settings': 'text-slate-400',
                }
                const iconColor = iconColors[item.href] || 'text-slate-400'
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:scale-[1.01]'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm" />
                    )}
                    <item.icon className={`h-5 w-5 shrink-0 stroke-[1.5] transition-colors duration-300 ${
                      active ? 'text-white' : `${iconColor} group-hover:text-white`
                    }`} />
                    <span className={active ? 'font-semibold' : ''}>{item.name}</span>
                  </Link>
                )
              } else {
                // Section with children
                const isExpanded = expandedSections.has(item.name)
                const hasActiveChild = item.children.some(child => isActive(child.href))
                
                // Color mapping for sections
                const sectionColors: Record<string, { text: string; bg: string; icon: string }> = {
                  'Operación': { text: 'text-emerald-300', bg: 'bg-emerald-500/10', icon: 'text-emerald-400' },
                  'Finanzas': { text: 'text-amber-300', bg: 'bg-amber-500/10', icon: 'text-amber-400' },
                }
                const sectionColor = sectionColors[item.name] || { text: 'text-slate-300', bg: 'bg-slate-700/30', icon: 'text-slate-400' }
                
                return (
                  <div key={item.name} className="space-y-1.5">
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`w-full flex items-center justify-between gap-x-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                        hasActiveChild
                          ? `${sectionColor.text} ${sectionColor.bg}`
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                      }`}
                    >
                      <span>{item.name}</span>
                      <ArrowRight
                        className={`h-3.5 w-3.5 transition-all duration-300 ${
                          isExpanded ? 'rotate-90' : ''
                        } ${hasActiveChild ? sectionColor.icon : 'text-slate-500'}`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-2 space-y-1 border-l-2 border-slate-700/50 pl-3">
                        {item.children.map((child) => {
                          const active = isActive(child.href)
                          // Icon colors for children
                          const childIconColors: Record<string, string> = {
                            '/maintenance': 'text-orange-400',
                            '/inventory': 'text-blue-400',
                            '/to-buy': 'text-purple-400',
                            '/vendors': 'text-cyan-400',
                            '/expenses': 'text-green-400',
                            '/bank': 'text-emerald-400',
                            '/reports': 'text-indigo-400',
                          }
                          const childIconColor = childIconColors[child.href] || 'text-slate-400'
                          
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm transition-all duration-300 ${
                                active
                                  ? 'text-white bg-gradient-to-r from-slate-700 to-slate-600 font-semibold shadow-md scale-[1.02]'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:scale-[1.01]'
                              }`}
                            >
                              <child.icon className={`h-4.5 w-4.5 shrink-0 stroke-[1.5] transition-colors duration-300 ${
                                active ? 'text-white' : `${childIconColor} group-hover:text-white`
                              }`} />
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
          <div className="mt-auto pt-4 border-t border-slate-700/50">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-x-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 hover:scale-[1.01]"
            >
              <LogOut className="h-4 w-4 stroke-[1.5] transition-colors duration-300" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 z-50 shadow-lg safe-area-top">
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 safe-area-x">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg shadow-md">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white">CasaPilot</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:text-white transition-colors p-2.5 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-700/50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 z-50 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden safe-area-left safe-area-y overflow-y-auto">
              {/* Branding in mobile drawer */}
              <div className="shrink-0 px-4 pt-6 pb-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl shadow-lg shadow-blue-500/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-white tracking-tight">CasaPilot</h1>
                </div>
              </div>

              <nav className="px-4 py-4 space-y-1.5 flex-1">
                {navigation.map((item) => {
                  if ('href' in item) {
                    const active = isActive(item.href)
                    const iconColors: Record<string, string> = {
                      '/dashboard': 'text-blue-400',
                      '/calendario': 'text-purple-400',
                      '/settings': 'text-slate-400',
                    }
                    const iconColor = iconColors[item.href] || 'text-slate-400'
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group relative flex items-center gap-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
                          active
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:scale-[1.01]'
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-sm" />
                        )}
                        <item.icon className={`h-5 w-5 shrink-0 stroke-[1.5] transition-colors duration-300 ${
                          active ? 'text-white' : `${iconColor} group-hover:text-white`
                        }`} />
                        <span className={active ? 'font-semibold' : ''}>{item.name}</span>
                      </Link>
                    )
                  } else {
                    const isExpanded = expandedSections.has(item.name)
                    const hasActiveChild = item.children.some(child => isActive(child.href))
                    const sectionColors: Record<string, { text: string; bg: string; icon: string }> = {
                      'Operación': { text: 'text-emerald-300', bg: 'bg-emerald-500/10', icon: 'text-emerald-400' },
                      'Finanzas': { text: 'text-amber-300', bg: 'bg-amber-500/10', icon: 'text-amber-400' },
                    }
                    const sectionColor = sectionColors[item.name] || { text: 'text-slate-300', bg: 'bg-slate-700/30', icon: 'text-slate-400' }
                    
                    return (
                      <div key={item.name} className="space-y-1.5">
                        <button
                          onClick={() => toggleSection(item.name)}
                          className={`w-full flex items-center justify-between gap-x-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                            hasActiveChild
                              ? `${sectionColor.text} ${sectionColor.bg}`
                              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                          }`}
                        >
                          <span>{item.name}</span>
                          <ArrowRight
                            className={`h-3.5 w-3.5 transition-all duration-300 ${
                              isExpanded ? 'rotate-90' : ''
                            } ${hasActiveChild ? sectionColor.icon : 'text-slate-500'}`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="ml-2 space-y-1 border-l-2 border-slate-700/50 pl-3">
                            {item.children.map((child) => {
                              const active = isActive(child.href)
                              const childIconColors: Record<string, string> = {
                                '/maintenance': 'text-orange-400',
                                '/inventory': 'text-blue-400',
                                '/to-buy': 'text-purple-400',
                                '/vendors': 'text-cyan-400',
                                '/expenses': 'text-green-400',
                                '/bank': 'text-emerald-400',
                                '/reports': 'text-indigo-400',
                              }
                              const childIconColor = childIconColors[child.href] || 'text-slate-400'
                              
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={`flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm transition-all duration-300 ease-out ${
                                    active
                                      ? 'text-white bg-gradient-to-r from-slate-700 to-slate-600 font-semibold shadow-md scale-[1.02]'
                                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:scale-[1.01]'
                                  }`}
                                >
                                  <child.icon className={`h-4.5 w-4.5 shrink-0 stroke-[1.5] transition-colors duration-300 ${
                                    active ? 'text-white' : `${childIconColor} group-hover:text-white`
                                  }`} />
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
              <div className="mt-auto pt-4 px-4 pb-6 border-t border-slate-700/50 safe-area-bottom">
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-x-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4 stroke-[1.5] transition-colors duration-300" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Header />
        <main className="py-4 px-4 sm:py-6 sm:px-6 min-h-screen lg:pt-6 pt-14 safe-area-x safe-area-bottom">
          <div className="page-soft">
            {children}
          </div>
        </main>
      </div>
    </div>
    </ErrorBoundary>
    </BillingGuard>
  )
}
