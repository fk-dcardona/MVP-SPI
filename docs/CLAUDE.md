# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a unified Next.js-based **Supply Chain Intelligence Platform** called "Finkargo Analytics MVP" that transforms CSV data into strategic insights using AI-driven conversational intelligence and the Supply Chain Triangle framework (Service-Cost-Capital optimization). The platform features sophisticated persona-adaptive dashboards and a cutting-edge WhatsApp conversational AI system.

## Development Commands

### Primary Commands
```bash
# Navigate to project directory
cd /Users/helpdesk/Cursor/MVP\ -\ Supply\ Chain\ Intelligence

# Install dependencies
npm install

# Development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
```

### Database Operations
```bash
# Supabase migrations
supabase db push              # Deploy migrations
supabase migration new <name> # Create new migration
supabase db reset             # Reset database
```

### Agent System
```bash
# Cron Schedule: Every 5 minutes via Vercel cron
# Manual Execution: Via /api/agents/{id}/execute
# Monitoring: Real-time agent status dashboard
```

## High-Level Architecture

### **Core Systems**

1. **Agent System** (`/src/lib/agents/`)
   - Factory pattern for creating different agent types
   - Manager singleton for coordinating agent lifecycle
   - Six agent implementations: inventory monitor, alert generator, data processor, report generator, optimization engine, notification dispatcher
   - Real-time background processing with configurable intervals

2. **WhatsApp Conversational Intelligence** (`/src/lib/whatsapp/`)
   - **Intelligent Conversation Service**: Central orchestrator for conversational AI
   - **Message Processor**: NLP intent recognition and entity extraction
   - **Conversation State Manager**: Maintains conversation context and memory
   - **Adaptive Response Generator**: Learns and improves responses based on persona
   - **Proactive Insight Engine**: Generates predictive business insights

3. **Authentication System** (`/src/app/(auth)/`, `/src/lib/auth/`)
   - Supabase-based authentication with email/password
   - Role-based access control (admin, manager, analyst)
   - WhatsApp OTP verification integration
   - Protected routes using Next.js middleware patterns

4. **Dashboard System** (`/src/app/dashboard/`)
   - Real-time metrics visualization
   - Agent management interface
   - Supply Chain Triangle framework visualization
   - CSV data upload and processing
   - Persona-adaptive layouts

### **Key Architectural Patterns**

1. **Three-Layer Architecture**:
   ```
   Presentation Layer (React Components)
   ├── Dashboard Layouts (persona-adaptive)
   ├── Mobile-optimized components
   ├── Real-time charts and analytics
   └── Command palette interface

   Business Logic Layer (Services & Agents)
   ├── Agent System (6 autonomous agents)
   ├── WhatsApp Intelligent Conversation Service
   ├── Supply Chain Triangle Calculator
   ├── Persona Detection Service
   └── Real-time data processing

   Data Layer (Supabase Integration)
   ├── Multi-tenant database with RLS
   ├── Real-time subscriptions
   ├── 25 database migrations
   └── Advanced indexing and functions
   ```

2. **Environment Configuration**:
   - All projects use `.env` files for configuration
   - Look for `.env.example` files as templates
   - Never commit actual `.env` files

3. **TypeScript Configuration**:
   - Strict type checking enabled
   - Path aliases configured (`@/*` maps to `./src/*`)
   - Modern ES2022+ target

4. **Testing Strategy**:
   - Unit tests for utilities and services
   - Integration tests for API endpoints and agents
   - Component tests for React projects
   - E2E tests for complete user flows
   - WhatsApp conversation flow testing
   - Test files in `__tests__` directories or alongside source files

5. **Error Handling**:
   - Centralized error handling in API projects
   - Structured logging with timestamps
   - User-friendly error messages in UI
   - Error boundaries for React components
   - Comprehensive agent error recovery

### Project Architecture

#### **Core Business Domains**
- **Supply Chain Triangle**: Core optimization engine for cost, time, and risk
- **Inventory Management**: Real-time monitoring and optimization
- **Supplier Management**: Performance tracking and scorecards
- **Financial Analytics**: Working capital optimization and scenario planning
- **Document Processing**: CSV upload and processing pipeline
- **Agent System**: 6 autonomous background agents
- **WhatsApp Intelligence**: Conversational AI system with learning capabilities

#### **Persona-Adaptive System**
The platform dynamically adapts to 5 user personas:
- **Streamliner**: Speed-focused, minimal UI
- **Navigator**: Analytical, detailed insights
- **Hub**: Multi-entity management
- **Spring**: Learning-oriented, educational
- **Processor**: Technical, data-focused

### Technology Stack
- **Framework**: Next.js 14.0.0 with App Router
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI components
- **Backend**: Next.js API routes, Supabase (PostgreSQL)
- **AI/ML**: Custom agent system, WhatsApp intelligent conversation service
- **Notifications**: Twilio WhatsApp integration
- **Infrastructure**: Vercel deployment, serverless functions
- **State Management**: Zustand
- **Charts**: Recharts

