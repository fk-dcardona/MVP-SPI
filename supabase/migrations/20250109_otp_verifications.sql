-- Create OTP verifications table
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(50) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone_code (phone_number, otp_code),
  INDEX idx_otp_expires (expires_at)
);

-- Enable RLS
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- Only allow system/service role to access OTP verifications
CREATE POLICY "Service role can manage OTP verifications" ON otp_verifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create cleanup function for expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_verifications 
  WHERE expires_at < CURRENT_TIMESTAMP 
  OR (is_used = true AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to clean up expired OTPs (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-otps', '*/15 * * * *', 'SELECT cleanup_expired_otps();');