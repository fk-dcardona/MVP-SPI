# Finkargo Analytics MVP

A Supply Chain Intelligence Platform that transforms CSV data into strategic insights using the Supply Chain Triangle framework (Service-Cost-Capital optimization).

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Twilio credentials

# Run database migrations
npm run supabase:setup

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Twilio account (for WhatsApp integration)

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run type-check      # Run TypeScript type checking
npm run lint            # Run ESLint
npm run test            # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate test coverage report

# Agent System
npm run agents:start    # Start background agents
npm run agents:status   # Check agent status
npm run agents:stop     # Stop all agents
```

## 🏗️ Architecture

### Core Systems

1. **Authentication System** (`/src/app/(auth)/`)
   - Supabase-based authentication
   - Role-based access control (admin, manager, analyst)
   - WhatsApp OTP verification (planned)

2. **Agent System** (`/src/lib/agents/`)
   - Factory pattern for creating agents
   - Manager singleton for lifecycle management
   - Six agent types:
     - Inventory Monitor
     - Alert Generator
     - Data Processor
     - Report Generator
     - Optimization Engine
     - Notification Dispatcher

3. **Dashboard System** (`/src/app/dashboard/`)
   - Real-time metrics visualization
   - Agent management interface
   - CSV data upload and processing

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL with RLS)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Agent System
AGENT_SCHEDULER_SECRET=your_secret
CRON_SECRET=your_cron_secret
BACKGROUND_JOBS_ENABLED=true
AGENT_EXECUTION_TIMEOUT=300000
```

## 📁 Project Structure

```
mvp-spi/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── api/               # API routes
│   │   └── dashboard/         # Dashboard pages
│   ├── components/            # React components
│   │   ├── agents/           # Agent-related components
│   │   ├── auth/             # Authentication components
│   │   ├── dashboard/        # Dashboard components
│   │   └── ui/               # Reusable UI components
│   ├── lib/                   # Core libraries
│   │   ├── agents/           # Agent system implementation
│   │   ├── auth/             # Authentication utilities
│   │   └── supabase/         # Supabase client setup
│   ├── hooks/                 # Custom React hooks
│   └── __tests__/            # Test files
├── supabase/                  # Database migrations
├── public/                    # Static assets
└── .cursor/                   # Cursor agent scripts
```

## 🧪 Testing

The project includes comprehensive tests for authentication and agent systems:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Test files are located in `src/__tests__/` and follow the naming convention `*.test.ts(x)`.

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔐 Security

- All database tables use Row Level Security (RLS)
- API routes require authentication
- Company-based data isolation
- Input validation on all user-submitted data
- Environment variables for sensitive configuration

## 📈 Performance Targets

- CSV processing: < 30 seconds for 10,000 records
- Dashboard load: < 3 seconds
- Real-time updates: < 1 second latency
- Agent execution: Configurable intervals (default 5 minutes)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support, please contact the development team or create an issue in the project repository.