## WhatsApp Conversational Intelligence System

### **Architecture Overview**
This is a sophisticated emergent AI system that represents cutting-edge conversational intelligence:

#### **Core Components**
1. **Intelligent Conversation Service** (`/src/lib/whatsapp/intelligent-conversation-service.ts`)
   - Central orchestrator for all conversational intelligence
   - Memory management and learning coordination
   - Analytics and simulation capabilities

2. **Message Processor** (`/src/lib/whatsapp/message-processor.ts`)
   - NLP intent recognition for business operations
   - Entity extraction (products, quantities, dates)
   - Context-aware conversation handling
   - Supports 15+ intent types including inventory, alerts, reports

3. **Conversation State Manager** (`/src/lib/whatsapp/conversation-state-manager.ts`)
   - **Working Memory**: Current conversation context
   - **Long-term Memory**: User patterns and preferences
   - **Message History**: Complete conversation threading
   - **Persona Tracking**: Adapts to user communication style

4. **Adaptive Response Generator** (`/src/lib/whatsapp/adaptive-response-generator.ts`)
   - Persona-based response adaptation
   - Learning from user feedback
   - Template-based response generation with personalization
   - Success pattern recognition

5. **Proactive Insight Engine** (`/src/lib/whatsapp/proactive-insight-engine.ts`)
   - **Pattern Detection**: Identifies automation opportunities
   - **Risk Assessment**: Cash flow and supplier risk alerts
   - **Opportunity Discovery**: Revenue optimization suggestions
   - **Learning Insights**: Feature recommendations and tips

### **Key Features**
- **Memory Architecture**: Combines working memory and long-term learning
- **Persona Adaptation**: Responses evolve based on user behavior (5 personas)
- **Proactive Intelligence**: System initiates helpful conversations
- **Learning Feedback Loop**: Continuous improvement from interactions
- **Context Awareness**: Deep understanding of business context
- **Natural Language Processing**: Intent recognition with confidence scoring
- **Multi-channel Integration**: WhatsApp via Twilio webhook

### **Database Schema**
- `whatsapp_conversation_state`: Persistent conversation memory
- `whatsapp_response_patterns`: Adaptive response learning
- `whatsapp_conversation_insights`: Proactive insight generation
- `whatsapp_user_feedback`: User correction and preference learning

### **NLP Capabilities**
- Intent recognition for inventory, alerts, reports, supplier management
- Entity extraction (products, dates, quantities, suppliers)
- Natural language understanding with confidence scoring
- Multi-turn conversation support
- Clarification request handling

### **Integration Points**
- **Webhook Endpoint**: `/api/webhooks/whatsapp/route.ts`
- **Twilio Integration**: Signature validation and rate limiting
- **Agent System**: Proactive agent execution based on conversations
- **Real-time Updates**: Live conversation monitoring and analytics

## Development Best Practices

1. **Before Making Changes**:
   - Check existing code patterns in the project
   - Look for project-specific conventions
   - Review any existing tests
   - Understand the persona-adaptive architecture
   - Test WhatsApp conversational flows if modifying AI components

2. **Code Quality**:
   - Always run `npm run type-check` and `npm run lint` before committing
   - Ensure all WhatsApp conversation components maintain type safety
   - Follow existing naming conventions (especially for agent and conversation components)
   - Use async/await patterns for all AI and database operations
   - Maintain conversation context and memory consistency

3. **Dependencies**:
   - Check if a library is already used before adding new ones
   - Prefer project's existing utility functions
   - All WhatsApp/AI dependencies are already configured (Twilio, natural language processing)
   - Keep dependencies up to date but test conversation flows after updates

4. **Security**:
   - Never hardcode API keys or secrets (especially Twilio credentials)
   - Use environment variables for all configuration
   - Validate all user inputs (critical for conversation processing)
   - Implement proper Twilio webhook signature validation
   - Protect conversation data with proper RLS policies

5. **WhatsApp Conversational AI Guidelines**:
   - Test conversation flows in development before deploying
   - Maintain persona consistency in all response generation
   - Preserve conversation memory and context across sessions
   - Use the simulation capabilities for testing complex conversation scenarios
   - Follow the established intent recognition patterns
   - Ensure proactive insights respect user preferences and business context

6. **Performance & Scalability**:
   - Conversation processing should handle concurrent users
   - Memory management should clean up inactive conversations
   - Database queries should use proper indexing for conversation data
   - Rate limiting is implemented for WhatsApp webhooks

## Environment Configuration

Required environment variables (see `.env.local`):
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Twilio WhatsApp Integration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number

# Agent System
AGENT_SCHEDULER_SECRET=your_agent_scheduler_secret

