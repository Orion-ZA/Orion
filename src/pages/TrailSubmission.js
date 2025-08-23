import React from 'react';

export default function TrailSubmission() {
  return (
    <div className="container fade-in-up">
      <h1>Trail Submission</h1>
      <div className="card" style={{padding:'1rem', marginTop:'1rem'}}>
        <p className="muted">Form placeholder for creating or updating a trail.</p>
        <div className="grid cols-2" style={{marginTop:'.5rem'}}>
          <div>
            <label>Name</label>
            <input className="input" placeholder="Trail name" />
          </div>
          <div>
            <label>Location</label>
            <input className="input" placeholder="City, State" />
          </div>
          <div>
            <label>Distance (mi)</label>
            <input className="input" type="number" placeholder="10" />
          </div>
          <div>
            <label>Difficulty</label>
            <select className="input">
              <option>Easy</option>
              <option>Moderate</option>
              <option>Hard</option>
            </select>
          </div>
          <div style={{gridColumn:'1 / -1'}}>
            <label>Description</label>
            <textarea className="input" rows="4" placeholder="Trail highlights, terrain, best season..." />
          </div>
          <div style={{gridColumn:'1 / -1'}}>
            <button className="button">Submit Trail</button>
          </div>
        </div>
      </div>
    </div>
  );
}
