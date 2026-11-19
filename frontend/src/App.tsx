import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { OmniScan } from './pages/OmniScan';
import { Dashboard } from './pages/Dashboard';

// Root redirect based on authentication state
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  return user ? <Navigate to="/omniscan" replace /> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root & Authentication Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Primary Feature: OmniScan Multi-Modal Digital Forensics */}
          <Route
            path="/omniscan"
            element={
              <ProtectedRoute>
                <OmniScan />
              </ProtectedRoute>
            }
          />

          {/* User Operations: Dashboard, Wallet & Analysis History */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Gracefully redirect any discontinued routes to OmniScan */}
          <Route path="/home" element={<Navigate to="/omniscan" replace />} />
          <Route path="/linklens" element={<Navigate to="/omniscan" replace />} />
          <Route path="/websentinel" element={<Navigate to="/omniscan" replace />} />
          <Route path="/qrguard" element={<Navigate to="/omniscan" replace />} />
          <Route path="/reorigin" element={<Navigate to="/omniscan" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/omniscan" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
