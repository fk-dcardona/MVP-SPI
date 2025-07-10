# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Finkargo Analytics MVP - A Supply Chain Intelligence Platform that transforms CSV data into strategic insights using the Supply Chain Triangle framework (Service-Cost-Capital optimization). The project provides real-time inventory analytics, automated alerts, and multi-tenant support for supply chain optimization.

**Current State**: Production-ready with all features implemented. All service accounts created with credentials stored in `.env.local`. Database migrations prepared and ready for deployment. Production deployment branch `feat/production-deployment` contains all necessary configurations.

## Implementation Status

### ✅ Completed
- Authentication system with Supabase + WhatsApp OTP integration
- Complete agent system (factory, manager, 6 agent implementations with business logic)
- Database schemas with RLS policies (companies, profiles, agents, inventory, sales, uploads)
- Full dashboard with real-time metrics and agent management
- UI component library (shadcn/ui) with Radix UI primitives
- WhatsApp service with Twilio integration
- CSV upload with drag-and-drop and Papa Parse processing
- Data processing pipeline with validation and transformation
- Supply Chain Triangle engine (Service-Cost-Capital calculations)
- Toast notifications and error boundaries
- Real-time hooks and WebSocket infrastructure
- Business logic implementations with TypeScript compliance
- Comprehensive test suite with Jest setup
- Performance optimizations (webpack bundle splitting, caching)

### 🔄 Ready to Deploy
- Database deployment to Supabase (credentials available)
- Vercel production deployment (account ready)
- Real-time subscriptions activation

### ❌ Not Started
- Domain configuration
- CI/CD pipeline setup
- Production monitoring and analytics

## Development Commands

