'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Save,
  RefreshCw,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { ScenarioAnalysis, CashFlowProjection } from '@/lib/financial/types';

interface ScenarioPlannerProps {
  baseScenario: ScenarioAnalysis;
  onScenarioSave?: (scenario: ScenarioAnalysis) => void;
}

export function ScenarioPlanner({ baseScenario, onScenarioSave }: ScenarioPlannerProps) {
  const [currentScenario, setCurrentScenario] = useState<ScenarioAnalysis>(baseScenario);
  const [assumptions, setAssumptions] = useState(baseScenario.assumptions);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleAssumptionChange = (key: string, value: number) => {
    setAssumptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const recalculateScenario = async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate impacts based on assumptions
    const salesImpact = assumptions.sales_growth_rate / 100;
    const costImpact = assumptions.cost_inflation_rate / 100;
    const paymentImpact = assumptions.payment_terms_change;
    const inventoryImpact = assumptions.inventory_turns_change;
    
    // Update scenario with new calculations
    const updatedScenario: ScenarioAnalysis = {
      ...currentScenario,
      assumptions,
      working_capital_impact: 
        baseScenario.projected_metrics.working_capital * 
        (1 + salesImpact - costImpact + (paymentImpact / 30) - (inventoryImpact / 10)),
      cash_cycle_impact: 
        -paymentImpact + (inventoryImpact > 0 ? -5 : 5),
      profitability_impact: 
        (salesImpact - costImpact) * 100,
      cash_flow_projections: generateCashFlowProjections(assumptions)
    };
    
    setCurrentScenario(updatedScenario);
    setIsCalculating(false);
  };

  const generateCashFlowProjections = (assumptions: any): CashFlowProjection[] => {
    const projections: CashFlowProjection[] = [];
    let cumulativeCash = 1000000; // Starting cash position
    
    for (let i = 0; i < 12; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      
      const salesGrowth = Math.pow(1 + assumptions.sales_growth_rate / 100, i / 12);
      const costInflation = Math.pow(1 + assumptions.cost_inflation_rate / 100, i / 12);
      
      const salesCollections = 500000 * salesGrowth;
      const supplierPayments = 300000 * costInflation;
      const operatingExpenses = 150000 * costInflation;
      
      const netCashFlow = salesCollections - supplierPayments - operatingExpenses;
      cumulativeCash += netCashFlow;
      
      projections.push({
        date: month,
        sales_collections: salesCollections,
        other_income: 0,
        total_inflows: salesCollections,
        supplier_payments: supplierPayments,
        operating_expenses: operatingExpenses,
        capital_expenditures: 0,
        other_expenses: 0,
        total_outflows: supplierPayments + operatingExpenses,
        net_cash_flow: netCashFlow,
        cumulative_cash_position: cumulativeCash,
        confidence_level: i < 3 ? 'high' : i < 6 ? 'medium' : 'low'
      });
    }
    
    return projections;
  };

  const getImpactColor = (impact: number): string => {
    if (impact > 0) return 'text-green-600';
    if (impact < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Scenario Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Assumptions</CardTitle>
          <CardDescription>
            Adjust parameters to model different business scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Growth */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sales-growth">Sales Growth Rate</Label>
                <span className="text-sm font-medium">{assumptions.sales_growth_rate}%</span>
              </div>
              <Slider
                id="sales-growth"
                min={-20}
                max={50}
                step={1}
                value={[assumptions.sales_growth_rate]}
                onValueChange={([value]) => handleAssumptionChange('sales_growth_rate', value)}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>-20%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            {/* Cost Inflation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cost-inflation">Cost Inflation Rate</Label>
                <span className="text-sm font-medium">{assumptions.cost_inflation_rate}%</span>
              </div>
              <Slider
                id="cost-inflation"
                min={0}
                max={20}
                step={0.5}
                value={[assumptions.cost_inflation_rate]}
                onValueChange={([value]) => handleAssumptionChange('cost_inflation_rate', value)}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>10%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="payment-terms">Payment Terms Change</Label>
                <span className="text-sm font-medium">{assumptions.payment_terms_change} days</span>
              </div>
              <Slider
                id="payment-terms"
                min={-30}
                max={30}
                step={5}
                value={[assumptions.payment_terms_change]}
                onValueChange={([value]) => handleAssumptionChange('payment_terms_change', value)}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>-30 days</span>
                <span>0</span>
                <span>+30 days</span>
              </div>
            </div>

            {/* Inventory Turns */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="inventory-turns">Inventory Turns Change</Label>
                <span className="text-sm font-medium">{assumptions.inventory_turns_change}x</span>
              </div>
              <Slider
                id="inventory-turns"
                min={-2}
                max={5}
                step={0.5}
                value={[assumptions.inventory_turns_change]}
                onValueChange={([value]) => handleAssumptionChange('inventory_turns_change', value)}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>-2x</span>
                <span>0</span>
                <span>+5x</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={recalculateScenario}
              disabled={isCalculating}
              className="flex-1"
            >
              {isCalculating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Calculate Impact
            </Button>
            <Button 
              variant="outline"
              onClick={() => setAssumptions(baseScenario.assumptions)}
            >
              Reset
            </Button>
            {onScenarioSave && (
              <Button 
                variant="outline"
                onClick={() => onScenarioSave(currentScenario)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Scenario
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Working Capital Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getImpactColor(currentScenario.working_capital_impact)}`}>
              {currentScenario.working_capital_impact > 0 ? '+' : ''}
              {formatCurrency(currentScenario.working_capital_impact)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs. base scenario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cash Cycle Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getImpactColor(-currentScenario.cash_cycle_impact)}`}>
              {currentScenario.cash_cycle_impact > 0 ? '+' : ''}
              {currentScenario.cash_cycle_impact} days
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lower is better
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Profitability Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getImpactColor(currentScenario.profitability_impact)}`}>
              {currentScenario.profitability_impact > 0 ? '+' : ''}
              {currentScenario.profitability_impact.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Margin change
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Projection Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Projected Cash Flow</CardTitle>
          <CardDescription>
            12-month cash flow forecast based on current assumptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentScenario.cash_flow_projections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cumulative_cash_position"
                  name="Cash Position"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="net_cash_flow"
                  name="Net Cash Flow"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      {currentScenario.risk_factors && currentScenario.risk_factors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant={currentScenario.probability === 'high' ? 'destructive' : 'secondary'}>
                {currentScenario.probability} probability
              </Badge>
              <Badge variant={currentScenario.impact_severity === 'high' ? 'destructive' : 'secondary'}>
                {currentScenario.impact_severity} impact
              </Badge>
            </div>
            <ul className="space-y-2">
              {currentScenario.risk_factors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}