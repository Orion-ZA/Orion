import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link className="brand" to="/Dashboard">
          <span className="brand-icon" aria-hidden>🌌</span>
          <span className="brand-text">Orion</span>
        </Link>

        <button className="burger" aria-label="Toggle menu" aria-expanded={open}
          onClick={() => setOpen(o => !o)}>
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/explorer">Trail Explorer</NavLink>
          <NavLink to="/submit">Trail Submission</NavLink>
          <NavLink to="/reviews">Reviews & Media</NavLink>
          <NavLink to="/mytrails">MyTrails</NavLink>
          <NavLink to="/alerts">Alerts & Updates</NavLink>
        </nav>
      </div>
    </header>
  );
}
