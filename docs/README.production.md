# Finkargo Analytics MVP - Production Deployment Guide

## 🌳 Documentation Map & Ecosystem Philosophy

This project's documentation is organized like a healthy forest ecosystem:
- **Canopy Layer**: High-level orientation and philosophy
- **Understory**: Operational guides and health monitoring
- **Forest Floor**: Deep knowledge, milestones, and field guides
- **Seeds & Saplings**: Config, data, and automation scripts

**All documentation is now in the `/docs/` directory.**

| Layer         | File(s)                                 | Purpose/Analogy                        |
|---------------|----------------------------------------|----------------------------------------|
| Canopy        | README.production.md, CLAUDE.md         | Orientation, philosophy, big picture   |
| Understory    | DEPLOYMENT_CHECKLIST.md, LOCAL_TESTING_GUIDE.md, COMPREHENSIVE_TESTING_CHECKLIST.md, COMPREHENSIVE_TEST_REPORT.md, UX_UI_REVIEW_ANALYSIS.md, UX_Implementation_Guide.md | Operational guides, health monitoring  |
| Forest Floor  | PHASE_4_5_CHECKLIST.md, PHASE-4-OPTIMIZATION-STRATEGY.md, DEPLOYMENT_STATUS.md, TEST_PROMPTS.md, User_Personas.md | Deep knowledge, milestones, field guide|
| Seeds/Saplings| .env.example, .env.production.example, .env.local, generate-test-data.js, test-comprehensive-features.js, setup-test.sh, test-data/ | Config, data, automation               |

---

## 🚀 Quick Start

This guide will walk you through deploying the Finkargo Analytics MVP to production using Supabase (database) and Vercel (hosting).

### Prerequisites

- Node.js 18+ installed
- Git repository access
- Credit card for service signups (most have free tiers)

### Estimated Time

- Initial setup: 2-3 hours
- Deployment: 30 minutes
- Testing: 1 hour

## 📋 Step-by-Step Deployment

### 1. Database Setup (Supabase)

1. **Create Supabase Project**
   ```bash
   # Visit https://app.supabase.com
   # Click "New Project"
   # Fill in:
   # - Project name: finkargo-analytics-mvp
   # - Database password: (save this securely)
   # - Region: Choose closest to your users
   ```

2. **Get Credentials**
   - Go to Settings > API
   - Copy: `Project URL`, `anon public`, `service_role secret`

3. **Deploy Database**
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref [your-project-ref]
   supabase db push
   ```

### 2. External Services Setup

#### Twilio (WhatsApp Notifications)
1. Sign up at https://www.twilio.com
2. Get credentials from Console Dashboard
3. Set up WhatsApp Sandbox (Messaging > Try it out)

#### Currency API
1. Sign up at https://app.exchangerate-api.com
2. Get free API key (1,500 requests/month)

### 3. Vercel Deployment

1. **Prepare Environment**
   ```bash
   # Create production env file
   cp .env.production.example .env.production
   # Edit with your credentials
   ```

2. **Deploy**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Add Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Add all variables from `.env.production`

### 4. Verify Deployment

Visit your deployment URL and test:
- Login with demo credentials
- Upload a sample CSV
- Check agent execution
- Verify dashboard metrics

## 🔐 Demo Credentials

After running seed data:
- **Admin**: admin@demo.com / demo123
- **Manager**: manager@demo.com / demo123
- **Analyst**: analyst@demo.com / demo123

## 📊 Key Features

- **Multi-tenant**: Complete data isolation between companies
- **Real-time**: Live dashboard updates via WebSockets
- **Automated**: 6 background agents for processing
- **Secure**: Row Level Security on all data
- **Scalable**: Handles 10,000+ inventory items

## 🛠️ Configuration Options

### Agent Configuration
Agents run every 5 minutes by default. Adjust in `/vercel.json`:
```json
"schedule": "*/5 * * * *"  // Change to desired interval
```

### Performance Tuning
- Increase Function timeout for large datasets
- Enable Edge Functions for better performance
- Add Redis for caching (optional)

## 🚨 Troubleshooting

### Common Issues

**Build fails on Vercel**
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

**Database connection errors**
- Check Supabase project is active (not paused)
- Verify environment variables
- Test connection string

**Agents not running**
- Check Vercel Functions logs
- Verify cron job configuration
- Ensure AGENT_SCHEDULER_SECRET matches

## 📈 Monitoring

### Built-in Monitoring
- Vercel Dashboard: Deployment status, logs, analytics
- Supabase Dashboard: Database metrics, API logs
- Application: Agent status page at `/dashboard/agents`

### Recommended Add-ons
- **Sentry**: Error tracking (free tier available)
- **UptimeRobot**: Availability monitoring (free)
- **Segment**: Analytics tracking (optional)

## 🔄 Updates & Maintenance

### Deploying Updates
```bash
git pull origin main
vercel --prod
```

### Database Migrations
```bash
# Create new migration
supabase migration new your_migration_name

# Deploy
supabase db push
```

### Backup Strategy
- Supabase: Daily automatic backups (Pro plan)
- Export critical data via dashboard
- Set up additional backup automation if needed

## 📞 Support Resources

- **Technical Issues**: Check `/docs/DEPLOYMENT_CHECKLIST.md`
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs

## 🎯 Production Readiness

✅ **Security**
- HTTPS enforced
- Environment variables protected
- RLS policies active
- Input validation on all forms

✅ **Performance**
- Optimized bundle size
- Image optimization
- Caching strategies
- Database indexes

✅ **Reliability**
- Error boundaries
- Graceful error handling
- Automatic retries
- Health checks

✅ **Scalability**
- Serverless architecture
- Auto-scaling functions
- CDN for static assets
- Database connection pooling

---

**Need help?** Review the comprehensive documentation in `/docs/CLAUDE.md` or check the troubleshooting guide in `/docs/DEPLOYMENT_CHECKLIST.md`.