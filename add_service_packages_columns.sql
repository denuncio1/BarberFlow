-- Adicionar colunas faltantes na tabela service_packages
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna enabled_days (array de dias da semana)
ALTER TABLE public.service_packages 
ADD COLUMN IF NOT EXISTS enabled_days TEXT[] DEFAULT '{}';

-- 2. Adicionar coluna usage_limit (limite de uso)
ALTER TABLE public.service_packages 
ADD COLUMN IF NOT EXISTS usage_limit BOOLEAN DEFAULT false;

-- 3. Adicionar coluna visible_to_clients (visível para clientes)
ALTER TABLE public.service_packages 
ADD COLUMN IF NOT EXISTS visible_to_clients BOOLEAN DEFAULT true;

-- 4. Verificar se as colunas foram criadas corretamente
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'service_packages'
AND column_name IN ('enabled_days', 'usage_limit', 'visible_to_clients')
ORDER BY ordinal_position;
