import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { LoaderProvider, useLoader } from './components/LoaderContext.js';
import FullScreenLoader from './components/FullScreenLoader.js';


import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateProfile from './pages/CreateProfile';
import ProtectedRoute from './components/ProtectedRoute';

import TrailExplorer from './pages/TrailExplorer';
import TrailSubmission from './pages/TrailSubmission';
import ReviewsMedia from './pages/ReviewsMedia';
import MyTrails from './pages/MyTrails';
import AlertsUpdates from './pages/AlertsUpdates';

function AppContent() {
  const location = useLocation();
  const hideNavFooter = ['/login', '/signup'].includes(location.pathname);

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

  const { show } = useLoader();
  return (
    <div className="app-shell">
      {show && <FullScreenLoader />}
      {!hideNavFooter && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
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
          <Route path="/explorer" element={<TrailExplorer />} />
          <Route path="/submit" element={<TrailSubmission />} />
          <Route path="/reviews" element={<ReviewsMedia />} />
          <Route path="/mytrails" element={<MyTrails />} />
          <Route path="/alerts" element={<AlertsUpdates />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
      {!hideNavFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <LoaderProvider>
      <Router>
        <AppContent />
      </Router>
    </LoaderProvider>
  );
}

export default App;