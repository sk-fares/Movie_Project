import React, { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { StatsModal } from './components/StatsModal';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { VideoPlayerPage } from './pages/VideoPlayerPage';
import { AddMoviePage } from './pages/AddMoviePage';
import { EditMoviePage } from './pages/EditMoviePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Route Guard: Ensures only the CineVault Owner can add or edit movies
const OwnerRoute = ({ children }) => {
  const { isOwner, loading, isAuthenticated } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isOwner) return <Navigate to="/" replace />;
  return children;
};

export function App() {
  const [statsOpen, setStatsOpen] = useState(false);
  const location = useLocation();

  // Don't render navigation bar or footer in theater mode or auth pages
  const isWatchPage = location.pathname.startsWith('/watch/');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const hideChrome = isWatchPage || isAuthPage;

  return (
    <AuthProvider>
      <ToastProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {!hideChrome && <Navbar onOpenStats={() => setStatsOpen(true)} />}

          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/movie/:id" element={<MovieDetailsPage />} />
              <Route path="/watch/:id" element={<VideoPlayerPage />} />
              <Route
                path="/add"
                element={
                  <OwnerRoute>
                    <AddMoviePage />
                  </OwnerRoute>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <OwnerRoute>
                    <EditMoviePage />
                  </OwnerRoute>
                }
              />
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Global Library Statistics Modal */}
          <StatsModal isOpen={statsOpen} onClose={() => setStatsOpen(false)} />

          {/* Footer */}
          {!hideChrome && (
            <footer
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '2.5rem 0',
                backgroundColor: '#0e0e0e',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}
            >
              <div
                className="container"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>CineVault</span> — Personal Movie Library &
                  Streaming System
                </div>
                <div>Single-user private edition • PWA Ready • Role Protected</div>
              </div>
            </footer>
          )}
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
