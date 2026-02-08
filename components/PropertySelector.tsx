'use client'

import { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Plus, Loader2, ChevronDown, Home, Building, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
import { ConfirmModal } from './ui/ConfirmModal'
import TenantError from './TenantError'
import { useToast } from './ui/Toast'
import { t } from '@/lib/i18n/es'
import { cache, CACHE_KEYS } from '@/lib/utils/cache'

interface Property {
  id: string
  name: string
  location: string | null
}

function PropertySelector() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newPropertyName, setNewPropertyName] = useState('')
  const [newPropertyLocation, setNewPropertyLocation] = useState('')
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [isChanging, setIsChanging] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; propertyId: string | null; propertyName: string }>({ isOpen: false, propertyId: null, propertyName: '' })
  const [deleting, setDeleting] = useState(false)

  // Load properties and active property - MUST be defined before useEffect
  const loadProperties = useCallback(async () => {
    setLoading(true)
    try {
      // Get tenant_id from profile (with cache)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Try cache first
      const profileCacheKey = CACHE_KEYS.profile(user.id)
      let profile = cache.get<{ tenant_id: string | null; preferred_property_id: string | null }>(profileCacheKey)

      if (!profile) {
        const { data: profileData, error: profileError } = await supabase
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

        if (!profileData || !profileData.tenant_id) {
          console.error('[PropertySelector] CRITICAL: No profile or tenant_id found for user:', {
            user_id: user.id,
            profile_exists: !!profileData,
            tenant_id: profileData?.tenant_id
          })
          setTenantError(
            `Your account (${user.email}) is missing tenant information. ` +
            `Please contact support or run: UPDATE profiles SET tenant_id = (SELECT id FROM tenants WHERE owner_id = '${user.id}') WHERE id = '${user.id}';`
          )
          setLoading(false)
          return
        }

        profile = { tenant_id: profileData.tenant_id, preferred_property_id: profileData.preferred_property_id }
        // Cache profile
        cache.set(profileCacheKey, profile)
      }

      // Clear any previous tenant errors
      setTenantError(null)

      // Get all properties for tenant (with cache)
      const propertiesCacheKey = CACHE_KEYS.properties(profile.tenant_id!)
      let props = cache.get<Property[]>(propertiesCacheKey)

      if (!props) {
        const { data: propsData } = await supabase
          .from('properties')
          .select('id, name, location')
          .eq('tenant_id', profile.tenant_id!)
          .order('name')

        props = propsData || []
        // Cache properties
        cache.set(propertiesCacheKey, props)
      }

      setProperties(props)

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
  }, [supabase])

  // Load properties and active property on mount
  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  // Get property icon component based on name (heuristic) - memoized
  // MUST be before any conditional returns
  const getPropertyIcon = useCallback((name: string) => {
    const lowerName = name.toLowerCase()
    
    // Departamento / Apartamento
    if (lowerName.includes('departamento') || lowerName.includes('apartamento') || 
        lowerName.includes('depto') || lowerName.includes('apto') ||
        lowerName.includes('apartment') || lowerName.includes('flat')) {
      return <Building className="h-4 w-4 text-[#64748B]" />
    }
    
    // Villa
    if (lowerName.includes('villa') || lowerName.includes('casa grande')) {
      return <Home className="h-4 w-4 text-[#64748B]" />
    }
    
    // Default: Casa / Home
    return <Home className="h-4 w-4 text-[#64748B]" />
  }, [])

  // Memoize active property - MUST be before any conditional returns
  const activeProperty = useMemo(() => {
    return properties.find(p => p.id === activePropertyId) || properties[0]
  }, [properties, activePropertyId])

  const handlePropertyChange = useCallback(async (propertyId: string) => {
    if (propertyId === activePropertyId) return
    
    setIsChanging(true)
    const newProperty = properties.find(p => p.id === propertyId)
    
    // Micro transición suave
    await new Promise(resolve => setTimeout(resolve, 150))
    
    setActivePropertyId(propertyId)
    localStorage.setItem('activePropertyId', propertyId)

    // Update preferred_property_id in profile and invalidate cache
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
      } else {
        // Invalidate profile cache
        cache.invalidate(CACHE_KEYS.profile(user.id))
      }
    }

    // Trigger refresh to update all queries (non-blocking)
    window.dispatchEvent(new CustomEvent('propertyChanged', { detail: { propertyId } }))
    
    // Toast feedback
    if (newProperty) {
      showToast(`Propiedad cambiada a: ${newProperty.name}`, 'success')
    }
    
    setIsChanging(false)
  }, [activePropertyId, properties, supabase, showToast])

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
        // Bypass restrictions for admin/test accounts
        const isAdminAccount = user.email === 'condecorporation@gmail.com'
        
        if (!isAdminAccount) {
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

      // Invalidate properties cache and reload
      if (profile?.tenant_id) {
        cache.invalidate(CACHE_KEYS.properties(profile.tenant_id))
      }
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

  async function handleDeleteProperty() {
    if (!deleteConfirm.propertyId) return

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
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.tenant_id) {
        showToast(t('propertySelector.errorDeletingProperty'), 'error')
        setDeleting(false)
        return
      }

      // Delete property
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', deleteConfirm.propertyId)
        .eq('tenant_id', profile.tenant_id)

      if (error) {
        console.error('[PropertySelector] Error deleting property:', error)
        showToast(t('propertySelector.errorDeletingProperty'), 'error')
        setDeleting(false)
        return
      }

      // If deleted property was active, switch to another or clear
      if (deleteConfirm.propertyId === activePropertyId) {
        const remainingProperties = properties.filter(p => p.id !== deleteConfirm.propertyId)
        if (remainingProperties.length > 0) {
          await handlePropertyChange(remainingProperties[0].id)
        } else {
          setActivePropertyId(null)
          localStorage.removeItem('activePropertyId')
          // Clear preferred_property_id
          await supabase
            .from('profiles')
            .update({ preferred_property_id: null })
            .eq('id', user.id)
        }
      }

      // Invalidate cache and reload properties
      cache.invalidate(CACHE_KEYS.properties(profile.tenant_id))
      cache.invalidate(CACHE_KEYS.profile(user.id))
      await loadProperties()
      showToast(t('propertySelector.propertyDeleted'), 'success')
      setDeleteConfirm({ isOpen: false, propertyId: null, propertyName: '' })
      
      // Trigger property change event
      window.dispatchEvent(new CustomEvent('propertyChanged'))
    } catch (error) {
      console.error('Error deleting property:', error)
      showToast(t('propertySelector.errorDeletingProperty'), 'error')
    } finally {
      setDeleting(false)
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

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Dropdown principal para cambiar propiedad */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isChanging}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-gray-200/60 bg-white hover:bg-gray-50 hover:border-gray-300/60 transition-all duration-200 ease-out text-xs sm:text-sm font-medium text-[#0F172A] ${
            isChanging ? 'opacity-60 cursor-wait' : ''
          }`}
        >
          <span className="shrink-0">
            {activeProperty ? getPropertyIcon(activeProperty.name) : <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#64748B]" />}
          </span>
          <span className="truncate max-w-[100px] sm:max-w-[140px] md:max-w-[180px]">{activeProperty?.name || t('propertySelector.selectProperty')}</span>
          <ChevronDown className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#64748B] shrink-0 transition-transform duration-200 ease-out ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-[94]"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-1.5 w-56 rounded-lg bg-white border border-gray-200/60 shadow-lg py-1 z-[95]">
              <div className="max-h-64 overflow-y-auto">
                {properties.length === 0 ? (
                  <div className="px-3 py-2.5 text-xs text-[#64748B] text-center">{t('propertySelector.noProperties')}</div>
                ) : (
                  properties.map((property) => (
                    <div
                      key={property.id}
                      className={`group flex items-center gap-2 ${
                        property.id === activePropertyId
                          ? 'bg-[#0F172A] text-white'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => {
                          handlePropertyChange(property.id)
                          setShowDropdown(false)
                        }}
                        className={`flex-1 text-left px-3 py-2.5 text-sm transition-all duration-200 ease-out flex items-center gap-2.5 ${
                          property.id === activePropertyId
                            ? 'text-white font-medium'
                            : 'text-[#0F172A]'
                        }`}
                      >
                        <span className="shrink-0">
                          {getPropertyIcon(property.name)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{property.name}</div>
                          {property.location && (
                            <div className={`text-[10px] truncate mt-0.5 ${property.id === activePropertyId ? 'text-white/70' : 'text-[#64748B]'}`}>
                              {property.location}
                            </div>
                          )}
                        </div>
                      </button>
                      {properties.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm({ isOpen: true, propertyId: property.id, propertyName: property.name })
                            setShowDropdown(false)
                          }}
                          className={`px-2 py-2.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                            property.id === activePropertyId
                              ? 'text-white/70 hover:text-white hover:bg-red-500/20'
                              : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                          }`}
                          title="Eliminar propiedad"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Botón secundario (ghost) para agregar propiedad - más discreto */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border border-transparent hover:border-gray-200/60 hover:bg-gray-50/50 transition-all duration-200 ease-out text-xs font-medium text-[#64748B] hover:text-[#0F172A] min-w-[32px] sm:min-w-0"
        title="Agregar propiedad"
      >
        <Plus className="h-3.5 w-3.5 stroke-[1.5]" />
        <span className="hidden sm:inline">Agregar propiedad</span>
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

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, propertyId: null, propertyName: '' })}
        onConfirm={handleDeleteProperty}
        title={t('propertySelector.deleteProperty')}
        message={t('propertySelector.confirmDeleteProperty', { name: deleteConfirm.propertyName })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}

export default memo(PropertySelector)

