import React from 'react';

export default function TrailExplorer() {
  return (
    <div className="container fade-in-up">
      <h1>Trail Explorer</h1>
      <p className="muted">Search, filter, and explore trails. Map placeholder below.</p>
      <div className="card" style={{height: 360, marginTop: '1rem', display: 'grid', placeItems: 'center'}}>
        <div style={{color: 'var(--muted)'}}>Map / List placeholder</div>
      </div>

      <div className="grid cols-3" style={{marginTop: '1rem'}}>
        <div className="card" style={{padding:'1rem'}}>
          <strong>Filters</strong>
          <ul style={{marginTop:'.5rem', color:'var(--muted)'}}>
            <li>Location</li>
            <li>Difficulty</li>
            <li>Distance</li>
            <li>Terrain</li>
          </ul>
        </div>
        <div className="card" style={{padding:'1rem'}}>
          <strong>Results</strong>
          <p className="muted">Results list placeholder</p>
        </div>
        <div className="card" style={{padding:'1rem'}}>
          <strong>Trail Detail</strong>
          <p className="muted">Select a trail to view details.</p>
        </div>
      </div>
    </div>
  );
}
