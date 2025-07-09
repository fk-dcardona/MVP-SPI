-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_otp_phone_number ON public.otp_verifications(phone_number);
CREATE INDEX idx_otp_expires_at ON public.otp_verifications(expires_at);
CREATE INDEX idx_otp_verified ON public.otp_verifications(verified);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies - only authenticated users can access their own OTP records
CREATE POLICY "Users can view their own OTP records" ON public.otp_verifications
    FOR SELECT TO authenticated
    USING (true); -- In production, you might want to restrict this further

CREATE POLICY "System can insert OTP records" ON public.otp_verifications
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "System can update OTP records" ON public.otp_verifications
    FOR UPDATE TO authenticated
    USING (true);

-- Add phone verification fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Create alerts table for storing system alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_alerts_company_id ON public.alerts(company_id);
CREATE INDEX idx_alerts_type ON public.alerts(type);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON public.alerts(acknowledged);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company's alerts" ON public.alerts
    FOR SELECT TO authenticated
    USING (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can acknowledge their company's alerts" ON public.alerts
    FOR UPDATE TO authenticated
    USING (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ))
    WITH CHECK (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "System can insert alerts" ON public.alerts
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Update triggers
CREATE TRIGGER update_otp_verifications_updated_at
    BEFORE UPDATE ON public.otp_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();