import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { router } from './router';

export const App: React.FC = () => {
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        // Send beacon to purge backend files on window/site close
        const rawBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) || '';
        const base = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
        navigator.sendBeacon(`${base}/api/v1/datasets/session/purge`);
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
