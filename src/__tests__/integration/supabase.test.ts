import { createClient } from '@/lib/supabase/client'

describe('Supabase Integration', () => {
  it('should have valid Supabase configuration', () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(supabaseUrl).toBeDefined()
    expect(supabaseUrl).toMatch(/^https:\/\/.*\.supabase\.co$/)
    
    expect(supabaseAnonKey).toBeDefined()
    expect(supabaseAnonKey).toMatch(/^eyJ/)
  })

  it('should create Supabase client successfully', () => {
    const supabase = createClient()
    
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
    expect(supabase.from).toBeDefined()
  })

  it('should have Twilio configuration for WhatsApp', () => {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

    expect(twilioAccountSid).toBeDefined()
    expect(twilioAccountSid).toMatch(/^AC/)
    
    expect(twilioAuthToken).toBeDefined()
    expect(twilioAuthToken).toHaveLength(32)
    
    expect(twilioWhatsAppNumber).toBeDefined()
    expect(twilioWhatsAppNumber).toMatch(/^whatsapp:\+/)
  })
})