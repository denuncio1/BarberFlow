-- Add signature_used column to appointments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'signature_used'
    ) THEN
        ALTER TABLE public.appointments 
        ADD COLUMN signature_used BOOLEAN DEFAULT false NOT NULL;
        
        -- Add index for better query performance
        CREATE INDEX IF NOT EXISTS idx_appointments_signature_used 
        ON public.appointments(signature_used);
        
        -- Add comment
        COMMENT ON COLUMN public.appointments.signature_used 
        IS 'Indicates if a signature/subscription was used for this appointment';
        
        RAISE NOTICE 'Column signature_used added successfully to appointments table';
    ELSE
        RAISE NOTICE 'Column signature_used already exists in appointments table';
    END IF;
END $$;
