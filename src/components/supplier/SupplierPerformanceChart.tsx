'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupplierPerformance } from '@/lib/supplier/types';

interface SupplierPerformanceChartProps {
  performances: Array<{
    supplier: { id: string; name: string };
    performance: SupplierPerformance;
  }>;
  title?: string;
  description?: string;
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function SupplierPerformanceChart({ 
  performances, 
  title = 'Supplier Performance Comparison',
  description = 'Comparative analysis across key performance dimensions'
}: SupplierPerformanceChartProps) {
  
  // Prepare data for radar chart
  const data = [
    {
      metric: 'Delivery',
      fullMark: 100,
      ...performances.reduce((acc, { supplier, performance }) => ({
        ...acc,
        [supplier.name]: performance.delivery_score
      }), {})
    },
    {
      metric: 'Quality',
      fullMark: 100,
      ...performances.reduce((acc, { supplier, performance }) => ({
        ...acc,
        [supplier.name]: performance.quality_score
      }), {})
    },
    {
      metric: 'Cost',
      fullMark: 100,
      ...performances.reduce((acc, { supplier, performance }) => ({
        ...acc,
        [supplier.name]: performance.cost_score
      }), {})
    },
    {
      metric: 'Responsiveness',
      fullMark: 100,
      ...performances.reduce((acc, { supplier, performance }) => ({
        ...acc,
        [supplier.name]: performance.responsiveness_score
      }), {})
    },
    {
      metric: 'Overall',
      fullMark: 100,
      ...performances.reduce((acc, { supplier, performance }) => ({
        ...acc,
        [supplier.name]: performance.overall_score
      }), {})
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid gridType="polygon" radialLines={true} />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              
              {performances.map((perf, index) => (
                <Radar
                  key={perf.supplier.id}
                  name={perf.supplier.name}
                  dataKey={perf.supplier.name}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
              
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}