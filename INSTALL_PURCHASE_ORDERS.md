# Sistema de Pedidos de Compra - Instruções de Instalação

## 📋 Pré-requisitos
- Acesso ao Dashboard do Supabase
- Sistema BarberFlow já instalado

## 🚀 Passo a Passo

### 1. Executar o Script SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Copie e cole o conteúdo do arquivo `create_purchase_orders_tables.sql`
5. Clique em **Run** (ou pressione Ctrl+Enter)

### 2. Verificar se as Tabelas foram Criadas

Execute este SQL para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('suppliers', 'purchase_orders', 'purchase_order_items');
```

Você deve ver 3 tabelas retornadas.

### 3. Acessar o Sistema

Após executar o SQL:

1. **Cadastrar Fornecedores**
   - Acesse: Menu → Controle de Estoque → Fornecedores
   - URL: `/stock-control/suppliers`

2. **Criar Pedidos de Compra**
   - Acesse: Menu → Controle de Estoque → Pedidos de Compra
   - URL: `/stock-control/purchase-orders`

## 📦 Estrutura Criada

### Tabelas

1. **suppliers** - Fornecedores
   - Dados cadastrais (nome, contato, telefone, email, CNPJ)
   - Endereço e observações
   - Status ativo/inativo

2. **purchase_orders** - Pedidos de Compra
   - Número do pedido (auto-gerado: PO-000001, PO-000002...)
   - Fornecedor vinculado
   - Datas (pedido, previsão, entrega)
   - Status: pending, approved, partially_received, received, cancelled
   - Valor total

3. **purchase_order_items** - Itens do Pedido
   - Produto vinculado
   - Quantidade e preço unitário
   - Quantidade recebida
   - Total do item

### Funcionalidades

✅ Cadastro completo de fornecedores
✅ Criação de pedidos com múltiplos produtos
✅ Geração automática de número de pedido
✅ Controle de status do pedido
✅ **Atualização automática de estoque** ao receber pedido
✅ **Registro automático em movimentações de estoque**
✅ Filtros por status
✅ Visualização detalhada de cada pedido

## 🔧 Fluxo de Uso

### Primeiro Uso

1. **Cadastre Fornecedores**
   ```
   Menu → Controle de Estoque → Fornecedores
   Clique em "Novo Fornecedor"
   Preencha os dados
   ```

2. **Crie um Pedido**
   ```
   Menu → Controle de Estoque → Pedidos de Compra
   Clique em "Novo Pedido"
   Selecione o fornecedor
   Adicione produtos (quantidade e preço)
   Clique em "Criar Pedido"
   ```

3. **Acompanhe o Pedido**
   ```
   Status inicial: Pendente
   → Aprovar (opcional)
   → Marcar como Recebido (atualiza estoque!)
   ```

### Recebimento de Pedido

Quando você marca um pedido como **Recebido**:
1. ✅ Status muda para "received"
2. ✅ Estoque dos produtos é atualizado (+quantidade)
3. ✅ Registro automático em "Movimentações de Estoque" (tipo: purchase)

## ⚠️ Erros Comuns

### "Table does not exist"
**Solução**: Execute o script SQL `create_purchase_orders_tables.sql` no Supabase.

### "Nenhum fornecedor cadastrado"
**Solução**: Cadastre fornecedores primeiro em `/stock-control/suppliers`.

### "Nenhum produto com estoque disponível"
**Solução**: Cadastre produtos em Menu → Cadastros → Produtos.

## 🔐 Segurança

- ✅ Row Level Security (RLS) ativado em todas as tabelas
- ✅ Usuários só veem seus próprios dados
- ✅ Policies configuradas para INSERT, SELECT, UPDATE, DELETE

## 📊 Integração

O sistema está integrado com:
- **Produtos** (cadastro de produtos)
- **Controle de Estoque** (atualização automática)
- **Movimentações de Estoque** (registro de entradas)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se o SQL foi executado corretamente
2. Veja o console do navegador (F12) para erros detalhados
3. Verifique se as tabelas existem no Supabase
