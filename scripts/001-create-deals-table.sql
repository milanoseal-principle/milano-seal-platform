-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  document_type TEXT,
  country TEXT,
  notes TEXT,
  tier TEXT DEFAULT 'priority',
  status TEXT DEFAULT 'new',
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_deals_email ON deals(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (allows all operations)
CREATE POLICY "Service role can manage all deals" ON deals
  FOR ALL
  USING (true)
  WITH CHECK (true);
