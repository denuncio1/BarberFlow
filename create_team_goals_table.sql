-- Create team_goals table for tracking team member goals and targets
CREATE TABLE IF NOT EXISTS public.team_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('products', 'services_unsigned', 'services_signed', 'general_unsigned', 'general_signed')),
    goal_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_expected_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    max_expected_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    bonus_active BOOLEAN DEFAULT false,
    consider_signature BOOLEAN DEFAULT false,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2024 AND year <= 2030),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, technician_id, goal_type, month, year)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_goals_user_id ON public.team_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_team_goals_technician_id ON public.team_goals(technician_id);
CREATE INDEX IF NOT EXISTS idx_team_goals_month_year ON public.team_goals(month, year);
CREATE INDEX IF NOT EXISTS idx_team_goals_goal_type ON public.team_goals(goal_type);

-- Enable Row Level Security
ALTER TABLE public.team_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own team goals" ON public.team_goals;
DROP POLICY IF EXISTS "Users can insert their own team goals" ON public.team_goals;
DROP POLICY IF EXISTS "Users can update their own team goals" ON public.team_goals;
DROP POLICY IF EXISTS "Users can delete their own team goals" ON public.team_goals;

-- Create RLS Policies
CREATE POLICY "Users can view their own team goals"
    ON public.team_goals
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own team goals"
    ON public.team_goals
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team goals"
    ON public.team_goals
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own team goals"
    ON public.team_goals
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_team_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS update_team_goals_updated_at_trigger ON public.team_goals;
CREATE TRIGGER update_team_goals_updated_at_trigger
    BEFORE UPDATE ON public.team_goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_goals_updated_at();

-- Create commission_payments table for tracking paid commissions
CREATE TABLE IF NOT EXISTS public.commission_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for commission_payments
CREATE INDEX IF NOT EXISTS idx_commission_payments_user_id ON public.commission_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_technician_id ON public.commission_payments(technician_id);
CREATE INDEX IF NOT EXISTS idx_commission_payments_date ON public.commission_payments(payment_date);

-- Enable Row Level Security for commission_payments
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own commission payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Users can insert their own commission payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Users can update their own commission payments" ON public.commission_payments;
DROP POLICY IF EXISTS "Users can delete their own commission payments" ON public.commission_payments;

-- Create RLS Policies for commission_payments
CREATE POLICY "Users can view their own commission payments"
    ON public.commission_payments
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commission payments"
    ON public.commission_payments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commission payments"
    ON public.commission_payments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commission payments"
    ON public.commission_payments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update commission_payments updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_commission_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for commission_payments
DROP TRIGGER IF EXISTS update_commission_payments_updated_at_trigger ON public.commission_payments;
CREATE TRIGGER update_commission_payments_updated_at_trigger
    BEFORE UPDATE ON public.commission_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_commission_payments_updated_at();

-- Grant permissions
GRANT ALL ON public.team_goals TO authenticated;
GRANT ALL ON public.commission_payments TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.team_goals IS 'Stores team member goals and targets by month/year';
COMMENT ON COLUMN public.team_goals.goal_type IS 'Type of goal: products, services_unsigned, services_signed, general_unsigned, general_signed';
COMMENT ON COLUMN public.team_goals.goal_value IS 'Target goal value';
COMMENT ON COLUMN public.team_goals.min_expected_value IS 'Minimum expected value to achieve';
COMMENT ON COLUMN public.team_goals.max_expected_value IS 'Maximum expected value (stretch goal)';
COMMENT ON COLUMN public.team_goals.bonus_active IS 'Whether bonus system is active for this goal';
COMMENT ON COLUMN public.team_goals.consider_signature IS 'Whether to consider signature sales in calculations';

COMMENT ON TABLE public.commission_payments IS 'Tracks commission payments made to technicians';
COMMENT ON COLUMN public.commission_payments.amount IS 'Amount paid';
COMMENT ON COLUMN public.commission_payments.payment_date IS 'Date when payment was made';
COMMENT ON COLUMN public.commission_payments.payment_method IS 'Method used for payment (cash, transfer, etc)';
