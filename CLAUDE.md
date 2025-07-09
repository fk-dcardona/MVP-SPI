# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Finkargo Analytics MVP - A Supply Chain Intelligence Platform that transforms CSV data into strategic insights using the Supply Chain Triangle framework (Service-Cost-Capital optimization). The project is actively being developed with a focus on inventory analytics, real-time alerts, and multi-tenant support.

**Current State**: Foundation complete, data pipeline pending. Core architecture implemented including authentication, agent system skeleton, and dashboard structure. Critical business logic and data processing features await implementation.

## Implementation Status

### ✅ Completed
- Authentication system with Supabase
- Agent system architecture (factory, manager, 6 agent types)
- Database schemas with RLS policies
- Dashboard structure and routing
- UI component library (shadcn/ui)
- WhatsApp service class with Twilio

### 🚧 In Progress
- CSV upload interface
- Data processing pipeline
- Supply Chain Triangle calculations

### ❌ Not Started
- Actual agent implementation logic (all have TODOs)
- Real-time WebSocket subscriptions
- Supply Chain Triangle visualization
- Production deployment

## Development Commands

```bash
# Navigate to the correct working directory
cd /Users/helpdesk/Cursor/MVP\ -\ Supply\ Chain\ Intelligence/mvp-spi

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

# Linting (interactive ESLint setup may appear on first run)
npm run lint
```

## High-Level Architecture

### Core Systems

1. **Agent System** (`/src/lib/agents/`)
   - Factory pattern for creating different agent types
   - Manager singleton for coordinating agent lifecycle
   - Six agent implementations: inventory monitor, alert generator, data processor, report generator, optimization engine, notification dispatcher
   - Real-time background processing with configurable intervals

2. **Authentication System** (`/src/app/(auth)/`, `/src/lib/auth/`)
   - Supabase-based authentication with email/password
   - Role-based access control (admin, manager, analyst)
   - Protected routes using Next.js middleware patterns
   - WhatsApp OTP verification (planned)

3. **Dashboard System** (`/src/app/dashboard/`)
   - Real-time metrics visualization
   - Agent management interface
   - Supply Chain Triangle framework visualization
   - CSV data upload and processing

### Technology Stack

- **Framework**: Next.js 14.0.0 with App Router
- **UI Components**: Custom shadcn/ui implementation with Radix UI primitives
- **Styling**: Tailwind CSS v3 with custom theme
- **State Management**: Zustand for global state
- **Forms**: React Hook Form with Zod validation
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Charts**: Recharts for data visualization
- **File Processing**: Papa Parse for CSV handling
- **Type Safety**: TypeScript with strict mode disabled

### Database Schema

Located in `/supabase/migrations/`:
- `001_create_companies_table.sql` - Multi-tenant company structure
- `002_create_profiles_table.sql` - User profiles with role management
- `003_enable_rls_policies.sql` - Row Level Security policies
- `004_create_agents_table.sql` - Agent configuration and state

### API Routes Pattern

All API routes follow RESTful conventions:
- `/api/agents` - CRUD operations for agents
- `/api/agents/[id]/execute` - Trigger agent execution
- `/api/agents/initialize` - System initialization
- `/api/cron/agents` - Scheduled agent tasks

### Component Architecture

- **Server Components**: Default for all routes unless client interaction needed
- **Client Components**: Marked with 'use client' for forms, modals, interactive elements
- **UI Components**: Centralized in `/src/components/ui/` following shadcn patterns
- **Feature Components**: Organized by domain (agents, auth, dashboard)

## Environment Configuration

Required environment variables (see `.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Known Issues & Workarounds

1. **TypeScript Path Aliases**: The project uses `@/*` aliases mapping to `./src/*`. Ensure tsconfig.json includes the paths configuration.

2. **Font Loading**: The project previously used Geist fonts which are not available in next/font/google. Now using Inter font as fallback.

3. **Port Conflicts**: If port 3000 is in use, Next.js will automatically try port 3001.

4. **Build Errors**: Some TypeScript errors exist due to the duplicate file structure. Always ensure you're working in the mvp-spi subdirectory.

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

1. Always work within the `mvp-spi` subdirectory
2. Check TypeScript errors with `npm run type-check` before committing
3. Ensure all new components follow the existing patterns
4. Use Server Components by default, Client Components only when necessary
5. Test agent implementations in isolation before integration
6. Maintain type safety for all Supabase queries

## Agent System Details

The agent system is a core architectural component that handles background processing:

- **AgentFactory**: Creates and validates agent configurations
- **AgentManager**: Singleton that manages agent lifecycle and execution
- **Agent Types**: Each serves a specific purpose in the supply chain analytics pipeline
- **Execution Model**: Agents run at configured intervals and can be triggered manually
- **Error Handling**: Failed executions are logged and agents enter error state

## Development Roadmap

### 🎯 Phase 1: Core Data Pipeline (Current Priority)
**Foundation - Without data, nothing works**

1. **CSV Upload Interface** (`/app/dashboard/upload/page.tsx`)
   - Drag-and-drop with Papa Parse
   - Progress indicators and validation
   - Support inventory/sales formats

2. **Data Processing Implementation**
   - Implement logic in data-processor agent
   - Currency conversion, date handling
   - Store in Supabase tables

3. **Database Schema Extension**
   - Create inventory_items table
   - Create sales_transactions table
   - Add performance indexes

### 🔺 Phase 2: Supply Chain Triangle Engine
**Core Value Proposition**

1. **Triangle Calculation Service** (`/lib/services/supply-chain-triangle.ts`)
   - Service Score: Stockout risk & fill rates
   - Cost Score: Margin analysis & optimization
   - Capital Score: Inventory turnover & working capital

2. **Triangle Visualization**
   - Interactive radar chart component
   - Real-time score updates
   - Historical trends

3. **Connect Agents to Data**
   - Replace TODO placeholders
   - Implement business logic
   - Connect to Supabase

### ⚡ Phase 3: Real-time & Automation
**Dynamic and Proactive**

1. **WebSocket Implementation**
   - Supabase real-time subscriptions
   - Live dashboard updates

2. **Complete WhatsApp Integration**
   - Connect notification-dispatcher
   - Implement OTP auth
   - Test alert pipeline

3. **Analytics Views**
   - Replace "Coming Soon" placeholders
   - Inventory analytics
   - Supplier scorecards

### 🚀 Phase 4: Production Ready
1. Performance optimization
2. Comprehensive testing
3. Vercel deployment

## Critical Missing Pieces

⚠️ **Most Critical**:
- **No data flow** - Entire pipeline missing
- **No Triangle framework** - Core concept not implemented  
- **Hollow agents** - All have TODO placeholders
- **Static dashboard** - No real-time updates

## Immediate Action Items

```bash
# 1. Start development server
cd /Users/helpdesk/Cursor/MVP\ -\ Supply\ Chain\ Intelligence/mvp-spi
npm run dev

# 2. Create upload page
# Create: /app/dashboard/upload/page.tsx

# 3. Implement data processor
# Update: /lib/agents/types/data-processor.ts

# 4. Create Triangle service
# Create: /lib/services/supply-chain-triangle.ts
```