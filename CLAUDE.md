# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository is intended to contain the Finkargo Analytics MVP - a Supply Chain Intelligence Platform. Currently, it contains a comprehensive specification document ("Cursor One Shot Prompt") that outlines the full implementation plan.

## Project Status

**Current State**: Specification only - no implementation exists yet.

The specification describes a production-ready inventory analytics platform that transforms CSV data into strategic insights using the Supply Chain Triangle framework (Service-Cost-Capital optimization).

## Technology Stack (To Be Implemented)

### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Styling**: Tailwind CSS with custom Supply Chain Triangle theme

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password + WhatsApp OTP)
- **Real-time**: Supabase subscriptions
- **File Processing**: Papa Parse for CSV handling
- **API**: Supabase Edge Functions

### External Services
- **Currency API**: ExchangeRate-API (free tier)
- **WhatsApp**: Twilio WhatsApp API
- **Deployment**: Vercel

## Common Development Commands (Once Implemented)

### Initial Setup
```bash
# Create Next.js project
npx create-next-app@latest finkargo-analytics --typescript --tailwind --app

# Install dependencies
npm install @supabase/supabase-js zustand react-hook-form zod recharts papaparse
npm install @radix-ui/react-* # for shadcn/ui components

# Install dev dependencies
npm install -D @types/papaparse
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Supabase Commands
```bash
# Initialize Supabase
npx supabase init

# Link to project
npx supabase link --project-ref <project-ref>

# Push database schema
npx supabase db push

# Deploy Edge Functions
npx supabase functions deploy

# Run locally
npx supabase start
```

### Deployment
```bash
# Deploy to Vercel
vercel --prod

# Preview deployment
vercel
```

## High-Level Architecture

### Core Business Logic

1. **Supply Chain Triangle Framework**
   - Service Score: Delivery performance metrics
   - Cost Score: Financial efficiency indicators
   - Capital Score: Working capital optimization

2. **Key Calculations**
   - Inventory Turnover Rate
   - Days of Inventory Outstanding
   - Stockout Risk Assessment
   - Reorder Point Calculations
   - Margin Analysis

3. **Data Processing Pipeline**
   - CSV Upload → Validation → Database Storage
   - Real-time calculations triggered by data changes
   - WhatsApp notifications for critical alerts

### Project Structure (Recommended)
```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Main dashboard
│   ├── api/              # API routes
│   └── components/       # Shared components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client and types
│   ├── calculations/     # Business logic calculations
│   └── validations/      # Zod schemas
├── hooks/                # Custom React hooks
├── store/               # Zustand stores
└── types/               # TypeScript type definitions
```

### Database Schema

The specification includes detailed schemas for:
- `companies` - Multi-tenant company data
- `profiles` - User profiles with roles
- `inventory` - Product inventory tracking
- `sales` - Transaction records
- `suppliers` - Supplier information
- `data_uploads` - CSV upload tracking

### Key Features to Implement

1. **Authentication Flow**
   - Email + OTP login
   - WhatsApp verification
   - Company association

2. **Dashboard Components**
   - Executive Overview with Triangle Visualization
   - Critical Alerts Panel
   - Metrics Grid (12 key KPIs)
   - Real-time Updates

3. **Data Management**
   - CSV Upload with validation
   - Inventory mapping and processing
   - Sales data integration

4. **Analytics Engine**
   - Real-time metric calculations
   - Alert generation
   - Trend analysis

## Implementation Guidelines

1. **Performance Requirements**
   - CSV processing: < 30 seconds for 10,000 records
   - Dashboard load: < 3 seconds
   - Real-time updates: < 1 second latency

2. **Security Considerations**
   - Row Level Security (RLS) on all tables
   - API rate limiting
   - Input validation on all user data

3. **Mobile Responsiveness**
   - All features must work on mobile devices
   - Touch-optimized interactions
   - Responsive charts and tables

4. **Error Handling**
   - User-friendly error messages
   - Retry logic for external API calls
   - Graceful fallbacks for missing data

## Next Steps

To begin implementation:
1. Initialize the Next.js project with the specified stack
2. Set up Supabase project and create database schema
3. Implement authentication flow
4. Build core dashboard components
5. Add CSV processing functionality
6. Integrate external services (WhatsApp, Currency API)
7. Deploy to Vercel

Refer to the "Cursor One Shot Prompt" document for detailed specifications and implementation requirements.