'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/core/auth';
import { getCSVUploads, getCSVData } from '@/lib/core/database';

export default function CSVViewPage() {
  const [user, setUser] = useState<any>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<any>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      loadUploads(user.id);
    } catch (err) {
      console.error('Auth check failed:', err);
      window.location.href = '/core/auth/login';
    }
  };

  const loadUploads = async (userId: string) => {
    try {
      const { data, error } = await getCSVUploads(userId);
      
      if (error) {
        setMessage(`Error loading uploads: ${error.message}`);
      } else {
        setUploads(data || []);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewData = async (uploadId: string) => {
    try {
      const { data, error } = await getCSVData(uploadId);
      
      if (error) {
        setMessage(`Error loading data: ${error.message}`);
      } else {
        setCsvData(data || []);
        setSelectedUpload(uploads.find(u => u.id === uploadId));
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '1200px',
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
        <h1>View CSV Data</h1>
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
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Uploads List */}
        <div style={{ 
          padding: '1rem',
          border: '1px solid #eee',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa',
          height: 'fit-content'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Uploaded Files</h3>
          
          {uploads.length === 0 ? (
            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
              No CSV files uploaded yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {uploads.map((upload) => (
                <button
                  key={upload.id}
                  onClick={() => handleViewData(upload.id)}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: selectedUpload?.id === upload.id ? '#0070f3' : '#fff',
                    color: selectedUpload?.id === upload.id ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{upload.filename}</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {formatDate(upload.upload_date)}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    {(upload.file_size / 1024).toFixed(2)} KB
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Display */}
        <div>
          {selectedUpload ? (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
                Data from: {selectedUpload.filename}
              </h3>
              
              {csvData.length > 0 ? (
                <div style={{ 
                  overflow: 'auto',
                  border: '1px solid #eee',
                  borderRadius: '4px'
                }}>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.9rem'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        {Object.keys(csvData[0]).map((header) => (
                          <th key={header} style={{ 
                            padding: '0.75rem',
                            borderBottom: '1px solid #eee',
                            textAlign: 'left',
                            fontWeight: 'bold'
                          }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 100).map((row, index) => (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #eee',
                          backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                        }}>
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} style={{ 
                              padding: '0.75rem',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {csvData.length > 100 && (
                    <div style={{ 
                      padding: '0.75rem',
                      backgroundColor: '#e7f3ff',
                      borderTop: '1px solid #eee',
                      textAlign: 'center',
                      color: '#0066cc'
                    }}>
                      Showing first 100 rows of {csvData.length} total rows
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                  No data found for this upload.
                </p>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '2rem',
              textAlign: 'center',
              color: '#6c757d',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #eee'
            }}>
              <p>Select a file from the list to view its data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}