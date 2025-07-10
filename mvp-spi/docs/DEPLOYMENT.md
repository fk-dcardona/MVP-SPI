# Production Deployment Guide

This guide covers deploying the Finkargo Analytics MVP to production using Vercel and Supabase.

## Prerequisites

- Vercel account (https://vercel.com)
- Supabase account (https://supabase.com)
- GitHub repository connected to Vercel
- Twilio account for WhatsApp integration (optional)
- Sentry account for error tracking (optional)

## Step 1: Supabase Setup

### 1.1 Create Production Project

1. Log in to Supabase Dashboard
2. Create new project with a strong database password
3. Wait for project to be provisioned (~2 minutes)

### 1.2 Deploy Database Schema

1. Navigate to SQL Editor in Supabase Dashboard
2. Run the production migration:
   ```sql
   -- Copy contents of /supabase/migrations/20240109_production_setup.sql
   ```
3. Verify all tables are created successfully

### 1.3 Configure Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates for:
   - Confirmation email
   - Password reset
   - Magic link

### 1.4 Set Up Storage Buckets

1. Go to Storage
2. Create bucket named `uploads` with public access disabled
3. Create bucket named `reports` with public access disabled

### 1.5 Get Connection Details

1. Go to Settings > API
2. Copy:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service role key (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Vercel Setup

### 2.1 Import Project

1. Log in to Vercel Dashboard
2. Click "New Project"
3. Import Git repository
4. Select the `mvp-spi` folder as root directory

### 2.2 Configure Environment Variables

Add the following environment variables in Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Finkargo Analytics
NEXT_PUBLIC_APP_VERSION=1.0.0

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_VERIFY_SERVICE_SID=your-verify-sid

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Security
NEXTAUTH_SECRET=generate-random-secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

### 2.3 Configure Domain (Optional)

1. Go to Settings > Domains
2. Add custom domain
3. Configure DNS according to Vercel instructions

### 2.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (~3-5 minutes)
3. Verify deployment at provided URL

## Step 3: Post-Deployment

### 3.1 Verify Health Check

```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": { "status": "up" },
    "storage": { "status": "up" },
    "auth": { "status": "up" }
  }
}
```

### 3.2 Create Initial Admin User

1. Navigate to your app
2. Sign up with admin email
3. Use Supabase Dashboard to update user role:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'admin@company.com';
   ```

### 3.3 Test Core Functionality

1. **Authentication**: Sign in/out
2. **CSV Upload**: Upload sample inventory file
3. **Dashboard**: Verify metrics display
4. **Agents**: Create and run test agent

### 3.4 Configure Monitoring

1. **Vercel Analytics**: Automatically enabled
2. **Sentry**: Verify errors are being captured
3. **Uptime Monitoring**: Set up external monitor for /api/health

## Step 4: Production Checklist

### Security
- [ ] All environment variables set correctly
- [ ] Database RLS policies active
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### Performance
- [ ] Database indexes created
- [ ] Image optimization enabled
- [ ] Caching headers configured
- [ ] CDN enabled for static assets

### Monitoring
- [ ] Error tracking active
- [ ] Performance monitoring enabled
- [ ] Health checks configured
- [ ] Alerts set up for critical errors

### Backup
- [ ] Database backups enabled in Supabase
- [ ] Backup retention policy configured
- [ ] Recovery process documented

## Troubleshooting

### Database Connection Issues
- Verify Supabase project is active
- Check environment variables are correct
- Ensure RLS policies aren't blocking access

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review build logs for specific errors

### Performance Issues
- Enable Vercel Analytics
- Check database query performance
- Review agent execution logs
- Consider upgrading Vercel plan for more resources

## Maintenance

### Regular Tasks
- Monitor error rates in Sentry
- Review database performance
- Update dependencies monthly
- Check security advisories

### Scaling Considerations
- Database connection pooling
- Implement caching layer
- Consider edge functions for global performance
- Upgrade Supabase plan for more connections

## Support

For issues:
1. Check Vercel deployment logs
2. Review Supabase logs
3. Check Sentry for errors
4. Contact support with deployment ID and error details