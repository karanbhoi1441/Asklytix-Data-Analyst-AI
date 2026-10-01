import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { DatasetProvider } from '@/contexts/DatasetContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { router } from './router';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DatasetProvider>
          <RouterProvider router={router} />
        </DatasetProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
