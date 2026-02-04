'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { InventoryItem } from '@/lib/types/database'

interface QuickAdjustProps {
  item: InventoryItem
  onQuantityChange: (itemId: string, newQuantity: number) => Promise<void>
}

export default function QuickAdjust({ item, onQuantityChange }: QuickAdjustProps) {
  const [quantity, setQuantity] = useState(item.quantity)
  const [customValue, setCustomValue] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const handleAdjust = async (delta: number) => {
    const newQuantity = Math.max(0, quantity + delta)
    setQuantity(newQuantity)
    await onQuantityChange(item.id, newQuantity)
  }

  const handleSetCustom = async () => {
    const newQuantity = parseInt(customValue)
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      setQuantity(newQuantity)
      await onQuantityChange(item.id, newQuantity)
      setCustomValue('')
      setShowCustom(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAdjust(-1)}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          disabled={quantity === 0}
        >
          <Minus className="h-4 w-4 text-gray-700" />
        </button>

          <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-gray-900">{quantity}</div>
          <div className="text-xs text-gray-500">{t('inventory.minThreshold')}: {item.min_threshold}</div>
        </div>

        <button
          onClick={() => handleAdjust(1)}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
        >
          <Plus className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          className="w-full text-sm text-blue-600 hover:text-blue-700"
        >
          {t('inventory.setCustomAmount')}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder={t('inventory.enterQuantity')}
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={handleSetCustom}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            {t('common.apply')}
          </button>
          <button
            onClick={() => {
              setShowCustom(false)
              setCustomValue('')
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}
    </div>
  )
}
