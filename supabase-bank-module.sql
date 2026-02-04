-- ============================================
-- MÓDULO BANCO - Tablas y RLS
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Tabla financial_accounts (cuentas: caja chica, tarjetas, bancos)
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('cash', 'card', 'bank')),
  currency TEXT NOT NULL DEFAULT 'USD',
  opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Tabla account_transactions (movimientos de cuentas)
CREATE TABLE IF NOT EXISTS public.account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  note TEXT,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_accounts_tenant ON public.financial_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_property ON public.financial_accounts(property_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_account ON public.account_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_tenant ON public.account_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_property ON public.account_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_expense ON public.account_transactions(expense_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_date ON public.account_transactions(transaction_date);

-- 4. Agregar account_id a expenses (si no existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expenses' 
    AND column_name = 'account_id'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_expenses_account ON public.expenses(account_id);
  END IF;
END $$;

-- 5. Función para actualizar current_balance automáticamente
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.direction = 'in' THEN
      UPDATE public.financial_accounts
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    ELSE
      UPDATE public.financial_accounts
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.direction = 'in' THEN
      UPDATE public.financial_accounts
      SET current_balance = current_balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    ELSE
      UPDATE public.financial_accounts
      SET current_balance = current_balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar balance automáticamente
DROP TRIGGER IF EXISTS trigger_update_account_balance ON public.account_transactions;
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR DELETE ON public.account_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance();

-- 7. RLS Policies para financial_accounts
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant's accounts" ON public.financial_accounts;
CREATE POLICY "Users can view their tenant's accounts"
  ON public.financial_accounts FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their tenant's accounts" ON public.financial_accounts;
CREATE POLICY "Users can insert their tenant's accounts"
  ON public.financial_accounts FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their tenant's accounts" ON public.financial_accounts;
CREATE POLICY "Users can update their tenant's accounts"
  ON public.financial_accounts FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their tenant's accounts" ON public.financial_accounts;
CREATE POLICY "Users can delete their tenant's accounts"
  ON public.financial_accounts FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 8. RLS Policies para account_transactions
ALTER TABLE public.account_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant's transactions" ON public.account_transactions;
CREATE POLICY "Users can view their tenant's transactions"
  ON public.account_transactions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their tenant's transactions" ON public.account_transactions;
CREATE POLICY "Users can insert their tenant's transactions"
  ON public.account_transactions FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their tenant's transactions" ON public.account_transactions;
CREATE POLICY "Users can update their tenant's transactions"
  ON public.account_transactions FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their tenant's transactions" ON public.account_transactions;
CREATE POLICY "Users can delete their tenant's transactions"
  ON public.account_transactions FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 9. Función para inicializar current_balance con opening_balance al crear cuenta
CREATE OR REPLACE FUNCTION initialize_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_balance IS NULL OR NEW.current_balance = 0 THEN
    NEW.current_balance := NEW.opening_balance;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_initialize_account_balance ON public.financial_accounts;
CREATE TRIGGER trigger_initialize_account_balance
  BEFORE INSERT ON public.financial_accounts
  FOR EACH ROW
  EXECUTE FUNCTION initialize_account_balance();

-- ============================================
-- FIN DEL SQL
-- ============================================
-- Después de ejecutar:
-- 1. Verificar que las tablas se crearon correctamente
-- 2. Verificar que los triggers funcionan
-- 3. Probar crear una cuenta y un movimiento
-- ============================================


