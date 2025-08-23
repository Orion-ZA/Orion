import React from 'react';

export default function AlertsUpdates() {
  return (
    <div className="container fade-in-up">
      <h1>Alerts & Updates</h1>
      <div className="grid cols-2" style={{marginTop:'1rem'}}>
        <div className="card" style={{padding:'1rem'}}>
          <h3>Active Alerts</h3>
          <ul style={{color:'var(--muted)'}}>
            <li>
              <span className="badge danger">Closure</span> Canyon Loop closed due to rockfall
            </li>
            <li>
              <span className="badge">Condition</span> Muddy sections near river crossing
            </li>
          </ul>
        </div>
        <div className="card" style={{padding:'1rem'}}>
          <h3>Subscriptions</h3>
          <p className="muted">Sign up to get alerts on saved trails.</p>
          <div className="grid cols-2">
            <input className="input" placeholder="Email address" />
            <button className="button">Subscribe</button>
          </div>
        </div>
      </div>
    </div>
  );
}
