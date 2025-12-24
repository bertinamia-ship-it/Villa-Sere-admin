-- Add bookings/rentals table for Airbnb tracking
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_name TEXT,
  platform TEXT NOT NULL DEFAULT 'Airbnb',
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nightly_rate DECIMAL(10, 2),
  total_amount DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_bookings_check_in ON bookings(check_in);
CREATE INDEX idx_bookings_check_out ON bookings(check_out);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_by ON bookings(created_by);

COMMENT ON TABLE bookings IS 'Rental bookings for tracking Airbnb income and occupancy';
