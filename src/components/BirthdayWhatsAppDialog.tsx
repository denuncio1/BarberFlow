import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Send, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  phone: string;
  birth_date: string;
  age: number;
  daysUntilBirthday: number;
}

interface BirthdayWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  selectedClient?: Client;
}

const MESSAGE_TEMPLATES = [
  {
    id: 'formal',
    name: 'Formal',
    template: 'Olá {name}! 🎉\n\nA equipe da {business} deseja um Feliz Aniversário! 🎂\n\nQue este novo ano seja repleto de realizações e momentos especiais.\n\nComo presente, preparamos uma condição especial para você. Entre em contato para saber mais!'
  },
  {
    id: 'casual',
    name: 'Casual',
    template: 'Opa {name}! 🎈🎉\n\nParabéns pelo seu dia! A galera da {business} te deseja tudo de bom!\n\nVem nos visitar e ganhe um presente especial! 🎁'
  },
  {
    id: 'promotional',
    name: 'Promocional',
    template: '🎂 FELIZ ANIVERSÁRIO {name}! 🎉\n\n🎁 Presente especial da {business}:\n✅ 20% de desconto em qualquer serviço\n✅ Válido por 7 dias\n\nAgende já: {phone}'
  },
  {
    id: 'custom',
    name: 'Personalizada',
    template: ''
  }
];

export function BirthdayWhatsAppDialog({ open, onOpenChange, clients, selectedClient }: BirthdayWhatsAppDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedClients, setSelectedClients] = useState<string[]>(selectedClient ? [selectedClient.id] : []);
  const [messageTemplate, setMessageTemplate] = useState('formal');
  const [customMessage, setCustomMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [sendMode, setSendMode] = useState<'now' | 'scheduled'>('now');
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentTemplate = () => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === messageTemplate);
    if (messageTemplate === 'custom') {
      return customMessage;
    }
    return template?.template || '';
  };

  const formatMessage = (clientData: Client) => {
    const template = getCurrentTemplate();
    return template
      .replace('{name}', clientData.name.split(' ')[0])
      .replace('{business}', 'BarberFlow')
      .replace('{phone}', '(11) 99999-9999'); // Replace with actual business phone
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(clients.map(c => c.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleClientToggle = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    }
  };

  const handleSendMessages = async () => {
    if (selectedClients.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um cliente",
        variant: "destructive"
      });
      return;
    }

    if (!getCurrentTemplate().trim()) {
      toast({
        title: "Atenção",
        description: "Digite uma mensagem",
        variant: "destructive"
      });
      return;
    }

    if (sendMode === 'scheduled' && !scheduledDate) {
      toast({
        title: "Atenção",
        description: "Selecione a data de envio",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const selectedClientsData = clients.filter(c => selectedClients.includes(c.id));
      
      // Create scheduled messages in database
      const messages = selectedClientsData.map(client => ({
        client_id: client.id,
        message: formatMessage(client),
        scheduled_date: sendMode === 'scheduled' 
          ? new Date(`${format(scheduledDate!, 'yyyy-MM-dd')}T${scheduledTime}:00`)
          : new Date(),
        status: sendMode === 'now' ? 'sending' : 'scheduled',
        type: 'birthday',
        phone: client.phone
      }));

      const { error } = await supabase
        .from('whatsapp_messages')
        .insert(messages);

      if (error) throw error;

      if (sendMode === 'now') {
        // Here you would integrate with WhatsApp Business API
        // For now, we'll simulate the sending
        toast({
          title: "✅ Mensagens enviadas!",
          description: `${selectedClients.length} mensagem(ns) enviada(s) com sucesso`,
        });
      } else {
        toast({
          title: "✅ Mensagens agendadas!",
          description: `${selectedClients.length} mensagem(ns) agendada(s) para ${format(scheduledDate!, 'dd/MM/yyyy')} às ${scheduledTime}`,
        });
      }

      onOpenChange(false);
      setSelectedClients([]);
      setCustomMessage('');
      setScheduledDate(undefined);
    } catch (error) {
      console.error('Error sending messages:', error);
      toast({
        title: "Erro ao enviar mensagens",
        description: "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Enviar Mensagens de Aniversário
          </DialogTitle>
          <DialogDescription>
            Selecione os clientes e personalize a mensagem de parabéns
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Send Mode Selection */}
          <div className="space-y-2">
            <Label>Modo de Envio</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sendMode === 'now' ? 'default' : 'outline'}
                onClick={() => setSendMode('now')}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Agora
              </Button>
              <Button
                type="button"
                variant={sendMode === 'scheduled' ? 'default' : 'outline'}
                onClick={() => setSendMode('scheduled')}
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Agendar Envio
              </Button>
            </div>
          </div>

          {/* Scheduled Date/Time */}
          {sendMode === 'scheduled' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Envio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Message Template */}
          <div className="space-y-2">
            <Label>Template de Mensagem</Label>
            <Select value={messageTemplate} onValueChange={setMessageTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Message */}
          {messageTemplate === 'custom' ? (
            <div className="space-y-2">
              <Label>Mensagem Personalizada</Label>
              <Textarea
                placeholder="Digite sua mensagem... Use {name} para o nome do cliente"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {'{name}'}, {'{business}'}, {'{phone}'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Preview da Mensagem</Label>
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                {getCurrentTemplate() || 'Selecione um template'}
              </div>
            </div>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Clientes ({selectedClients.length} selecionados)</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedClients.length === clients.length}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm cursor-pointer">
                  Selecionar todos
                </label>
              </div>
            </div>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {clients.map(client => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
                >
                  <Checkbox
                    id={`client-${client.id}`}
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={(checked) => handleClientToggle(client.id, checked as boolean)}
                  />
                  <label htmlFor={`client-${client.id}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{client.age} anos</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {client.daysUntilBirthday === 0 ? 'Hoje!' : `${client.daysUntilBirthday} dias`}
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSendMessages} disabled={isLoading}>
            {isLoading ? (
              "Processando..."
            ) : sendMode === 'now' ? (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Agora
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Agendar Mensagens
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
