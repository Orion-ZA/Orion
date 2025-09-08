import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import LogoutButton from './LogoutButton.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useToast } from './ToastContext';
import ProfileIcon from './ProfileIcon';
import SettingsIcon from './SettingsIcon';
import FavouritesIcon from './FavouritesIcon';
import FeedbackIcon from './FeedbackIcon';
import HelpCenterIcon from './HelpCenterIcon';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const { show } = useToast();
  
  // Login via route; Google sign-in available on Login page

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
    <header className={`navbar ${isLanding ? 'landing' : ''}`}>
      <div className="nav-inner">
        <Link className="brand" to={user ? '/dashboard' : '/'}>
          <span className="brand-icon" aria-hidden>🌌</span>
          <span className="brand-text">Orion</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="nav-links desktop-nav">
          <NavLink to="/explorer">Trail Explorer</NavLink>
          <button type="button" className="as-link" onClick={()=>{ if(!user){ show('Please log in first', { type: 'warn' }); } else { navigate('/submit'); } }}>Trail Submission</button>
          <button type="button" className="as-link" onClick={()=>{ if(!user){ show('Please log in first', { type: 'warn' }); } else { navigate('/reviews'); } }}>Reviews & Media</button>
          <button type="button" className="as-link" onClick={()=>{ if(!user){ show('Please log in first', { type: 'warn' }); } else { navigate('/mytrails'); } }}>MyTrails</button>
          <button type="button" className="as-link" onClick={()=>{ if(!user){ show('Please log in first', { type: 'warn' }); } else { navigate('/alerts'); } }}>Alerts & Updates</button>
        </nav>

        {/* Desktop login/logout */}
        <div className="nav-actions desktop-actions">
          {user ? (
            <div 
              className="profile-container"
              onMouseEnter={() => setProfileOpen(true)}
              onMouseLeave={() => setProfileOpen(false)}
            >
              <button className="profile-trigger">
                {user?. photoURL ? (
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
            <button className="nav-login-btn" onClick={() => navigate('/login')}>Login</button>
          )}
        </div>

        {/* Mobile burger toggle */}
        <input
          type="checkbox"
          id="checkbox"
          checked={open}
          onChange={() => setOpen(o => !o)}
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
            <NavLink to="/explorer" onClick={() => setOpen(false)}>Trail Explorer</NavLink>
            <button type="button" className="as-link" onClick={()=>{ if(!user){ show('Please log in first', { type: 'warn' }); } else { navigate('/submit'); setOpen(false);} }}>Trail Submission</button>
            <button type="button" className="as-link" onClick={()=>{ if(!user){ show('Please log in first', { type: 'warn' }); } else { navigate('/reviews'); setOpen(false);} }}>Reviews & Media</button>
            <button type="button" className="as-link" onClick={()=>{ if(!user){ show('Please log in first', { type: 'warn' }); } else { navigate('/mytrails'); setOpen(false);} }}>MyTrails</button>
            <button type="button" className="as-link" onClick={()=>{ if(!user){ show('Please log in first', { type: 'warn' }); } else { navigate('/alerts'); setOpen(false);} }}>Alerts & Updates</button>
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
                <button className="mobile-profile-item" onClick={() => { navigate('/favorites'); setOpen(false); }}>
                  Favorites
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
              <button className="nav-login-btn mobile-login" onClick={() => { navigate('/login'); setOpen(false); }}>Login</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}