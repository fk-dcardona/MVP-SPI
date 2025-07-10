# 🚀 Production Deployment Checklist

## Phase 1: Database Setup ✅

### Supabase Project Setup
- [ ] Create new Supabase project at https://app.supabase.com
- [ ] Note down the project URL and keys
- [ ] Enable email authentication in Authentication settings
- [ ] Configure email templates if needed

### Database Deployment
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy migrations
supabase db push

# Run seed data (optional for demo)
supabase db seed
```

### Verify Database
- [ ] Check all tables are created in Supabase dashboard
- [ ] Verify RLS policies are enabled
- [ ] Test auth flow with a test user
- [ ] Verify materialized view (mv_category_summary) is created

## Phase 2: Environment Configuration

### Required Services Setup

#### 1. Twilio (WhatsApp)
- [ ] Create Twilio account at https://www.twilio.com
- [ ] Get Account SID and Auth Token
- [ ] Set up WhatsApp Sandbox:
  - Go to Messaging > Try it out > Send a WhatsApp message
  - Follow sandbox setup instructions
  - Note the WhatsApp number (usually whatsapp:+14155238886)
- [ ] Test sending a message

#### 2. Currency API
- [ ] Sign up at https://app.exchangerate-api.com/sign-up (free tier available)
- [ ] Get API key
- [ ] Test API endpoint

#### 3. Create Production Environment File
```bash
# Copy example file
cp .env.production.example .env.production

# Edit with your actual values
# IMPORTANT: Never commit .env.production
```

### Environment Variables Checklist
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_WHATSAPP_NUMBER
- [ ] CURRENCY_API_KEY
- [ ] AGENT_SCHEDULER_SECRET (generate random string)
- [ ] NEXT_PUBLIC_APP_URL

## Phase 3: Vercel Deployment

### Pre-deployment Steps
- [ ] Create Vercel account at https://vercel.com
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Run production build locally: `npm run build`
- [ ] Fix any build errors

### Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Follow prompts to:
# - Link to existing project or create new
# - Configure project settings
# - Deploy
```

### Configure Vercel Project
1. Go to Vercel Dashboard > Your Project > Settings

2. **Environment Variables**:
   - [ ] Add all variables from .env.production
   - [ ] Set for Production environment

3. **Domains**:
   - [ ] Add custom domain (optional)
   - [ ] Configure DNS records

4. **Functions**:
   - [ ] Verify cron job is configured (check Functions tab)
   - [ ] Test cron endpoint manually

## Phase 4: Post-Deployment Testing

### Critical Path Testing
- [ ] **Authentication Flow**:
  - Sign up new user
  - Login/logout
  - Password reset
  
- [ ] **Multi-tenant Isolation**:
  - Create test company
  - Verify data isolation
  
- [ ] **CSV Upload**:
  - Upload sample inventory CSV
  - Verify processing
  - Check data in tables
  
- [ ] **Agent System**:
  - Verify all 6 agents appear
  - Test manual execution
  - Check cron job runs
  
- [ ] **Dashboard**:
  - Verify metrics display
  - Test real-time updates
  - Check Supply Chain Triangle
  
- [ ] **Alerts**:
  - Create alert rule
  - Trigger condition
  - Verify notification

### Performance Testing
- [ ] Dashboard loads < 3 seconds
- [ ] CSV processing < 30 seconds for 1000 rows
- [ ] Agent execution completes < 60 seconds

### Security Verification
- [ ] RLS policies working (test cross-tenant access)
- [ ] API endpoints require authentication
- [ ] Environment variables not exposed
- [ ] HTTPS enabled on all routes

## Phase 5: Monitoring Setup

### Basic Monitoring
- [ ] Enable Vercel Analytics
- [ ] Set up Vercel Speed Insights
- [ ] Configure error alerts

### Advanced Monitoring (Optional)
- [ ] Set up Sentry for error tracking
- [ ] Configure Supabase database alerts
- [ ] Set up uptime monitoring

## Phase 6: Documentation

### Update Documentation
- [ ] Update README with production URL
- [ ] Document any production-specific configurations
- [ ] Create user guide for client
- [ ] Document API endpoints

### Knowledge Transfer
- [ ] Admin user guide
- [ ] Agent configuration guide
- [ ] Troubleshooting guide
- [ ] Contact information for support

## 🎯 Go-Live Checklist

### Final Verification
- [ ] All tests passing
- [ ] No console errors in production
- [ ] Performance metrics met
- [ ] Security scan completed
- [ ] Backup strategy in place

### Launch
- [ ] Notify stakeholders
- [ ] Monitor first 24 hours closely
- [ ] Prepare hotfix process
- [ ] Celebrate! 🎉

## 📞 Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Twilio Support**: https://support.twilio.com

## 🔧 Common Issues & Solutions

### Build Failures
- Clear `.next` cache: `rm -rf .next`
- Check Node version: Should be 18.x or higher
- Verify all dependencies installed

### Database Connection Issues
- Check Supabase project is not paused
- Verify environment variables are correct
- Check RLS policies aren't blocking access

### Cron Job Not Running
- Verify AGENT_SCHEDULER_SECRET matches
- Check Vercel Functions logs
- Ensure cron configuration in vercel.json

### WhatsApp Not Sending
- Verify Twilio credentials
- Check WhatsApp sandbox is active
- Ensure phone numbers are in correct format