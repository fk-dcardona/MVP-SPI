'use client';

import { ReactNode } from 'react';
import { CommandPalette } from '@/components/CommandPalette';

interface DashboardLayoutClientProps {
  children: ReactNode;
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
}