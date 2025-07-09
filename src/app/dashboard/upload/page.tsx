import { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { FileUpload } from '@/components/upload/file-upload'
import { UploadHistory } from '@/components/upload/upload-history'

export const metadata: Metadata = {
  title: 'Upload Data | Finkargo Analytics',
  description: 'Upload inventory and sales CSV files for analysis',
}

export default function UploadPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Upload</h1>
          <p className="text-muted-foreground mt-2">
            Upload your inventory and sales CSV files to start analyzing your supply chain performance
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upload New Files</h2>
            <FileUpload />
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
            <UploadHistory />
          </Card>
        </div>
      </div>
    </div>
  )
}