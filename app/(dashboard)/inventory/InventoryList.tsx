'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InventoryItem } from '@/lib/types/database'
import { CATEGORIES, ROOMS } from '@/lib/constants'
import { Plus, Search, Pencil, Trash2, Package, AlertCircle, Download, Upload } from 'lucide-react'
import InventoryForm from './InventoryForm'
import QuickAdjust from './QuickAdjust'
import CSVImport from './CSVImport'
import { exportToCSV } from '@/lib/utils/export'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/components/I18nProvider'
import { useTrialGuard } from '@/hooks/useTrialGuard'
import { PageHeader } from '@/components/ui/PageHeader'

export default function InventoryList() {
  const { t } = useI18n()
  const { canWrite, showTrialBlockedToast } = useTrialGuard()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasProperty, setHasProperty] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; itemId: string | null }>({ isOpen: false, itemId: null })
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  const fetchItems = async () => {
    setLoading(true)
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      setItems([])
      setHasProperty(false)
      setLoading(false)
      return
    }

    setHasProperty(true)
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('property_id', propertyId)
      .order('name')

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
    
    const handlePropertyChange = () => {
      fetchItems()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, categoryFilter, roomFilter])

  const filterItems = () => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }

    if (roomFilter !== 'all') {
      filtered = filtered.filter(item => item.location === roomFilter)
    }

    setFilteredItems(filtered)
  }

  const handleDeleteClick = (id: string) => {
    if (!canWrite) {
      showTrialBlockedToast()
      return
    }
    setDeleteConfirm({ isOpen: true, itemId: id })
  }

  const handleDelete = async () => {
    if (!deleteConfirm.itemId) return

    setDeleting(true)
    const propertyId = await getActivePropertyId()
    if (!propertyId) {
      setDeleting(false)
      setDeleteConfirm({ isOpen: false, itemId: null })
      return
    }

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', deleteConfirm.itemId)
      .eq('property_id', propertyId)

    if (!error) {
      setItems(items.filter(item => item.id !== deleteConfirm.itemId))
    }
    
    setDeleting(false)
    setDeleteConfirm({ isOpen: false, itemId: null })
  }

  const handleEdit = (item: InventoryItem) => {
    if (!canWrite) {
      showTrialBlockedToast()
      return
    }
    setEditingItem(item)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingItem(null)
    fetchItems()
  }

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    const propertyId = await getActivePropertyId()
    if (!propertyId) return

    const { error } = await supabase
      .from('inventory_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId)
      .eq('property_id', propertyId)

    if (!error) {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const handleExportCSV = async () => {
    const propertyId = await getActivePropertyId()
    let propertyName: string | null = null
    if (propertyId) {
      const { data: property } = await supabase
        .from('properties')
        .select('name')
        .eq('id', propertyId)
        .maybeSingle()
      propertyName = property?.name || null
    }

    const exportData = items.map(item => ({
      Name: item.name,
      Category: item.category,
      Location: item.location,
      Quantity: item.quantity,
      'Min Threshold': item.min_threshold,
      Notes: item.notes || '',
      'Created At': new Date(item.created_at).toLocaleDateString()
    }))
    exportToCSV(exportData, 'Inventario', undefined, { propertyName })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title={t('inventory.title')} subtitle={t('inventory.subtitle')} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="none">
              <Skeleton variant="rectangular" height={200} className="rounded-t-xl" />
              <div className="p-6 space-y-3">
                <Skeleton variant="text" width="70%" height={20} />
                <Skeleton variant="text" width="50%" height={16} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="space-y-8">
        <PageHeader title={t('inventory.title')} subtitle={t('inventory.subtitle')} />
        <EmptyState
          icon={<Package className="h-14 w-14" />}
          title={t('inventory.noPropertySelected')}
          description={t('inventory.selectOrCreatePropertyInventory')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">{t('inventory.title')}</h1>
          <p className="text-sm text-[#64748B] leading-relaxed">
              {filteredItems.length === 0 
                ? t('inventory.emptyTitle')
                : t('inventory.totalItems', { count: String(filteredItems.length) })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImport(true)}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            <Upload className="h-4 w-4" />
            {t('inventory.importCSV')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            <Download className="h-4 w-4" />
            {t('inventory.exportCSV')}
          </Button>
          <Button
            size="sm"
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
            {t('inventory.addItem')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
            <Search className="h-4 w-4 text-[#64748B] shrink-0" />
            <input
              type="text"
              placeholder={t('inventory.searchItems')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-0 focus:ring-0 text-base sm:text-sm text-[#0F172A] placeholder-[#94A3B8] min-h-[44px] sm:min-h-0"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-2">
                {t('inventory.category')}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-3 sm:py-2 text-base sm:text-sm text-[#0F172A] bg-white focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all min-h-[44px] sm:min-h-0"
              >
                <option value="all">{t('inventory.allCategories')}</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748B] uppercase tracking-wide mb-2">
                {t('inventory.room')}
              </label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-3 sm:py-2 text-base sm:text-sm text-[#0F172A] bg-white focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all min-h-[44px] sm:min-h-0"
              >
                <option value="all">{t('inventory.allRooms')}</option>
                {ROOMS.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Package className="h-14 w-14" />}
            title={items.length === 0 ? t('inventory.emptyTitle') : t('inventory.noItemsFound')}
            description={items.length === 0 ? t('inventory.emptyDescription') : t('inventory.tryDifferentFilters')}
            actionLabel={items.length === 0 ? t('inventory.emptyAction') : undefined}
            onAction={items.length === 0 ? () => {
              if (!canWrite) {
                showTrialBlockedToast()
                return
              }
              setShowForm(true)
            } : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} padding="none" className="overflow-hidden group">
              {item.photo_url && (
                <div className="relative w-full h-48 overflow-hidden bg-[#F8FAFC]">
                  <img 
                    src={item.photo_url} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3 className="font-semibold text-[#0F172A] text-base mb-1.5 truncate">{item.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(item)}
                      disabled={!canWrite}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={t('common.edit')}
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      disabled={!canWrite}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {item.quantity <= item.min_threshold && (
                  <div className="flex items-center gap-2 text-[#EF4444] text-xs font-medium mb-4 px-3 py-1.5 bg-[#EF4444]/10 rounded-lg border border-[#EF4444]/20">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{t('inventory.lowStock')}</span>
                  </div>
                )}

                <QuickAdjust
                  item={item}
                  onQuantityChange={handleQuantityChange}
                />

                {item.notes && (
                  <p className="text-sm text-[#64748B] mt-4 pt-4 border-t border-[#E2E8F0] leading-relaxed">{item.notes}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <InventoryForm
          item={editingItem}
          onClose={handleFormClose}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-[#E2E8F0]">
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0F172A]">{t('inventory.importCSV')}</h2>
              <button
                onClick={() => {
                  setShowImport(false)
                  fetchItems()
                }}
                className="text-[#64748B] hover:text-[#0F172A] transition-colors p-1 rounded-lg hover:bg-[#F8FAFC]"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <CSVImport />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemId: null })}
        onConfirm={handleDelete}
        title={t('inventory.deleteItemTitle')}
        message={t('inventory.deleteItemMessage')}
        confirmText={t('common.delete')}
        loading={deleting}
      />
    </div>
  )
}
