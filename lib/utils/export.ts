export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  if (data.length === 0) {
    alert('No data to export')
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
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}
