'use client'

import { useState } from 'react'
import { Booking } from '@/lib/types/database'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface BookingFormProps {
  booking?: Booking | null
  onSave: (booking: Partial<Booking>) => void
  onCancel: () => void
}

export default function BookingForm({ booking, onSave, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    guest_name: booking?.guest_name || '',
    platform: booking?.platform || 'Airbnb',
    check_in: booking?.check_in || '',
    check_out: booking?.check_out || '',
    nightly_rate: booking?.nightly_rate?.toString() || '',
    total_amount: booking?.total_amount?.toString() || '',
    cleaning_fee: booking?.cleaning_fee?.toString() || '0',
    notes: booking?.notes || '',
    status: booking?.status || 'confirmed',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📋 Form submitted with data:', formData)
    
    const bookingData = {
      guest_name: formData.guest_name || null,
      platform: formData.platform,
      check_in: formData.check_in,
      check_out: formData.check_out,
      nightly_rate: formData.nightly_rate ? parseFloat(formData.nightly_rate) : null,
      total_amount: parseFloat(formData.total_amount),
      cleaning_fee: parseFloat(formData.cleaning_fee),
      notes: formData.notes || null,
      status: formData.status as 'confirmed' | 'cancelled' | 'completed',
    }
    
    console.log('✅ Parsed booking data:', bookingData)
    onSave(bookingData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <CardHeader>
        <CardTitle>{booking ? 'Edit Booking' : 'Add New Booking'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Guest Name"
              placeholder="Optional"
              value={formData.guest_name}
              onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
            />
            
            <Select
              label="Platform"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              options={[
                { value: 'Airbnb', label: 'Airbnb' },
                { value: 'Booking.com', label: 'Booking.com' },
                { value: 'VRBO', label: 'VRBO' },
                { value: 'Direct', label: 'Direct' },
                { value: 'Other', label: 'Other' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Check-In"
              value={formData.check_in}
              onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
              required
            />
            
            <Input
              type="date"
              label="Check-Out"
              value={formData.check_out}
              onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              step="0.01"
              label="Nightly Rate"
              placeholder="Optional"
              value={formData.nightly_rate}
              onChange={(e) => setFormData({ ...formData, nightly_rate: e.target.value })}
            />
            
            <Input
              type="number"
              step="0.01"
              label="Total Amount"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              required
            />

            <Input
              type="number"
              step="0.01"
              label="Cleaning Fee"
              value={formData.cleaning_fee}
              onChange={(e) => setFormData({ ...formData, cleaning_fee: e.target.value })}
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'confirmed' | 'cancelled' | 'completed' })}
            options={[
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            required
          />

          <Textarea
            label="Notes"
            rows={3}
            placeholder="Any additional information..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {booking ? 'Update' : 'Create'} Booking
            </Button>
          </div>
        </div>
      </CardContent>
    </form>
  )
}
