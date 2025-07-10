# 🚀 Local Testing Guide
## Supply Chain Intelligence MVP

This guide will help you test all the different modules of the application locally.

---

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Git** (for version control)

---

## 🛠️ Setup Instructions

### 1. Start the Development Server

```bash
# Navigate to the project directory
cd "MVP - Supply Chain Intelligence"

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## 🎯 Testing All Modules

### 🔐 **1. Authentication Module**
**URL**: http://localhost:3000/login

**Test Credentials**:
- Email: `test@finkargo.com`
- Password: `Test123!@#`

**Features to Test**:
- ✅ Login form functionality
- ✅ WhatsApp OTP verification
- ✅ Password reset flow
- ✅ Session management

**Test Steps**:
1. Visit http://localhost:3000 (should redirect to login)
2. Enter test credentials
3. Test "Sign in with email link" option
4. Verify session persistence

---

### 📤 **2. File Upload Module**
**URL**: http://localhost:3000/dashboard/upload

**Test Files Available**:
- `test-data/large_inventory.csv` (1000 products)
- `test-data/test_sales.csv` (300 sales records)

**Features to Test**:
- ✅ CSV file upload
- ✅ File validation
- ✅ Upload progress tracking
- ✅ Upload history display

**Test Steps**:
1. Login to the application
2. Navigate to Upload page
3. Upload `large_inventory.csv` for inventory data
4. Upload `test_sales.csv` for sales data
5. Check upload history and progress

---

### 🤖 **3. Agent System Module**
**URL**: http://localhost:3000/dashboard/agents

**Agent Types Available**:
- **Data Processor Agent**: Processes uploaded CSV files
- **Alert Generator Agent**: Creates alerts based on thresholds
- **Inventory Monitor Agent**: Monitors stock levels
- **Optimization Engine Agent**: Optimizes working capital
- **Report Generator Agent**: Generates automated reports
- **Notification Dispatcher Agent**: Sends notifications

**Features to Test**:
- ✅ Agent creation and configuration
- ✅ Agent execution triggers
- ✅ Agent status monitoring
- ✅ Agent scheduling

**Test Steps**:
1. Navigate to Agents page
2. Create a new Data Processor Agent
3. Configure agent parameters
4. Execute the agent manually
5. Monitor agent status and logs

---

### 📊 **4. Analytics Dashboard Module**
**URL**: http://localhost:3000/dashboard/analytics

**Analytics Components**:
- **Financial Metrics**: Working capital, cash flow, ratios
- **Inventory Analytics**: Stock levels, turnover rates, aging
- **Sales Analytics**: Performance metrics, revenue analysis
- **Supplier Performance**: Scorecards, risk assessment

**Features to Test**:
- ✅ Real-time data visualization
- ✅ Interactive charts and graphs
- ✅ Data filtering and sorting
- ✅ Export functionality

**Test Steps**:
1. Upload test data first
2. Navigate to Analytics page
3. Explore different analytics sections
4. Test chart interactions
5. Verify data accuracy

---

### 🔺 **5. Supply Chain Triangle Module**
**URL**: http://localhost:3000/api/triangle

**Features to Test**:
- ✅ Triangle score calculations
- ✅ Real-time updates
- ✅ Historical trend analysis
- ✅ Performance indicators

**Test Steps**:
1. Ensure test data is uploaded
2. Check triangle scores via API
3. Monitor real-time updates
4. Analyze historical trends

---

### 🚨 **6. Alert System Module**
**URL**: Accessible via dashboard

**Features to Test**:
- ✅ Alert rule creation
- ✅ Real-time alert triggering
- ✅ Alert notification delivery
- ✅ Alert history and status

**Test Steps**:
1. Create alert rules for inventory thresholds
2. Upload data that triggers alerts
3. Verify alert notifications
4. Check alert history

---

### 💬 **7. Notification System Module**
**Features to Test**:
- ✅ WhatsApp integration
- ✅ In-app notifications
- ✅ Email notifications
- ✅ Notification preferences

**Test Steps**:
1. Configure notification settings
2. Trigger test notifications
3. Verify delivery methods
4. Check notification history

---

## 🧪 **Automated Testing**

### Run Comprehensive Tests
```bash
# Run the automated test suite
node test-comprehensive-features.js
```

This will test all modules automatically and provide a detailed report.

---

## 📱 **Testing Different User Roles**

### Admin User
- Email: `admin@finkargo.com`
- Password: `Admin123!@#`
- **Capabilities**: Full access to all modules

### Manager User
- Email: `manager@finkargo.com`
- Password: `Manager123!@#`
- **Capabilities**: Dashboard access, limited admin features

### Analyst User
- Email: `analyst@finkargo.com`
- Password: `Analyst123!@#`
- **Capabilities**: Read-only access to analytics

---

## 🔧 **Troubleshooting**

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill existing process
   lsof -ti:3000 | xargs kill -9
   # Or use different port
   npm run dev -- -p 3001
   ```

2. **Database connection issues**
   - Check environment variables
   - Verify Supabase configuration

3. **File upload fails**
   - Check file format (CSV only)
   - Verify file size limits
   - Ensure proper headers

4. **Authentication issues**
   - Clear browser cache
   - Check Supabase auth configuration

---

## 📊 **Performance Testing**

### Load Testing
```bash
# Test with large dataset
# Upload large_inventory.csv (1000 products)
# Monitor performance metrics
```

### Memory Usage
```bash
# Monitor memory usage during testing
# Check for memory leaks
```

---

## 🎯 **Test Scenarios**

### Scenario 1: Complete Workflow
1. Login as admin user
2. Upload inventory and sales data
3. Create and configure agents
4. Monitor analytics dashboard
5. Set up alert rules
6. Verify notifications

### Scenario 2: Performance Testing
1. Upload large dataset (1000+ records)
2. Monitor load times
3. Test real-time updates
4. Verify system responsiveness

### Scenario 3: Error Handling
1. Upload invalid files
2. Test network disconnections
3. Verify error messages
4. Check recovery mechanisms

---

## 📈 **Expected Results**

### Performance Benchmarks
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 200ms
- **File Upload**: < 5 seconds for 1MB files
- **Real-time Updates**: < 1 second

### Quality Metrics
- **Test Success Rate**: 100%
- **Error Rate**: < 1%
- **User Experience**: Smooth and intuitive
- **Data Accuracy**: 100%

---

## 🎉 **Success Criteria**

✅ All modules accessible and functional  
✅ Data upload and processing working  
✅ Analytics displaying correctly  
✅ Alerts and notifications functioning  
✅ Performance within acceptable limits  
✅ Error handling working properly  
✅ User experience smooth and intuitive  

---

**Happy Testing! 🚀**

For support or questions, refer to the comprehensive test reports:
- `COMPREHENSIVE_TEST_REPORT.md`
- `COMPREHENSIVE_TESTING_CHECKLIST.md` 