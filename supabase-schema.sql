-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Vendors table
CREATE TABLE public.vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users
);

-- Inventory items table
CREATE TABLE public.inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL, -- room
  quantity INTEGER NOT NULL DEFAULT 0,
  min_threshold INTEGER DEFAULT 0,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users
);

-- Maintenance tickets table
CREATE TABLE public.maintenance_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  room TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'done')) DEFAULT 'open',
  vendor_id UUID REFERENCES public.vendors,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  cost DECIMAL(10, 2),
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendors,
  ticket_id UUID REFERENCES public.maintenance_tickets,
  notes TEXT,
  receipt_url TEXT,

  -- Bookings table
  CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    guest_name TEXT,
    platform TEXT DEFAULT 'Airbnb',
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nightly_rate DECIMAL(10, 2),
    total_amount DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'completed')) DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users
  );
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Vendors policies (all authenticated users can read, only admins can write)
CREATE POLICY "Anyone authenticated can view vendors" ON public.vendors
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create vendors" ON public.vendors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vendors" ON public.vendors
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vendors" ON public.vendors
  FOR DELETE USING (auth.role() = 'authenticated');

-- Inventory policies
CREATE POLICY "Anyone authenticated can view inventory" ON public.inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create inventory items" ON public.inventory_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update inventory items" ON public.inventory_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete inventory items" ON public.inventory_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Maintenance tickets policies
CREATE POLICY "Anyone authenticated can view tickets" ON public.maintenance_tickets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create tickets" ON public.maintenance_tickets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tickets" ON public.maintenance_tickets
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tickets" ON public.maintenance_tickets
  FOR DELETE USING (auth.role() = 'authenticated');

-- Expenses policies
CREATE POLICY "Anyone authenticated can view expenses" ON public.expenses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update expenses" ON public.expenses
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete expenses" ON public.expenses

  -- Bookings policies
  CREATE POLICY "Anyone authenticated can view bookings" ON public.bookings
    FOR SELECT USING (auth.role() = 'authenticated');

  CREATE POLICY "Authenticated users can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  CREATE POLICY "Authenticated users can update bookings" ON public.bookings
    FOR UPDATE USING (auth.role() = 'authenticated');

  CREATE POLICY "Authenticated users can delete bookings" ON public.bookings
    FOR DELETE USING (auth.role() = 'authenticated');
  FOR DELETE USING (auth.role() = 'authenticated');

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.maintenance_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.expenses

  CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
