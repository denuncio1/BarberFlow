import { defineConfig } from "vite";
import dotenv from 'dotenv';
dotenv.config();
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import bodyParser from "body-parser";
// Handler simulado para o webhook do WhatsApp (não depende do Supabase)
async function handleWhatsAppMessageSimulado({ from, body }: { from: string; body: string }) {
  // Apenas retorna uma resposta padrão
  return `Recebido de ${from}: ${body}`;
}
import { IncomingMessage, ServerResponse } from "http";

// Interfaces para a carga útil do Webhook do WhatsApp
interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text: {
    body: string;
  };
  type: 'text';
}

interface WhatsAppChangeValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  messages?: WhatsAppMessage[];
}

interface WhatsAppChange {
  value: WhatsAppChangeValue;
  field: 'messages';
}

interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry?: WhatsAppEntry[];
}

interface RequestWithBody extends IncomingMessage {
  body: WhatsAppWebhookPayload;
}

// Função para enviar respostas via API da Meta (simulada)
async function sendWhatsAppReply(to: string, text: string) {
  const { VITE_WHATSAPP_ACCESS_TOKEN, VITE_WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!VITE_WHATSAPP_ACCESS_TOKEN || !VITE_WHATSAPP_PHONE_NUMBER_ID) {
    console.error("Variáveis de ambiente do WhatsApp não configuradas.");
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${VITE_WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: to,
    text: { body: text },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VITE_WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Erro ao enviar resposta do WhatsApp:', data);
    } else {
      console.log('Resposta do WhatsApp enviada com sucesso:', data);
    }
  } catch (error) {
    console.error('Falha na requisição para a API do WhatsApp:', error);
  }
}

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(), 
    react(),
    {
      name: 'whatsapp-webhook-middleware',
      configureServer(server) {
        server.middlewares.use(bodyParser.json());

        server.middlewares.use('/api/whatsapp-webhook', async (req, res) => {
          const webhookReq = req as RequestWithBody;
          if (req.method === 'GET') {
            const query = req.url ? new URL(req.url, `http://${req.headers.host}`).searchParams : new URLSearchParams();
            const mode = query.get('hub.mode');
            const token = query.get('hub.verify_token');
            const challenge = query.get('hub.challenge');

            if (mode === 'subscribe' && token === process.env.VITE_WHATSAPP_VERIFY_TOKEN) {
              console.log('WEBHOOK_VERIFIED');
              res.statusCode = 200;
              res.end(challenge);
            } else {
              console.error('Failed validation. Make sure the validation tokens match.');
              res.statusCode = 403;
              res.end();
            }
          } else if (req.method === 'POST') {
            const body = webhookReq.body;
            if (body.object === 'whatsapp_business_account') {
              body.entry?.forEach((entry: WhatsAppEntry) => {
                entry.changes?.forEach((change: WhatsAppChange) => {
                  if (change.field === 'messages' && change.value.messages) {
                    change.value.messages.forEach(async (message: WhatsAppMessage) => {
                      if (message.type === 'text') {
                        const responseText = await handleWhatsAppMessageSimulado({
                          from: message.from,
                          body: message.text.body,
                        });
                        await sendWhatsAppReply(message.from, responseText);
                      }
                    });
                  }
                });
              });
            }
            res.statusCode = 200;
            res.end('EVENT_RECEIVED');
          } else {
            res.statusCode = 404;
            res.end();
          }
        });
      },
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
