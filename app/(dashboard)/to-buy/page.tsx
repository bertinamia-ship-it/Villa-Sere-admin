'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PurchaseItem } from '@/lib/types/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { Plus, ShoppingCart, Edit, Trash2, ExternalLink, Search } from 'lucide-react'
import PurchaseItemForm from './PurchaseItemForm'
import { getActivePropertyId } from '@/lib/utils/property-client'
import { t } from '@/lib/i18n/es'

export default function ToBuyPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [hasProperty, setHasProperty] = useState(true)
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [filteredItems, setFilteredItems] = useState<PurchaseItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<PurchaseItem | null>(null)

  const loadItems = async () => {
    setLoading(true)
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        setItems([])
        setHasProperty(false)
        setLoading(false)
        return
      }

      setHasProperty(true)
      const { data, error } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
      showToast('Error al cargar items', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    
    // Listen for property changes
    const handlePropertyChange = () => {
      loadItems()
    }
    window.addEventListener('propertyChanged', handlePropertyChange)
    return () => window.removeEventListener('propertyChanged', handlePropertyChange)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, statusFilter, areaFilter])

  function filterItems() {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    if (areaFilter !== 'all') {
      filtered = filtered.filter(item => item.area === areaFilter)
    }

    setFilteredItems(filtered)
  }

  async function handleSave(item: Partial<PurchaseItem>) {
    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('errors.propertyRequired'), 'error')
        return
      }

      if (editingItem) {
        // Update: filter by id + property_id for security
        const { error } = await supabase
          .from('purchase_items')
          .update({ ...item, property_id: propertyId })
          .eq('id', editingItem.id)
          .eq('property_id', propertyId)
        if (error) throw error
        showToast(t('toBuy.itemSaved'), 'success')
      } else {
        // Insert: include property_id
        const { error } = await supabase
          .from('purchase_items')
          .insert([{ ...item, property_id: propertyId }])
        if (error) throw error
        showToast(t('toBuy.itemSaved'), 'success')
      }
      
      setShowForm(false)
      setEditingItem(null)
      loadItems()
    } catch (error) {
      console.error('Error saving item:', error)
      showToast(t('toBuy.saveError'), 'error')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este artículo?')) return

    try {
      const propertyId = await getActivePropertyId()
      if (!propertyId) {
        showToast(t('toBuy.noPropertySelected'), 'error')
        return
      }

      const { error } = await supabase
        .from('purchase_items')
        .delete()
        .eq('id', id)
        .eq('property_id', propertyId) // Security: ensure property matches
      
      if (error) throw error
      showToast(t('toBuy.itemDeleted'), 'success')
      loadItems()
    } catch (error) {
      console.error('Error deleting item:', error)
      showToast(t('toBuy.deleteError'), 'error')
    }
  }

  function handleEdit(item: PurchaseItem) {
    setEditingItem(item)
    setShowForm(true)
  }

  const areas = Array.from(new Set(items.map(i => i.area).filter(Boolean))) as string[]
  const statusCounts = {
    to_buy: items.filter(i => i.status === 'to_buy').length,
    ordered: items.filter(i => i.status === 'ordered').length,
    received: items.filter(i => i.status === 'received').length,
  }

  const totalCost = filteredItems
    .filter(i => i.est_cost)
    .reduce((sum, i) => sum + (i.est_cost || 0) * i.quantity, 0)

  const statusColors: Record<string, string> = {
    to_buy: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20',
    ordered: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    received: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
  }

  const statusLabels = {
    to_buy: t('status.toBuy'),
    ordered: 'Ordenado',
    received: 'Recibido',
  }

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!hasProperty) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('toBuy.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('toBuy.subtitle')}</p>
        </div>
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12" />}
          title={t('toBuy.noPropertySelected')}
          description={t('toBuy.noPropertyDescription')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('toBuy.title')}</h1>
          <p className="mt-1 text-sm text-gray-700">{t('toBuy.subtitle')}</p>
        </div>
        <Button 
          onClick={() => {
            setEditingItem(null)
            setShowForm(true)
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t('toBuy.addItem')}
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('status.toBuy')}</p>
              <p className="text-xl font-bold text-gray-900">{statusCounts.to_buy}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('toBuy.ordered')}</p>
              <p className="text-xl font-bold text-gray-900">{statusCounts.ordered}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('toBuy.received')}</p>
              <p className="text-xl font-bold text-gray-900">{statusCounts.received}</p>
            </div>
          </div>
        </Card>

        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('toBuy.estimatedCost')}</p>
              <p className="text-xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('toBuy.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('toBuy.status')}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900"
              >
                <option value="all">{t('toBuy.allStatuses')}</option>
                <option value="to_buy">{t('status.toBuy')}</option>
                <option value="ordered">{t('toBuy.ordered')}</option>
                <option value="received">{t('toBuy.received')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('toBuy.area')}</label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900"
              >
                <option value="all">{t('toBuy.allAreas')}</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShoppingCart className="h-12 w-12" />}
            title={t('toBuy.noItems')}
            description={t('toBuy.noItemsDescription')}
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                {t('toBuy.addItem')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id} padding="sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.item}</h3>
                      {item.area && (
                        <p className="text-sm text-gray-700">{item.area}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">{t('toBuy.quantity')}</p>
                      <p className="font-medium text-gray-900">{item.quantity}</p>
                    </div>
                    {item.est_cost && (
                      <div>
                        <p className="text-gray-500">{t('toBuy.estimatedCost')}</p>
                        <p className="font-medium text-gray-900">${(item.est_cost * item.quantity).toFixed(2)}</p>
                      </div>
                    )}
                    {item.link && (
                      <div className="col-span-2">
                        <p className="text-gray-500">{t('toBuy.link')}</p>
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {t('common.view')} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {item.notes && (
                    <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">
                      {item.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PurchaseItemForm
              item={editingItem}
              areas={areas}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false)
                setEditingItem(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
