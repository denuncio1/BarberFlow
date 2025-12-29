import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';

const WhatsAppBotSetup: React.FC = () => {
  const WEBHOOK_URL = `${window.location.origin}/api/whatsapp-webhook`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Bot de Agendamento para WhatsApp (Meta)</CardTitle>
        <CardDescription>
          Siga os passos abaixo para conectar seu aplicativo à API do WhatsApp Business da Meta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">Passo 1: Criar um Aplicativo na Meta for Developers</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Acesse o portal <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Meta for Developers</a>.</li>
            <li>Crie um novo aplicativo do tipo "Business".</li>
            <li>Adicione o produto "WhatsApp Business" ao seu aplicativo.</li>
            <li>Selecione ou adicione uma Conta Empresarial da Meta.</li>
          </ol>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Passo 2: Configurar o Webhook</h3>
          <p className="text-sm mb-2">
            O webhook é a ponte entre o WhatsApp e o nosso sistema. Ele receberá as mensagens dos clientes em tempo real.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Na seção "WhatsApp" &gt; "Configuração da API" do seu aplicativo Meta, encontre o painel de Webhooks e clique em "Configurar".</li>
            <li>No campo <strong>URL de retorno de chamada</strong>, você precisará de uma URL pública. Durante o desenvolvimento, use uma ferramenta como <a href="https://ngrok.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">ngrok</a> para expor seu ambiente local. A URL será parecida com: <code>https://SUA_URL_PUBLICA.ngrok.io/api/whatsapp-webhook</code>.</li>
            <li>No campo <strong>Token de verificação do webhook</strong>, crie uma senha secreta. Ela será usada para garantir que as solicitações vêm da Meta. Guarde este valor.</li>
          </ol>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Passo 3: Variáveis de Ambiente</h3>
          <p className="text-sm mb-2">
            Adicione as seguintes variáveis ao seu arquivo de configuração de ambiente (<code>.env.local</code> ou similar):
          </p>
          <pre className="bg-gray-100 p-2 rounded-md text-sm dark:bg-gray-800">
            {`VITE_WHATSAPP_VERIFY_TOKEN="SEU_TOKEN_DE_VERIFICACAO_DO_WEBHOOK"
VITE_WHATSAPP_ACCESS_TOKEN="SEU_TOKEN_DE_ACESSO_PERMANENTE"
VITE_WHATSAPP_PHONE_NUMBER_ID="ID_DO_SEU_NUMERO_DE_TELEFONE"`}
          </pre>
          <p className="text-sm mt-2">
            Você encontra o <strong>Token de Acesso</strong> e o <strong>ID do Número de Telefone</strong> na mesma página de "Configuração da API".
          </p>
        </div>

        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Endpoint do Webhook</AlertTitle>
          <AlertDescription>
            O endpoint que você deve configurar na Meta é: <code>{WEBHOOK_URL}</code>.
            O próximo passo será criar essa rota em nosso sistema.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WhatsAppBotSetup;
