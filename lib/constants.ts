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

// Maintenance Templates
export interface MaintenanceTemplate {
  id: string
  title: string
  default_frequency_unit: 'day' | 'week' | 'month' | 'year'
  default_frequency_interval: number
  default_priority: 'low' | 'medium' | 'high' | 'urgent'
  suggested_notes?: string
}

export const MAINTENANCE_TEMPLATES: MaintenanceTemplate[] = [
  {
    id: 'pool-cleaning',
    title: 'Limpieza de Piscina',
    default_frequency_unit: 'week',
    default_frequency_interval: 1,
    default_priority: 'medium',
    suggested_notes: 'Revisar pH, cloro, limpiar skimmer y filtro'
  },
  {
    id: 'ac-service',
    title: 'Servicio de Aire Acondicionado',
    default_frequency_unit: 'month',
    default_frequency_interval: 3,
    default_priority: 'high',
    suggested_notes: 'Limpieza de filtros, revisión de gas y funcionamiento'
  },
  {
    id: 'garden-maintenance',
    title: 'Mantenimiento de Jardín',
    default_frequency_unit: 'week',
    default_frequency_interval: 2,
    default_priority: 'low',
    suggested_notes: 'Corte de césped, poda, riego y fertilización'
  },
  {
    id: 'deep-cleaning',
    title: 'Limpieza Profunda',
    default_frequency_unit: 'month',
    default_frequency_interval: 1,
    default_priority: 'medium',
    suggested_notes: 'Limpieza completa de todas las áreas, incluyendo ventanas y cortinas'
  },
  {
    id: 'pest-control',
    title: 'Control de Plagas',
    default_frequency_unit: 'month',
    default_frequency_interval: 3,
    default_priority: 'high',
    suggested_notes: 'Fumigación preventiva y revisión de puntos de entrada'
  },
  {
    id: 'plumbing-check',
    title: 'Revisión de Plomería',
    default_frequency_unit: 'month',
    default_frequency_interval: 6,
    default_priority: 'medium',
    suggested_notes: 'Revisar grifos, tuberías, calentador y presión de agua'
  },
  {
    id: 'electrical-inspection',
    title: 'Inspección Eléctrica',
    default_frequency_unit: 'year',
    default_frequency_interval: 1,
    default_priority: 'high',
    suggested_notes: 'Revisión de instalación eléctrica, interruptores y seguridad'
  },
  {
    id: 'roof-inspection',
    title: 'Inspección de Techo',
    default_frequency_unit: 'year',
    default_frequency_interval: 1,
    default_priority: 'high',
    suggested_notes: 'Revisar tejas, goteras, canaletas y estructura'
  },
  {
    id: 'appliance-service',
    title: 'Servicio de Electrodomésticos',
    default_frequency_unit: 'month',
    default_frequency_interval: 6,
    default_priority: 'medium',
    suggested_notes: 'Limpieza y revisión de nevera, lavadora, secadora y otros'
  },
  {
    id: 'security-check',
    title: 'Revisión de Seguridad',
    default_frequency_unit: 'month',
    default_frequency_interval: 3,
    default_priority: 'high',
    suggested_notes: 'Revisar cerraduras, alarmas, cámaras y sistemas de seguridad'
  },
  {
    id: 'fire-safety',
    title: 'Revisión de Seguridad contra Incendios',
    default_frequency_unit: 'month',
    default_frequency_interval: 6,
    default_priority: 'urgent',
    suggested_notes: 'Revisar extintores, detectores de humo y rutas de evacuación'
  },
  {
    id: 'water-heater',
    title: 'Mantenimiento de Calentador',
    default_frequency_unit: 'year',
    default_frequency_interval: 1,
    default_priority: 'medium',
    suggested_notes: 'Limpieza, revisión de válvulas y temperatura'
  }
]
