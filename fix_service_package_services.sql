-- Script para criar a tabela service_package_services e corrigir relacionamentos
-- Execute este script no SQL Editor do Supabase

-- 1. Criar a tabela service_package_services se não existir
CREATE TABLE IF NOT EXISTS public.service_package_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  service_package_id uuid NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_package_id, service_id)
);

-- 2. Habilitar Row Level Security
ALTER TABLE public.service_package_services ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS para service_package_services

-- Política de SELECT: usuários podem ver apenas seus próprios dados
DROP POLICY IF EXISTS "Users can view their own service package services" ON public.service_package_services;
CREATE POLICY "Users can view their own service package services"
ON public.service_package_services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_packages sp
    WHERE sp.id = service_package_services.service_package_id
    AND sp.user_id = auth.uid()
  )
);

-- Política de INSERT: usuários podem criar apenas para seus próprios service packages
DROP POLICY IF EXISTS "Users can insert their own service package services" ON public.service_package_services;
CREATE POLICY "Users can insert their own service package services"
ON public.service_package_services
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_packages sp
    WHERE sp.id = service_package_services.service_package_id
    AND sp.user_id = auth.uid()
  )
);

-- Política de DELETE: usuários podem deletar apenas seus próprios dados
DROP POLICY IF EXISTS "Users can delete their own service package services" ON public.service_package_services;
CREATE POLICY "Users can delete their own service package services"
ON public.service_package_services
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_packages sp
    WHERE sp.id = service_package_services.service_package_id
    AND sp.user_id = auth.uid()
  )
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_service_package_services_package_id 
ON public.service_package_services(service_package_id);

CREATE INDEX IF NOT EXISTS idx_service_package_services_service_id 
ON public.service_package_services(service_id);

-- 5. Verificar se a tabela foi criada corretamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'service_package_services'
ORDER BY ordinal_position;
