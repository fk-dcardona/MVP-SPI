# Test Prompts for MVP-SPI Verification

## Setup Test Environment

```bash
# Terminal 1 - Start the development server
cd /Users/helpdesk/Cursor/MVP\ -\ Supply\ Chain\ Intelligence
npm run dev

# Terminal 2 - Run these test scenarios
```

## 1. Authentication Flow Testing

### Test User Registration
```bash
# Navigate to http://localhost:3000
# Click "Sign Up"
# Test with:
Email: test@finkargo.com
Password: Test123!@#
Full Name: Test User
Company Name: Test Trading Co
Industry: Retail
Phone: +1234567890
```

### Test Login
```bash
# After registration, sign out and test login
Email: test@finkargo.com
Password: Test123!@#
```

## 2. CSV Upload Testing

### Prepare Test CSV Files

Create `test_inventory.csv`:
```csv
sku,name,unit,qty,supplier,leadtime,precio-unitario,total-costo
SKU001,Product A,piezas,100,Supplier A,14,10.50,1050.00
SKU002,Product B,cajas,50,Supplier B,7,25.00,1250.00
SKU003,Product C por unidad,kg,75,Supplier A,10,5.75,431.25
SKU004,Product D,litros,200,Supplier C,21,3.25,650.00
```

Create `test_sales.csv`:
```csv
date,sku,product,quantity,unit-price,total,customer
2024-01-15,SKU001,Product A,10,15.00,150.00,Customer X
2024-01-16,SKU002,Product B,5,35.00,175.00,Customer Y
2024-01-17,SKU001,Product A,20,15.00,300.00,Customer Z
2024-01-18,SKU004,Product D,50,5.00,250.00,Customer X
```

### Upload Process
```bash
# Navigate to Dashboard > Upload Data
# 1. Drag and drop test_inventory.csv
# 2. Wait for processing confirmation
# 3. Drag and drop test_sales.csv
# 4. Verify both uploads succeeded
```

## 3. Dashboard & Analytics Testing

### Supply Chain Triangle
```bash
# Navigate to Dashboard home
# Verify:
- Triangle visualization shows three axes (Service, Cost, Capital)
- Scores are calculated (should be between 0-100)
- Overall score displays in center
- Recommendations panel shows insights
```

### Real-time Updates
```bash
# Open dashboard in two browser tabs
# In Tab 1: Upload new data
# In Tab 2: Watch for real-time updates in:
  - Metrics grid
  - Triangle scores
  - Alert notifications
```

### Analytics Pages
```bash
# Test each analytics page:

1. Inventory Analytics (/dashboard/analytics/inventory)
   - Check velocity chart
   - Verify top/slow movers
   - Test category breakdown
   - Review turnover trends

2. Sales Analytics (/dashboard/analytics/sales)
   - Verify revenue trends
   - Check product performance
   - Test customer insights
   - Review growth metrics

3. Supplier Analytics (/dashboard/analytics/suppliers)
   - Check supplier scorecards
   - Verify lead time analysis
   - Test performance metrics
   - Review cost breakdown

4. Financial Analytics (/dashboard/analytics/financial)
   - Check working capital metrics
   - Verify cash conversion cycle
   - Test ROCE calculations
   - Review cost structure
```

## 4. Agent System Testing

### Manual Agent Execution
```bash
# From Dashboard > Agents
# Test each agent individually:

1. Inventory Monitor
   - Click "Run Now"
   - Check execution logs
   - Verify alerts generated for low stock

2. Data Processor
   - Already runs on CSV upload
   - Check processing history

3. Alert Generator
   - Should create alerts based on thresholds
   - Verify in notification center

4. Report Generator
   - Generate daily summary
   - Check report output

5. Optimization Engine
   - Run optimization analysis
   - Check recommendations

6. Notification Dispatcher
   - Verify alert routing
   - Check notification delivery
```

## 5. WhatsApp OTP Testing

### Phone Verification Flow
```bash
# Navigate to Dashboard > Settings
# Click "Verify Phone Number"
# Enter phone number with country code
# Request OTP
# Enter received code
# Verify success message
```

## 6. Notification Center Testing

### Alert Interactions
```bash
# Click bell icon in header
# Verify:
- Unread count badge
- Alert list displays
- Can mark as read
- Can mark all as read
- Real-time updates when new alerts arrive
```

## 7. Performance Testing

### Large Dataset Upload
Create `large_inventory.csv` with 1000+ rows:
```python
# Python script to generate test data
import csv
import random

with open('large_inventory.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['sku','name','unit','qty','supplier','leadtime','precio-unitario','total-costo'])
    
    for i in range(1000):
        sku = f'SKU{i:04d}'
        name = f'Product {i}'
        unit = random.choice(['piezas', 'cajas', 'kg', 'litros'])
        qty = random.randint(10, 1000)
        supplier = f'Supplier {random.choice(["A","B","C","D","E"])}'
        leadtime = random.randint(7, 30)
        price = round(random.uniform(1.0, 100.0), 2)
        total = round(qty * price, 2)
        writer.writerow([sku, name, unit, qty, supplier, leadtime, price, total])
```

### Test Upload Performance
```bash
# Upload large_inventory.csv
# Monitor:
- Progress bar updates smoothly
- Processing time < 30 seconds
- No browser freezing
- Success confirmation
```

## 8. Error Handling Testing

### Invalid Data
```bash
# Test various error scenarios:

1. Upload non-CSV file
2. Upload CSV with missing columns
3. Upload CSV with invalid data types
4. Test with empty CSV
5. Test with corrupted file
```

### Network Errors
```bash
# Disconnect internet briefly while:
- Uploading files
- Loading dashboard
- Running agents
# Verify graceful error messages
```

## 9. Security Testing

### Access Control
```bash
# Try accessing without login:
- http://localhost:3000/dashboard
- http://localhost:3000/api/agents
# Should redirect to login

# Try accessing other company's data
# Should see only your company data
```

## 10. Browser Compatibility

Test in multiple browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Expected Results Summary

✅ **All tests should pass with:**
- Smooth user experience
- No console errors
- Proper error messages
- Real-time updates working
- Data properly calculated
- Agents executing successfully
- Notifications delivered

## Common Issues & Solutions

1. **Port 3000 in use**
   ```bash
   # Kill existing process
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection errors**
   - Check Supabase credentials in .env.local
   - Verify Supabase project is running

3. **WhatsApp OTP not received**
   - Check Twilio credentials
   - Verify phone number format
   - Check Twilio logs

4. **Real-time updates not working**
   - Check browser console for WebSocket errors
   - Verify Supabase real-time is enabled

## Branch Setup for Next Phase

```bash
# After testing, create new branch for Phase 4-5
git checkout -b phase-4-5-optimization

# Current branch has Phases 1-3 complete
git branch
# * main (or current branch)
# phase-4-5-optimization (new)
```