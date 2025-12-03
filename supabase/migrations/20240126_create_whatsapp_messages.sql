-- Create whatsapp_messages table for scheduled and sent messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    scheduled_date TIMESTAMPTZ NOT NULL,
    sent_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    type VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client_id ON public.whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_scheduled_date ON public.whatsapp_messages(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type ON public.whatsapp_messages(type);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_messages_updated_at
    BEFORE UPDATE ON public.whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_messages_updated_at();

-- Add comments
COMMENT ON TABLE public.whatsapp_messages IS 'Stores scheduled and sent WhatsApp messages';
COMMENT ON COLUMN public.whatsapp_messages.status IS 'Status: scheduled, sending, sent, failed';
COMMENT ON COLUMN public.whatsapp_messages.type IS 'Message type: birthday, promotion, reminder, etc.';

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.whatsapp_messages
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
