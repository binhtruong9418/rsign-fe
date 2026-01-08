import React from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import CompletedDocumentsPage from './pages/CompletedDocumentsPage';
import CompletedDocumentDetailPage from './pages/CompletedDocumentDetailPage';
import SigningPage from './pages/SigningPage';
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

          {/* Signing Workflow */}
          <Route path="/sign/:sessionId" element={<ProtectedRoute><SigningPage /></ProtectedRoute>} />
          <Route path="/signing-success" element={<ProtectedRoute><SigningSuccessPage /></ProtectedRoute>} />

          {/* Dashboard & Document Details */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/documents/:documentId" element={<ProtectedRoute><DocumentDetailPage /></ProtectedRoute>} />
            <Route path="/completed" element={<ProtectedRoute><CompletedDocumentsPage /></ProtectedRoute>} />
            <Route path="/documents/:documentId/completed" element={<ProtectedRoute><CompletedDocumentDetailPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

