"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { triangleService } from "@/lib/services/supply-chain-triangle";
import { useState, useEffect, lazy, Suspense } from "react";
import { TriangleAnalysis } from "@/lib/services/supply-chain-triangle";
import { useTriangleScoresRealtime, useInventoryRealtime } from "@/hooks/useRealtime";
import { toast } from "@/components/ui/use-toast";

// Lazy load the heavy SupplyChainTriangle component
const SupplyChainTriangle = lazy(() => 
  import("@/components/triangle/SupplyChainTriangle").then(mod => ({ 
    default: mod.SupplyChainTriangle 
  }))
);

export default function DashboardPage() {
  const { userProfile, company, isLoading } = useAuth();
  const [triangleAnalysis, setTriangleAnalysis] = useState<TriangleAnalysis | null>(null);
  const [isLoadingTriangle, setIsLoadingTriangle] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (company?.id) {
      loadTriangleAnalysis();
    }
  }, [company?.id]);

  // Subscribe to real-time triangle score updates
  useTriangleScoresRealtime((payload) => {
    console.log('New triangle scores:', payload);
    // Reload analysis when new scores are calculated
    loadTriangleAnalysis();
    toast({
      title: "Triangle Updated",
      description: "Your Supply Chain Triangle has been recalculated with latest data.",
    });
  });

  // Subscribe to real-time inventory updates
  useInventoryRealtime((payload) => {
    console.log('Inventory update:', payload);
    // Show notification for critical inventory changes
    if (payload.eventType === 'UPDATE' && payload.new?.quantity < 10) {
      toast({
        title: "Low Inventory Alert",
        description: `${payload.new?.description} is running low (${payload.new?.quantity} units)`,
        variant: "destructive",
      });
    }
  });

  const loadTriangleAnalysis = async () => {
    if (!company?.id) return;
    
    setIsLoadingTriangle(true);
    try {
      const analysis = await triangleService.calculateTriangleScores(company.id);
      setTriangleAnalysis(analysis);
      // Check if we have any data
      const hasInventoryData = analysis.metrics.service.fillRate > 0 || 
                              analysis.metrics.capital.inventoryTurnover > 0;
      setHasData(hasInventoryData);
    } catch (error) {
      console.error('Failed to load triangle analysis:', error);
      setHasData(false);
    } finally {
      setIsLoadingTriangle(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userProfile?.full_name}!
        </h1>
        <p className="text-gray-600">
          Ready to analyze your supply chain data and optimize your operations.
        </p>
      </div>

      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time updates active</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Data</CardTitle>
            <CardDescription>
              Import your inventory and sales data to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/upload">
              <Button className="w-full">Upload CSV Files</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Analytics</CardTitle>
            <CardDescription>
              Explore your supply chain metrics and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/analytics">
              <Button variant="outline" className="w-full">
                Open Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>
              Manage your company profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full">Manage Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Supply Chain Triangle */}
      {hasData && triangleAnalysis && (
        <div className="mt-8">
          <Suspense fallback={
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading Supply Chain Triangle...</p>
                </div>
              </CardContent>
            </Card>
          }>
            <SupplyChainTriangle 
              analysis={triangleAnalysis} 
              onRefresh={loadTriangleAnalysis}
              isLoading={isLoadingTriangle}
            />
          </Suspense>
        </div>
      )}

      {/* No Data Message */}
      {!hasData && !isLoadingTriangle && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Get Started with Your Supply Chain Analysis</CardTitle>
            <CardDescription>
              Upload your inventory and sales data to see your Supply Chain Triangle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">
                Your Supply Chain Triangle will appear here once you upload data
              </p>
              <Link href="/dashboard/upload">
                <Button>Upload Your First Dataset</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Info */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Company Name</p>
                <p className="text-lg font-semibold">{company.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Industry</p>
                <p className="text-lg font-semibold">{company.industry}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 