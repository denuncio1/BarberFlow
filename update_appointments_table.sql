-- Update appointments table to add missing columns
-- Execute este script no SQL Editor do Supabase Dashboard

-- First, drop the employee_id constraint if it exists to avoid conflicts
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_employee_id_fkey;

-- Make employee_id nullable if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'employee_id') THEN
        ALTER TABLE appointments ALTER COLUMN employee_id DROP NOT NULL;
    END IF;
END $$;

-- Add technician_id column if it doesn't exist (nullable)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'technician_id') THEN
        ALTER TABLE appointments ADD COLUMN technician_id UUID;
    END IF;
END $$;

-- Add service_id column if it doesn't exist (nullable)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'service_id') THEN
        ALTER TABLE appointments ADD COLUMN service_id UUID;
    END IF;
END $$;

-- Add client_id column if it doesn't exist (nullable)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'client_id') THEN
        ALTER TABLE appointments ADD COLUMN client_id UUID;
    END IF;
END $$;

-- Add foreign key constraints after columns are created (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_appointments_technician'
    ) THEN
        ALTER TABLE appointments 
          ADD CONSTRAINT fk_appointments_technician 
          FOREIGN KEY (technician_id) REFERENCES technicians(id) 
          ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_appointments_service'
    ) THEN
        ALTER TABLE appointments 
          ADD CONSTRAINT fk_appointments_service 
          FOREIGN KEY (service_id) REFERENCES services(id) 
          ON DELETE SET NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_appointments_client'
    ) THEN
        ALTER TABLE appointments 
          ADD CONSTRAINT fk_appointments_client 
          FOREIGN KEY (client_id) REFERENCES clients(id) 
          ON DELETE SET NULL;
    END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'notes') THEN
        ALTER TABLE appointments ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'appointments' AND column_name = 'status') THEN
        ALTER TABLE appointments ADD COLUMN status TEXT DEFAULT 'scheduled';
    END IF;
END $$;

-- Add indexes for better performance (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'service_id') THEN
        CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'technician_id') THEN
        CREATE INDEX IF NOT EXISTS idx_appointments_technician_id ON appointments(technician_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'client_id') THEN
        CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, appointment_date);
END $$;

-- Update RLS policies if needed (optional)
-- The existing policies should still work, but you can review them in the Supabase dashboard
