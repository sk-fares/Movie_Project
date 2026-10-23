import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { StatsModal } from './components/StatsModal';
import { HomePage } from './pages/HomePage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { VideoPlayerPage } from './pages/VideoPlayerPage';
import { AddMoviePage } from './pages/AddMoviePage';
import { EditMoviePage } from './pages/EditMoviePage';

export function App() {
  const [statsOpen, setStatsOpen] = useState(false);
  const location = useLocation();

  // Don't render the navigation bar in theater mode
  const isWatchPage = location.pathname.startsWith('/watch/');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isWatchPage && <Navbar onOpenStats={() => setStatsOpen(true)} />}

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:id" element={<MovieDetailsPage />} />
          <Route path="/watch/:id" element={<VideoPlayerPage />} />
          <Route path="/add" element={<AddMoviePage />} />
          <Route path="/edit/:id" element={<EditMoviePage />} />
        </Routes>
      </main>

      {/* Global Library Statistics Modal */}
      <StatsModal isOpen={statsOpen} onClose={() => setStatsOpen(false)} />

      {/* Footer (omitted on watch page) */}
      {!isWatchPage && (
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
            <div>Single-user private offline/local edition • HTML5 Range Streaming</div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
