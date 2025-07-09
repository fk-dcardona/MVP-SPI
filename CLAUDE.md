# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Finkargo Analytics MVP - A Supply Chain Intelligence Platform that transforms CSV data into strategic insights using the Supply Chain Triangle framework (Service-Cost-Capital optimization). The project is actively being developed with a focus on inventory analytics, real-time alerts, and multi-tenant support.

**Current State**: Active development with core architecture implemented. The project includes authentication, agent system, and dashboard components.

## Project Structure Issues & Resolution

**IMPORTANT**: This codebase has a structural conflict where there are duplicate files in both the root `/MVP - Supply Chain Intelligence/` directory and the `/MVP - Supply Chain Intelligence/mvp-spi/` subdirectory. Always work within the `mvp-spi` subdirectory as it contains the canonical implementation.

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

## Merge History & Protocol

### Branch Merges Completed

#### feat/background-agents (Merged: Current Session)
- **Status**: ✅ Successfully merged and tested
- **Conflicts Resolved**:
  - `.env.example`: Combined actual values from HEAD with placeholder structure from branch
  - `.gitignore`: Kept comprehensive version from branch, added archive/ directory
  - `CLAUDE.md`: Preserved from HEAD (deleted in branch)
  - `mvp-spi/`: Removed submodule reference (not critical)
  - App files: Restored deleted files from branch (canonical code)
- **New Features Added**:
  - Complete agent system with 6 agent implementations
  - Background processing capabilities
  - Agent management API routes
  - Real-time agent execution
  - Comprehensive UI components for agent management
- **Testing Status**: ✅ TypeScript compilation passes, build successful
- **Issues Fixed**:
  - Created missing UI components (card, button, badge, input, label, select, alert)
  - Fixed font import issues (replaced Geist with Inter)
  - Added missing utility functions (cn function)
  - Fixed type definitions (added autoApply to OptimizationEngineConfig)
  - Created missing globals.css with Tailwind configuration
  - Updated AgentCard component to use proper Agent interface
  - Fixed EditAgentDialog to use native HTML select components

## Next Steps for Implementation

1. Complete WhatsApp integration for OTP authentication
2. Implement CSV upload and processing pipeline
3. Add real-time WebSocket subscriptions for live updates
4. Build out the Supply Chain Triangle visualization
5. Create comprehensive test suite
6. Set up CI/CD pipeline with Vercel
7. Implement remaining agent types
8. Add comprehensive logging and monitoring