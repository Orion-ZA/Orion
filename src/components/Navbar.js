import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import LogoutButton from './LogoutButton.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useToast } from './ToastContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { show } = useToast();
  // Login via route; Google sign-in available on Login page

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  return (
  <header className="navbar">
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
          {user ? <LogoutButton /> : (
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
            {user ? <LogoutButton /> : (
              <button className="nav-login-btn mobile-login" onClick={() => { navigate('/login'); setOpen(false); }}>Login</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}