import { buildExportFilename } from './download'

/**
 * Exports data to CSV file
 * 
 * @param data - Array of objects to export
 * @param reportType - Type of report (e.g., "Inventario", "Reporte-Gastos")
 * @param headers - Optional array of header keys (defaults to Object.keys(data[0]))
 * @param options - Optional configuration
 * @param options.propertyName - Name of the active property (will be included in filename)
 * @param options.dateRange - Optional date range (e.g., "2026-01" for month)
 */
export function exportToCSV(
  data: any[],
  reportType: string,
  headers?: string[],
  options?: {
    propertyName?: string | null
    dateRange?: string | null
  }
) {
  if (data.length === 0) {
    alert('No hay datos para exportar')
    return
  }

  const keys = headers || Object.keys(data[0])
  const csvHeaders = keys.join(',')
  
  const csvRows = data.map(row => {
    return keys.map(key => {
      const value = row[key]
      // Handle null/undefined
      if (value === null || value === undefined) return ''
      // Escape quotes and wrap in quotes if contains comma or quotes
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(',')
  })

  const csvContent = [csvHeaders, ...csvRows].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  
  // Build filename with property name if provided
  const dateRange = options?.dateRange || new Date().toISOString().split('T')[0]
  link.download = buildExportFilename({
    propertyName: options?.propertyName,
    reportType,
    dateRange,
    ext: 'csv'
  })
  
  link.click()
  window.URL.revokeObjectURL(url)
}
