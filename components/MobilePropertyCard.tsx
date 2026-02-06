'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { Home, Building, ChevronDown, Sparkles, Plus } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useToast } from './ui/Toast'
import { t } from '@/lib/i18n/es'

interface Property {
  id: string
  name: string
  location: string | null
}

export default function MobilePropertyCard() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [activeProperty, setActiveProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPropertyName, setNewPropertyName] = useState('')
  const [newPropertyLocation, setNewPropertyLocation] = useState('')

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

      const { data: props } = await supabase
        .from('properties')
        .select('id, name, location')
        .eq('tenant_id', profile.tenant_id)
        .order('name')

      setProperties(props || [])

      const activeId = profile.preferred_property_id || props?.[0]?.id || null
      setActivePropertyId(activeId)
      setActiveProperty(props?.find(p => p.id === activeId) || null)

      if (activeId) {
        localStorage.setItem('activePropertyId', activeId)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
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
    setIsChanging(false)
    showToast(t('propertySelector.propertyChanged', { name: newProperty?.name || '' }), 'success')
  }

  async function handleCreateProperty() {
    if (!newPropertyName.trim()) {
      showToast('El nombre de la propiedad es requerido', 'error')
      return
    }

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast(t('errors.authRequired'), 'error')
        setCreating(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        showToast('Error: No se encontró tenant_id', 'error')
        setCreating(false)
        return
      }

      // Bypass property limit for specific user
      if (user.email === 'condecorporation@gmail.com') {
        // Allow unlimited properties for this test account
      } else {
        // Check subscription limits (simplified for client component)
        // For now, allow creation - limits will be enforced server-side if needed
        // In a real scenario, you'd call an API route here
      }

      const { data: newProperty, error } = await supabase
        .from('properties')
        .insert([{
          name: newPropertyName.trim(),
          location: newPropertyLocation.trim() || null,
          tenant_id: profile.tenant_id,
        }])
        .select()
        .single()

      if (error || !newProperty) {
        console.error('Error creating property:', error)
        showToast('Error al crear la propiedad', 'error')
        setCreating(false)
        return
      }

      // Set as active property if it's the first one
      if (properties.length === 0) {
        setActivePropertyId(newProperty.id)
        setActiveProperty(newProperty)
        localStorage.setItem('activePropertyId', newProperty.id)
        await supabase
          .from('profiles')
          .update({ preferred_property_id: newProperty.id })
          .eq('id', user.id)
      }

      // Reload properties
      await loadProperties()
      showToast('Propiedad creada exitosamente', 'success')
      setShowCreateModal(false)
      setNewPropertyName('')
      setNewPropertyLocation('')
      
      // Trigger property change event
      window.dispatchEvent(new CustomEvent('propertyChanged'))
    } catch (error) {
      console.error('Error creating property:', error)
      showToast('Error al crear la propiedad', 'error')
    } finally {
      setCreating(false)
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
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-white to-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-lg min-h-[56px]">
        <div className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 animate-pulse" />
        <div className="h-3 flex-1 rounded bg-slate-200/60 animate-pulse" />
      </div>
    )
  }

  if (!activeProperty) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200/60 shadow-sm min-h-[56px]">
        <div className="p-1.5 bg-slate-200 rounded-lg">
          <Home className="h-4 w-4 text-slate-400" />
        </div>
        <span className="text-sm font-medium text-slate-500">Sin propiedad</span>
      </div>
    )
  }

  return (
    <>
      {/* Card Premium de Villa Activa */}
      <button
        onClick={() => setShowModal(true)}
        disabled={isChanging}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-sm rounded-lg border border-blue-200/60 shadow-md hover:shadow-lg hover:border-blue-300/80 active:scale-[0.98] transition-all duration-200 group"
        type="button"
      >
        <div className="shrink-0 p-1.5 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-lg shadow-sm ring-1 ring-blue-400/20">
          {getPropertyIcon(activeProperty.name)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Villa Activa</span>
            <Sparkles className="h-2.5 w-2.5 text-blue-500" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate leading-tight">
            {activeProperty.name}
          </div>
          {activeProperty.location && (
            <div className="text-[11px] text-slate-600 truncate mt-0.5 leading-tight">
              {activeProperty.location}
            </div>
          )}
        </div>
        <div className="shrink-0 p-1 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
          <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
        </div>
      </button>

      {/* Modal para cambiar propiedad */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span className="font-semibold">{t('propertySelector.selectProperty')}</span>
            {properties.length > 0 && (
              <span className="text-sm font-normal text-slate-500">
                ({properties.length})
              </span>
            )}
          </div>
        }
        size="full"
      >
        <div className="space-y-3 pb-4">
          {properties.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Home className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">{t('propertySelector.noProperties')}</p>
            </div>
          ) : (
            properties.map((property) => (
              <button
                key={property.id}
                onClick={() => handlePropertyChange(property.id)}
                disabled={isChanging || property.id === activePropertyId}
                className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all duration-200 ${
                  property.id === activePropertyId
                    ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-500 shadow-lg scale-[1.02]'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98]'
                } ${isChanging ? 'opacity-50 cursor-wait' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg transition-all ${
                    property.id === activePropertyId
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {getPropertyIcon(property.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-base mb-0.5 ${
                      property.id === activePropertyId ? 'text-blue-900' : 'text-slate-900'
                    }`}>
                      {property.name}
                    </div>
                    {property.location && (
                      <div className={`text-sm ${
                        property.id === activePropertyId ? 'text-blue-700' : 'text-slate-500'
                      }`}>
                        {property.location}
                      </div>
                    )}
                  </div>
                  {property.id === activePropertyId && (
                    <div className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>

      {/* Modal para crear propiedad */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setNewPropertyName('')
          setNewPropertyLocation('')
        }}
        title={
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            <span className="font-semibold">Crear Nueva Propiedad</span>
          </div>
        }
        size="full"
      >
        <div className="space-y-4 pb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nombre de la Propiedad *
            </label>
            <Input
              type="text"
              value={newPropertyName}
              onChange={(e) => setNewPropertyName(e.target.value)}
              placeholder="ej. Villa Serena"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ubicación
            </label>
            <Input
              type="text"
              value={newPropertyLocation}
              onChange={(e) => setNewPropertyLocation(e.target.value)}
              placeholder="ej. Los Cabos, Baja California"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false)
                setNewPropertyName('')
                setNewPropertyLocation('')
              }}
              className="flex-1"
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateProperty}
              disabled={creating || !newPropertyName.trim()}
              className="flex-1"
            >
              {creating ? 'Creando...' : 'Crear Propiedad'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

