import { ReactNode } from "react";
import { Metadata } from "next";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export const metadata: Metadata = {
  title: "Dashboard - Supply Chain Intelligence",
  description: "Your supply chain analytics dashboard",
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
} 