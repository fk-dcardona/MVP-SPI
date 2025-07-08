"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { userProfile, company, isLoading } = useAuth();

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
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
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