```bash
# The project is now in the root directory (not mvp-spi subdirectory)
cd /Users/helpdesk/Cursor/MVP\ -\ Supply\ Chain\ Intelligence

# Install dependencies
npm install

# Development server (runs on port 3000)
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Run tests
npm run test
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

## High-Level Architecture

### Core Systems

1. **Agent System** (`/src/lib/agents/`)
   - Factory pattern for creating different agent types
   - Manager singleton for coordinating agent lifecycle
   - Six agent implementations with complete business logic:
     - `inventory_monitor`: Real-time stock tracking, reorder points, ABC analysis
     - `alert_generator`: Rule-based alerts, severity levels, multi-channel dispatch
     - `data_processor`: CSV parsing, validation, transformation, metrics calculation
     - `report_generator`: PDF/Excel reports, scheduled generation, custom templates
     - `optimization_engine`: Supply chain scoring, inventory optimization, recommendations
     - `notification_dispatcher`: WhatsApp/Email/SMS notifications with templates
   - Background processing with 5-minute default intervals
   - Cron job support via `/api/cron/agents`

2. **Authentication System** (`/src/app/(auth)/`, `/src/lib/auth/`)
   - Supabase authentication with email/password
   - WhatsApp OTP verification via Twilio
   - Role-based access control (admin, manager, analyst)
   - Protected routes using Next.js middleware
   - Company-based data isolation

3. **Dashboard System** (`/src/app/dashboard/`)
   - Real-time metrics with WebSocket subscriptions
   - Agent management with status monitoring
   - Supply Chain Triangle visualization (radar charts)
   - CSV upload with drag-and-drop interface
   - Analytics views: inventory, sales, suppliers, financial

### Technology Stack

- **Framework**: Next.js 14.0.0 with App Router
- **Language**: TypeScript (strict mode disabled, path aliases enabled)
- **UI Library**: React 18 with Server/Client component separation
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v3 with custom design tokens
- **State Management**: Zustand for global state
- **Forms**: React Hook Form + Zod validation
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Charts**: Recharts for data visualization
- **File Processing**: Papa Parse for CSV handling
- **Real-time**: Supabase WebSocket subscriptions
- **External APIs**: Twilio (WhatsApp), Currency API
- **Testing**: Jest with React Testing Library
- **Build**: Webpack with optimized bundle splitting

### Database Schema

Core tables (migrations in `/supabase/migrations/`):
- **companies**: Multi-tenant company structure with settings
- **profiles**: User profiles with role-based permissions
- **agents**: Agent configurations, status, and execution history
- **inventory_items**: Real-time inventory data with metrics
- **sales_transactions**: Sales data with customer and product details
- **data_uploads**: File upload tracking and processing status
- **triangle_scores**: Supply chain performance metrics history
- **alert_rules**: Configurable alert conditions and thresholds
- **alert_history**: Alert execution and notification logs

All tables implement Row Level Security (RLS) for data isolation.

### API Routes Pattern

RESTful API structure (`/src/app/api/`):
- `/api/agents` - CRUD operations for agents
- `/api/agents/[id]` - Individual agent operations
- `/api/agents/[id]/execute` - Trigger manual agent execution
- `/api/agents/initialize` - Initialize agent system on startup
- `/api/cron/agents` - Scheduled agent execution (5-min intervals)
- `/api/data/upload` - CSV file upload endpoint
- `/api/analytics/*` - Analytics data endpoints
- `/api/alerts/*` - Alert rules and history

### Component Architecture

- **Server Components**: Default for all routes unless client interaction needed
- **Client Components**: Marked with 'use client' for forms, modals, interactive elements
- **UI Components**: Centralized in `/src/components/ui/` following shadcn patterns
- **Feature Components**: Organized by domain (agents, auth, dashboard)

## Environment Configuration

**✅ All credentials configured in `.env.local`**

Required environment variables:
```bash
# Supabase (Configured)
NEXT_PUBLIC_SUPABASE_URL=https://iagkaochjxqhjlcqfzfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
SUPABASE_SERVICE_ROLE_KEY=[configured]

# Twilio (WhatsApp) (Configured)
TWILIO_ACCOUNT_SID=[configured]
TWILIO_AUTH_TOKEN=[configured]
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# External APIs (Configured)
CURRENCY_API_KEY=[configured]
AGENT_SCHEDULER_SECRET=[configured]

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: When deploying, copy `.env.local` to `.env.production` and update `SUPABASE_SERVICE_KEY` to `SUPABASE_SERVICE_ROLE_KEY`.

## Known Issues & Workarounds

1. **TypeScript Path Aliases**: Uses `@/*` aliases mapping to `./src/*`. The tsconfig.json is properly configured.

2. **Font Loading**: Uses Inter font from next/font/google (previously used unavailable Geist fonts).

3. **Port Conflicts**: Default port 3000. If occupied, Next.js will use 3001.

4. **Select Components**: Native HTML select elements used instead of Radix Select for reliability.

5. **Build Cache**: Clear `.next/` directory if experiencing build issues after branch merges.

## Performance Targets

- CSV processing: < 30 seconds for 10,000 records
- Dashboard load: < 3 seconds
- Real-time updates: < 1 second latency
- Agent execution: Configurable intervals (default 5 minutes)

## Security Considerations

- All database tables use Row Level Security (RLS)
- API routes require authentication
- Company-based data isolation
- Input validation on all user-submitted data

## Development Workflow

1. Work in the root directory (the project was moved from mvp-spi subdirectory)
2. Check TypeScript errors with `npm run type-check` before committing
3. Ensure all new components follow the existing patterns
4. Use Server Components by default, Client Components only when necessary
5. Test agent implementations in isolation before integration
6. Maintain type safety for all Supabase queries

## Agent System Details

The agent system is the core architectural component for background processing:

### Architecture
- **AgentFactory** (`/lib/agents/factory.ts`): Creates and validates agent configurations
- **AgentManager** (`/lib/agents/manager.ts`): Singleton managing agent lifecycle
- **Agent Interface**: Standardized interface with context support

### Agent Implementations
1. **InventoryMonitor**: Tracks stock levels, calculates reorder points, performs ABC analysis
2. **AlertGenerator**: Processes alert rules, evaluates conditions, triggers notifications
3. **DataProcessor**: Validates CSV data, transforms formats, calculates metrics
4. **ReportGenerator**: Creates PDF/Excel reports, supports templates, scheduled generation
5. **OptimizationEngine**: Calculates supply chain scores, generates recommendations
6. **NotificationDispatcher**: Sends WhatsApp/Email/SMS notifications with retry logic

### Execution
- Default interval: 5 minutes (configurable per agent)
- Manual execution via API: `POST /api/agents/[id]/execute`
- Cron job support: `GET /api/cron/agents`
- Context passing for data sharing between agents
- Error recovery with exponential backoff

## Supply Chain Triangle Framework

The core value proposition implementing Service-Cost-Capital optimization:

### Components
1. **Service Score** (0-100)
   - Fill rate performance
   - Stockout frequency
   - Order fulfillment speed
   - Customer satisfaction metrics

2. **Cost Score** (0-100)
   - Inventory holding costs
   - Margin analysis
   - Cost optimization opportunities
   - Supplier pricing trends

3. **Capital Score** (0-100)
   - Inventory turnover ratio
   - Working capital efficiency
   - Cash conversion cycle
   - Capital allocation optimization

### Implementation
- **Calculator** (`/lib/services/supply-chain-triangle.ts`): Core scoring algorithms
- **Visualizations**: Radar charts, trend analysis, benchmarking
- **Real-time Updates**: Scores recalculated on data changes
- **Recommendations**: AI-powered optimization suggestions

## Key Development Patterns

### Data Flow
1. **CSV Upload** → Papa Parse validation → Data transformation
2. **Processing** → Agent execution → Metrics calculation
3. **Storage** → Supabase with RLS → Real-time subscriptions
4. **Analytics** → Supply Chain Triangle → Dashboard updates

### Error Handling
- Structured error types with error codes
- User-friendly error messages via toast notifications
- Detailed logging for debugging
- Error boundaries preventing app crashes

### Testing Approach
- Unit tests for business logic (`__tests__/`)
- Mock Supabase client for isolation
- Test data generators for consistency
- Performance benchmarks for optimization

## Development History Summary

### Major Integration Completed
The project successfully integrated 7 feature branches into main, delivering:
- Complete agent system with business logic implementations
- Full authentication with WhatsApp OTP
- Supply Chain Triangle optimization engine  
- Comprehensive UI component library
- Real-time data processing pipeline
- Test suite with Jest configuration

### Key Technical Decisions
1. **Native HTML selects** over complex Radix components for reliability
2. **Agent context support** for data sharing between agents
3. **Webpack bundle splitting** for optimal performance
4. **Row Level Security** on all database tables
5. **5-minute intervals** for agent execution cycles

### Repository Status
- **Current Branch**: main (single source of truth)
- **Build Status**: Production-ready
- **TypeScript**: Fully compliant with minor warnings
- **Test Coverage**: Core business logic covered

## Production Deployment

### 🚀 Quick Deployment (All Credentials Ready)

Since all service accounts are created and credentials are in `.env.local`, deployment is streamlined:

1. **Database Deployment** (15 minutes)
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link to project
supabase login
supabase link --project-ref iagkaochjxqhjlcqfzfo

# Deploy migrations
supabase db push

# Optional: Run seed data
supabase db seed
```

2. **Vercel Deployment** (20 minutes)
```bash
# Prepare production env
cp .env.local .env.production
# Fix: Change SUPABASE_SERVICE_KEY to SUPABASE_SERVICE_ROLE_KEY

# Deploy
npm install -g vercel
vercel --prod

# Add env variables in Vercel Dashboard
# Then redeploy to apply them
vercel --prod --force
```

3. **Post-Deployment**
- Enable Supabase realtime on tables
- Update NEXT_PUBLIC_APP_URL with production URL
- Test all features with demo users:
  - Admin: admin@demo.com / demo123
  - Manager: manager@demo.com / demo123
  - Analyst: analyst@demo.com / demo123

### 📁 Deployment Files Created

The `feat/production-deployment` branch contains:
- `vercel.json` - Deployment configuration with cron jobs
- `supabase/config.toml` - Supabase project configuration
- `supabase/seed.sql` - Demo data with users
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step guide
- `README.production.md` - Production overview
- All database migrations (001-011)

### 🚀 Quick Start

```bash
# Development
cd /Users/helpdesk/Cursor/MVP\ -\ Supply\ Chain\ Intelligence
npm install
npm run dev

# Testing
npm run type-check
npm run test
npm run lint

# Build
npm run build
npm start
```

### 📋 Pre-deployment Checklist

- [x] All environment variables configured (in `.env.local`)
- [x] Supabase project created (iagkaochjxqhjlcqfzfo)
- [x] Twilio account with WhatsApp sandbox
- [x] Currency API key obtained
- [x] Agent scheduler secret generated
- [x] All database migrations prepared
- [ ] Database migrations deployed
- [ ] Supabase RLS policies tested in production
- [ ] Production URL configured

### 🛠️ Common Tasks

**Add a new agent type:**
1. Create implementation in `/src/lib/agents/implementations/`
2. Add to agent types in `/src/lib/agents/types.ts`
3. Update factory in `/src/lib/agents/factory.ts`
4. Add UI components if needed

**Modify Supply Chain Triangle scoring:**
1. Update `/src/lib/services/supply-chain-triangle.ts`
2. Adjust weights and thresholds
3. Update visualization components
4. Test with sample data

**Add new CSV format support:**
1. Extend `/src/lib/utils/csv-validator.ts`
2. Add transformation logic in data processor
3. Update upload UI for new format
4. Add validation tests