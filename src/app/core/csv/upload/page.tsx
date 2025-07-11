'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getProfile } from '@/lib/core/auth';
import { uploadCSVData } from '@/lib/core/database';

export default function CSVUploadPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user, error } = await getCurrentUser();
      
      if (error || !user) {
        window.location.href = '/core/auth/login';
        return;
      }

      setUser(user);

      const { data: profileData } = await getProfile(user.id);
      setProfile(profileData);
    } catch (err) {
      console.error('Auth check failed:', err);
      window.location.href = '/core/auth/login';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setMessage('');
    } else {
      setMessage('Please select a valid CSV file');
      setFile(null);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  };

  const handleUpload = async () => {
    if (!file || !user || !profile) return;

    setUploading(true);
    setProgress(0);
    setMessage('');

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const text = await file.text();
      const data = parseCSV(text);

      setProgress(95);

      const { upload, error } = await uploadCSVData(
        user.id,
        profile.company_id,
        file.name,
        file.size,
        data
      );

      clearInterval(progressInterval);

      if (error) {
        setMessage(`Upload failed: ${error.message}`);
        setProgress(0);
      } else {
        setProgress(100);
        setMessage(`Successfully uploaded ${data.length} rows from ${file.name}`);
        setFile(null);
        
        // Reset file input
        const fileInput = document.getElementById('csv-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #eee'
      }}>
        <h1>Upload CSV File</h1>
        <button
          onClick={() => window.location.href = '/core/dashboard'}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>

      {message && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          backgroundColor: message.includes('Error') || message.includes('failed') ? '#fee' : '#efe',
          border: `1px solid ${message.includes('Error') || message.includes('failed') ? '#fcc' : '#cfc'}`,
          borderRadius: '4px',
          color: message.includes('Error') || message.includes('failed') ? '#c33' : '#363'
        }}>
          {message}
        </div>
      )}

      <div style={{ 
        padding: '2rem',
        border: '2px dashed #ccc',
        borderRadius: '8px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ marginBottom: '1rem' }}
        />
        
        {file && (
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Selected file:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              width: '100%', 
              backgroundColor: '#e9ecef', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '20px', 
                backgroundColor: '#0070f3',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <p style={{ marginTop: '0.5rem' }}>{progress}% Complete</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: !file || uploading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !file || uploading ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </div>

      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#e7f3ff',
        borderRadius: '4px',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ marginTop: 0 }}>Instructions</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Select a CSV file to upload</li>
          <li>The file will be parsed and stored in the database</li>
          <li>You can view uploaded data from the dashboard</li>
          <li>Maximum file size: 10MB</li>
        </ul>
      </div>
    </div>
  );
}