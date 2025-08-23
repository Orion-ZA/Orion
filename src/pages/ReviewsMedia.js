import React from 'react';

export default function ReviewsMedia() {
  return (
    <div className="container fade-in-up">
      <h1>Reviews & Media</h1>
      <div className="grid cols-3" style={{marginTop:'1rem'}}>
        {[1,2,3,4,5,6].map(i => (
          <div className="card" key={i} style={{padding:'1rem'}}>
            <div style={{height:140, background:'rgba(255,255,255,0.06)', borderRadius:8}} />
            <h4 style={{marginTop:'.75rem'}}>Trail Review #{i}</h4>
            <p className="muted">“Great views, a bit rocky near the summit. 4/5.”</p>
          </div>
        ))}
      </div>
    </div>
  );
}
