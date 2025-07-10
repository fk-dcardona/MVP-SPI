"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

// Lazy load all heavy analytics components
const InventoryAnalytics = lazy(() => 
  import("@/components/analytics/InventoryAnalytics").then(mod => ({ 
    default: mod.InventoryAnalytics 
  }))
);

const SalesAnalytics = lazy(() => 
  import("@/components/analytics/SalesAnalytics").then(mod => ({ 
    default: mod.SalesAnalytics 
  }))
);

const SupplierScorecard = lazy(() => 
  import("@/components/supplier/SupplierScorecard").then(mod => ({ 
    default: mod.SupplierScorecard 
  }))
);

const FinancialMetrics = lazy(() => 
  import("@/components/analytics/FinancialMetrics").then(mod => ({ 
    default: mod.FinancialMetrics 
  }))
);

// Loading component for analytics
const AnalyticsLoading = () => (
  <Card>
    <CardContent className="py-12">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading analytics data...</p>
      </div>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const { company, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("inventory");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No company data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Deep insights into your supply chain performance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Suspense fallback={<AnalyticsLoading />}>
            <InventoryAnalytics companyId={company.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Suspense fallback={<AnalyticsLoading />}>
            <SalesAnalytics companyId={company.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance</CardTitle>
              <CardDescription>
                Supplier scorecards and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Suspense fallback={<AnalyticsLoading />}>
            <FinancialMetrics companyId={company.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}