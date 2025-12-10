// Mock de envio de notificações (WhatsApp/SMS)
export async function sendNotification({ name, phone, slot }: { name: string; phone: string; slot: string }) {
  // Aqui você integraria com uma API real de WhatsApp/SMS
  // Exemplo: Twilio, Zenvia, WhatsApp Business API
  console.log(`Enviando notificação para ${name} (${phone}): Seu atendimento está confirmado para ${slot}.`);
  return true;
}
