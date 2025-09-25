import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { LoaderProvider, useLoader } from './components/LoaderContext.js';
import FullScreenLoader from './components/FullScreenLoader.js';
import { ToastProvider } from './components/ToastContext';
import faviconAsset from './assets/orion_logo_clear.png';


import Login from './pages/Login';
import Welcome from './pages/Welcome';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateProfile from './pages/CreateProfile';
import ProtectedRoute from './components/ProtectedRoute';

import Trails from './pages/Trails';
import ReviewsMedia from './pages/ReviewsMedia';
import MyTrails from './pages/MyTrails';
import AlertsUpdates from './pages/AlertsUpdates';

import Feedback from './pages/Feedback';
import ProfilePage from './pages/ProfilePage';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';

function AppContent() {
  const location = useLocation();
  const hideNavFooter = ['/login', '/signup'].includes(location.pathname);
  const hideFooter = ['/login', '/signup', '/trails'].includes(location.pathname);
  const firstRenderRef = useRef(true);
  const isLanding = location.pathname === '/';
  const isTrails = location.pathname === '/trails';

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const { show, triggerLoader } = useLoader();

  // Trigger loader on route changes (skip first render)
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const id = setTimeout(() => triggerLoader(700), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  return (
    <div className="app-shell">
      {show && <FullScreenLoader />}
      {!hideNavFooter && <Navbar />}
  <main className="page-fade" key={location.pathname} style={isLanding || isTrails ? { paddingTop: 0 } : undefined}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/trails" element={<Trails />} />
          <Route path="/reviews" element={<ReviewsMedia />} />
          <Route path="/mytrails" element={<MyTrails />} />
          <Route path="/alerts" element={<AlertsUpdates />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="*" element={<Welcome />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  useEffect(() => {
    const existing = document.querySelector("link[rel='icon']");
    const link = existing || document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.sizes = '192x192';
    link.href = faviconAsset;
    if (!existing) {
      document.head.appendChild(link);
    }
  }, []);

  return (
    <LoaderProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </LoaderProvider>
  );
}

export default App;