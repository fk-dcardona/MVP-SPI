import { supabase } from './auth';

export async function uploadCSVData(
  userId: string,
  companyId: string,
  filename: string,
  fileSize: number,
  data: any[]
) {
  const { data: upload, error } = await supabase
    .from('csv_uploads')
    .insert({
      user_id: userId,
      company_id: companyId,
      filename,
      file_size: fileSize,
      data: data
    })
    .select()
    .single();

  return { upload, error };
}

export async function getCSVUploads(userId: string) {
  const { data, error } = await supabase
    .from('csv_uploads')
    .select('*')
    .eq('user_id', userId)
    .order('upload_date', { ascending: false });

  return { data, error };
}

export async function getCSVData(uploadId: string) {
  const { data, error } = await supabase
    .from('csv_uploads')
    .select('data')
    .eq('id', uploadId)
    .single();

  return { data: data?.data, error };
}