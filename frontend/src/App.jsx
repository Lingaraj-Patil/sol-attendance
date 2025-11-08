import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterInstitute from './pages/RegisterInstitute';
import ConnectInstitute from './pages/ConnectInstitute';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import { SkeletonLoader } from './components/SkeletonLoader';
import { LazyLoadComponent } from './components/LazyLoadComponent';

// Lazy load landing page components for fast initial load
const LandingPage = lazy(() =>
  import('./components/LandingPage').then((module) => ({
    default: module.LandingPage,
  }))
);
const TopAnimatedLogo = lazy(() =>
  import('./components/TopAnimatedLogo').then((module) => ({
    default: module.TopAnimatedLogo,
  }))
);
const LandingNavbar = lazy(() => import('./components/LandingNavbar'));
const Footer = lazy(() =>
  import('./components/Footer').then((module) => ({ default: module.Footer }))
);
const NEP2020 = lazy(() =>
  import('./components/Nep').then((module) => ({ default: module.NEP2020 }))
);
const ChatBot = lazy(() => import('./components/ChatBot'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page Route - Fast loading with lazy components */}
          <Route
            path="/"
            element={
              <div className="relative min-h-screen">
                {/* Fixed Top Logo Header */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
                  <Suspense fallback={<div className="h-32" />}>
                    <TopAnimatedLogo />
                  </Suspense>
                </header>

                {/* Fixed Right Side Navbar */}
                <Suspense fallback={<div className="w-20" />}>
                  <LandingNavbar />
                </Suspense>

                {/* Main Content - Add right padding to account for navbar */}
                <main className="pt-40 pr-20">
                  {/* Page 1: Landing Page */}
                  <Suspense fallback={<SkeletonLoader />}>
                    <LandingPage />
                  </Suspense>

                  {/* Page 2: NEP 2020 - Lazy load when in viewport */}
                  <LazyLoadComponent fallback={<SkeletonLoader />}>
                    <Suspense fallback={<SkeletonLoader />}>
                      <NEP2020 />
                    </Suspense>
                  </LazyLoadComponent>
                </main>

                {/* Footer */}
                <Suspense fallback={<div className="h-64" />}>
                  <Footer />
                </Suspense>

                {/* ChatBot - Always available */}
                <ChatBot />
              </div>
            }
          />

          {/* Auth Routes - No Navbar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-institute" element={<RegisterInstitute />} />
          <Route path="/connect-institute" element={<ConnectInstitute />} />

          {/* Protected Routes - With Navbar */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Navbar />
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/marketplace"
            element={
              <PrivateRoute>
                <Navbar />
                <Marketplace />
              </PrivateRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;