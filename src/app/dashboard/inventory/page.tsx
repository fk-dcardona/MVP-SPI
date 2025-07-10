import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Inventory | Finkargo Analytics',
  description: 'Track and manage your inventory',
};

export default function InventoryPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">
          Track stock levels, movements, and optimize your inventory
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory Overview
          </CardTitle>
          <CardDescription>
            Your complete inventory management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Inventory management features coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}