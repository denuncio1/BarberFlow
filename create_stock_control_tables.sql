-- Create stock control tables
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Tabela de locais de estoque (depósitos, lojas, centros de distribuição)
CREATE TABLE IF NOT EXISTS stock_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  type TEXT, -- 'warehouse', 'store', 'distribution_center'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela de movimentações de estoque (entradas e saídas)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL, -- 'purchase', 'sale', 'adjustment', 'transfer', 'loss', etc
  reference_document TEXT, -- número de nota fiscal, pedido, etc
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de pedidos de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
  total_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabela de itens do pedido de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela de controle de lotes e validade
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Adicionar campos ao products para controle de estoque (se não existirem)
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'UN';

-- Enable Row Level Security
ALTER TABLE stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stock_locations_updated_at') THEN
    CREATE TRIGGER update_stock_locations_updated_at
      BEFORE UPDATE ON stock_locations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stock_movements_updated_at') THEN
    CREATE TRIGGER update_stock_movements_updated_at
      BEFORE UPDATE ON stock_movements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_purchase_orders_updated_at') THEN
    CREATE TRIGGER update_purchase_orders_updated_at
      BEFORE UPDATE ON purchase_orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_batches_updated_at') THEN
    CREATE TRIGGER update_product_batches_updated_at
      BEFORE UPDATE ON product_batches
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_locations_user_id ON stock_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_location_id ON stock_movements(location_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_user_id ON purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_user_id ON product_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry_date ON product_batches(expiry_date);

-- Add RLS Policies
DO $$ 
BEGIN
  -- Stock Locations Policies
  DROP POLICY IF EXISTS "Users can insert their own stock locations" ON stock_locations;
  DROP POLICY IF EXISTS "Users can view their own stock locations" ON stock_locations;
  DROP POLICY IF EXISTS "Users can update their own stock locations" ON stock_locations;
  DROP POLICY IF EXISTS "Users can delete their own stock locations" ON stock_locations;
  
  -- Stock Movements Policies
  DROP POLICY IF EXISTS "Users can insert their own stock movements" ON stock_movements;
  DROP POLICY IF EXISTS "Users can view their own stock movements" ON stock_movements;
  DROP POLICY IF EXISTS "Users can update their own stock movements" ON stock_movements;
  DROP POLICY IF EXISTS "Users can delete their own stock movements" ON stock_movements;
  
  -- Purchase Orders Policies
  DROP POLICY IF EXISTS "Users can insert their own purchase orders" ON purchase_orders;
  DROP POLICY IF EXISTS "Users can view their own purchase orders" ON purchase_orders;
  DROP POLICY IF EXISTS "Users can update their own purchase orders" ON purchase_orders;
  DROP POLICY IF EXISTS "Users can delete their own purchase orders" ON purchase_orders;
  
  -- Purchase Order Items Policies  
  DROP POLICY IF EXISTS "Users can insert purchase order items" ON purchase_order_items;
  DROP POLICY IF EXISTS "Users can view purchase order items" ON purchase_order_items;
  DROP POLICY IF EXISTS "Users can update purchase order items" ON purchase_order_items;
  DROP POLICY IF EXISTS "Users can delete purchase order items" ON purchase_order_items;
  
  -- Product Batches Policies
  DROP POLICY IF EXISTS "Users can insert their own product batches" ON product_batches;
  DROP POLICY IF EXISTS "Users can view their own product batches" ON product_batches;
  DROP POLICY IF EXISTS "Users can update their own product batches" ON product_batches;
  DROP POLICY IF EXISTS "Users can delete their own product batches" ON product_batches;
EXCEPTION WHEN undefined_table THEN
  -- Tables don't exist yet, ignore
END $$;

-- Stock Locations Policies
CREATE POLICY "Users can insert their own stock locations"
ON stock_locations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own stock locations"
ON stock_locations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock locations"
ON stock_locations FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock locations"
ON stock_locations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Stock Movements Policies
CREATE POLICY "Users can insert their own stock movements"
ON stock_movements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own stock movements"
ON stock_movements FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock movements"
ON stock_movements FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock movements"
ON stock_movements FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Purchase Orders Policies
CREATE POLICY "Users can insert their own purchase orders"
ON purchase_orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own purchase orders"
ON purchase_orders FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase orders"
ON purchase_orders FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase orders"
ON purchase_orders FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Purchase Order Items Policies (relacionados ao pedido do usuário)
CREATE POLICY "Users can insert purchase order items"
ON purchase_order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM purchase_orders 
  WHERE id = purchase_order_id AND user_id = auth.uid()
));

CREATE POLICY "Users can view purchase order items"
ON purchase_order_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM purchase_orders 
  WHERE id = purchase_order_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update purchase order items"
ON purchase_order_items FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM purchase_orders 
  WHERE id = purchase_order_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete purchase order items"
ON purchase_order_items FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM purchase_orders 
  WHERE id = purchase_order_id AND user_id = auth.uid()
));

-- Product Batches Policies
CREATE POLICY "Users can insert their own product batches"
ON product_batches FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own product batches"
ON product_batches FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own product batches"
ON product_batches FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product batches"
ON product_batches FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Insert default stock location for existing users
INSERT INTO stock_locations (user_id, name, type, is_active)
SELECT DISTINCT user_id, 'Local Principal', 'store', true
FROM products
WHERE user_id NOT IN (SELECT user_id FROM stock_locations)
ON CONFLICT DO NOTHING;
