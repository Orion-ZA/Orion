import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import LogoutButton from './LogoutButton.js';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useToast } from './ToastContext';
import ProfileIcon from './ProfileIcon';
import SettingsIcon from './SettingsIcon';
import FeedbackIcon from './FeedbackIcon';
import HelpCenterIcon from './HelpCenterIcon';
import OrionLogo from '../assets/orion_logo_clear.png';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const closeTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingRoute = location.pathname === '/';
  const isOverlayRoute = isLandingRoute || location.pathname === '/trails';
  const { show } = useToast();
  
  // Login via route; Google sign-in available on Login page

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // --- Auth (Google only) ---
  const googleProviderRef = useRef(new GoogleAuthProvider());
  const handleGoogleLogin = async () => {
    if (isAuthLoading || user) return;
    setIsAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProviderRef.current);
      show('Logged in with Google', { type: 'success' });
    } catch (err) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProviderRef.current);
          return; // redirect flow
        } catch (rErr) {
          // eslint-disable-next-line no-console
          console.error('Redirect sign-in failed', rErr);
          show(rErr.message || 'Google sign-in failed', { type: 'error' });
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('Google sign-in error', err);
        show(err.message || 'Google sign-in failed', { type: 'error' });
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // --- Profile dropdown hover persistence (delay close) ---
  const openProfileDropdown = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setProfileOpen(true);
  };
  const scheduleProfileClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setProfileOpen(false), 220);
  };

  const closeMobileMenu = () => setOpen(false);

  const handleGuardedNavigation = (destination) => {
    if (!user) {
      show('Please log in first', { type: 'warn' });
    } else {
      const target =
        typeof destination === 'string'
          ? { to: destination }
          : destination && typeof destination === 'object'
            ? destination
            : null;

      if (target?.to) {
        navigate(target.to, target.state ? { state: target.state } : undefined);
      }
    }
  };

  const scrollToSection = (target) => {
    closeMobileMenu();
    const id = target.startsWith('#') ? target.slice(1) : target;
    const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (el) {
      const prefersReducedMotion =
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
          ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
          : false;
      el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const landingLinks = [
    { label: 'Home', target: 'home' },
    { label: 'About', target: 'about' },
    { label: 'Trail Explorer', target: 'explorer' },
    { label: 'Trail Submission', target: 'submit' },
    { label: 'Reviews & Media', target: 'reviews' },
    { label: 'Activities', target: 'activities' },
  ];

  const appLinks = [
    { label: 'Trail Explorer', type: 'nav', to: '/trails' },
    {
      label: 'Trail Submission',
      type: 'guarded',
      to: '/trails',
      state: { openSubmission: true },
      active: ['/trails'],
    },
    { label: 'Reviews & Media', type: 'guarded', to: '/reviews', active: ['/reviews'] },
    { label: 'MyTrails', type: 'guarded', to: '/mytrails', active: ['/mytrails'] },
    { label: 'Alerts & Updates', type: 'guarded', to: '/alerts', active: ['/alerts'] },
  ];

  return (
    <header className={`navbar ${isOverlayRoute ? 'landing' : ''}`}>
      <div className="nav-inner">
        <Link className="brand" to="/" onClick={closeMobileMenu} aria-label="Orion Home">
          <img src={OrionLogo} alt="Orion" className="brand-logo" draggable="false" />
        </Link>

        {/* Desktop nav links */}
        <nav className="nav-links desktop-nav">
          {isLandingRoute
            ? landingLinks.map(({ label, target }) => (
                <a
                  key={target}
                  href={`#${target}`}
                  onClick={(evt) => {
                    evt.preventDefault();
                    scrollToSection(target);
                  }}
                >
                  {label}
                </a>
              ))
            : appLinks.map(({ label, type, to, state, active }) => {
                if (type === 'nav') {
                  return (
                    <NavLink key={label} to={to}>
                      {label}
                    </NavLink>
                  );
                }
                const isActive = Array.isArray(active) && active.includes(location.pathname);
                return (
                  <button
                    key={label}
                    type="button"
                    className={`as-link ${isActive ? 'active' : ''}`}
                    onClick={() => handleGuardedNavigation({ to, state })}
                  >
                    {label}
                  </button>
                );
              })}
        </nav>

        {/* Desktop login/logout */}
        <div className="nav-actions desktop-actions">
          {user ? (
            <div
              className="profile-container"
              onMouseEnter={openProfileDropdown}
              onMouseLeave={scheduleProfileClose}
            >
              <button className="profile-trigger">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL} alt="User Avatar" className="profile-avatar"
                  />
                ):(
                  <ProfileIcon className="profile-icon" />
                )}
                <span className="profile-chevron">{profileOpen ? '▲' : '▼'}</span>
              </button>
              
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <p className="profile-name">{user.displayName || user.email}</p>
                    <p className="profile-email">{user.email}</p>
                  </div>
                  
                  <div className="profile-menu">
                    <button
                      className="profile-menu-item"
                      onClick={() => navigate('/profile')}
                    >
                      <ProfileIcon className="menu-icon" />
                      Profile
                    </button>
                    <button 
                      className="profile-menu-item"
                      onClick={() => navigate('/help')}
                    >
                      <HelpCenterIcon className="menu-icon" />
                      Help Center
                    </button>
                    
                    <button 
                      className="profile-menu-item"
                      onClick={() => navigate('/settings')}
                    >
                      <SettingsIcon className="menu-icon" />
                      Settings
                    </button>
                    
                    <button 
                      className="profile-menu-item"
                      onClick={() => navigate('/feedback')}
                    >
                      <FeedbackIcon className="menu-icon" />
                      Feedback
                    </button>
                    
                    <hr className="profile-divider" />
                    
                    <div className="profile-menu-item logout-item">
                      <LogoutButton />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-login-btn" onClick={handleGoogleLogin} disabled={isAuthLoading}>
              {isAuthLoading ? 'Connecting…' : 'Login'}
            </button>
          )}
        </div>

        {/* Mobile burger toggle */}
        <input
          type="checkbox"
          id="checkbox"
          checked={open}
          onChange={() => setOpen((o) => !o)}
          aria-hidden
        />
        <label htmlFor="checkbox" className="toggle" aria-label="Toggle menu" aria-expanded={open}>
          <div className="bars" id="bar1"></div>
          <div className="bars" id="bar2"></div>
          <div className="bars" id="bar3"></div>
        </label>

        {/* Mobile menu */}
        <div className={`mobile-menu ${open ? 'open' : ''}`}>
          <div className="mobile-nav-links">
            {isLandingRoute
              ? landingLinks.map(({ label, target }) => (
                  <a
                    key={target}
                    href={`#${target}`}
                    onClick={(evt) => {
                      evt.preventDefault();
                      scrollToSection(target);
                    }}
                  >
                    {label}
                  </a>
                ))
              : appLinks.map(({ label, type, to, state }) =>
                  type === 'nav' ? (
                    <NavLink key={label} to={to} onClick={closeMobileMenu}>
                      {label}
                    </NavLink>
                  ) : (
                    <button
                      key={label}
                      type="button"
                      className="as-link"
                      onClick={() => {
                        handleGuardedNavigation({ to, state });
                        closeMobileMenu();
                      }}
                    >
                      {label}
                    </button>
                  )
                )}
          </div>
          <div className="mobile-actions">
            {user ? (
              <div className="mobile-profile">
                <div className="mobile-profile-info">
                  {user?.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="User avatar" 
                      className="mobile-avatar" 
                    />
                  )}
                  
                  <p className="mobile-profile-name">{user.displayName || user.email}</p>
                  <p className="mobile-profile-email">{user.email}</p>
                </div>
                <button className="mobile-profile-item" onClick={() => { navigate('/profile'); setOpen(false); }}>
                  Profile
                </button>
                <button className="mobile-profile-item" onClick={() => { navigate('/help'); setOpen(false); }}>
                  Help Center
                </button>
                <button className="mobile-profile-item" onClick={() => { navigate('/settings'); setOpen(false); }}>
                  Settings
                </button>
                <button className="mobile-profile-item" onClick={() => { navigate('/feedback'); setOpen(false); }}>
                  Feedback
                </button>
                <div className="mobile-logout">
                  <LogoutButton />
                </div>
              </div>
            ) : (
              <button 
                className="nav-login-btn mobile-login" 
                onClick={() => { handleGoogleLogin(); setOpen(false); }}
                disabled={isAuthLoading}
              >
                {isAuthLoading ? 'Connecting…' : 'Login'}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}