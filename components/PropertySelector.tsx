'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Plus, Loader2, ChevronDown } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
import TenantError from './TenantError'
import { t } from '@/lib/i18n/es'

interface Property {
  id: string
  name: string
  location: string | null
}

export default function PropertySelector() {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPropertyName, setNewPropertyName] = useState('')
  const [newPropertyLocation, setNewPropertyLocation] = useState('')
  const [tenantError, setTenantError] = useState<string | null>(null)

  // Load properties and active property
  useEffect(() => {
    loadProperties()
  }, [])

  async function loadProperties() {
    setLoading(true)
    try {
      // Get tenant_id from profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, preferred_property_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('[PropertySelector] Error fetching profile:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        setLoading(false)
        return
      }

      if (!profile || !profile.tenant_id) {
        console.error('[PropertySelector] CRITICAL: No profile or tenant_id found for user:', {
          user_id: user.id,
          profile_exists: !!profile,
          tenant_id: profile?.tenant_id
        })
        setTenantError(
          `Your account (${user.email}) is missing tenant information. ` +
          `Please contact support or run: UPDATE profiles SET tenant_id = (SELECT id FROM tenants WHERE owner_id = '${user.id}') WHERE id = '${user.id}';`
        )
        setLoading(false)
        return
      }

      // Clear any previous tenant errors
      setTenantError(null)

      // Get all properties for tenant
      const { data: props } = await supabase
        .from('properties')
        .select('id, name, location')
        .eq('tenant_id', profile.tenant_id)
        .order('name')

      setProperties(props || [])

      // Set active property: preferred → first property
      const activeId = profile.preferred_property_id || props?.[0]?.id || null
      setActivePropertyId(activeId)

      // Store in localStorage for client-side access
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
    setActivePropertyId(propertyId)
    localStorage.setItem('activePropertyId', propertyId)

    // Update preferred_property_id in profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_property_id: propertyId })
        .eq('id', user.id)

      if (error) {
        console.error('[PropertySelector] Error updating preferred property:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          user_id: user.id,
          property_id: propertyId
        })
      }
    }

    // Trigger refresh to update all queries
    window.dispatchEvent(new CustomEvent('propertyChanged', { detail: { propertyId } }))
  }

  async function handleCreateProperty() {
    if (!newPropertyName.trim()) {
      return
    }

    setCreating(true)
    try {
      // Get tenant_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[PropertySelector] No user found')
        setCreating(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('[PropertySelector] Error fetching profile in createProperty:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
          user_id: user.id
        })
        alert(`Error: ${profileError.message || 'Failed to fetch profile'}`)
        setCreating(false)
        return
      }

      if (!profile || !profile.tenant_id) {
        const errorMsg = `CRITICAL ERROR: Your account (${user.email}) is missing tenant_id. ` +
          `This prevents creating properties. ` +
          `Please contact support or run: UPDATE profiles SET tenant_id = (SELECT id FROM tenants WHERE owner_id = '${user.id}') WHERE id = '${user.id}';`
        console.error('[PropertySelector] CRITICAL: No profile or tenant_id found:', {
          user_id: user.id,
          profile_exists: !!profile,
          tenant_id: profile?.tenant_id,
          error_message: errorMsg
        })
        alert(errorMsg)
        setTenantError(errorMsg)
        setCreating(false)
        return
      }

      // Check subscription limits
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('subscription_plan, subscription_status')
        .eq('id', profile.tenant_id)
        .maybeSingle()
      
      if (tenantError) {
        console.error('[PropertySelector] Error fetching tenant:', {
          message: tenantError.message,
          details: tenantError.details,
          hint: tenantError.hint,
          code: tenantError.code,
          tenant_id: profile.tenant_id
        })
        // Continue anyway - subscription check is optional
      }

      if (tenant) {
        const isFreeOrTrial = tenant.subscription_plan === 'free' || tenant.subscription_status === 'trial'
        if (isFreeOrTrial) {
          // Check current property count
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profile.tenant_id)

          if ((count || 0) >= 1) {
            alert(t('propertySelector.freeTrialLimit'))
            setShowCreateModal(false)
            return
          }
        }
      }

      // Create property
      const { data: newProperty, error: createError } = await supabase
        .from('properties')
        .insert({
          tenant_id: profile.tenant_id,
          name: newPropertyName.trim(),
          location: newPropertyLocation.trim() || null,
        })
        .select()
        .single()

      if (createError) {
        console.error('[PropertySelector] Error creating property:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code,
          tenant_id: profile.tenant_id
        })
        alert(`${t('propertySelector.errorCreatingProperty')}: ${createError.message || 'Unknown error'}`)
        setCreating(false)
        return
      }

      if (!newProperty) {
        console.error('[PropertySelector] Property created but no data returned')
        alert(t('propertySelector.propertyCreatedFailedRetrieve'))
        setCreating(false)
        return
      }

      // Reload properties and set as active
      await loadProperties()
      if (newProperty) {
        await handlePropertyChange(newProperty.id)
      }

      // Reset form
      setNewPropertyName('')
      setNewPropertyLocation('')
      setShowCreateModal(false)
    } catch (error) {
      console.error('Error creating property:', error)
      alert(t('propertySelector.errorCreatingPropertyRetry'))
    } finally {
      setCreating(false)
    }
  }

  if (tenantError) {
    return (
      <TenantError 
        message={tenantError}
        onRetry={() => {
          setTenantError(null)
          loadProperties()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{t('propertySelector.loading')}</span>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Crear Propiedad</span>
        </Button>
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setNewPropertyName('')
            setNewPropertyLocation('')
          }}
          title={t('propertySelector.createFirstProperty')}
          size="md"
        >
          <div className="space-y-4">
            <Input
            label={t('propertySelector.propertyName')}
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
            placeholder={t('propertySelector.propertyNamePlaceholder')}
              required
            />
            <Input
            label={t('propertySelector.propertyLocation')}
            value={newPropertyLocation}
            onChange={(e) => setNewPropertyLocation(e.target.value)}
            placeholder={t('propertySelector.propertyLocationPlaceholder')}
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewPropertyName('')
                  setNewPropertyLocation('')
                }}
                disabled={creating}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreateProperty}
                loading={creating}
                disabled={!newPropertyName.trim()}
              >
                {t('common.create')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  }

  const activeProperty = properties.find(p => p.id === activePropertyId) || properties[0]

  // Get property icon based on name or location
  const getPropertyIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('beach') || lowerName.includes('playa') || lowerName.includes('mar')) return '🏖️'
    if (lowerName.includes('mountain') || lowerName.includes('montaña')) return '⛰️'
    if (lowerName.includes('city') || lowerName.includes('ciudad')) return '🏙️'
    return '🏠'
  }

  return (
    <div className="flex items-center gap-2">
      {/* Dropdown para cambiar propiedad */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-all duration-150 ease-out text-sm font-medium text-[#0F172A]"
        >
          <span className="text-base shrink-0">{activeProperty ? getPropertyIcon(activeProperty.name) : '🏠'}</span>
          <span className="truncate max-w-[120px]">{activeProperty?.name || t('propertySelector.selectProperty')}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-[#64748B] shrink-0 transition-transform duration-150 ease-out ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-[94]"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-1.5 w-56 rounded-lg bg-white border border-gray-200/60 shadow-lg py-1.5 z-[95] animate-dropdown-enter">
              <div className="max-h-64 overflow-y-auto">
                {properties.length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-[#64748B] text-center">{t('propertySelector.noProperties')}</div>
                ) : (
                  properties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => {
                        handlePropertyChange(property.id)
                        setShowDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-all duration-150 ease-out flex items-center gap-2.5 ${
                        property.id === activePropertyId
                          ? 'bg-[#0F172A] text-white font-medium'
                          : 'text-[#0F172A]'
                      }`}
                    >
                      <span className="text-base shrink-0">{getPropertyIcon(property.name)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{property.name}</div>
                        {property.location && (
                          <div className={`text-[10px] truncate ${property.id === activePropertyId ? 'text-white/70' : 'text-[#64748B]'}`}>
                            {property.location}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Botón separado para agregar propiedad */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-gray-200/60 hover:bg-gray-50 hover:border-gray-300/60 transition-all duration-150 ease-out text-xs font-medium text-[#0F172A]"
      >
        <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
        <span className="hidden sm:inline">Agregar</span>
      </button>

      {/* Modal para crear propiedad */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setNewPropertyName('')
          setNewPropertyLocation('')
        }}
        title={t('propertySelector.addNewProperty')}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t('propertySelector.propertyName')}
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
            placeholder={t('propertySelector.propertyNamePlaceholder')}
            required
          />
          <Input
            label={t('propertySelector.propertyLocation')}
            value={newPropertyLocation}
            onChange={(e) => setNewPropertyLocation(e.target.value)}
            placeholder={t('propertySelector.propertyLocationPlaceholder')}
          />
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false)
                setNewPropertyName('')
                setNewPropertyLocation('')
              }}
              disabled={creating}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreateProperty}
              loading={creating}
              disabled={!newPropertyName.trim()}
            >
              {t('propertySelector.createProperty')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

