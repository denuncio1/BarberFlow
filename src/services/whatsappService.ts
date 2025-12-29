import { supabase } from '../integrations/supabase/client';

export interface WhatsAppMessage {
  id: string;
  client_id: string;
  message: string;
  phone: string;
  scheduled_date: string;
  sent_date?: string;
  status: 'scheduled' | 'sending' | 'sent' | 'failed';
  type: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

interface SendWhatsAppParams {
  phone: string;
  message: string;
}

/**
 * Service to handle WhatsApp message sending and scheduling
 * 
 * IMPORTANT: This is a placeholder implementation.
 * To enable actual WhatsApp sending, you need to:
 * 
 * 1. Set up WhatsApp Business API:
 *    - Create a Facebook Developer account
 *    - Set up WhatsApp Business Platform
 *    - Get API credentials (Phone Number ID, Business Account ID, Access Token)
 * 
 * 2. Alternative: Use a third-party service like:
 *    - Twilio WhatsApp API
 *    - MessageBird
 *    - Vonage (Nexmo)
 *    - WhatsApp Cloud API
 * 
 * 3. Update the sendWhatsAppMessage function with your chosen provider's API
 * 
 * 4. Store API keys in Supabase environment variables or Edge Function secrets
 */

/**
 * Send a WhatsApp message using WhatsApp Business API
 * This is a placeholder - implement with your chosen provider
 */
export async function sendWhatsAppMessage({ phone, message }: SendWhatsAppParams): Promise<boolean> {
  try {
    // TODO: Replace with actual WhatsApp API integration
    
    // Example with Twilio (commented out):
    /*
    const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
    const TWILIO_WHATSAPP_FROM = import.meta.env.VITE_TWILIO_WHATSAPP_FROM; // e.g., 'whatsapp:+14155238886'
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_WHATSAPP_FROM,
          To: `whatsapp:${phone}`,
          Body: message,
        }),
      }
    );
    
    return response.ok;
    */

    // Example with WhatsApp Cloud API (commented out):
    /*
    const WHATSAPP_ACCESS_TOKEN = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
    const WHATSAPP_PHONE_NUMBER_ID = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      }
    );
    
    return response.ok;
    */

    // Simulated success for development
    console.log('📱 Simulated WhatsApp message to:', phone);
    console.log('💬 Message:', message);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Process scheduled messages that are due to be sent
 */
export async function processScheduledMessages() {
  try {
    const now = new Date().toISOString();
    
    // Get messages that should be sent now
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_date', now)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    if (!messages || messages.length === 0) {
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    // Process each message
    for (const msg of messages) {
      // Update status to sending
      await supabase
        .from('whatsapp_messages')
        .update({ status: 'sending' })
        .eq('id', msg.id);

      // Attempt to send
      const success = await sendWhatsAppMessage({
        phone: msg.phone,
        message: msg.message,
      });

      if (success) {
        await supabase
          .from('whatsapp_messages')
          .update({ 
            status: 'sent',
            sent_date: new Date().toISOString()
          })
          .eq('id', msg.id);
        successCount++;
      } else {
        await supabase
          .from('whatsapp_messages')
          .update({ 
            status: 'failed',
            error_message: 'Failed to send message'
          })
          .eq('id', msg.id);
        failedCount++;
      }

      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error('Error processing scheduled messages:', error);
    throw error;
  }
}

/**
 * Get all scheduled messages for a client
 */
export async function getClientScheduledMessages(clientId: string) {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('scheduled_date', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Cancel a scheduled message
 */
export async function cancelScheduledMessage(messageId: string) {
  const { error } = await supabase
    .from('whatsapp_messages')
    .update({ status: 'failed', error_message: 'Cancelled by user' })
    .eq('id', messageId)
    .eq('status', 'scheduled');

  if (error) throw error;
  return true;
}

/**
 * Get message statistics
 */
export async function getMessageStats(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('status, type')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) throw error;

  const stats = {
    total: data.length,
    scheduled: data.filter(m => m.status === 'scheduled').length,
    sent: data.filter(m => m.status === 'sent').length,
    failed: data.filter(m => m.status === 'failed').length,
    byType: {} as Record<string, number>
  };

  data.forEach(msg => {
    stats.byType[msg.type] = (stats.byType[msg.type] || 0) + 1;
  });

  return stats;
}
