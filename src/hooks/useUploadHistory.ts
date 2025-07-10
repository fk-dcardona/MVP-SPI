import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface UploadRecord {
  id: string;
  file_name: string;
  file_type: 'inventory' | 'sales';
  row_count: number;
  uploaded_at: string;
  status: 'processing' | 'completed' | 'failed';
}

export function useUploadHistory() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient();

  const fetchUploadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUploads([]);
        return;
      }

      const { data, error } = await supabase
        .from('data_uploads')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setUploads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch upload history'));
      setUploads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadHistory();

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
        () => {
          fetchUploadHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    uploads,
    loading,
    error,
    refetch: fetchUploadHistory
  };
}