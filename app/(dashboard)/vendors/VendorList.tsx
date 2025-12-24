'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Vendor } from '@/lib/types/database'
import { Plus, Search, Pencil, Trash2, Phone, Mail, MessageCircle } from 'lucide-react'
import VendorForm from './VendorForm'

export default function VendorList() {
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
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('company_name')

    if (!error && data) {
      setVendors(data)
    }
    setLoading(false)
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
    if (!confirm('Are you sure you want to delete this vendor?')) return

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id)

    if (!error) {
      setVendors(vendors.filter(vendor => vendor.id !== id))
    }
  }

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingVendor(null)
    fetchVendors()
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">{vendors.length} total vendors</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-0 focus:ring-0 text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Vendors List */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No vendors found</p>
        </div>
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
                    className="p-1 text-gray-600 hover:text-blue-600 transition"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    className="p-1 text-gray-600 hover:text-red-600 transition"
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
