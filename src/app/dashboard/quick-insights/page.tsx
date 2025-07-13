'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { FileUpload } from '@/components/upload/file-upload'
import { ImmediateValueDashboard } from '@/components/analytics/ImmediateValueDashboard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InventoryRow, SalesRow } from '@/lib/validators/csv-validator'
import { 
  Upload, 
  BarChart3, 
  FileSpreadsheet,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export default function QuickInsightsPage() {
  const [inventoryData, setInventoryData] = useState<InventoryRow[]>([])
  const [salesData, setSalesData] = useState<SalesRow[]>([])
  const [hasData, setHasData] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')

  // Mock data handler for file upload success
  const handleUploadSuccess = (data: any[], fileType: 'inventory' | 'sales') => {
    if (fileType === 'inventory') {
      setInventoryData(data as InventoryRow[])
    } else {
      setSalesData(data as SalesRow[])
    }

    // Check if we have both datasets
    if ((fileType === 'inventory' && salesData.length > 0) || 
        (fileType === 'sales' && inventoryData.length > 0)) {
      setHasData(true)
      setActiveTab('insights')
    }
  }

  const handleShare = () => {
    // TODO: Implement sharing functionality
    console.log('Sharing insights...')
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quick Insights</h1>
            <p className="text-muted-foreground mt-2">
              Upload your inventory and sales data to get immediate actionable insights
            </p>
          </div>
          {hasData && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab(activeTab === 'upload' ? 'insights' : 'upload')}
            >
              {activeTab === 'upload' ? (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Insights
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload More Data
                </>
              )}
            </Button>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger value="insights" disabled={!hasData} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              View Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Status */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${inventoryData.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium">Inventory Data</span>
                {inventoryData.length > 0 && (
                  <span className="text-xs text-muted-foreground">({inventoryData.length} items)</span>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${salesData.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium">Sales Data</span>
                {salesData.length > 0 && (
                  <span className="text-xs text-muted-foreground">({salesData.length} records)</span>
                )}
              </div>
              {hasData && (
                <div className="ml-auto flex items-center gap-2 text-green-600">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Ready for insights!</span>
                </div>
              )}
            </div>

            {/* Upload Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Inventory Data</h2>
                  {inventoryData.length > 0 && (
                    <span className="ml-auto text-sm text-green-600 font-medium">✓ Uploaded</span>
                  )}
                </div>
                <UploadWrapper 
                  onSuccess={(data) => handleUploadSuccess(data, 'inventory')}
                  acceptedFileType="inventory"
                />
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Sales Data</h2>
                  {salesData.length > 0 && (
                    <span className="ml-auto text-sm text-green-600 font-medium">✓ Uploaded</span>
                  )}
                </div>
                <UploadWrapper 
                  onSuccess={(data) => handleUploadSuccess(data, 'sales')}
                  acceptedFileType="sales"
                />
              </Card>
            </div>

            {/* Sample Data Info */}
            <Card className="p-6 bg-muted/50">
              <h3 className="font-semibold mb-2">Don&apos;t have your data ready?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download our sample templates to see the expected format and test the platform
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Inventory Template
                </Button>
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Sales Template
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            {hasData && (
              <ImmediateValueDashboard 
                inventoryData={inventoryData}
                salesData={salesData}
                onShare={handleShare}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Wrapper component to handle the file upload integration
function UploadWrapper({ 
  onSuccess, 
  acceptedFileType 
}: { 
  onSuccess: (data: any[]) => void
  acceptedFileType: 'inventory' | 'sales'
}) {
  // This would need to be integrated with the actual FileUpload component
  // For now, it's a placeholder that shows the concept
  return (
    <div className="space-y-4">
      <FileUpload />
      {/* TODO: Connect FileUpload success callback to onSuccess prop */}
    </div>
  )
}