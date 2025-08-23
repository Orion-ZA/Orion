import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import TrailExplorer from './pages/TrailExplorer';
import TrailSubmission from './pages/TrailSubmission';
import ReviewsMedia from './pages/ReviewsMedia';
import MyTrails from './pages/MyTrails';
import AlertsUpdates from './pages/AlertsUpdates';

function App() {
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

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explorer" element={<TrailExplorer />} />
          <Route path="/submit" element={<TrailSubmission />} />
          <Route path="/reviews" element={<ReviewsMedia />} />
          <Route path="/mytrails" element={<MyTrails />} />
          <Route path="/alerts" element={<AlertsUpdates />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
