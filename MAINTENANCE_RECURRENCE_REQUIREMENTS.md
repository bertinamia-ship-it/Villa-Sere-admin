# Requisitos para Recurrencia en Tickets de Mantenimiento

## Objetivo
Agregar funcionalidad de recurrencia flexible a tickets de mantenimiento, permitiendo:
- Tickets de una sola vez
- Tickets recurrentes con reglas flexibles:
  - Cada X semanas
  - Cada X meses
  - Cada X años
  - Selección manual de meses específicos

## Cambios Requeridos en Supabase

### 1. Modificar tabla `maintenance_tickets`

Agregar las siguientes columnas a `public.maintenance_tickets`:

```sql
-- Recurrencia
ALTER TABLE public.maintenance_tickets 
ADD COLUMN IF NOT EXISTS is_recurrent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('once', 'weekly', 'monthly', 'yearly', 'custom_months')),
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER, -- Cada X semanas/meses/años
ADD COLUMN IF NOT EXISTS recurrence_months INTEGER[], -- Array de meses (1-12) para custom_months
ADD COLUMN IF NOT EXISTS next_occurrence_date DATE, -- Próxima fecha de ocurrencia
ADD COLUMN IF NOT EXISTS last_completed_date DATE, -- Última vez que se completó
ADD COLUMN IF NOT EXISTS parent_ticket_id UUID REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE; -- Para tickets generados
```

### 2. Crear función SQL para calcular próxima ocurrencia

```sql
CREATE OR REPLACE FUNCTION calculate_next_maintenance_occurrence(
  p_last_date DATE,
  p_recurrence_type TEXT,
  p_recurrence_interval INTEGER,
  p_recurrence_months INTEGER[] DEFAULT NULL
) RETURNS DATE AS $$
DECLARE
  next_date DATE;
BEGIN
  next_date := p_last_date;
  
  CASE p_recurrence_type
    WHEN 'once' THEN
      RETURN NULL; -- No hay próxima ocurrencia
    WHEN 'weekly' THEN
      next_date := next_date + (p_recurrence_interval || ' weeks')::INTERVAL;
    WHEN 'monthly' THEN
      next_date := next_date + (p_recurrence_interval || ' months')::INTERVAL;
    WHEN 'yearly' THEN
      next_date := next_date + (p_recurrence_interval || ' years')::INTERVAL;
    WHEN 'custom_months' THEN
      -- Encontrar el próximo mes en el array que sea >= al mes actual
      -- Si no hay, usar el primero del próximo año
      -- (Lógica más compleja, implementar según necesidad)
      next_date := next_date + '1 month'::INTERVAL; -- Placeholder
    ELSE
      RETURN NULL;
  END CASE;
  
  RETURN next_date;
END;
$$ LANGUAGE plpgsql;
```

### 3. Actualizar RLS (si es necesario)

Las políticas RLS existentes deberían funcionar, pero verificar que las nuevas columnas no rompan nada.

## Cambios en el Frontend

### 1. Actualizar `TicketForm.tsx`

Agregar campos para:
- Switch "Es recurrente"
- Selector de tipo de recurrencia (una vez, semanal, mensual, anual, meses específicos)
- Input para intervalo (cada X semanas/meses/años)
- Selector múltiple de meses (solo si tipo = custom_months)

### 2. Actualizar lógica de creación/actualización

- Al crear ticket recurrente, calcular `next_occurrence_date`
- Al marcar como completado, si es recurrente:
  - Crear nuevo ticket hijo con `parent_ticket_id`
  - Calcular nueva `next_occurrence_date`
  - Actualizar `last_completed_date`

### 3. Vista de tickets recurrentes

- Mostrar tickets recurrentes con badge "Recurrente"
- Mostrar próxima ocurrencia
- Permitir "Marcar como hecho" que genera el siguiente ticket

## Notas

- Los tickets recurrentes pueden tener un "ticket padre" que define la plantilla
- Los tickets generados automáticamente tienen `parent_ticket_id` apuntando al padre
- La lógica de "meses específicos" requiere validación adicional en el frontend

## Implementación Sugerida

1. **Fase 1**: Agregar columnas y función SQL
2. **Fase 2**: Actualizar `TicketForm` con campos de recurrencia
3. **Fase 3**: Implementar lógica de generación automática de tickets
4. **Fase 4**: Agregar vista/filtro para tickets recurrentes

## Consideraciones

- Los tickets recurrentes NO deben aparecer en el calendario (solo bookings)
- La recurrencia se gestiona completamente en `/maintenance`
- Mantener compatibilidad con tickets existentes (todos son "una vez" por defecto)


