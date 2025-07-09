'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { WorkingCapitalDashboard } from '@/components/financial/WorkingCapitalDashboard';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { WorkingCapitalDashboard as DashboardType } from '@/lib/financial/types';

interface FinancialMetricsProps {
  companyId: string;
}

export function FinancialMetrics({ companyId }: FinancialMetricsProps) {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadFinancialMetrics();
  }, [companyId]);

  const loadFinancialMetrics = async () => {
    setIsLoading(true);
    try {
      // Fetch inventory data
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', companyId);

      // Fetch latest metrics
      const { data: metrics } = await supabase
        .from('inventory_metrics')
        .select('*')
        .eq('company_id', companyId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate financial metrics
      const inventoryValue = inventory?.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || 0;
      const accountsReceivable = metrics?.accounts_receivable || inventoryValue * 0.8; // Simulated
      const accountsPayable = metrics?.accounts_payable || inventoryValue * 0.6; // Simulated
      const workingCapital = inventoryValue + accountsReceivable - accountsPayable;

      // Create dashboard data
      const dashboardData: DashboardType = {
        company_id: companyId,
        calculated_at: new Date().toISOString(),
        current_metrics: {
          working_capital: workingCapital,
          inventory_value: inventoryValue,
          accounts_receivable: accountsReceivable,
          accounts_payable: accountsPayable,
          days_inventory_outstanding: metrics?.days_inventory_outstanding || 45,
          days_sales_outstanding: metrics?.days_sales_outstanding || 30,
          days_payable_outstanding: metrics?.days_payable_outstanding || 45,
          cash_conversion_cycle: 30, // DIO + DSO - DPO
          current_ratio: (inventoryValue + accountsReceivable) / accountsPayable,
          quick_ratio: accountsReceivable / accountsPayable,
          inventory_turnover: 8.5,
          receivables_turnover: 12,
          payables_turnover: 8
        },
        optimization_potential: {
          total_opportunity: workingCapital * 0.15,
          inventory_reduction: inventoryValue * 0.1,
          receivables_acceleration: accountsReceivable * 0.05,
          payables_extension: accountsPayable * 0.05
        },
        industry_benchmarks: {
          inventory_turns: 10,
          receivables_days: 25,
          payables_days: 50,
          cash_cycle_days: 20
        },
        working_capital_trend: workingCapital > inventoryValue ? 'improving' : 'stable',
        cash_cycle_trend: 'improving',
        recommendations: generateRecommendations(workingCapital, inventoryValue, accountsReceivable, accountsPayable)
      };

      setDashboard(dashboardData);
    } catch (error) {
      console.error('Error loading financial metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendations = (
    workingCapital: number,
    inventory: number,
    receivables: number,
    payables: number
  ) => {
    const recommendations = [];
    
    if (inventory / workingCapital > 0.5) {
      recommendations.push({
        id: 'fin-1',
        title: 'Reduce Excess Inventory',
        description: 'Implement JIT ordering for slow-moving items to free up capital',
        priority_score: 90,
        expected_working_capital_improvement: inventory * 0.1,
        expected_cash_cycle_reduction_days: 5,
        time_to_implement_days: 30,
        quick_win: true
      });
    }

    if (receivables / workingCapital > 0.3) {
      recommendations.push({
        id: 'fin-2',
        title: 'Accelerate Collections',
        description: 'Offer early payment discounts to reduce DSO',
        priority_score: 85,
        expected_working_capital_improvement: receivables * 0.05,
        expected_cash_cycle_reduction_days: 3,
        time_to_implement_days: 14,
        quick_win: true
      });
    }

    recommendations.push({
      id: 'fin-3',
      title: 'Optimize Payment Terms',
      description: 'Negotiate extended payment terms with key suppliers',
      priority_score: 75,
      expected_working_capital_improvement: payables * 0.05,
      expected_cash_cycle_reduction_days: 5,
      time_to_implement_days: 45,
      quick_win: false
    });

    return recommendations;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-600">No financial data available</p>
        </CardContent>
      </Card>
    );
  }

  return <WorkingCapitalDashboard dashboard={dashboard} />;
}