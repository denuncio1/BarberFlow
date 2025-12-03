# Como Configurar as Políticas de Segurança do Supabase

## Problema
O erro "new row violates row-level security policy for table 'technicians'" ocorre porque o Supabase tem Row Level Security (RLS) ativado nas tabelas, mas não há políticas configuradas que permitam operações.

## Solução

### Opção 1: Executar o Script SQL (Recomendado)

1. Acesse o Dashboard do Supabase: https://azdtuqbrxruomxmueguz.supabase.co
2. Faça login com suas credenciais
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo `supabase_rls_policies.sql`
6. Cole no editor SQL
7. Clique em **Run** para executar o script

Este script criará políticas de segurança para todas as tabelas:
- technicians
- clients
- services
- appointments
- blocked_times
- products
- payment_methods

### Opção 2: Configurar Manualmente (Apenas para technicians)

Se preferir configurar apenas a tabela de técnicos manualmente:

1. Acesse o Dashboard do Supabase
2. Vá em **Authentication** > **Policies**
3. Encontre a tabela `technicians`
4. Clique em **New Policy**
5. Selecione **Custom Policy**
6. Configure as seguintes políticas:

#### INSERT Policy
```sql
Policy name: Users can insert their own technicians
Target roles: authenticated
USING expression: (deixe vazio)
WITH CHECK expression: auth.uid() = user_id
```

#### SELECT Policy
```sql
Policy name: Users can view their own technicians
Target roles: authenticated
USING expression: auth.uid() = user_id
WITH CHECK expression: (deixe vazio)
```

#### UPDATE Policy
```sql
Policy name: Users can update their own technicians
Target roles: authenticated
USING expression: auth.uid() = user_id
WITH CHECK expression: auth.uid() = user_id
```

#### DELETE Policy
```sql
Policy name: Users can delete their own technicians
Target roles: authenticated
USING expression: auth.uid() = user_id
WITH CHECK expression: (deixe vazio)
```

## O que estas políticas fazem

- **INSERT**: Permite que usuários autenticados insiram registros onde o `user_id` corresponde ao ID do usuário logado
- **SELECT**: Permite que usuários vejam apenas seus próprios registros
- **UPDATE**: Permite que usuários atualizem apenas seus próprios registros
- **DELETE**: Permite que usuários excluam apenas seus próprios registros

Isso garante que cada usuário tenha acesso apenas aos seus próprios dados, implementando isolamento multi-tenant.

## Após Configurar

Depois de executar o script ou configurar as políticas:

1. Recarregue a página da aplicação
2. Tente cadastrar um barbeiro novamente
3. O erro não deve mais ocorrer

## Verificação

Para verificar se as políticas foram criadas corretamente:

1. No Dashboard do Supabase, vá em **Authentication** > **Policies**
2. Selecione a tabela `technicians`
3. Você deverá ver 4 políticas listadas (INSERT, SELECT, UPDATE, DELETE)
