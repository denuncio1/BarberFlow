-- Create financial tables
-- Execute este script no SQL Editor do Supabase Dashboard

-- Tabela de Contas a Pagar
CREATE TABLE IF NOT EXISTS accounts_payable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  category TEXT,
  supplier_name TEXT,
  reference_type TEXT, -- 'stock_entry', 'service', 'expense', etc
  reference_id UUID, -- ID da movimentação de estoque, serviço, etc
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de Contas a Receber
CREATE TABLE IF NOT EXISTS accounts_receivable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue', 'cancelled')),
  category TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  reference_type TEXT, -- 'stock_exit', 'service', 'sale', etc
  reference_id UUID, -- ID da movimentação de estoque, serviço, etc
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_payable_updated_at') THEN
    CREATE TRIGGER update_accounts_payable_updated_at
      BEFORE UPDATE ON accounts_payable
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_accounts_receivable_updated_at') THEN
    CREATE TRIGGER update_accounts_receivable_updated_at
      BEFORE UPDATE ON accounts_receivable
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounts_payable_user_id ON accounts_payable(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_reference ON accounts_payable(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_user_id ON accounts_receivable(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_reference ON accounts_receivable(reference_type, reference_id);

-- Add RLS Policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own accounts payable" ON accounts_payable;
  DROP POLICY IF EXISTS "Users can view their own accounts payable" ON accounts_payable;
  DROP POLICY IF EXISTS "Users can update their own accounts payable" ON accounts_payable;
  DROP POLICY IF EXISTS "Users can delete their own accounts payable" ON accounts_payable;
  
  DROP POLICY IF EXISTS "Users can insert their own accounts receivable" ON accounts_receivable;
  DROP POLICY IF EXISTS "Users can view their own accounts receivable" ON accounts_receivable;
  DROP POLICY IF EXISTS "Users can update their own accounts receivable" ON accounts_receivable;
  DROP POLICY IF EXISTS "Users can delete their own accounts receivable" ON accounts_receivable;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Accounts Payable Policies
CREATE POLICY "Users can insert their own accounts payable"
ON accounts_payable FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own accounts payable"
ON accounts_payable FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts payable"
ON accounts_payable FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts payable"
ON accounts_payable FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Accounts Receivable Policies
CREATE POLICY "Users can insert their own accounts receivable"
ON accounts_receivable FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own accounts receivable"
ON accounts_receivable FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts receivable"
ON accounts_receivable FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounts receivable"
ON accounts_receivable FOR DELETE TO authenticated
USING (auth.uid() = user_id);
