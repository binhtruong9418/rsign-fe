import React from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPageV2 from './pages/DashboardPageV2';
import DocumentDetailPageV2 from './pages/DocumentDetailPageV2';
import MultiDocumentDetailPage from './pages/MultiDocumentDetailPage';
import SigningPageV2 from './pages/SigningPageV2';
import MultiSigningPage from './pages/MultiSigningPage';
import SigningSuccessPage from './pages/SigningSuccessPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* V2 Signing Workflow - Outside Layout (full screen) */}
          <Route path="/sign/:sessionId" element={<ProtectedRoute><SigningPageV2 /></ProtectedRoute>} />
          <Route path="/multi-sign/:sessionId" element={<ProtectedRoute><MultiSigningPage /></ProtectedRoute>} />
          <Route path="/signing-success" element={<ProtectedRoute><SigningSuccessPage /></ProtectedRoute>} />

          {/* Dashboard & Document Details - Inside Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPageV2 /></ProtectedRoute>} />
            <Route path="/documents/:documentSignerId" element={<ProtectedRoute><DocumentDetailPageV2 /></ProtectedRoute>} />
            <Route path="/multi-documents/:documentId" element={<ProtectedRoute><MultiDocumentDetailPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

