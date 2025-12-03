# Sistema de Mensagens WhatsApp para Aniversariantes

## 📋 Visão Geral

Sistema completo de envio automático e programado de mensagens de aniversário via WhatsApp para clientes da barbearia.

## ✅ Componentes Criados

### 1. **BirthdayWhatsAppDialog.tsx**
Componente de diálogo para envio de mensagens com as seguintes funcionalidades:

- ✅ Seleção individual ou em massa de clientes
- ✅ Modo de envio: Imediato ou Agendado
- ✅ Templates de mensagem pré-definidos:
  - **Formal**: Mensagem profissional de parabéns
  - **Casual**: Mensagem descontraída
  - **Promocional**: Com oferta especial de desconto
  - **Personalizada**: Mensagem customizada pelo usuário
- ✅ Agendamento com data e horário
- ✅ Preview da mensagem com variáveis substituídas
- ✅ Lista de clientes com checkbox para seleção
- ✅ Indicadores visuais (idade, dias até aniversário)

### 2. **whatsappService.ts**
Serviço para integração com APIs de WhatsApp:

- ✅ Função `sendWhatsAppMessage()` - Envio de mensagens
- ✅ Função `processScheduledMessages()` - Processamento de mensagens agendadas
- ✅ Função `getClientScheduledMessages()` - Histórico de mensagens
- ✅ Função `cancelScheduledMessage()` - Cancelamento de envios
- ✅ Função `getMessageStats()` - Estatísticas de envio
- ✅ Documentação para integração com:
  - WhatsApp Business API (Facebook)
  - Twilio WhatsApp API
  - WhatsApp Cloud API
  - MessageBird / Vonage

### 3. **Tabela whatsapp_messages**
Estrutura no Supabase para armazenar mensagens:

```sql
- id: UUID (chave primária)
- client_id: UUID (referência a clientes)
- message: TEXT (conteúdo da mensagem)
- phone: VARCHAR(20) (telefone do destinatário)
- scheduled_date: TIMESTAMPTZ (data/hora de envio)
- sent_date: TIMESTAMPTZ (data/hora efetiva do envio)
- status: VARCHAR(20) (scheduled, sending, sent, failed)
- type: VARCHAR(50) (birthday, promotion, reminder)
- error_message: TEXT (mensagens de erro)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

Inclui:
- Índices para performance
- Trigger para atualização automática
- RLS (Row Level Security) habilitado
- Políticas de acesso

### 4. **Integração no ClientsReport**
Adicionado ao relatório de aniversariantes:

- ✅ Botão "Enviar Mensagens em Massa" no cabeçalho
- ✅ Botão "Enviar Mensagem" individual para cada cliente
- ✅ Dialog integrado com gestão de estado
- ✅ Passa lista de clientes aniversariantes automaticamente

### 5. **Traduções (pt/en)**
Adicionadas 34 strings de tradução:

- send_birthday_messages
- whatsapp_birthday_title
- send_mode, send_now, schedule_send
- message_template, template_formal/casual/promotional/custom
- custom_message, message_preview
- processing, messages_sent_success
- error_sending_messages
- E mais...

## 🚀 Como Usar

### Para o Usuário Final:

1. **Acessar Relatório de Clientes**
   - Ir em Relatórios → Relatório de Clientes
   - Clicar na aba "Aniversariantes"

2. **Envio Individual**
   - Clicar em "Enviar Mensagem" na linha do cliente
   - Selecionar template de mensagem
   - Escolher envio imediato ou agendar
   - Confirmar envio

3. **Envio em Massa**
   - Clicar em "Enviar Mensagens em Massa"
   - Selecionar múltiplos clientes (checkbox)
   - Escolher template
   - Agendar para data específica (ex: 08:00 do dia do aniversário)
   - Confirmar envio

4. **Recursos Avançados**
   - Agendar mensagens para envio automático
   - Personalizar mensagens com variáveis {name}, {business}, {phone}
   - Visualizar preview antes de enviar
   - Selecionar todos os clientes de uma vez

## ⚙️ Configuração Técnica

### 1. **Executar Migration no Supabase**

```sql
-- Execute o arquivo: supabase/migrations/20240126_create_whatsapp_messages.sql
-- Via SQL Editor no Supabase Dashboard
```

### 2. **Configurar API do WhatsApp**

**Opção A: WhatsApp Cloud API (Recomendado)**
```typescript
// No whatsappService.ts, descomentar e configurar:
const WHATSAPP_ACCESS_TOKEN = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;

