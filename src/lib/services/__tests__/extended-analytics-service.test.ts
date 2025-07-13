import { ExtendedAnalyticsService } from '../extended-analytics-service';

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            single: jest.fn(),
            limit: jest.fn()
          }))
        }))
      }))
    }))
  })
}));

describe('ExtendedAnalyticsService', () => {
  let service: ExtendedAnalyticsService;
  let mockSupabase: any;

  beforeEach(() => {
    service = new ExtendedAnalyticsService();
    // Get the mocked supabase instance
    mockSupabase = (service as any).supabase;
  });

  describe('calculateExtendedInventoryMetrics', () => {
    it('should calculate inventory metrics with turnover data', async () => {
      // Mock turnover data
      const mockTurnoverData = [
        {
          sku: 'TEST-001',
          units_sold: 30,
          avg_inventory: 100,
          turnover_rate: 3.6,
          days_of_supply: 10
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockTurnoverData,
        error: null
      });

      const result = await service.calculateExtendedInventoryMetrics('test-company-id');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        inventoryTurnover: 3.6,
        daysOfSupply: 10,
        stockHealthScore: 'normal'
      });
      expect(result[0].reorderPoint).toBeGreaterThan(0);
      expect(result[0].holdingCost).toBeGreaterThan(0);
    });

    it('should handle stockout scenarios', async () => {
      const mockTurnoverData = [
        {
          sku: 'TEST-002',
          units_sold: 0,
          avg_inventory: 0,
          turnover_rate: 0,
          days_of_supply: 0
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockTurnoverData,
        error: null
      });

      const result = await service.calculateExtendedInventoryMetrics('test-company-id');

      expect(result[0].stockHealthScore).toBe('stockout');
      expect(result[0].daysOfSupply).toBe(0);
    });

    it('should handle excess stock scenarios', async () => {
      const mockTurnoverData = [
        {
          sku: 'TEST-003',
          units_sold: 1,
          avg_inventory: 1000,
          turnover_rate: 0.1,
          days_of_supply: 120
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockTurnoverData,
        error: null
      });

      const result = await service.calculateExtendedInventoryMetrics('test-company-id');

      expect(result[0].stockHealthScore).toBe('excess');
      expect(result[0].daysOfSupply).toBe(120);
    });
  });

  describe('calculateWorkingCapitalMetrics', () => {
    it('should calculate working capital metrics', async () => {
      const mockFinancialData = [
        {
          working_capital: 100000,
          working_capital_ratio: 1.5,
          cash_conversion_cycle: 45,
          inventory_value: 50000
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockFinancialData,
        error: null
      });

      // Mock sales data
      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            gte: () => ({
              data: [
                { revenue: 10000, quantity: 100 },
                { revenue: 15000, quantity: 150 }
              ]
            })
          })
        })
      });

      const result = await service.calculateWorkingCapitalMetrics('test-company-id');

      expect(result.workingCapital).toBe(100000);
      expect(result.workingCapitalRatio).toBe(1.5);
      expect(result.cashConversionCycle).toBe(45);
      expect(result.grossMargin).toBeGreaterThan(0);
    });
  });

  describe('assessRisks', () => {
    it('should assess risks across categories', async () => {
      const mockRiskData = [
        {
          risk_category: 'inventory',
          risk_score: 25,
          risk_level: 'medium',
          contributing_factors: { low_stock_items: 5, total_items: 20 }
        },
        {
          risk_category: 'supplier',
          risk_score: 15,
          risk_level: 'low',
          contributing_factors: { avg_supplier_score: 85 }
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockRiskData,
        error: null
      });

      // Mock sales data for market risk assessment
      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            gte: () => ({
              data: [
                { transaction_date: '2024-01-01T00:00:00Z', quantity: 10 },
                { transaction_date: '2024-01-02T00:00:00Z', quantity: 15 },
                { transaction_date: '2024-01-03T00:00:00Z', quantity: 8 }
              ]
            })
          })
        })
      });

      const result = await service.assessRisks('test-company-id');

      expect(result).toHaveLength(3); // inventory, supplier, market
      expect(result[0].category).toBe('inventory');
      expect(result[0].riskScore).toBe(25);
      expect(result[2].category).toBe('market');
    });
  });

  describe('compareToIndustryBenchmarks', () => {
    it('should compare metrics to industry benchmarks', async () => {
      // Mock working capital metrics
      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: [{
            working_capital: 100000,
            working_capital_ratio: 1.2,
            cash_conversion_cycle: 20,
            days_inventory_outstanding: 30,
            days_sales_outstanding: 30,
            days_payable_outstanding: 40
          }],
          error: null
        })
        .mockResolvedValueOnce({
          data: [{
            fillRate: 96,
            orderAccuracy: 94,
            averageLeadTime: 7,
            leadTimeVariability: 2,
            supplierPerformanceScore: 88
          }],
          error: null
        })
        .mockResolvedValueOnce({
          data: [
            { turnover_rate: 8.5 }
          ],
          error: null
        });

      // Mock sales data for fill rate calculation
      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            gte: () => ({
              data: [
                { quantity: 100, fulfilled: true },
                { quantity: 50, fulfilled: true },
                { quantity: 25, fulfilled: false }
              ]
            })
          })
        })
      });

      const result = await service.compareToIndustryBenchmarks('test-company-id', 'retail');

      expect(result).toHaveLength(4);
      expect(result[0].metric).toBe('Inventory Turnover');
      expect(result[0].currentValue).toBe(8.5);
      expect(result[0].industryAverage).toBe(8);
      expect(result[0].percentile).toBeGreaterThan(0);
    });
  });

  describe('optimizeMultiEchelonInventory', () => {
    it('should provide inventory optimization recommendations', async () => {
      const mockInventoryData = [
        {
          sku: 'TEST-001',
          quantity: 500,
          unit_cost: 10,
          location: 'Warehouse A'
        },
        {
          sku: 'TEST-002',
          quantity: 200,
          unit_cost: 25,
          location: 'Warehouse B'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => mockInventoryData
        })
      });

      // Mock turnover data for each SKU
      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: { units_sold: 100 },
          error: null
        })
        .mockResolvedValueOnce({
          data: { units_sold: 50 },
          error: null
        });

      const result = await service.optimizeMultiEchelonInventory('test-company-id');

      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.totalSavings).toBeGreaterThanOrEqual(0);
      
      if (result.recommendations.length > 0) {
        expect(result.recommendations[0]).toHaveProperty('location');
        expect(result.recommendations[0]).toHaveProperty('sku');
        expect(result.recommendations[0]).toHaveProperty('currentLevel');
        expect(result.recommendations[0]).toHaveProperty('optimalLevel');
        expect(result.recommendations[0]).toHaveProperty('savings');
      }
    });
  });

  describe('generateAlerts', () => {
    it('should generate appropriate alerts based on metrics', async () => {
      // Mock inventory metrics with various stock levels
      mockSupabase.rpc
        .mockResolvedValueOnce({
          data: [
            { sku: 'LOW-001', turnover_rate: 5, avg_inventory: 10, days_of_supply: 2, units_sold: 50 },
            { sku: 'STOCK-002', turnover_rate: 0, avg_inventory: 0, days_of_supply: 0, units_sold: 0 },
            { sku: 'EXCESS-003', turnover_rate: 1, avg_inventory: 500, days_of_supply: 120, units_sold: 10 }
          ],
          error: null
        })
        .mockResolvedValueOnce({
          data: [{
            working_capital: 50000,
            working_capital_ratio: 0.8,
            cash_conversion_cycle: 70
          }],
          error: null
        });

      const result = await service.generateAlerts('test-company-id');

      expect(result).toBeInstanceOf(Array);
      
      // Should generate alerts for stockout, low stock, excess stock, and financial issues
      const alertTypes = result.map(alert => alert.type);
      expect(alertTypes).toContain('stockout');
      expect(alertTypes).toContain('low_stock');
      expect(alertTypes).toContain('excess_stock');
      expect(alertTypes).toContain('working_capital');
      expect(alertTypes).toContain('cash_cycle');
    });
  });

  describe('identifyCostOptimizations', () => {
    it('should identify cost optimization opportunities', async () => {
      const mockOptimizations = [
        {
          opportunity_type: 'excess_inventory',
          sku: 'EXCESS-001',
          current_value: 10000,
          potential_savings: 2000,
          recommendation: 'Reduce inventory levels for slow-moving items',
          priority: 1
        }
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: mockOptimizations,
        error: null
      });

      const result = await service.identifyCostOptimizations('test-company-id');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('excess_inventory');
      expect(result[0].potentialSavings).toBe(2000);
      expect(result[0].priority).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      });

      await expect(service.calculateExtendedInventoryMetrics('test-company-id'))
        .rejects.toThrow('Database connection failed');
    });
  });
});