import React from 'react';
import '../Navbar.css';

export default function LandingNavbar({ onLogin }) {
  return (
  <header className="navbar">
      <div className="nav-inner">
    <a className="brand" href="#home">
          <span className="brand-icon" aria-hidden>🌌</span>
          <span className="brand-text">Orion</span>
    </a>
        <nav className="nav-links desktop-nav">
          <a href="#explorer">Trail Explorer</a>
          <a href="#submit">Trail Submission</a>
          <a href="#reviews">Reviews & Media</a>
        </nav>
        <div className="nav-actions desktop-actions">
          <button className="nav-login-btn" onClick={onLogin}>Login</button>
        </div>
      </div>
    </header>
  );
}
