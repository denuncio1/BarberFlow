# Instruções para Criar Tabelas de Metas da Equipe no Supabase

## Passo a Passo:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto BarberFlow

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute a Migration**
   - Copie todo o conteúdo do arquivo `create_team_goals_table.sql`
   - Cole no editor SQL
   - Clique em "Run" (ou pressione Ctrl+Enter)

4. **Verifique a Criação**
   - Vá para "Table Editor" no menu lateral
   - Você deve ver duas novas tabelas:
     - `team_goals` (Metas da equipe)
     - `commission_payments` (Pagamentos de comissões)

## O que foi criado:

### Tabela `team_goals`:
- Armazena metas mensais para cada colaborador
- Tipos de meta: produtos, serviços com/sem assinatura, gerais
- Valores: meta mínima, máxima e alvo
- Sistema de bônus e consideração de assinaturas
- Índices para performance otimizada
- RLS (Row Level Security) habilitado

### Tabela `commission_payments`:
- Rastreia pagamentos de comissões realizados
- Histórico completo por colaborador
- Suporta diferentes métodos de pagamento
- RLS habilitado para segurança

### Recursos de Segurança:
- ✅ Row Level Security (RLS) ativo
- ✅ Políticas de acesso por usuário
- ✅ Índices para consultas rápidas
- ✅ Triggers para atualização automática de timestamps
- ✅ Constraints de validação

## Troubleshooting:

Se houver erros:
1. Certifique-se de que a tabela `technicians` existe
2. Verifique se você tem permissões de admin no projeto
3. Se a tabela já existir, você pode deletá-la primeiro:
   ```sql
   DROP TABLE IF EXISTS public.team_goals CASCADE;
   DROP TABLE IF EXISTS public.commission_payments CASCADE;
   ```
   E então execute o script novamente.

## Após a Execução:

A página de Metas da Equipe deve funcionar corretamente, permitindo:
- ✅ Criar metas para colaboradores
- ✅ Visualizar progresso em tempo real
- ✅ Gráficos e relatórios detalhados
- ✅ Filtros por tipo de meta
- ✅ Cálculos automáticos de comissões
