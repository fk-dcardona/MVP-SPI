const fs = require('fs');
const path = require('path');

// Generate test inventory CSV
function generateInventoryCSV(rows = 100) {
  const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D', 'Supplier E'];
  const units = ['piezas', 'cajas', 'kg', 'litros', 'unidades'];
  
  let csv = 'sku,name,unit,qty,supplier,leadtime,precio-unitario,total-costo\n';
  
  for (let i = 1; i <= rows; i++) {
    const sku = `SKU${String(i).padStart(4, '0')}`;
    const name = `Product ${i}${i % 10 === 0 ? ' por unidad' : ''}`; // Add "por unidad" to some products
    const unit = units[Math.floor(Math.random() * units.length)];
    const qty = Math.floor(Math.random() * 990) + 10;
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const leadtime = Math.floor(Math.random() * 24) + 7;
    const price = (Math.random() * 99 + 1).toFixed(2);
    const total = (qty * parseFloat(price)).toFixed(2);
    
    csv += `${sku},${name},${unit},${qty},${supplier},${leadtime},${price},${total}\n`;
  }
  
  fs.writeFileSync(path.join(__dirname, 'test-data', 'test_inventory.csv'), csv);
  console.log(`✅ Generated test_inventory.csv with ${rows} rows`);
}

// Generate test sales CSV
function generateSalesCSV(days = 30, ordersPerDay = 10) {
  const customers = ['Customer A', 'Customer B', 'Customer C', 'Customer D', 'Customer E'];
  
  let csv = 'date,sku,product,quantity,unit-price,total,customer\n';
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  for (let d = 0; d < days; d++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + d);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    for (let o = 0; o < ordersPerDay; o++) {
      const skuNum = Math.floor(Math.random() * 100) + 1;
      const sku = `SKU${String(skuNum).padStart(4, '0')}`;
      const product = `Product ${skuNum}`;
      const quantity = Math.floor(Math.random() * 50) + 1;
      const unitPrice = (Math.random() * 149 + 1).toFixed(2);
      const total = (quantity * parseFloat(unitPrice)).toFixed(2);
      const customer = customers[Math.floor(Math.random() * customers.length)];
      
      csv += `${dateStr},${sku},${product},${quantity},${unitPrice},${total},${customer}\n`;
    }
  }
  
  fs.writeFileSync(path.join(__dirname, 'test-data', 'test_sales.csv'), csv);
  console.log(`✅ Generated test_sales.csv with ${days * ordersPerDay} rows`);
}

// Generate large inventory CSV for performance testing
function generateLargeInventoryCSV(rows = 1000) {
  generateInventoryCSV(rows);
  fs.renameSync(
    path.join(__dirname, 'test-data', 'test_inventory.csv'),
    path.join(__dirname, 'test-data', 'large_inventory.csv')
  );
  console.log(`✅ Generated large_inventory.csv with ${rows} rows`);
}

// Create test-data directory if it doesn't exist
const testDataDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir);
}

// Generate all test files
console.log('🚀 Generating test data files...\n');
generateInventoryCSV(100);
generateSalesCSV(30, 10);
generateLargeInventoryCSV(1000);

console.log('\n✨ All test data files generated in ./test-data/');
console.log('\nYou can now use these files to test the CSV upload functionality.');