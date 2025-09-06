import React from 'react';

export default function LandingFooter() {
  return (
    <footer className="landing-footer" style={{background:'#0b1a2e', color:'#fff'}}>
      <div className="footer-inner" style={{maxWidth:1200, margin:'0 auto', padding:'28px 20px', display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <div>
          <h3 style={{fontSize:'1.05rem', marginBottom:12}}>Explore</h3>
          <a href="#explore" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>Trail Moments</a>
          <a href="#submit" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>Local favorites</a>
          <a href="#community" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>Browse by activity</a>
        </div>
        <div>
          <h3 style={{fontSize:'1.05rem', marginBottom:12}}>Maps</h3>
          <a href="#home" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>Search</a>
          <a href="#reviews" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>Stats</a>
        </div>
        <div>
          <h3 style={{fontSize:'1.05rem', marginBottom:12}}>Company</h3>
          <a href="/" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>About</a>
          <a href="/" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>Jobs</a>
        </div>
        <div>
          <h3 style={{fontSize:'1.05rem', marginBottom:12}}>Community</h3>
          <a href="/" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>Support</a>
          <a href="/" style={{display:'block', color:'rgba(255,255,255,0.9)', marginBottom:8}}>Gift membership</a>
        </div>
      </div>
      <div style={{textAlign:'center', padding:'12px 20px', color:'rgba(255,255,255,0.75)'}}>
        © 2025 Orion • Find Your Outside
      </div>
    </footer>
  );
}
