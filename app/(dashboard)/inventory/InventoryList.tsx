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

export default function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchItems()
  }, [])

  useEffect(() => {
    filterItems()
  }, [items, searchTerm, categoryFilter, roomFilter])

  const fetchItems = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name')

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)

    if (!error) {
      setItems(items.filter(item => item.id !== id))
    }
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
    const { error } = await supabase
      .from('inventory_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId)

    if (!error) {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const handleExportCSV = () => {
    const exportData = items.map(item => ({
      Name: item.name,
      Category: item.category,
      Location: item.location,
      Quantity: item.quantity,
      'Min Threshold': item.min_threshold,
      Notes: item.notes || '',
      'Created At': new Date(item.created_at).toLocaleDateString()
    }))
    exportToCSV(exportData, 'inventory')
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">{items.length} total items</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Upload className="h-5 w-5" />
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
            >
              <option value="all">All Rooms</option>
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
          <p className="text-gray-600">No items found</p>
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
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                    <p className="text-sm text-gray-500">{item.location}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-gray-600 hover:text-blue-600 transition"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-gray-600 hover:text-red-600 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {item.quantity <= item.min_threshold && (
                  <div className="flex items-center gap-1 text-red-600 text-sm mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Low stock!</span>
                  </div>
                )}

                <QuickAdjust
                  item={item}
                  onQuantityChange={handleQuantityChange}
                />

                {item.notes && (
                  <p className="text-sm text-gray-600 mt-2">{item.notes}</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Import Inventory</h2>
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
    </div>
  )
}
