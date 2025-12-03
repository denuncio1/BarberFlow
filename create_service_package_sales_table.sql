-- Create service_package_sales table
-- Execute este script no SQL Editor do Supabase Dashboard

CREATE TABLE IF NOT EXISTS service_package_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  purchased_quantity INTEGER NOT NULL DEFAULT 1,
  remaining_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE service_package_sales ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_service_package_sales_updated_at'
  ) THEN
    CREATE TRIGGER update_service_package_sales_updated_at
      BEFORE UPDATE ON service_package_sales
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_service_package_sales_user_id ON service_package_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_service_package_sales_client_id ON service_package_sales(client_id);
CREATE INDEX IF NOT EXISTS idx_service_package_sales_package_id ON service_package_sales(service_package_id);

-- Add RLS Policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own service package sales" ON service_package_sales;
  DROP POLICY IF EXISTS "Users can view their own service package sales" ON service_package_sales;
  DROP POLICY IF EXISTS "Users can update their own service package sales" ON service_package_sales;
  DROP POLICY IF EXISTS "Users can delete their own service package sales" ON service_package_sales;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist yet, ignore
END $$;

CREATE POLICY "Users can insert their own service package sales"
ON service_package_sales
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own service package sales"
ON service_package_sales
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own service package sales"
ON service_package_sales
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service package sales"
ON service_package_sales
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
