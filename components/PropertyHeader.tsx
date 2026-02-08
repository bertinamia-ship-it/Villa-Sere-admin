'use client'

import { useState, useEffect, memo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { cache, CACHE_KEYS } from '@/lib/utils/cache'
import { Sparkles } from 'lucide-react'
import { t } from '@/lib/i18n/es'

function PropertyHeader() {
  const supabase = createClient()
  const [propertyName, setPropertyName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadPropertyName = useCallback(async () => {
    setLoading(true)
    try {
      const propertyId = await getActivePropertyId()
      if (propertyId) {
        // Try cache first
        const cacheKey = CACHE_KEYS.property(propertyId)
        let cached = cache.get<{ name: string }>(cacheKey)
        
        if (cached?.name) {
          setPropertyName(cached.name)
          setLoading(false)
          return
        }

        // Fetch from DB
        const { data } = await supabase
          .from('properties')
          .select('name')
          .eq('id', propertyId)
          .maybeSingle()
        
        if (data?.name) {
          setPropertyName(data.name)
          // Cache the property name
          cache.set(cacheKey, { name: data.name })
        } else {
          setPropertyName(null)
        }
      } else {
        setPropertyName(null)
      }
    } catch (error) {
      // Only log in dev
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading property name:', error)
      }
      setPropertyName(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadPropertyName()

    const handlePropertyChange = () => {
      // Invalidate cache and reload
      const propertyId = localStorage.getItem('activePropertyId')
      if (propertyId) {
        cache.invalidate(CACHE_KEYS.property(propertyId))
      }
      loadPropertyName()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, [loadPropertyName])

  if (loading || !propertyName) {
    return null
  }

  // Month name in Spanish
  const now = new Date()
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const currentMonth = monthNames[now.getMonth()]
  const currentYear = now.getFullYear()

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200/60">
      <div className="p-2 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg shadow-md shadow-blue-500/20 shrink-0">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
          {propertyName}
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          {t('dashboard.subtitleContext', { propertyName, month: currentMonth, year: currentYear })}
        </p>
      </div>
    </div>
  )
}

export default memo(PropertyHeader)

