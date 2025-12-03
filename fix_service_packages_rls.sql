-- Fix Row Level Security policies for service_packages table
-- Execute este script no SQL Editor do Supabase Dashboard

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own service packages" ON service_packages;
DROP POLICY IF EXISTS "Users can insert own service packages" ON service_packages;
DROP POLICY IF EXISTS "Users can update own service packages" ON service_packages;
DROP POLICY IF EXISTS "Users can delete own service packages" ON service_packages;

-- Enable RLS if not already enabled
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;

-- Create policies for service_packages table
-- Policy for SELECT (viewing)
CREATE POLICY "Users can view own service packages"
ON service_packages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for INSERT (creating)
CREATE POLICY "Users can insert own service packages"
ON service_packages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (editing)
CREATE POLICY "Users can update own service packages"
ON service_packages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (removing)
CREATE POLICY "Users can delete own service packages"
ON service_packages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
