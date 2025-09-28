import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import CookieBanner from './components/CookieBanner';
import { injectSEOConfig } from './utils/seoInjector';
import { debugLog } from './config/environment';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calculator from './pages/Calculator';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Upgrade from './pages/Upgrade';
import HelpCenter from './pages/HelpCenter';
import Contact from './pages/Contact';
import ReportBug from './pages/ReportBug';
import SuggestFeature from './pages/SuggestFeature';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import UpgradeSuccess from './pages/UpgradeSuccess';
import UpgradeCancel from './pages/UpgradeCancel';
import AdminPanel from './pages/AdminPanel';
import PixPayment from './pages/PixPayment';

function App() {
  // Injetar configurações de SEO baseadas no ambiente
  useEffect(() => {
    injectSEOConfig();
    debugLog('Configurações de SEO injetadas para o ambiente atual');
  }, []);

  return (
    <AuthProvider>
      <PortfolioProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <main className="container mx-auto px-4 py-6">
              <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* Rotas protegidas */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/upgrade" element={
                  <ProtectedRoute>
                    <Upgrade />
                  </ProtectedRoute>
                } />
                <Route path="/upgrade/success" element={
                  <ProtectedRoute>
                    <UpgradeSuccess />
                  </ProtectedRoute>
                } />
                <Route path="/upgrade/cancel" element={
                  <ProtectedRoute>
                    <UpgradeCancel />
                  </ProtectedRoute>
                } />
                <Route path="/help-center" element={
                  <ProtectedRoute>
                    <HelpCenter />
                  </ProtectedRoute>
                } />
                <Route path="/contact" element={
                  <ProtectedRoute>
                    <Contact />
                  </ProtectedRoute>
                } />
                <Route path="/report-bug" element={
                  <ProtectedRoute>
                    <ReportBug />
                  </ProtectedRoute>
                } />
                <Route path="/suggest-feature" element={
                  <ProtectedRoute>
                    <SuggestFeature />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                } />
                <Route path="/pix-payment" element={
                  <ProtectedRoute>
                    <PixPayment />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            
            {/* Cookie Banner */}
            <CookieBanner />
          </div>
        </Router>
      </PortfolioProvider>
    </AuthProvider>
  );
}

export default App;
