/**
 * Helper functions for building export filenames with property names
 */

/**
 * Normalizes a property name to a URL-safe slug
 * Example: "Villa Serena" -> "Villa-Serena"
 */
export function slugifyPropertyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Builds an export filename with property name, report type, and optional date range
 * 
 * @param options - Configuration object
 * @param options.propertyName - Name of the active property (will be slugified)
 * @param options.reportType - Type of report (e.g., "Reporte-Gastos", "Inventario")
 * @param options.dateRange - Optional date range (e.g., "2026-01" for month, "2026-01-15" for date)
 * @param options.ext - File extension (default: "csv")
 * 
 * @example
 * buildExportFilename({
 *   propertyName: "Villa Serena",
 *   reportType: "Reporte-Gastos",
 *   dateRange: "2026-01",
 *   ext: "csv"
 * })
 * // Returns: "Villa-Serena_Reporte-Gastos_2026-01.csv"
 */
export function buildExportFilename({
  propertyName,
  reportType,
  dateRange,
  ext = 'csv'
}: {
  propertyName?: string | null
  reportType: string
  dateRange?: string | null
  ext?: string
}): string {
  const parts: string[] = []

  // Add property name (slugified) if provided
  if (propertyName) {
    parts.push(slugifyPropertyName(propertyName))
  }

  // Add report type
  parts.push(reportType)

  // Add date range if provided
  if (dateRange) {
    parts.push(dateRange)
  }

  // Join parts with underscores and add extension
  const filename = parts.join('_')
  return `${filename}.${ext}`
}

