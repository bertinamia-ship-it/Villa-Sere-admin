'use client'

import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { User, LogOut } from 'lucide-react'
import PropertySelector from './PropertySelector'
import { getActivePropertyId } from '@/lib/utils/property-client'

const sectionNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventario',
  '/to-buy': 'Compras',
  '/maintenance': 'Mantenimiento',
  '/expenses': 'Gastos',
  '/vendors': 'Proveedores',
  '/reports': 'Reportes',
  '/rentals': 'Rentas',
  '/billing': 'Facturación',
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email || null)
    }
    loadUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sectionName = sectionNames[pathname] || 'CasaPilot'

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200/60">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Left: Section Name */}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-semibold text-[#0F172A] truncate">{sectionName}</h1>
        </div>

        {/* Right: Property Selector + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <PropertySelector />
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="h-7 w-7 rounded-full bg-[#0F172A] flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-gray-200/60 shadow-lg py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-gray-200/60">
                    <p className="text-xs font-medium text-[#0F172A] truncate">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-[#64748B] hover:bg-gray-50 hover:text-[#0F172A] transition-colors duration-200 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

