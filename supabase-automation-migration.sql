-- ============================================================
-- Automation Migration - Maintenance Plans + Tasks
-- ============================================================
-- This migration adds automated maintenance scheduling and tasks
-- Multi-tenant + multi-property support
-- ============================================================

-- ============================================================
-- 1. maintenance_plans (programación de mantenimientos recurrentes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maintenance_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency_unit TEXT NOT NULL CHECK (frequency_unit IN ('day', 'week', 'month', 'year')),
  frequency_interval INTEGER NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_run_date DATE NOT NULL,
  last_completed_date DATE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  estimated_cost NUMERIC,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 2. maintenance_plan_runs (historial de ejecuciones)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maintenance_plan_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.maintenance_plans(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  linked_ticket_id UUID REFERENCES public.maintenance_tickets(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 3. tasks (tareas operativas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cadence TEXT NOT NULL CHECK (cadence IN ('once', 'daily', 'weekly', 'monthly', 'yearly')),
  due_date DATE, -- Para tareas 'once'
  next_due_date DATE NOT NULL,
  last_completed_date DATE,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 4. Índices para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_tenant_property_next 
  ON public.maintenance_plans(tenant_id, property_id, next_run_date);

CREATE INDEX IF NOT EXISTS idx_maintenance_plans_active 
  ON public.maintenance_plans(tenant_id, property_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_maintenance_plan_runs_plan_scheduled 
  ON public.maintenance_plan_runs(plan_id, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_maintenance_plan_runs_tenant_property 
  ON public.maintenance_plan_runs(tenant_id, property_id);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_property_next 
  ON public.tasks(tenant_id, property_id, next_due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_status 
  ON public.tasks(tenant_id, property_id, status) 
  WHERE status != 'done';

-- ============================================================
-- 5. Función para calcular next_run_date
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_next_run_date(
  p_start_date DATE,
  p_frequency_unit TEXT,
  p_frequency_interval INTEGER,
  p_last_completed_date DATE DEFAULT NULL
) RETURNS DATE AS $$
DECLARE
  v_base_date DATE;
  v_next_date DATE;
BEGIN
  -- Si hay last_completed_date, usar esa como base
  -- Si no, usar start_date
  v_base_date := COALESCE(p_last_completed_date, p_start_date);
  
  -- Calcular próxima fecha según frecuencia
  CASE p_frequency_unit
    WHEN 'day' THEN
      v_next_date := v_base_date + (p_frequency_interval || ' days')::INTERVAL;
    WHEN 'week' THEN
      v_next_date := v_base_date + (p_frequency_interval || ' weeks')::INTERVAL;
    WHEN 'month' THEN
      v_next_date := v_base_date + (p_frequency_interval || ' months')::INTERVAL;
    WHEN 'year' THEN
      v_next_date := v_base_date + (p_frequency_interval || ' years')::INTERVAL;
    ELSE
      v_next_date := v_base_date;
  END CASE;
  
  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 6. Función para calcular next_due_date (tareas)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_next_due_date(
  p_cadence TEXT,
  p_last_completed_date DATE DEFAULT NULL,
  p_current_due_date DATE DEFAULT NULL
) RETURNS DATE AS $$
DECLARE
  v_base_date DATE;
  v_next_date DATE;
BEGIN
  -- Para 'once', usar due_date original
  IF p_cadence = 'once' THEN
    RETURN p_current_due_date;
  END IF;
  
  -- Para recurrentes, usar last_completed_date o current_due_date como base
  v_base_date := COALESCE(p_last_completed_date, p_current_due_date, CURRENT_DATE);
  
  -- Calcular próxima fecha según cadencia
  CASE p_cadence
    WHEN 'daily' THEN
      v_next_date := v_base_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      v_next_date := v_base_date + INTERVAL '1 week';
    WHEN 'monthly' THEN
      v_next_date := v_base_date + INTERVAL '1 month';
    WHEN 'yearly' THEN
      v_next_date := v_base_date + INTERVAL '1 year';
    ELSE
      v_next_date := v_base_date;
  END CASE;
  
  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 7. Trigger para updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a maintenance_plans
DROP TRIGGER IF EXISTS maintenance_plans_updated_at ON public.maintenance_plans;
CREATE TRIGGER maintenance_plans_updated_at
  BEFORE UPDATE ON public.maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Aplicar trigger a tasks
DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- 8. Enable RLS
-- ============================================================
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_plan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. RLS Policies - maintenance_plans
-- ============================================================
-- SELECT
DROP POLICY IF EXISTS "Users can view maintenance_plans in their tenant" ON public.maintenance_plans;
CREATE POLICY "Users can view maintenance_plans in their tenant"
  ON public.maintenance_plans FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- INSERT
DROP POLICY IF EXISTS "Users can create maintenance_plans in their tenant" ON public.maintenance_plans;
CREATE POLICY "Users can create maintenance_plans in their tenant"
  ON public.maintenance_plans FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- UPDATE
DROP POLICY IF EXISTS "Users can update maintenance_plans in their tenant" ON public.maintenance_plans;
CREATE POLICY "Users can update maintenance_plans in their tenant"
  ON public.maintenance_plans FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- DELETE
DROP POLICY IF EXISTS "Users can delete maintenance_plans in their tenant" ON public.maintenance_plans;
CREATE POLICY "Users can delete maintenance_plans in their tenant"
  ON public.maintenance_plans FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- ============================================================
-- 10. RLS Policies - maintenance_plan_runs
-- ============================================================
-- SELECT
DROP POLICY IF EXISTS "Users can view maintenance_plan_runs in their tenant" ON public.maintenance_plan_runs;
CREATE POLICY "Users can view maintenance_plan_runs in their tenant"
  ON public.maintenance_plan_runs FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- INSERT
DROP POLICY IF EXISTS "Users can create maintenance_plan_runs in their tenant" ON public.maintenance_plan_runs;
CREATE POLICY "Users can create maintenance_plan_runs in their tenant"
  ON public.maintenance_plan_runs FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- UPDATE
DROP POLICY IF EXISTS "Users can update maintenance_plan_runs in their tenant" ON public.maintenance_plan_runs;
CREATE POLICY "Users can update maintenance_plan_runs in their tenant"
  ON public.maintenance_plan_runs FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- DELETE
DROP POLICY IF EXISTS "Users can delete maintenance_plan_runs in their tenant" ON public.maintenance_plan_runs;
CREATE POLICY "Users can delete maintenance_plan_runs in their tenant"
  ON public.maintenance_plan_runs FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- ============================================================
-- 11. RLS Policies - tasks
-- ============================================================
-- SELECT
DROP POLICY IF EXISTS "Users can view tasks in their tenant" ON public.tasks;
CREATE POLICY "Users can view tasks in their tenant"
  ON public.tasks FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- INSERT
DROP POLICY IF EXISTS "Users can create tasks in their tenant" ON public.tasks;
CREATE POLICY "Users can create tasks in their tenant"
  ON public.tasks FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- UPDATE
DROP POLICY IF EXISTS "Users can update tasks in their tenant" ON public.tasks;
CREATE POLICY "Users can update tasks in their tenant"
  ON public.tasks FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- DELETE
DROP POLICY IF EXISTS "Users can delete tasks in their tenant" ON public.tasks;
CREATE POLICY "Users can delete tasks in their tenant"
  ON public.tasks FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (
      SELECT id FROM public.properties 
      WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    )
  );

-- ============================================================
-- Verificación
-- ============================================================
-- Verificar que las tablas fueron creadas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_plans') THEN
    RAISE EXCEPTION 'Table maintenance_plans was not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_plan_runs') THEN
    RAISE EXCEPTION 'Table maintenance_plan_runs was not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    RAISE EXCEPTION 'Table tasks was not created';
  END IF;
  RAISE NOTICE 'All automation tables created successfully';
END $$;


