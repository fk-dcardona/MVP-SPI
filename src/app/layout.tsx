import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AgentSystemInitializer } from "@/components/agents/AgentSystemInitializer";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supply Chain Intelligence",
  description: "Transform your data into strategic insights",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        <ErrorBoundary>
          <AgentSystemInitializer />
          {children}
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
