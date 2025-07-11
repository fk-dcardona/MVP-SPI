'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SupplyChainTriangleOverviewProps {
  compact?: boolean;
}

export function SupplyChainTriangleOverview({ compact = false }: SupplyChainTriangleOverviewProps) {
  // Mock data - replace with actual data
  const triangleData = [
    {
      dimension: 'Service',
      score: 85,
      fullMark: 100,
    },
    {
      dimension: 'Cost',
      score: 72,
      fullMark: 100,
    },
    {
      dimension: 'Capital',
      score: 78,
      fullMark: 100,
    },
  ];

  const overallScore = Math.round((85 + 72 + 78) / 3);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, className: 'bg-green-600' };
    if (score >= 60) return { variant: 'default' as const, className: 'bg-yellow-600' };
    return { variant: 'destructive' as const };
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Supply Chain Triangle</CardTitle>
            <Badge {...getScoreBadge(overallScore)}>
              Score: {overallScore}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Service</p>
              <p className={`text-2xl font-bold ${getScoreColor(85)}`}>85</p>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">+5</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Cost</p>
              <p className={`text-2xl font-bold ${getScoreColor(72)}`}>72</p>
              <div className="flex items-center justify-center mt-1">
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                <span className="text-xs text-red-600">-3</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Capital</p>
              <p className={`text-2xl font-bold ${getScoreColor(78)}`}>78</p>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-xs text-green-600">+2</span>
              </div>
            </div>
          </div>
          
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm" className="w-full">
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Supply Chain Triangle</CardTitle>
            <CardDescription>
              Your performance across Service, Cost, and Capital optimization
            </CardDescription>
          </div>
          <Badge {...getScoreBadge(overallScore)} className="text-lg px-4 py-1">
            Overall Score: {overallScore}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={triangleData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="dimension" 
                  className="text-sm"
                  tick={{ fill: '#6b7280' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: '#6b7280' }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Details */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Service Level</p>
                  <p className="text-sm text-gray-600">Fill rate & delivery performance</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getScoreColor(85)}`}>85</p>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+5%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Cost Efficiency</p>
                  <p className="text-sm text-gray-600">Margin & operational costs</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getScoreColor(72)}`}>72</p>
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-sm text-red-600">-3%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Capital Optimization</p>
                  <p className="text-sm text-gray-600">Working capital & inventory turns</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getScoreColor(78)}`}>78</p>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+2%</span>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/dashboard/analytics">
              <Button className="w-full">
                Analyze Performance
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}