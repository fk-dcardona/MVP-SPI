import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Suppliers | Finkargo Analytics',
  description: 'Manage supplier relationships and performance',
};

export default function SuppliersPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Supplier Management</h1>
        <p className="text-muted-foreground mt-2">
          Track supplier performance and manage relationships
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Supplier Directory
          </CardTitle>
          <CardDescription>
            Your supplier network and scorecards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Supplier management features coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}