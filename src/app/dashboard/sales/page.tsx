import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sales | Finkargo Analytics',
  description: 'Monitor sales performance and revenue',
};

export default function SalesPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sales Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Monitor revenue, orders, and sales performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Sales Overview
          </CardTitle>
          <CardDescription>
            Your sales performance dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Sales analytics features coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}