'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import Papa from 'papaparse'
import { validateCSVStructure } from '@/lib/validators/csv-validator'

interface UploadState {
  status: 'idle' | 'parsing' | 'validating' | 'uploading' | 'success' | 'error'
  progress: number
  message?: string
  fileType?: 'inventory' | 'sales'
}

export function FileUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  })

  const resetState = () => {
    setUploadState({ status: 'idle', progress: 0 })
  }

  const processFile = useCallback(async (file: File) => {
    try {
      setUploadState({ status: 'parsing', progress: 10 })

      // Parse CSV
      const result = await new Promise<Papa.ParseResult<any>>((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: (error) => {
            throw new Error(`Parse error: ${error.message}`)
          },
        })
      })

      setUploadState({ status: 'validating', progress: 40 })

      // Validate structure
      const validation = validateCSVStructure(result.data, file.name)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      setUploadState({ 
        status: 'uploading', 
        progress: 60,
        fileType: validation.fileType 
      })

      // Upload to API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', validation.fileType)
      formData.append('rowCount', result.data.length.toString())

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      setUploadState({
        status: 'success',
        progress: 100,
        message: `Successfully uploaded ${result.data.length} ${validation.fileType} records`,
        fileType: validation.fileType,
      })

      // Reset after 3 seconds
      setTimeout(resetState, 3000)
    } catch (error) {
      setUploadState({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Upload failed',
      })
    }
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0])
    }
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: uploadState.status !== 'idle' && uploadState.status !== 'error',
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          uploadState.status === 'idle' && 'hover:border-primary/50',
          uploadState.status === 'error' && 'border-destructive',
          uploadState.status === 'success' && 'border-green-500',
          (uploadState.status !== 'idle' && uploadState.status !== 'error') && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-2">
          {uploadState.status === 'idle' && (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
            </>
          )}

          {uploadState.status === 'parsing' && (
            <>
              <FileSpreadsheet className="h-10 w-10 text-primary animate-pulse" />
              <p className="text-sm font-medium">Parsing CSV file...</p>
            </>
          )}

          {uploadState.status === 'validating' && (
            <>
              <FileSpreadsheet className="h-10 w-10 text-primary animate-pulse" />
              <p className="text-sm font-medium">Validating data structure...</p>
            </>
          )}

          {uploadState.status === 'uploading' && (
            <>
              <Upload className="h-10 w-10 text-primary animate-pulse" />
              <p className="text-sm font-medium">Uploading {uploadState.fileType} data...</p>
            </>
          )}

          {uploadState.status === 'success' && (
            <>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-green-600">{uploadState.message}</p>
            </>
          )}

          {uploadState.status === 'error' && (
            <>
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm font-medium text-destructive">Upload failed</p>
            </>
          )}
        </div>
      </div>

      {uploadState.status !== 'idle' && uploadState.status !== 'error' && (
        <Progress value={uploadState.progress} className="h-2" />
      )}

      {uploadState.status === 'error' && uploadState.message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadState.message}</AlertDescription>
        </Alert>
      )}

      {uploadState.status === 'error' && (
        <Button onClick={resetState} variant="outline" className="w-full">
          Try Again
        </Button>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Supported formats:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Inventory CSV: SKU, Description, Quantity, Unit Cost</li>
          <li>Sales CSV: Date, SKU, Quantity, Revenue</li>
        </ul>
      </div>
    </div>
  )
}