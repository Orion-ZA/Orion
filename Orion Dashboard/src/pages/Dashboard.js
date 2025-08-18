import React from 'react';
import { Link } from 'react-router-dom';
// removed GlassCard; using original card content with glass styling

export default function Dashboard() {
  return (
    <div className="container">
      <section className="fade-in-up" style={{display:'grid', gap:'1rem'}}>
        <h1 className="gradient-text" style={{margin:'0.5rem 0 0'}}>Welcome to Orion</h1>
        <p style={{color:'var(--muted)'}}>Plan, discover, and share hiking adventures. This dashboard gives you a snapshot of trails, contributions, and alerts across the community.</p>
      </section>

      <section className="grid cols-3 fade-in-up" style={{marginTop:'1rem'}}>
        <div className="scale-in reveal" style={{'--delay':'60ms'}}>
          <div className="card glass" style={{padding:'1rem', display:'grid', gap:'.5rem', justifyItems:'start'}}>
            <h3>Browse Trails</h3>
            <p className="muted">Search by location, difficulty, distance, and terrain.</p>
            <div>
              <Link to="/explorer" className="button">Open Explorer</Link>
            </div>
          </div>
        </div>
        <div className="scale-in reveal" style={{'--delay':'140ms'}}>
          <div className="card glass" style={{padding:'1rem', display:'grid', gap:'.5rem', justifyItems:'start'}}>
            <h3>Contribute</h3>
            <p className="muted">Submit trails, add photos, and write reviews.</p>
            <div>
              <Link to="/submit" className="button">Submit a Trail</Link>
            </div>
          </div>
        </div>
        <div className="scale-in reveal" style={{'--delay':'220ms'}}>
          <div className="card glass" style={{padding:'1rem', display:'grid', gap:'.5rem', justifyItems:'start'}}>
            <h3>Stay Safe</h3>
            <p className="muted">View closures, conditions, and alerts from the community.</p>
            <div>
              <Link to="/alerts" className="button">View Alerts</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Image Banner Segment */}
  <section className="card scale-in hero reveal" style={{marginTop:'1rem', padding:0, overflow:'hidden', position:'relative', '--delay':'280ms'}}>
        <img
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop"
          alt="Scenic mountain trail"
          loading="lazy"
      className="hero-img"
      style={{width:'100%', height: '360px', objectFit:'cover', display:'block', filter:'brightness(0.85)'}}
        />
        <div style={{position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center', padding:'1rem'}}>
          <div>
            <h2 style={{margin:'0 0 .5rem'}}>Find your next trail</h2>
            <p className="muted" style={{maxWidth:'68ch', margin:'0 auto 1rem'}}>Discover crowdsourced insights on difficulty, terrain, distance, photos, and real-time alerts from the community.</p>
            <Link to="/explorer" className="button">Browse Trails</Link>
          </div>
        </div>
      </section>

      <section className="grid cols-4 fade-in-up" style={{marginTop:'1rem'}}>
        <div className="card glass scale-in reveal" style={{padding:'1rem', '--delay':'60ms'}}>
          <h4>Quick Stats</h4>
          <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:'6px'}}>
            <li>
              <span className="badge success">Live</span> 1,284 Trails
            </li>
            <li>
              <span className="badge">Avg Difficulty</span> Moderate
            </li>
            <li>
              <span className="badge">Active Alerts</span> 12
            </li>
          </ul>
        </div>

  <div className="card glass scale-in reveal" style={{padding:'1rem', '--delay':'120ms'}}>
          <h4>Favourites & Wishlist</h4>
          <p className="muted">Keep track of hikes you love and ones you want to try.</p>
          <Link to="/mytrails" className="button">Open MyTrails</Link>
        </div>

  <div className="card glass scale-in reveal" style={{padding:'1rem', '--delay':'180ms'}}>
          <h4>Recent Reviews</h4>
          <p className="muted">See what hikers are saying.</p>
          <Link to="/reviews" className="button">Open Reviews</Link>
        </div>

  <div className="card glass scale-in reveal" style={{padding:'1rem', '--delay':'240ms'}}>
          <h4>Search & Filter</h4>
          <p className="muted">Find the perfect trail for your next trip.</p>
          <Link to="/explorer" className="button">Search Trails</Link>
        </div>
      </section>
    </div>
  );
}
