'use client'

import { useEffect, useState } from 'react'
import { FileSpreadsheet, Calendar, Package, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface UploadRecord {
  id: string
  file_name: string
  file_type: 'inventory' | 'sales'
  row_count: number
  uploaded_at: string
  status: 'processing' | 'completed' | 'failed'
}

export function UploadHistory() {
  const [uploads, setUploads] = useState<UploadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUploadHistory()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('upload-history')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'data_uploads',
        },
        (payload) => {
          fetchUploadHistory()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchUploadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('data_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setUploads(data || [])
    } catch (error) {
      console.error('Error fetching upload history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-muted-foreground">Loading history...</div>
      </div>
    )
  }

  if (uploads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No uploads yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upload your first CSV file to get started
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {upload.file_type === 'inventory' ? (
                  <Package className="h-4 w-4 text-blue-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {upload.file_name}
                </span>
              </div>
              <Badge
                variant={
                  upload.status === 'completed' ? 'default' :
                  upload.status === 'processing' ? 'secondary' :
                  'destructive'
                }
                className="text-xs"
              >
                {upload.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(upload.uploaded_at), { addSuffix: true })}
              </div>
              <div>
                {upload.row_count.toLocaleString()} rows
              </div>
              <Badge variant="outline" className="text-xs">
                {upload.file_type}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}