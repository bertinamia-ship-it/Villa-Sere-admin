-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add purchase_items table for "To Buy" list
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  area TEXT,
  item TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  est_cost NUMERIC(10, 2),
  link TEXT,
  status TEXT NOT NULL DEFAULT 'to_buy' CHECK (status IN ('to_buy', 'ordered', 'received')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view purchase items"
  ON public.purchase_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert purchase items"
  ON public.purchase_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update purchase items"
  ON public.purchase_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete purchase items"
  ON public.purchase_items FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_purchase_items_updated_at
  BEFORE UPDATE ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_purchase_items_status ON public.purchase_items(status);
CREATE INDEX IF NOT EXISTS idx_purchase_items_area ON public.purchase_items(area);
CREATE INDEX IF NOT EXISTS idx_purchase_items_created_by ON public.purchase_items(created_by);

-- Add unique constraint for idempotent imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_items_unique ON public.purchase_items(area, item) WHERE area IS NOT NULL;

COMMENT ON TABLE public.purchase_items IS 'Shopping list and purchase tracking';
