'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vendor } from '@/lib/types/database'
import { Plus, Search, Pencil, Trash2, Phone, Mail, MessageCircle, Users } from 'lucide-react'
import VendorForm from './VendorForm'
import { getCurrentTenantId } from '@/lib/utils/tenant'
import { useI18n } from '@/components/I18nProvider'
import { useTrialGuard } from '@/hooks/useTrialGuard'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'

export default function VendorList() {
  const { t } = useI18n()
  const { canWrite, showTrialBlockedToast } = useTrialGuard()
  const { showToast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchVendors()
  }, [])

  useEffect(() => {
    filterVendors()
  }, [vendors, searchTerm])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      // Get tenant_id from profile (vendors are shared by tenant, not by property)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        const { logError } = await import('@/lib/utils/error-handler')
        logError('VendorList.loadVendors.profile', profileError)
        setVendors([])
        setLoading(false)
        return
      }

      if (!profile || !profile.tenant_id) {
        // Only log in dev - this is expected for some users
        if (process.env.NODE_ENV === 'development') {
          console.warn('[VendorList] No profile or tenant_id found')
        }
        setVendors([])
        setLoading(false)
        return
      }

      // Fetch vendors filtered by tenant_id (shared across all properties in tenant)
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('company_name')

      if (!error && data) {
        setVendors(data)
      } else if (error) {
        const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
        logError('VendorList.loadVendors.fetch', error)
        showToast(getUserFriendlyError(error, t), 'error')
      }
    } catch (error) {
      const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
      logError('VendorList.loadVendors', error)
      showToast(getUserFriendlyError(error, t), 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterVendors = () => {
    if (!searchTerm) {
      setFilteredVendors(vendors)
      return
    }

    const filtered = vendors.filter(vendor =>
      vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredVendors(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!canWrite) {
      showTrialBlockedToast()
      return
    }
    if (!confirm(t('vendors.confirmDelete'))) return

    try {
      // Get tenant_id for security
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!profile?.tenant_id) return

      // Delete with tenant_id filter for security
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)

      if (error) {
        const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
        logError('VendorList.delete', error)
        showToast(getUserFriendlyError(error, t), 'error')
      } else {
        setVendors(vendors.filter(vendor => vendor.id !== id))
        showToast(t('vendors.vendorDeleted'), 'success')
      }
    } catch (error) {
      const { logError, getUserFriendlyError } = await import('@/lib/utils/error-handler')
      logError('VendorList.delete', error)
      showToast(getUserFriendlyError(error, t), 'error')
    }
  }

  const handleEdit = (vendor: Vendor) => {
    if (!canWrite) {
      showTrialBlockedToast()
      return
    }
    setEditingVendor(vendor)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingVendor(null)
    fetchVendors()
  }

  if (loading) {
    return <div className="flex justify-center p-8">{t('common.loading')}</div>
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <PageHeader
        title={t('vendors.title')}
        subtitle={t('vendors.totalVendors', { count: String(vendors.length) })}
        rightSlot={
          <Button
            onClick={() => {
              if (!canWrite) {
                showTrialBlockedToast()
                return
              }
              setShowForm(true)
            }}
            disabled={!canWrite}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            <Plus className="h-4 w-4" />
            {t('vendors.addVendor')}
          </Button>
        }
      />

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('vendors.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Users className="h-14 w-14" />}
            title={vendors.length === 0 ? t('vendors.emptyTitle') : t('vendors.noVendorsFound')}
            description={vendors.length === 0 ? t('vendors.emptyDescription') : t('vendors.tryDifferentFilters')}
            actionLabel={vendors.length === 0 ? t('vendors.addVendor') : undefined}
            onAction={vendors.length === 0 ? () => {
              if (!canWrite) {
                showTrialBlockedToast()
                return
              }
              setShowForm(true)
            } : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-lg shadow hover:shadow-md transition p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{vendor.company_name}</h3>
                  {vendor.specialty && (
                    <p className="text-sm text-gray-600 mt-1">{vendor.specialty}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(vendor)}
                    disabled={!canWrite}
                    className="p-1 text-gray-600 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    disabled={!canWrite}
                    className="p-1 text-gray-600 hover:text-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {vendor.phone && (
                  <a
                    href={`tel:${vendor.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
                  >
                    <Phone className="h-4 w-4" />
                    {vendor.phone}
                  </a>
                )}

                {vendor.whatsapp && (
                  <a
                    href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp: {vendor.whatsapp}
                  </a>
                )}

                {vendor.email && (
                  <a
                    href={`mailto:${vendor.email}`}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
                  >
                    <Mail className="h-4 w-4" />
                    {vendor.email}
                  </a>
                )}

                {vendor.notes && (
                  <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                    {vendor.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <VendorForm
          vendor={editingVendor}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
