'use client'

import { useState } from 'react'
import { PurchaseItem } from '@/lib/types/database'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface PurchaseItemFormProps {
  item?: PurchaseItem | null
  areas: string[]
  onSave: (item: Partial<PurchaseItem>) => void
  onCancel: () => void
}

export default function PurchaseItemForm({ item, areas, onSave, onCancel }: PurchaseItemFormProps) {
  const [formData, setFormData] = useState({
    area: item?.area || '',
    item: item?.item || '',
    quantity: item?.quantity?.toString() || '1',
    est_cost: item?.est_cost?.toString() || '',
    link: item?.link || '',
    status: item?.status || 'to_buy',
    notes: item?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSave({
      area: formData.area || null,
      item: formData.item,
      quantity: parseInt(formData.quantity) || 1,
      est_cost: formData.est_cost ? parseFloat(formData.est_cost) : null,
      link: formData.link || null,
      status: formData.status as 'to_buy' | 'ordered' | 'received',
      notes: formData.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <CardHeader>
        <CardTitle>{item ? 'Edit Item' : 'Add New Item'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            label="Item Name"
            value={formData.item}
            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
            placeholder="e.g., Towels, Soap, etc."
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Area
              </label>
              <input
                list="areas"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Kitchen, Master, etc."
                className="w-full px-3.5 py-2.5 text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="areas">
                {areas.map(area => (
                  <option key={area} value={area} />
                ))}
              </datalist>
            </div>

            <Input
              type="number"
              label="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.01"
              label="Est. Cost (per item)"
              value={formData.est_cost}
              onChange={(e) => setFormData({ ...formData, est_cost: e.target.value })}
              placeholder="0.00"
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'to_buy' | 'ordered' | 'received' })}
              options={[
                { value: 'to_buy', label: 'To Buy' },
                { value: 'ordered', label: 'Ordered' },
                { value: 'received', label: 'Received' },
              ]}
              required
            />
          </div>

          <Input
            label="Link"
            type="url"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://..."
          />

          <Textarea
            label="Notes"
            rows={3}
            placeholder="Additional details..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {item ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </div>
      </CardContent>
    </form>
  )
}
