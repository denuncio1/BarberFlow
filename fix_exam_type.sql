-- Fix exam_type column constraint
-- Execute este script no SQL Editor do Supabase Dashboard

-- Make exam_type nullable if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'appointments' AND column_name = 'exam_type') THEN
        ALTER TABLE appointments ALTER COLUMN exam_type DROP NOT NULL;
    END IF;
END $$;

-- Set a default value for exam_type in existing records if needed
UPDATE appointments SET exam_type = 'regular' WHERE exam_type IS NULL;
