-- Adicionar coluna birth_date na tabela clients
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna birth_date (data de nascimento)
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Verificar se a coluna foi criada corretamente
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'clients'
AND column_name = 'birth_date';
