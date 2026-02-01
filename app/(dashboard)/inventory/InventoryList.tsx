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
import { t } from '@/lib/i18n/es'

export default function InventoryList() {
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
    
    // Listen for property changes
    const handlePropertyChange = () => {
      fetchItems()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    // Get active property name
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Gestiona el inventario de tu propiedad</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200/60 p-4 space-y-3">
              <Skeleton variant="rectangular" height={200} />
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="50%" height={16} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Gestiona el inventario de tu propiedad</p>
        </div>
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title={t('inventory.noPropertySelected')}
          description={t('inventory.noPropertyDescription')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('inventory.title')}</h1>
          <p className="text-gray-600 mt-1">{items.length} artículos en total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Upload className="h-5 w-5" />
            {t('inventory.importCSV')}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <Download className="h-5 w-5" />
            {t('inventory.exportCSV')}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5" />
            {t('inventory.addItem')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('inventory.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.category')}</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">{t('inventory.allCategories')}</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.room')}</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">{t('inventory.allRooms')}</option>
              {ROOMS.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">{t('inventory.itemNotFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition">
              {item.photo_url && (
                <img 
                  src={item.photo_url} 
                  alt={item.name} 
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-base mb-1">{item.name}</h3>
                    <p className="text-sm text-slate-600 mb-0.5">{item.category}</p>
                    <p className="text-xs text-slate-500">{item.location}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded transition-all duration-150"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="p-1.5 text-slate-500 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-all duration-150"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {item.quantity <= item.min_threshold && (
                  <div className="flex items-center gap-1.5 text-[#EF4444] text-xs font-medium mb-2 px-2 py-1 bg-[#EF4444]/10 rounded">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{t('inventory.lowStock')}</span>
                  </div>
                )}

                <QuickAdjust
                  item={item}
                  onQuantityChange={handleQuantityChange}
                />

                {item.notes && (
                  <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-[#E5E7EB]">{item.notes}</p>
                )}
              </div>
            </div>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('inventory.importCSV')}</h2>
              <button
                onClick={() => {
                  setShowImport(false)
                  fetchItems() // Refresh list after import
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <CSVImport />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, itemId: null })}
        onConfirm={handleDelete}
        title={t('inventory.editItem')}
        message="¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer."
        confirmText={t('common.delete')}
        loading={deleting}
      />
    </div>
  )
}