// Adicionar ao .env:
VITE_WHATSAPP_ACCESS_TOKEN=seu_token_aqui
VITE_WHATSAPP_PHONE_NUMBER_ID=seu_phone_id_aqui
```

**Opção B: Twilio WhatsApp API**
```typescript
// No whatsappService.ts, descomentar e configurar:
const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = import.meta.env.VITE_TWILIO_WHATSAPP_FROM;

// Adicionar ao .env:
VITE_TWILIO_ACCOUNT_SID=seu_account_sid
VITE_TWILIO_AUTH_TOKEN=seu_auth_token
VITE_TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 3. **Processamento de Mensagens Agendadas**

Para processar mensagens agendadas, criar um Supabase Edge Function ou cron job:

```typescript
// Exemplo de Edge Function (schedule-whatsapp-messages/index.ts)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { processScheduledMessages } from '../_shared/whatsappService.ts'

serve(async (req) => {
  const result = await processScheduledMessages()
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Agendar com cron (Supabase Dashboard → Edge Functions → Cron):
```
0 * * * * # Executar a cada hora
```

## 📊 Fluxo de Dados

```
Cliente Aniversariante
    ↓
Relatório de Clientes (Aba Aniversariantes)
    ↓
Usuário clica "Enviar Mensagem" ou "Enviar em Massa"
    ↓
BirthdayWhatsAppDialog abre
    ↓
Usuário seleciona clientes, template, modo (agora/agendado)
    ↓
Confirma envio
    ↓
Registro criado na tabela whatsapp_messages
    ↓
Se "Enviar Agora": whatsappService.sendWhatsAppMessage() → WhatsApp API
Se "Agendado": aguarda processScheduledMessages() → WhatsApp API
    ↓
Status atualizado (sent/failed)
    ↓
Toast de confirmação para usuário
```

## 🔧 Melhorias Futuras

1. **Histórico de Mensagens**
   - Criar página para visualizar todas as mensagens enviadas
   - Filtros por status, tipo, data
   - Estatísticas de entrega

2. **Templates Avançados**
   - Editor visual de mensagens
   - Suporte a imagens/mídia
   - Mensagens com múltiplas variáveis

3. **Automação**
   - Envio automático X dias antes do aniversário
   - Mensagens de follow-up
   - Integração com campanhas de marketing

4. **Analytics**
   - Taxa de abertura (se API suportar)
   - Taxa de resposta
   - ROI de campanhas

## 📝 Notas Importantes

- **Desenvolvimento**: Atualmente usa simulação (console.log). Mensagens não são enviadas de verdade.
- **Produção**: Necessita configuração de API do WhatsApp (veja seção Configuração Técnica).
- **Custos**: WhatsApp Business API pode ter custos por mensagem. Verifique pricing.
- **Compliance**: Certifique-se de ter consentimento dos clientes para envio de mensagens.
- **Limites**: APIs têm rate limits. O serviço adiciona delay de 500ms entre mensagens.

## 🎯 Status do Projeto

✅ **Implementação Completa**
- [x] Componente de diálogo
- [x] Serviço de WhatsApp
- [x] Tabela no banco de dados
- [x] Integração no relatório
- [x] Traduções pt/en
- [x] Templates de mensagens
- [x] Agendamento
- [x] Seleção em massa

⚠️ **Pendente Configuração**
- [ ] API do WhatsApp (Facebook/Twilio)
- [ ] Edge Function para mensagens agendadas
- [ ] Variáveis de ambiente (.env)

## 💡 Suporte

Para dúvidas ou problemas:
1. Verificar logs no console do navegador
2. Verificar tabela whatsapp_messages no Supabase
3. Testar com dados de exemplo primeiro
4. Conferir documentação da API escolhida (WhatsApp/Twilio)
