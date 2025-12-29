import { supabase } from '../integrations/supabase/client';

// Define os tipos para os dados do bot
interface WhatsAppMessage {
  from: string;
  body: string;
}

interface Appointment {
  service: 'corte de cabelo' | 'barba' | 'combo corte+barba';
  time: string;
  clientName: string;
  clientPhone: string;
}

// Simulação de horários disponíveis
const availableTimes = ['10:00', '11:00', '14:00', '15:00', '16:00'];

// Lógica de conversação do bot
export const handleWhatsAppMessage = async (message: WhatsAppMessage): Promise<string> => {
  const { from, body }: { from: string; body: string } = message;
  const lowerBody = body.toLowerCase();

  // Verifica o estado atual da conversa com o cliente (simulado)
  const currentState = await getClientState(from);

  if (!currentState) {
    await setClientState(from, { step: 'GREETING' });
    return `Olá! Bem-vindo à BarberFlow. Nossos serviços são:
- Corte de cabelo
- Barba
- Combo corte+barba
Qual você gostaria de agendar?`;
  }

  switch (currentState.step) {
    case 'GREETING':
      if (['corte de cabelo', 'barba', 'combo corte+barba'].includes(lowerBody)) {
        await setClientState(from, { step: 'SELECT_TIME', service: lowerBody });
        return `Ótima escolha! Nossos horários disponíveis são: ${availableTimes.join(', ')}. Qual horário você prefere?`;
      }
      return 'Por favor, escolha um serviço válido.';

    case 'SELECT_TIME':
      if (availableTimes.includes(lowerBody)) {
        const appointment: Appointment = {
          service: currentState.service,
          time: lowerBody,
          clientName: 'Cliente WhatsApp', // Nome pode ser solicitado depois
          clientPhone: from,
        };
        await saveAppointment(appointment);
        await setClientState(from, { step: 'CONFIRMED' });
        return `Agendamento confirmado para ${appointment.service} às ${appointment.time}. Enviaremos um lembrete no dia. Você pode cancelar ou remarcar a qualquer momento.`;
      }
      return 'Horário indisponível. Por favor, escolha um dos horários livres.';

    case 'CONFIRMED':
      if (lowerBody.includes('cancelar') || lowerBody.includes('remarcar')) {
        await setClientState(from, { step: 'GREETING' });
        // Lógica para cancelar/remarcar
        return 'Seu agendamento foi cancelado. Gostaria de fazer um novo agendamento?';
      }
      return 'Seu agendamento já está confirmado. Para cancelar ou remarcar, envie "cancelar" ou "remarcar".';

    default:
      await setClientState(from, { step: 'GREETING' });
      return 'Desculpe, não entendi. Como posso ajudar?';
  }
};

// Funções auxiliares para gerenciar o estado e salvar dados
const clientState: { [key: string]: any } = {};

const getClientState = async (phone: string): Promise<any> => {
  return clientState[phone];
};

const setClientState = async (phone: string, state: any): Promise<void> => {
  clientState[phone] = state;
};

const saveAppointment = async (appointment: Appointment): Promise<void> => {
  // Integração com a tabela de agendamentos do Supabase
  const { data, error } = await supabase.from('appointments').insert([
    {
      client_name: appointment.clientName,
      client_phone: appointment.clientPhone,
      service: appointment.service,
      start_time: appointment.time,
      // Outros campos necessários
    },
  ]);

  if (error) {
    console.error('Erro ao salvar agendamento:', error);
  } else {
    console.log('Agendamento salvo:', data);
  }
};
