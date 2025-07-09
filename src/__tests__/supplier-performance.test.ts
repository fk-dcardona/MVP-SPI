import { SupplierPerformanceCalculator } from '@/lib/supplier/performance-calculator';
import { Supplier, PurchaseOrder } from '@/lib/supplier/types';

describe('SupplierPerformanceCalculator', () => {
  let calculator: SupplierPerformanceCalculator;
  let supplier: Supplier;
  let orders: PurchaseOrder[];

  beforeEach(() => {
    calculator = new SupplierPerformanceCalculator();
    
    supplier = {
      id: 'supplier-1',
      company_id: 'company-1',
      name: 'Test Supplier',
      lead_time_days: 7,
      created_at: new Date(),
      updated_at: new Date()
    };

    const baseDate = new Date('2024-01-01');
    orders = [
      {
        id: 'order-1',
        company_id: 'company-1',
        supplier_id: 'supplier-1',
        order_number: 'PO-001',
        order_date: new Date('2024-01-01'),
        expected_delivery_date: new Date('2024-01-08'),
        actual_delivery_date: new Date('2024-01-08'), // On time
        status: 'delivered',
        total_amount: 10000,
        currency: 'USD',
        items: [
          {
            id: 'item-1',
            purchase_order_id: 'order-1',
            sku: 'SKU-001',
            product_name: 'Product 1',
            quantity_ordered: 100,
            quantity_received: 100,
            unit_price: 100,
            total_price: 10000,
            defective_quantity: 2
          }
        ],
        created_at: baseDate,
        updated_at: baseDate
      },
      {
        id: 'order-2',
        company_id: 'company-1',
        supplier_id: 'supplier-1',
        order_number: 'PO-002',
        order_date: new Date('2024-01-15'),
        expected_delivery_date: new Date('2024-01-22'),
        actual_delivery_date: new Date('2024-01-25'), // 3 days late
        status: 'delivered',
        total_amount: 15000,
        currency: 'USD',
        items: [
          {
            id: 'item-2',
            purchase_order_id: 'order-2',
            sku: 'SKU-002',
            product_name: 'Product 2',
            quantity_ordered: 150,
            quantity_received: 150,
            unit_price: 100,
            total_price: 15000,
            defective_quantity: 0
          }
        ],
        created_at: baseDate,
        updated_at: baseDate
      }
    ];
  });

  describe('calculatePerformance', () => {
    it('should calculate delivery metrics correctly', () => {
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-31');
      
      const performance = calculator.calculatePerformance(
        supplier,
        orders,
        periodStart,
        periodEnd
      );

      expect(performance.total_orders).toBe(2);
      expect(performance.on_time_deliveries).toBe(1);
      expect(performance.late_deliveries).toBe(1);
      expect(performance.very_late_deliveries).toBe(0);
      expect(performance.on_time_delivery_rate).toBe(50);
      expect(performance.average_delay_days).toBe(3);
    });

    it('should calculate quality metrics correctly', () => {
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-31');
      
      const performance = calculator.calculatePerformance(
        supplier,
        orders,
        periodStart,
        periodEnd
      );

      expect(performance.total_items_received).toBe(250);
      expect(performance.defective_items).toBe(2);
      expect(performance.defect_rate).toBeCloseTo(0.8, 1);
    });

    it('should calculate cost metrics correctly', () => {
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-31');
      
      const performance = calculator.calculatePerformance(
        supplier,
        orders,
        periodStart,
        periodEnd
      );

      expect(performance.total_spend).toBe(25000);
      expect(performance.price_variance).toBeGreaterThan(0);
      expect(performance.invoice_accuracy_rate).toBeGreaterThan(90);
    });

    it('should calculate overall score correctly', () => {
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-31');
      
      const performance = calculator.calculatePerformance(
        supplier,
        orders,
        periodStart,
        periodEnd
      );

      expect(performance.overall_score).toBeGreaterThan(0);
      expect(performance.overall_score).toBeLessThanOrEqual(100);
      expect(performance.delivery_score).toBeGreaterThan(0);
      expect(performance.quality_score).toBeGreaterThan(0);
      expect(performance.cost_score).toBeGreaterThan(0);
      expect(performance.responsiveness_score).toBeGreaterThan(0);
    });

    it('should handle empty orders array', () => {
      const periodStart = new Date('2024-01-01');
      const periodEnd = new Date('2024-01-31');
      
      const performance = calculator.calculatePerformance(
        supplier,
        [],
        periodStart,
        periodEnd
      );

      expect(performance.total_orders).toBe(0);
      expect(performance.on_time_delivery_rate).toBe(0);
      expect(performance.defect_rate).toBe(0);
    });
  });

  describe('generateScorecard', () => {
    it('should generate scorecard with correct trend', () => {
      const currentPerformance = {
        supplier_id: 'supplier-1',
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        total_orders: 10,
        on_time_deliveries: 8,
        late_deliveries: 2,
        very_late_deliveries: 0,
        average_delay_days: 1,
        on_time_delivery_rate: 80,
        total_items_received: 1000,
        defective_items: 10,
        defect_rate: 1,
        quality_complaints: 0,
        total_spend: 100000,
        price_variance: 2,
        invoice_accuracy_rate: 98,
        discount_captured: 5000,
        average_response_time_hours: 24,
        quote_turnaround_days: 2,
        issue_resolution_days: 3,
        delivery_score: 75,
        quality_score: 90,
        cost_score: 85,
        responsiveness_score: 80,
        overall_score: 82
      };

      const historicalPerformance = [
        { ...currentPerformance, overall_score: 70 },
        { ...currentPerformance, overall_score: 73 },
        { ...currentPerformance, overall_score: 75 }
      ];

      const scorecard = calculator.generateScorecard(
        supplier,
        currentPerformance,
        historicalPerformance
      );

      expect(scorecard.trend).toBe('improving');
      expect(scorecard.risk_level).toBe('low');
      expect(scorecard.recommendations).toHaveLength(0);
    });

    it('should generate recommendations for poor performance', () => {
      const currentPerformance = {
        supplier_id: 'supplier-1',
        period_start: new Date('2024-01-01'),
        period_end: new Date('2024-01-31'),
        total_orders: 10,
        on_time_deliveries: 5,
        late_deliveries: 5,
        very_late_deliveries: 3,
        average_delay_days: 5,
        on_time_delivery_rate: 50,
        total_items_received: 1000,
        defective_items: 50,
        defect_rate: 5,
        quality_complaints: 5,
        total_spend: 100000,
        price_variance: 10,
        invoice_accuracy_rate: 85,
        discount_captured: 1000,
        average_response_time_hours: 72,
        quote_turnaround_days: 7,
        issue_resolution_days: 10,
        delivery_score: 40,
        quality_score: 50,
        cost_score: 45,
        responsiveness_score: 35,
        overall_score: 42
      };

      const scorecard = calculator.generateScorecard(
        supplier,
        currentPerformance,
        []
      );

      expect(scorecard.risk_level).toBe('high');
      expect(scorecard.recommendations.length).toBeGreaterThan(5);
      expect(scorecard.recommendations).toContain('Evaluate alternative suppliers for risk mitigation');
    });
  });
});