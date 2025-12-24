export function exportInventoryToCSV(items: any[]) {
  const headers = ['Name', 'Category', 'Location', 'Quantity', 'Min Threshold', 'Notes']
  const rows = items.map(item => [
    item.name,
    item.category,
    item.location,
    item.quantity,
    item.min_threshold,
    item.notes || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

export function exportExpensesToCSV(expenses: any[], vendors: any[], tickets: any[], month: string) {
  const headers = ['Date', 'Amount', 'Category', 'Vendor', 'Ticket', 'Notes']
  const rows = expenses.map(exp => {
    const vendor = vendors.find(v => v.id === exp.vendor_id)
    const ticket = tickets.find(t => t.id === exp.ticket_id)
    return [
      exp.date,
      exp.amount,
      exp.category,
      vendor?.company_name || '',
      ticket?.title || '',
      exp.notes || ''
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${month}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}
