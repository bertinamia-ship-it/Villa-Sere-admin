'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface ImportResult {
  success: number
  errors: string[]
}

export default function CSVImport() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      showToast('Please upload a CSV file', 'error')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid')
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const errors: string[] = []
      let success = 0

      // Validate required columns
      const requiredColumns = ['name', 'category', 'location', 'quantity']
      const missingColumns = requiredColumns.filter(col => !headers.includes(col))
      
      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)
      }

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        
        if (values.length !== headers.length) {
          errors.push(`Line ${i + 1}: Column count mismatch`)
          continue
        }

        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })

        // Validate and prepare data
        if (!row.name || !row.category || !row.location) {
          errors.push(`Line ${i + 1}: Missing required fields`)
          continue
        }

        const quantity = parseInt(row.quantity) || 0
        const min_threshold = parseInt(row.min_threshold || row.minthreshold || '5')

        try {
          const { error } = await supabase
            .from('inventory_items')
            .insert({
              name: row.name,
              category: row.category,
              location: row.location,
              quantity,
              min_threshold,
              notes: row.notes || null,
            })

          if (error) {
            errors.push(`Line ${i + 1}: ${error.message}`)
          } else {
            success++
          }
        } catch (error: any) {
          errors.push(`Line ${i + 1}: ${error.message}`)
        }
      }

      setResult({ success, errors })
      
      if (success > 0) {
        showToast(`Successfully imported ${success} items`, 'success')
      }
      if (errors.length > 0) {
        showToast(`${errors.length} items failed to import`, 'warning')
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to import CSV', 'error')
    } finally {
      setImporting(false)
      e.target.value = '' // Reset input
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          <CardTitle>Import Inventory from CSV</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">CSV Format Requirements</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Required columns: <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">category</code>, <code className="bg-blue-100 px-1 rounded">location</code>, <code className="bg-blue-100 px-1 rounded">quantity</code></li>
              <li>• Optional columns: <code className="bg-blue-100 px-1 rounded">min_threshold</code>, <code className="bg-blue-100 px-1 rounded">notes</code></li>
              <li>• First row must be column headers</li>
              <li>• Values separated by commas</li>
            </ul>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button
                type="button"
                onClick={() => document.getElementById('csv-upload')?.click()}
                loading={importing}
                disabled={importing}
              >
                <Upload className="h-4 w-4" />
                Choose CSV File
              </Button>
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Click to select a CSV file to import
            </p>
          </div>

          {result && (
            <div className="space-y-3">
              {result.success > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Successfully imported {result.success} items
                    </p>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-900">
                      {result.errors.length} errors occurred:
                    </p>
                  </div>
                  <div className="ml-8 space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.slice(0, 10).map((error, i) => (
                      <p key={i} className="text-sm text-red-800">
                        {error}
                      </p>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-sm text-red-700 italic">
                        ... and {result.errors.length - 10} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
