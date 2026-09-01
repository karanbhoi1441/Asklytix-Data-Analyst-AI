import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/routing/ProtectedRoute';

import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { ForgotPasswordPage } from '@/pages/ForgotPassword';

import { ConnectDataSourcePage } from '@/pages/ConnectDataSource';
import { DashboardPage } from '@/pages/Dashboard';
import { AskAIPage } from '@/pages/AskAI';
import { DatasetsPage } from '@/pages/Datasets';
import { DatasetDetailPage } from '@/pages/Datasets/[datasetId]';
import { AnalysisPage } from '@/pages/Analysis';
import { VisualizationsPage } from '@/pages/Visualizations';
import { DashboardsPage } from '@/pages/Dashboards';
import { ForecastingPage } from '@/pages/Forecasting';
import { ReportsPage } from '@/pages/Reports';
import { ChatHistoryPage } from '@/pages/ChatHistory';
import { SettingsPage } from '@/pages/Settings';

export const router = createBrowserRouter([
  // Root redirect
  { path: '/', element: <Navigate to="/login" replace /> },

  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Protected Routes
  {
    element: <ProtectedRoute />,
    children: [
      // Standalone clean Connect Data Source page (Initial landing & upload)
      { path: '/connect', element: <ConnectDataSourcePage /> },
      { path: '/upload', element: <ConnectDataSourcePage /> },
      { path: '/data-sources', element: <ConnectDataSourcePage /> },

      // Full App Shell workspace routes
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/ask', element: <AskAIPage /> },
          { path: '/datasets', element: <DatasetsPage /> },
          { path: '/datasets/:datasetId', element: <DatasetDetailPage /> },
          { path: '/analysis', element: <AnalysisPage /> },
          { path: '/visualizations', element: <VisualizationsPage /> },
          { path: '/dashboards', element: <DashboardsPage /> },
          { path: '/forecasting', element: <ForecastingPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/history', element: <ChatHistoryPage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/login" replace /> },
]);
