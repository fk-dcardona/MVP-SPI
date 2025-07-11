# Refactoring Guide: Building Solid Foundations

## Current Issues Identified

1. **Toast/UI Component Webpack Errors**: Complex UI components causing module loading failures
2. **Server/Client Hydration Mismatches**: Mixing server and client components without clear boundaries
3. **Authentication Flow Problems**: Session management not working smoothly
4. **Database Schema Dependencies**: Code assumes tables that don't exist
5. **Complex Dependencies**: Too many moving parts before basics are working

## Refactoring Approach

### Phase 1: Strip to Essentials ✅
- Removed problematic Toaster component from layout
- Commented out complex UI dependencies
- Created minimal authentication pages without fancy UI

### Phase 2: Build Minimal Working System ✅
- Created `/auth/simple-login` - Basic login without UI libraries
- Created `/auth/dashboard` - Simple dashboard that actually works
- Used only HTML/inline styles to avoid CSS/component issues

### Phase 3: Establish Clear Boundaries (Current)

#### Client-Only Components (`'use client'`)
- Authentication forms
- Interactive dashboards
- User state management
- Browser-specific features

#### Server Components (Default)
- Static pages
- Data fetching from database
- SEO-optimized content
- Initial page shells

### Phase 4: Progressive Enhancement (Next)

1. **Database Setup**
   ```sql
   -- Ensure these tables exist before using them
   CREATE TABLE IF NOT EXISTS profiles (
     id UUID PRIMARY KEY,
     email TEXT,
     full_name TEXT,
     role TEXT,
     company_id UUID
   );
   
   CREATE TABLE IF NOT EXISTS companies (
     id UUID PRIMARY KEY,
     name TEXT,
     created_at TIMESTAMP
   );
   ```

2. **Add UI Components Incrementally**
   - Test each component in isolation
   - Use dynamic imports for heavy components
   - Add proper error boundaries

3. **Authentication Middleware**
   - Simple session checks
   - Clear redirect logic
   - Proper cookie handling

## Solid Foundation Principles

### 1. Start Simple
- Plain HTML/CSS before complex UI libraries
- Working authentication before fancy features
- Direct navigation before complex routing

### 2. Test Each Layer
- Verify auth works: `/auth/simple-login`
- Confirm session persists: `/auth/dashboard`
- Check database queries separately

### 3. Clear Component Rules
```tsx
// Client Component (interactive)
'use client';
export default function InteractiveThing() {
  const [state, setState] = useState();
  // Hooks, browser APIs, event handlers
}

// Server Component (static)
export default async function StaticThing() {
  const data = await fetchData();
  // No hooks, no browser APIs
  return <div>{data}</div>;
}
```

### 4. Progressive Database Integration
1. Start with auth only (Supabase handles this)
2. Add user profiles when needed
3. Add company data when profiles work
4. Build up schema incrementally

## Migration Path

From broken state → Working state:

1. **Use new simple auth**: `/auth/simple-login`
2. **Verify it works**: Check dashboard access
3. **Migrate features one by one**: 
   - CSV upload (without toast notifications)
   - Data viewing (simple tables)
   - Agent system (after basics work)

## Best Practices Going Forward

1. **Always test in isolation first**
2. **Don't add complex UI until core logic works**
3. **Keep server/client boundaries clear**
4. **Add features incrementally**
5. **Document what tables/data each feature needs**

## Current Working Setup

- ✅ Authentication: `/auth/simple-login` → `/auth/dashboard`
- ✅ No complex dependencies
- ✅ Clear client-side components
- ✅ Simple session management
- ✅ Basic logout functionality

## Next Steps

1. Create database migrations for required tables
2. Add CSV upload without complex UI
3. Build data views progressively
4. Add back UI components one at a time
5. Test each addition thoroughly

This approach ensures we always have a working system and can identify exactly what breaks when we add new features.