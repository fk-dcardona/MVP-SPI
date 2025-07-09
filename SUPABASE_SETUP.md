# Supabase Project Setup Guide

## Quick Setup Steps

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New project"
4. Fill in:
   - **Project name**: `finkargo-analytics`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier is fine for development

### 2. Get Your API Keys

Once project is created:

1. Go to **Settings** → **API**
2. Copy these values to your `.env.local`:

```bash
# From the API Settings page:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)
SUPABASE_SERVICE_KEY=eyJ... (your service key - keep secret!)
```

### 3. Run Database Migrations

```bash
# In your terminal:
cd /Users/helpdesk/Cursor/MVP\ -\ Supply\ Chain\ Intelligence/mvp-spi

# Option 1: Run via Supabase Dashboard
# Go to SQL Editor and paste each migration file

# Option 2: Use Supabase CLI (if installed)
npx supabase db push
```

### 4. Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - Enable email confirmations
   - Set redirect URLs

### 5. Set Up Row Level Security

This is already in the migrations, but verify:

1. Go to **Database** → **Tables**
2. Check that RLS is enabled (shield icon) on:
   - companies
   - user_profiles
   - inventory_items
   - sales_transactions

### 6. Test Your Connection

```bash
# Run this to test:
npm run supabase:test
```

## Twilio Setup (for WhatsApp OTP)

### 1. Create Twilio Account

1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Sign up for free trial
3. Verify your phone number

### 2. Get WhatsApp Sandbox

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to join sandbox
3. Note your sandbox number (like: whatsapp:+14155238886)

### 3. Get API Credentials

1. Go to **Account** → **API keys & tokens**
2. Copy to `.env.local`:

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Currency API Setup

1. Go to [https://app.exchangerate-api.com/sign-up](https://app.exchangerate-api.com/sign-up)
2. Sign up for free account (1,500 requests/month)
3. Get your API key
4. Add to `.env.local`:

```bash
EXCHANGERATE_API_KEY=your_api_key_here
```

## Verify Everything Works

Run this checklist script:

```bash
npm run setup:verify
```

✅ All green? You're ready to start the agents!