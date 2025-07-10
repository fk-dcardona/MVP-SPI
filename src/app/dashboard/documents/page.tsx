import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documents | Finkargo Analytics',
  description: 'Manage import/export documentation',
};

export default function DocumentsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
        <p className="text-muted-foreground mt-2">
          Organize and track your import/export documentation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Document Library
          </CardTitle>
          <CardDescription>
            Your trade documentation hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Document management features coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}