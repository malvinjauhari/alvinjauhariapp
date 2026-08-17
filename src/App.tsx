import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './app/page';
import { LoginPage } from './app/auth/login/page';
import { DashboardLayout } from './components/layout/AppLayout';
import { DashboardHome } from './app/dashboard/page';
import { LinksPage } from './app/dashboard/links/page';
import { NotesPage } from './app/dashboard/notes/page';
import { TemporaryNotesPage } from './app/dashboard/temporary-notes/page';
import { TasksPage } from './app/dashboard/tasks/page';
import { SettingsPage } from './app/dashboard/settings/page';
import { CategoriesPage } from './app/dashboard/categories/page';
import { DataManagementPage } from './app/dashboard/data/page';
import { ManagementPage } from './app/dashboard/management/page';
import { FinanceDashboardPage } from './app/dashboard/finance/page';
import { TransactionHistoryPage } from './app/dashboard/finance/transactions/page';
import { WalletsPage } from './app/dashboard/finance/wallets/page';
import { ThemeProvider } from './context/ThemeContext';
import { MinimalLoader } from './components/ui/MinimalLoader';
import { NotFoundPage } from './app/not-found/page';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <MinimalLoader />;
  if (!user) return <Navigate to="/auth/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="links" element={<LinksPage />} />
                <Route path="notes" element={<NotesPage />} />
                <Route path="temporary-notes" element={<TemporaryNotesPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="finance">
                  <Route index element={<FinanceDashboardPage />} />
                  <Route path="transactions" element={<TransactionHistoryPage />} />
                  <Route path="wallets" element={<WalletsPage />} />
                </Route>
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="data" element={<DataManagementPage />} />
                <Route path="management" element={<ManagementPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
