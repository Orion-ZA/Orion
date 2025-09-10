import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="brand-col">
          <div className="brand-row">
            <span className="brand-mark" aria-hidden>🌌</span>
            <span className="brand-name">Orion</span>
          </div>
          <p className="brand-tag">Crowd-sourced hiking intelligence. Find, plan, and share your next adventure.</p>
          <div className="socials" aria-label="Social media">
            <button type="button" aria-label="Twitter" className="social">𝕏</button>
            <button type="button" aria-label="Instagram" className="social">IG</button>
            <button type="button" aria-label="YouTube" className="social">▶</button>
            <button type="button" aria-label="GitHub" className="social">GH</button>
          </div>
        </div>

        <div className="links-col">
          <p className="col-title">Explore</p>
          <Link to="/trails">Trails</Link>
          <Link to="/reviews">Reviews & Media</Link>
          <Link to="/alerts">Alerts & Updates</Link>
        </div>

        <div className="links-col">
          <p className="col-title">Company</p>
          <button type="button" className="linklike">About</button>
          <button type="button" className="linklike">Careers</button>
          <button type="button" className="linklike">Contact</button>
          <button type="button" className="linklike">Press</button>
        </div>

        <div className="subscribe-col">
          <p className="col-title">Stay in the loop</p>
          <p className="subscribe-copy">Subscribe for trail updates, maps, and hidden gems. No spam.</p>
          <form className="subscribe-form" onSubmit={(e)=> e.preventDefault()}>
            <input type="email" placeholder="you@example.com" aria-label="Email address" required />
            <button type="submit">Subscribe</button>
          </form>
          <p className="fine-print">By subscribing you agree to our <button type="button" className="linklike">Terms</button> and <button type="button" className="linklike">Privacy Policy</button>.</p>
        </div>
      </div>
  <div className="footer-bottom">
        <span>© {year} Orion</span>
        <div className="policy-links">
          <button type="button" className="linklike">Privacy</button>
          <button type="button" className="linklike">Terms</button>
          <button type="button" className="linklike">Cookies</button>
        </div>
      </div>
    </footer>
  );
}
