# 🌊 Minimal Flow Testing Protocol

## Goal
Test the minimal viable flow: **Login → Upload CSV → View Data**

No complexity. No external dependencies. Just the essence.

---

## Pre-Test Setup

### 1. Clean Environment
```bash
# Kill all processes
pkill -f "next" && pkill -f "node" && pkill -f "npm"

# Clear caches
rm -rf .next node_modules/.cache

# Verify ports are free
lsof -i :3000 || echo "Port 3000 is free ✅"
```

### 2. Start Fresh Server
```bash
cd "/Users/helpdesk/Cursor/MVP - Supply Chain Intelligence"
npm run dev
```

### 3. Verify Server
Wait for: `✓ Ready in Xs`

---

## Testing Flow

### Phase 1: Access Minimal App
1. Open browser: **http://localhost:3000/minimal**
2. Should redirect to: **http://localhost:3000/minimal/login**
3. ✅ Success: Login page appears
4. ❌ Failure: Connection refused or error

### Phase 2: Test Authentication
1. Enter credentials:
   - Email: `test@finkargo.com`
   - Password: `Test123!@#`
2. Click "Login"
3. ✅ Success: Redirects to dashboard
4. ❌ Failure: Error message or stuck

### Phase 3: Upload CSV
1. On dashboard, click "Choose CSV file"
2. Select: `test-data/test_sales.csv`
3. ✅ Success: Data appears in table
4. ❌ Failure: No data or error

### Phase 4: View Data
1. Verify table shows:
   - Column headers
   - First 10 rows
   - Row count message
2. ✅ Success: Data is readable and formatted
3. ❌ Failure: Missing data or formatting issues

### Phase 5: Test Logout
1. Click "Logout" button
2. ✅ Success: Returns to login page
3. ❌ Failure: Stuck or error

---

## Test Checklist

- [ ] Server starts without errors
- [ ] Can access /minimal route
- [ ] Login page loads
- [ ] Can login with test credentials
- [ ] Dashboard loads after login
- [ ] Can upload CSV file
- [ ] Data displays in table
- [ ] Logout works
- [ ] Can login again after logout

---

## Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Time to login page | < 2 sec | _____ |
| Login process | < 1 sec | _____ |
| CSV upload | < 1 sec | _____ |
| Data display | < 1 sec | _____ |
| Total flow | < 30 sec | _____ |

---

## What This Proves

If this minimal flow works:
1. ✅ Basic architecture is sound
2. ✅ No system-level connection issues
3. ✅ File upload works
4. ✅ Client-server communication works
5. ✅ We have a foundation to build on

---

## Next Steps After Success

1. Add Supabase for real user storage
2. Add database for CSV data persistence
3. Add one chart visualization
4. Add basic data filtering
5. Each addition tested incrementally

---

## If Testing Fails

Check:
1. Is server actually running?
2. Any errors in terminal?
3. Browser console errors?
4. Network tab in DevTools?

The minimal flow has NO external dependencies, so any failure is either:
- Port/connection issue
- Code syntax error
- Browser issue

---

**Remember: This is just login → upload → view. Nothing more.**