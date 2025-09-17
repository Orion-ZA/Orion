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
            <button type="button" aria-label="X (Twitter)" className="social">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17.53 3H21.5l-7.19 8.21L23 21h-7.5l-5.36-6.61L3.67 21H-.3l7.64-8.73L1 3h7.61l4.77 5.89L17.53 3zm-1.13 15.5h2.09l-5.67-7.01-1.5-1.85L5.59 5H3.5l5.67 7.01 1.5 1.85 5.73 7.14z" fill="currentColor"/></svg>
            </button>
            <button type="button" aria-label="Instagram" className="social">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect width="24" height="24" rx="6" fill="currentColor" opacity=".1"/><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
            </button>
            <button type="button" aria-label="YouTube" className="social">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect width="24" height="24" rx="6" fill="currentColor" opacity=".1"/><path d="M9.75 8.5v7l6.5-3.5-6.5-3.5z" fill="currentColor"/><rect x="2.5" y="6.5" width="19" height="11" rx="5.5" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
            </button>
            <button type="button" aria-label="GitHub" className="social">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.38-2.03 1.02-2.75-.1-.26-.44-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.38 9.38 0 0 1 12 6.84c.85.004 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.54 1.4.2 2.44.1 2.7.64.72 1.02 1.63 1.02 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .26.18.58.69.48A10.01 10.01 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" fill="currentColor"/></svg>
            </button>
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