# External APIs
EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
```

## Database Schema (25 Migrations)

The database follows a sophisticated multi-tenant architecture:

### **Core Tables**
- `companies`: Multi-tenant organization structure
- `profiles`: User management with persona tracking
- `agents`: Agent definitions and configurations
- `agent_executions`: Execution history and results

### **Business Data**
- `inventory_items`: Stock tracking
- `sales_data`: Sales analytics
- `suppliers`: Supplier management
- `triangle_scores`: Supply chain optimization metrics

### **WhatsApp Intelligence**
- `whatsapp_conversations`: Conversation tracking
- `whatsapp_conversation_state`: Memory and context
- `whatsapp_response_patterns`: Learning patterns
- `whatsapp_user_feedback`: User corrections and preferences

### **Persona System**
- `user_behavior_signals`: Track all user actions
- `persona_scores`: Real-time persona calculations
- `user_preferences`: Store onboarding results

## API Routes Pattern

All API routes follow RESTful conventions:
- `/api/agents` - CRUD operations for agents
- `/api/agents/[id]/execute` - Trigger agent execution
- `/api/agents/initialize` - System initialization
- `/api/cron/agents` - Scheduled agent tasks
- `/api/webhooks/whatsapp` - WhatsApp message processing

## Component Architecture

- **Server Components**: Default for all routes unless client interaction needed
- **Client Components**: Marked with 'use client' for forms, modals, interactive elements
- **UI Components**: Centralized in `/src/components/ui/` following shadcn patterns
- **Feature Components**: Organized by domain (agents, auth, dashboard, whatsapp)

## Known Issues & Workarounds

1. **TypeScript Path Aliases**: The project uses `@/*` aliases mapping to `./src/*`. Ensure tsconfig.json includes the paths configuration.

2. **Port Conflicts**: If port 3000 is in use, Next.js will automatically try port 3001.

3. **WhatsApp Webhook Testing**: Use ngrok or similar tool for local webhook testing with Twilio.

4. **Conversation Memory**: Inactive conversations are cleaned up after 2 hours to prevent memory leaks.

## Performance Targets

- CSV processing: < 30 seconds for 10,000 records
- Dashboard load: < 3 seconds
- Real-time updates: < 1 second latency
- Agent execution: Configurable intervals (default 5 minutes)
- WhatsApp response time: < 3 seconds for standard queries

## Security Considerations

- All database tables use Row Level Security (RLS)
- API routes require authentication
- Company-based data isolation
- Input validation on all user-submitted data
- Twilio webhook signature validation
- Rate limiting on WhatsApp endpoints
- Conversation data encryption at rest

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

## Implementation Status

### ✅ Completed
- Authentication system with Supabase + WhatsApp OTP
- Agent system with complete business logic implementation (6 agent types)
- Database schemas with RLS policies including data tables
- Dashboard structure with persona-adaptive layouts
- UI component library (shadcn/ui) with enhanced design system
- **WhatsApp Conversational Intelligence**: Complete implementation with memory, learning, and proactive insights
- CSV upload interface with validation and business rules
- Data processing pipeline with metrics calculation
- Supply Chain Triangle optimization engine
- ASK Method onboarding system (Ryan Levesque methodology)
- Comprehensive mobile optimization with gesture support
- Complete test coverage for onboarding flows
- Persona tracking database schema with behavior signals

### 🚧 In Progress
- Navigator dashboard customization features
- Hub multi-entity management
- Production deployment to Vercel

### 🎯 Next Priority
- Database deployment and migration
- External service configuration (Supabase, Twilio)
- Production environment setup
- WhatsApp webhook configuration

## Development Workflow

1. Always work within the project root directory
2. Check TypeScript errors with `npm run type-check` before committing
3. Ensure all new components follow the existing patterns
4. Use Server Components by default, Client Components only when necessary
5. Test agent implementations in isolation before integration
6. Test WhatsApp conversation flows in development
7. Maintain type safety for all Supabase queries
8. Follow persona-adaptive design principles

## Recent Major Achievements

### **WhatsApp Conversational Intelligence Implementation** (Completed: Current Session)
- **Status**: ✅ Complete sophisticated conversational AI system
- **Files Created**: 5 major components (2,683 lines of code)
- **Database Schema**: 2 new migrations with learning capabilities
- **Features**: Memory, learning, proactive insights, persona adaptation
- **Integration**: Full webhook integration with Twilio
- **Testing**: Simulation capabilities for development

### **Key Innovation: Emergent AI Architecture**
The WhatsApp conversational intelligence represents a sophisticated **emergent AI system**:
1. **Memory Architecture**: Combines working memory and long-term learning
2. **Persona Adaptation**: Responses evolve based on user behavior
3. **Proactive Intelligence**: System initiates helpful conversations
4. **Learning Feedback Loop**: Continuous improvement from interactions
5. **Context Awareness**: Deep understanding of business context

This implementation transforms the platform from a traditional dashboard into an intelligent business partner that learns and adapts to provide increasingly valuable insights through natural conversation.