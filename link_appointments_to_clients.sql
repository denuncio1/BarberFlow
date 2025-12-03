-- Script para vincular appointments antigos aos clientes
-- Execute este script no SQL Editor do Supabase

-- Verificar quais colunas existem na tabela appointments
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Após verificar as colunas acima, descomente e ajuste uma das opções abaixo:

-- OPÇÃO 1: Se appointments tiver coluna 'phone' ou 'client_phone'
-- UPDATE appointments a
-- SET client_id = c.id
-- FROM clients c
-- WHERE a.client_id IS NULL
-- AND a.user_id = c.user_id
-- AND TRIM(a.phone) = TRIM(c.phone);

-- OPÇÃO 2: Se appointments tiver coluna 'email' ou 'client_email'
-- UPDATE appointments a
-- SET client_id = c.id
-- FROM clients c
-- WHERE a.client_id IS NULL
-- AND a.user_id = c.user_id
-- AND LOWER(TRIM(a.email)) = LOWER(TRIM(c.email));

-- OPÇÃO 3: Se não houver forma de vincular automaticamente,
-- precisaremos fazer manualmente ou criar uma interface para isso
