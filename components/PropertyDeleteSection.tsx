'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { Trash2, AlertTriangle, Home, Building } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
import { useToast } from './ui/Toast'
import { t } from '@/lib/i18n/es'

interface Property {
  id: string
  name: string
  location: string | null
}

export default function PropertyDeleteSection() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

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
    } catch (error) {
      console.error('Error loading properties:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteClick(property: Property) {
    setSelectedProperty(property)
    setConfirmName('')
    setShowDeleteModal(true)
  }

  async function handleDelete() {
    if (!selectedProperty) return
    
    // Validar que el nombre coincida exactamente
    if (confirmName.trim() !== selectedProperty.name.trim()) {
      showToast('El nombre no coincide. Por favor, escribe el nombre exacto de la propiedad.', 'error')
      return
    }

    setDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast(t('propertySelector.errorDeletingProperty'), 'error')
        setDeleting(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, preferred_property_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        showToast(t('propertySelector.errorDeletingProperty'), 'error')
        setDeleting(false)
        return
      }

      const activePropertyId = await getActivePropertyId()

      // Delete property
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', selectedProperty.id)
        .eq('tenant_id', profile.tenant_id)

      if (error) {
        console.error('Error deleting property:', error)
        showToast(t('propertySelector.errorDeletingProperty'), 'error')
        setDeleting(false)
        return
      }

      // If deleted property was active, switch to another or clear
      if (selectedProperty.id === activePropertyId) {
        const remainingProperties = properties.filter(p => p.id !== selectedProperty.id)
        if (remainingProperties.length > 0) {
          const newActiveId = remainingProperties[0].id
          localStorage.setItem('activePropertyId', newActiveId)
          await supabase
            .from('profiles')
            .update({ preferred_property_id: newActiveId })
            .eq('id', user.id)
        } else {
          localStorage.removeItem('activePropertyId')
          await supabase
            .from('profiles')
            .update({ preferred_property_id: null })
            .eq('id', user.id)
        }
      }

      // Reload properties
      await loadProperties()
      showToast(t('propertySelector.propertyDeleted'), 'success')
      setShowDeleteModal(false)
      setSelectedProperty(null)
      setConfirmName('')
      
      // Trigger property change event
      window.dispatchEvent(new CustomEvent('propertyChanged'))
    } catch (error) {
      console.error('Error deleting property:', error)
      showToast(t('propertySelector.errorDeletingProperty'), 'error')
    } finally {
      setDeleting(false)
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
      <Card className="border-red-200/50 bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Eliminar Propiedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Cargando...</p>
        </CardContent>
      </Card>
    )
  }

  if (properties.length === 0) {
    return (
      <Card className="border-red-200/50 bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Eliminar Propiedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No hay propiedades para eliminar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-red-200/50 bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Eliminar Propiedades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Elimina propiedades de forma permanente. Esta acción no se puede deshacer.
          </p>
          <div className="space-y-2">
            {properties.map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200/50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {getPropertyIcon(property.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{property.name}</div>
                    {property.location && (
                      <div className="text-xs text-slate-500 truncate">{property.location}</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(property)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

      {/* Modal de confirmación con nombre */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedProperty(null)
          setConfirmName('')
        }}
        title={
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Eliminar Propiedad</span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-900 mb-2">
              Esta acción no se puede deshacer.
            </p>
            <p className="text-sm text-red-700">
              Se eliminará permanentemente la propiedad <strong>"{selectedProperty?.name}"</strong> y todos sus datos asociados.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Para confirmar, escribe el nombre de la propiedad:
            </label>
            <Input
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={selectedProperty?.name}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Escribe exactamente: <strong>{selectedProperty?.name}</strong>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedProperty(null)
                setConfirmName('')
              }}
              className="flex-1"
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              disabled={deleting || confirmName.trim() !== selectedProperty?.name.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Eliminando...' : 'Eliminar Propiedad'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

