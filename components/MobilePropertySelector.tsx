'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { Home, Building, ChevronDown, X } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useToast } from './ui/Toast'
import { t } from '@/lib/i18n/es'

interface Property {
  id: string
  name: string
  location: string | null
}

export default function MobilePropertySelector() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    const handlePropertyChange = () => {
      loadProperties()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, [])

  async function loadProperties() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, preferred_property_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        setLoading(false)
        return
      }

      // Try localStorage first for faster load
      const cachedPropertyId = localStorage.getItem('activePropertyId')
      
      const { data: props } = await supabase
        .from('properties')
        .select('id, name, location')
        .eq('tenant_id', profile.tenant_id)
        .order('name')

      setProperties(props || [])

      const activeId = cachedPropertyId || profile.preferred_property_id || props?.[0]?.id || null
      setActivePropertyId(activeId)
      setActiveProperty(props?.find(p => p.id === activeId) || null)

      if (activeId) {
        localStorage.setItem('activePropertyId', activeId)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
      // Fallback to localStorage if API fails
      const cachedPropertyId = localStorage.getItem('activePropertyId')
      if (cachedPropertyId) {
        setActivePropertyId(cachedPropertyId)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handlePropertyChange(propertyId: string) {
    if (propertyId === activePropertyId) {
      setShowModal(false)
      return
    }
    
    setIsChanging(true)
    try {
      const newProperty = properties.find(p => p.id === propertyId)
      
      setActivePropertyId(propertyId)
      setActiveProperty(newProperty || null)
      localStorage.setItem('activePropertyId', propertyId)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ preferred_property_id: propertyId })
          .eq('id', user.id)
      }

      window.dispatchEvent(new CustomEvent('propertyChanged'))
      setShowModal(false)
      showToast(t('propertySelector.propertyChanged'), 'success')
    } catch (error) {
      console.error('Error changing property:', error)
      showToast(t('propertySelector.errorChangingProperty'), 'error')
    } finally {
      setIsChanging(false)
    }
  }

  const getPropertyIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('departamento') || lowerName.includes('apartamento') || 
        lowerName.includes('depto') || lowerName.includes('apto') ||
        lowerName.includes('apartment') || lowerName.includes('flat')) {
      return <Building className="h-4 w-4" />
    }
    return <Home className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-sm min-h-[40px]">
        <div className="h-4 w-4 rounded bg-slate-200 animate-pulse" />
        <div className="h-3 flex-1 rounded bg-slate-200 animate-pulse" />
      </div>
    )
  }

  // Si no hay propiedad activa pero hay propiedades, usar la primera
  const displayProperty = activeProperty || properties[0] || null
  
  if (!displayProperty) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-sm min-h-[40px]">
        <Home className="h-4 w-4 text-slate-400" />
        <span className="text-xs text-slate-500">Sin propiedad</span>
      </div>
    )
  }

  return (
    <>
      {/* Chip más pequeño en header móvil */}
      <button
        onClick={() => setShowModal(true)}
        disabled={isChanging}
        className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 min-h-[40px] flex-1 max-w-[calc(100vw-140px)]"
        type="button"
      >
        <div className="shrink-0 text-slate-600">
          {getPropertyIcon(displayProperty.name)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs font-semibold text-slate-900 truncate">
            {displayProperty.name}
          </div>
          {displayProperty.location && (
            <div className="text-[10px] text-slate-500 truncate">
              {displayProperty.location}
            </div>
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
      </button>

      {/* Bottom Sheet Modal para cambiar propiedad */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          <div className="flex items-center gap-2">
            <span>Cambiar Propiedad</span>
            {properties.length > 0 && (
              <span className="text-sm font-normal text-slate-500">
                ({properties.length})
              </span>
            )}
          </div>
        }
        size="full"
      >
        <div className="space-y-2 pb-4">
          {properties.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {t('propertySelector.noProperties')}
            </div>
          ) : (
            properties.map((property) => (
              <button
                key={property.id}
                onClick={() => handlePropertyChange(property.id)}
                disabled={isChanging || property.id === activePropertyId}
                className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all duration-200 ${
                  property.id === activePropertyId
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500 shadow-md'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98]'
                } ${isChanging ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${
                    property.id === activePropertyId
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {getPropertyIcon(property.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-base ${
                      property.id === activePropertyId ? 'text-blue-900' : 'text-slate-900'
                    }`}>
                      {property.name}
                    </div>
                    {property.location && (
                      <div className={`text-sm mt-0.5 ${
                        property.id === activePropertyId ? 'text-blue-700' : 'text-slate-500'
                      }`}>
                        {property.location}
                      </div>
                    )}
                  </div>
                  {property.id === activePropertyId && (
                    <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}

