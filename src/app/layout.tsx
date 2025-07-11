import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProvider from "./ClientProvider";
// Temporarily removed complex components for clean refactor
// import { AgentSystemInitializer } from "@/components/agents/AgentSystemInitializer";
// import { Toaster } from "@/components/ui/toaster";
const inter = Inter({
  variable: "--font-inter",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientProvider>
          {children}
        </ClientProvider>
        {/* <Toaster /> */}
      </body>
    </html>
  );
}
