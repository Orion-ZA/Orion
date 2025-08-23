import React from 'react';

export default function MyTrails() {
  return (
    <div className="container fade-in-up">
      <h1>MyTrails</h1>
      <div className="grid cols-3" style={{marginTop:'1rem'}}>
        <div className="card" style={{padding:'1rem'}}>
          <h3>Favourites</h3>
          <ul style={{color:'var(--muted)'}}>
            <li>Angel's Landing</li>
            <li>Misty Ridge Loop</li>
          </ul>
        </div>
        <div className="card" style={{padding:'1rem'}}>
          <h3>Completed</h3>
          <ul style={{color:'var(--muted)'}}>
            <li>Bear Creek Trail</li>
            <li>Sunset Peak</li>
          </ul>
        </div>
        <div className="card" style={{padding:'1rem'}}>
          <h3>Wishlist</h3>
          <ul style={{color:'var(--muted)'}}>
            <li>Emerald Basin</li>
            <li>Rocky Knob Summit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
