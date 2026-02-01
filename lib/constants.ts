export const CATEGORIES = [
  'Suministros de Limpieza',
  'Cocina',
  'Ropa de Cama y Toallas',
  'Artículos de Aseo',
  'Piscina y Exterior',
  'Herramientas de Mantenimiento',
  'Suministros de Oficina',
  'Otros'
] as const

export const ROOMS = [
  'Cocina',
  'Sala de Estar',
  'Comedor',
  'Habitación 1',
  'Habitación 2',
  'Habitación 3',
  'Habitación 4',
  'Baño 1',
  'Baño 2',
  'Baño 3',
  'Lavandería',
  'Almacén',
  'Exterior',
  'Área de Piscina',
  'Garaje'
] as const

export const EXPENSE_CATEGORIES = [
  'Mantenimiento',
  'Servicios Públicos',
  'Suministros',
  'Limpieza',
  'Servicio de Piscina',
  'Jardinería',
  'Reparaciones',
  'Otros'
] as const

// Database values (keep in English for compatibility)
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export const TICKET_STATUSES = ['open', 'in_progress', 'done'] as const

// Spanish translations for display
export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente'
}

export const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  done: 'Completado'
}
