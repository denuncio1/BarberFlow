-- Row Level Security Policies for BarberFlow
-- Execute este script no SQL Editor do Supabase Dashboard

-- ============================================
-- DROP EXISTING POLICIES (if any)
-- ============================================

-- Drop existing policies for TECHNICIANS
DROP POLICY IF EXISTS "Users can insert their own technicians" ON technicians;
DROP POLICY IF EXISTS "Users can view their own technicians" ON technicians;
DROP POLICY IF EXISTS "Users can update their own technicians" ON technicians;
DROP POLICY IF EXISTS "Users can delete their own technicians" ON technicians;

-- Drop existing policies for CLIENTS
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

-- Drop existing policies for SERVICES
DROP POLICY IF EXISTS "Users can insert their own services" ON services;
DROP POLICY IF EXISTS "Users can view their own services" ON services;
DROP POLICY IF EXISTS "Users can update their own services" ON services;
DROP POLICY IF EXISTS "Users can delete their own services" ON services;

-- Drop existing policies for APPOINTMENTS
DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;

-- Drop existing policies for BLOCKED_TIMES
DROP POLICY IF EXISTS "Users can insert their own blocked times" ON blocked_times;
DROP POLICY IF EXISTS "Users can view their own blocked times" ON blocked_times;
DROP POLICY IF EXISTS "Users can update their own blocked times" ON blocked_times;
DROP POLICY IF EXISTS "Users can delete their own blocked times" ON blocked_times;

-- Drop existing policies for PRODUCTS
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

-- Drop existing policies for PAYMENT_METHODS
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;

-- Drop existing policies for SERVICE_PACKAGES
DROP POLICY IF EXISTS "Users can insert their own service packages" ON service_packages;
DROP POLICY IF EXISTS "Users can view their own service packages" ON service_packages;
DROP POLICY IF EXISTS "Users can update their own service packages" ON service_packages;
DROP POLICY IF EXISTS "Users can delete their own service packages" ON service_packages;

-- Drop existing policies for SERVICE_PACKAGE_SALES
DROP POLICY IF EXISTS "Users can insert their own service package sales" ON service_package_sales;
DROP POLICY IF EXISTS "Users can view their own service package sales" ON service_package_sales;
DROP POLICY IF EXISTS "Users can update their own service package sales" ON service_package_sales;
DROP POLICY IF EXISTS "Users can delete their own service package sales" ON service_package_sales;

-- ============================================
-- CREATE NEW POLICIES
-- ============================================

-- ============================================
-- POLICIES FOR TECHNICIANS TABLE
-- ============================================

-- Policy: Allow users to INSERT their own technicians
CREATE POLICY "Users can insert their own technicians"
ON technicians
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own technicians
CREATE POLICY "Users can view their own technicians"
ON technicians
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own technicians
CREATE POLICY "Users can update their own technicians"
ON technicians
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own technicians
CREATE POLICY "Users can delete their own technicians"
ON technicians
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR CLIENTS TABLE
-- ============================================

-- Policy: Allow users to INSERT their own clients
CREATE POLICY "Users can insert their own clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own clients
CREATE POLICY "Users can view their own clients"
ON clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own clients
CREATE POLICY "Users can update their own clients"
ON clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own clients
CREATE POLICY "Users can delete their own clients"
ON clients
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR SERVICES TABLE
-- ============================================

-- Policy: Allow users to INSERT their own services
CREATE POLICY "Users can insert their own services"
ON services
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own services
CREATE POLICY "Users can view their own services"
ON services
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own services
CREATE POLICY "Users can update their own services"
ON services
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own services
CREATE POLICY "Users can delete their own services"
ON services
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR APPOINTMENTS TABLE
-- ============================================

-- Policy: Allow users to INSERT their own appointments
CREATE POLICY "Users can insert their own appointments"
ON appointments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own appointments
CREATE POLICY "Users can view their own appointments"
ON appointments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own appointments
CREATE POLICY "Users can update their own appointments"
ON appointments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own appointments
CREATE POLICY "Users can delete their own appointments"
ON appointments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR BLOCKED_TIMES TABLE
-- ============================================

-- Policy: Allow users to INSERT their own blocked times
CREATE POLICY "Users can insert their own blocked times"
ON blocked_times
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own blocked times
CREATE POLICY "Users can view their own blocked times"
ON blocked_times
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own blocked times
CREATE POLICY "Users can update their own blocked times"
ON blocked_times
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own blocked times
CREATE POLICY "Users can delete their own blocked times"
ON blocked_times
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR PRODUCTS TABLE
-- ============================================

-- Policy: Allow users to INSERT their own products
CREATE POLICY "Users can insert their own products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own products
CREATE POLICY "Users can view their own products"
ON products
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own products
CREATE POLICY "Users can update their own products"
ON products
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own products
CREATE POLICY "Users can delete their own products"
ON products
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR PAYMENT_METHODS TABLE
-- ============================================

-- Policy: Allow users to INSERT their own payment methods
CREATE POLICY "Users can insert their own payment methods"
ON payment_methods
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own payment methods
CREATE POLICY "Users can view their own payment methods"
ON payment_methods
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own payment methods
CREATE POLICY "Users can update their own payment methods"
ON payment_methods
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own payment methods
CREATE POLICY "Users can delete their own payment methods"
ON payment_methods
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR SERVICE_PACKAGES TABLE
-- ============================================

-- Policy: Allow users to INSERT their own service packages
CREATE POLICY "Users can insert their own service packages"
ON service_packages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own service packages
CREATE POLICY "Users can view their own service packages"
ON service_packages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own service packages
CREATE POLICY "Users can update their own service packages"
ON service_packages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own service packages
CREATE POLICY "Users can delete their own service packages"
ON service_packages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES FOR SERVICE_PACKAGE_SALES TABLE
-- ============================================

-- Policy: Allow users to INSERT their own service package sales
CREATE POLICY "Users can insert their own service package sales"
ON service_package_sales
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to SELECT their own service package sales
CREATE POLICY "Users can view their own service package sales"
ON service_package_sales
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Allow users to UPDATE their own service package sales
CREATE POLICY "Users can update their own service package sales"
ON service_package_sales
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to DELETE their own service package sales
CREATE POLICY "Users can delete their own service package sales"
ON service_package_sales
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
