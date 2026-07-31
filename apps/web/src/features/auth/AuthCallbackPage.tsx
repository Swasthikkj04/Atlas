import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api/client';

export const AuthCallbackPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function completeAuth() {
      try {
        await apiClient.get('/api/v1/auth/me');
        window.location.href = '/dashboard';
      } catch (err: any) {
        setError('Authentication failed. Please log in again.');
      }
    }

    void completeAuth();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {error ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <a
            href="/"
            style={{
              color: '#38bdf8',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Return to Home
          </a>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1.5rem auto',
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(3600deg); }
            }
          `}</style>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            Authenticating with Nebula...
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Finalizing your secure session
          </p>
        </div>
      )}
    </div>
  );
};
