
import React, { useEffect, useRef, useState } from 'react';
import './LandingPage.css';
import orionLogo from '../assets/orion_logo.png';
import { useNavigate } from 'react-router-dom';

const HERO_SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1600&q=80',
    alt: 'Mountain sunrise',
  },
  {
    img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80',
    alt: 'Forest trail',
  },
  {
    img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    alt: 'River valley',
  },
  {
    img: 'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?auto=format&fit=crop&w=1600&q=80',
    alt: 'Hiking ridge',
  },
];

// --- Animated 3D Carousel Component (moved outside main component) ---
function AnimatedCarousel() {
  const activities = [
    'Hiking',
    'Mountain Biking',
    'Running',
    'Backpacking',
    'Walking',
    'Road Biking',
    'Off-road Driving',
    'Camping',
    'Bird Watching',
    'Horseback Riding',
  ];
  const [angle, setAngle] = React.useState(0);
  const intervalRef = React.useRef();
  const CARD_W = 180;
  const CARD_H = 220;
  const Z = 380; // depth

  React.useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAngle((a) => a + 36); // 360/10 = 36deg per card
    }, 2200);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div
      className="carousel-wrapper"
      style={{
        width: '100%',
        height: 'clamp(280px, 50vw, 360px)',
        position: 'relative',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        margin: '0 auto clamp(32px, 6vw, 64px) auto',
        maxWidth: '100%',
      }}
    >
      <div
        className="carousel-inner"
        style={{
          position: 'relative',
          width: CARD_W,
          height: CARD_H,
          margin: '0 auto',
          transform: `perspective(1000px) rotateY(${-angle}deg)`,
          zIndex: 2,
          transformStyle: 'preserve-3d',
          transition: 'transform 1.2s cubic-bezier(.2,.9,.3,1)',
        }}
      >
        {activities.map((name, i) => (
          <div
            className="carousel-card"
            key={i}
            style={{
              position: 'absolute',
              border: '2px solid #4CAF50',
              borderRadius: 12,
              overflow: 'hidden',
              inset: 0,
              transform: `rotateY(${(360 / 10) * i}deg) translateZ(${Z}px)`,
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              transition:
                'transform 0.35s cubic-bezier(.2,.9,.3,1), box-shadow 0.35s',
              zIndex: 1,
            }}
          >
            <div style={{width:'100%',height:'70%',background:'#f1f8e9',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <img
                src={`https://cdn-assets.alltrails.com/assets/images/activities/square-2/${name.toLowerCase().replace(/ /g,'-')}@2x.jpg`}
                alt={name}
                style={{width:'100%',height:'100%',objectFit:'cover'}}
                onError={(e)=>{ e.currentTarget.src = orionLogo; e.currentTarget.style.objectFit='contain'; e.currentTarget.style.background='#f1f8e9'; }}
              />
            </div>
            <div
              className="carousel-name"
              style={{
                padding: 12,
                fontWeight: 700,
                color: '#2d5016',
                background: 'white',
                height: '30%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [cur, setCur] = useState(0);
  const autoplayRef = useRef();

  // Hero slider autoplay
  useEffect(() => {
    autoplayRef.current = setInterval(() => setCur(c => (c + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(autoplayRef.current);
  }, []);

  // Reveal on scroll (align with global .reveal.is-visible)
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new window.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    reveals.forEach(r => io.observe(r));
    return () => io.disconnect();
  }, []);

  // Enhanced visual effect: parallax on hero
  useEffect(() => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const onMove = e => {
      const x = (e.clientX / window.innerWidth - 0.5) * 10;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      hero.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
    };
    hero.addEventListener('mousemove', onMove);
    return () => hero.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div className="landing-root">
      {/* Using outer Navbar/Footer; removed inner header */}

      {/* HERO (slider) */}
  <section className="hero" aria-labelledby="hero-heading" style={{position:'relative',color:'white',backgroundImage:`url(${HERO_SLIDES[cur].img})`,backgroundSize:'cover',backgroundPosition:'center'}}>
        <div className="hero-overlay" aria-hidden="true" style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,0.3),rgba(0,0,0,0.45))',pointerEvents:'none'}}></div>
        <div className="container hero-content" style={{position:'relative',zIndex:4,textAlign:'center',padding:'0 20px',maxWidth:900}}>
          <h1 id="hero-heading" className="hero-title" style={{textShadow:'0 6px 20px rgba(0,0,0,0.45)'}}>
            Find Your Outside
          </h1>
          <p style={{fontSize:'1.05rem',margin:'10px auto 18px',maxWidth:720,textShadow:'0 4px 10px rgba(0,0,0,0.35)',animation:'fadeIn 1.5s ease 1s forwards',opacity:0}}>
            Discover the best hiking trails around the world — curated routes, community reviews, and offline maps for every adventure.
          </p>
          <div className="hero-controls" role="search" style={{display:'flex',gap:12,alignItems:'center',justifyContent:'center',marginTop:18,flexWrap:'wrap',padding:'0 8px'}}>
            <div className="search-bar" aria-label="Search trails" style={{display:'flex',width:'min(680px,100%)',borderRadius:10,overflow:'hidden',boxShadow:'0 8px 24px rgba(12,20,10,0.08)',background:'rgba(255,255,255,0.12)'}}>
              <input type="search" placeholder="Search by city, park, or trail name" aria-label="Search input" style={{flex:1,padding:'12px 14px',border:0,background:'rgba(255,255,255,0.06)',color:'white',fontSize:'1rem'}} />
              <button aria-label="Search button" style={{padding:'12px 18px',background:'#4CAF50',color:'white',borderRadius:0,border:0,fontWeight:700}}>🔍</button>
            </div>
          </div>
          <div className="hero-actions" style={{display:'flex',gap:12,alignItems:'center',justifyContent:'center',marginTop:14,padding:'0 12px'}}>
            <a className="hero-actions-link hero-actions link" href="#explore" style={{color:'rgba(255,255,255,0.95)',textDecoration:'underline',fontWeight:600}}>Explore nearby trails</a>
            <button onClick={()=>navigate('/login')} style={{padding:'10px 16px',borderRadius:10,border:'1px solid rgba(255,255,255,0.75)',background:'rgba(0,0,0,0.25)',color:'#fff',fontWeight:700,backdropFilter:'blur(4px)'}}>Get started</button>
          </div>
        </div>
        {/* Hero slider controls */}
        <div className="hero-controls-container" style={{position:'absolute',bottom:20,left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:15,zIndex:5}}>
          <div className="hero-nav" style={{display:'flex',gap:8}}>
            {HERO_SLIDES.map((_,i)=>(
              <button key={i} className={"hero-dot"+(cur===i?' active':'')} aria-label={`Go to slide ${i+1}`} style={{width:10,height:10,borderRadius:'50%',background:cur===i?'#fff':'rgba(255,255,255,0.4)',border:'2px solid rgba(255,255,255,0.25)',cursor:'pointer',transition:'all .2s',margin:2}} onClick={()=>setCur(i)}></button>
            ))}
          </div>
          <div className="hero-arrows" style={{display:'flex',gap:10}}>
            <button className="hero-arrow" title="Previous" style={{padding:8,borderRadius:8,background:'rgba(0,0,0,0.35)',color:'white',display:'inline-flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setCur((cur-1+HERO_SLIDES.length)%HERO_SLIDES.length)}>&lt;</button>
            <button className="hero-arrow" title="Next" style={{padding:8,borderRadius:8,background:'rgba(0,0,0,0.35)',color:'white',display:'inline-flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setCur((cur+1)%HERO_SLIDES.length)}>&gt;</button>
          </div>
        </div>
      </section>

      {/* RIVER (auto-scrolling gallery) */}
  <section className="river-section reveal" id="explore" style={{padding:'36px 0 56px',background:'#fff',borderTop:'1px solid rgba(0,0,0,0.03)'}}>
        <div className="river-title container" style={{display:'flex',alignItems:'center',gap:10,color:'#2d5016',fontWeight:700,marginBottom:12}}>
          <span style={{fontSize:22}}>📸</span><span style={{fontWeight:800}}>Trail Moments</span>
        </div>
  <div className="river h-scroll-sm" aria-hidden="false">
          <div className="river-track" style={{display:'flex',gap:18,alignItems:'center',animation:'riverScroll 34s linear infinite',willChange:'transform'}}>
            {/* Example river items, can be mapped from data */}
            {[...Array(8)].map((_,i)=>(
              <div className="river-item" key={i} style={{flex:'0 0 auto',width:240,borderRadius:12,overflow:'hidden',background:'#eee',boxShadow:'0 8px 24px rgba(12,20,10,0.08)',position:'relative',transition:'all 0.3s'}}>
        <img src={`https://cdn-assets-2.alltrails.com/assets/packs/${['4288b278d125afce427b','dadf01e4c131e9c4b087','5eda52177ab34f450ed8','f06350e3a4607a6f5a7b','e8715e1ee3de02d54333','f7303771ad55c03cde0c','476f4af85f7ccfec7bf6','7cc14154c32cf730804c'][i]}.jpg`} alt={`@user${i+1}`} style={{display:'block',width:'100%',height:140,objectFit:'cover',background:'#e8f5e9'}} onError={(e)=>{e.currentTarget.src=orionLogo; e.currentTarget.style.objectFit='contain'; e.currentTarget.style.background='#f1f8e9';}} />
                <div className="handle" style={{padding:'8px 10px',fontWeight:600,background:'linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,255,255,0.92))',color:'#2d5016'}}>@user{i+1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Favorites */}
      <section className="local-favorites reveal">
        <div className="container">
          <h2 className="section-title" style={{fontSize:'1.6rem',marginBottom:18,display:'flex',alignItems:'center',gap:10,color:'#2d5016',fontWeight:700}}><span style={{fontSize:22}}>❤️</span> Local favorites near Johannesburg</h2>
          <div className="trails-grid h-scroll-sm" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:20}}>
          {/* Example trail cards */}
          {[1,2,3,4].map(i=>(
            <article className="trail-card" key={i} style={{background:'white',borderRadius:12,overflow:'hidden',boxShadow:'0 8px 24px rgba(12,20,10,0.08)',transition:'transform .45s cubic-bezier(.2,.9,.3,1),box-shadow .45s'}}>
              <div className="trail-image" style={{height:160,overflow:'hidden'}}>
                <img src={[
                  'https://images.pexels.com/photos/847393/pexels-photo-847393.jpeg',
                  'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=600&q=80',
                  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80',
                  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=600&q=80',
                ][i-1]} alt={`Trail ${i}`} style={{width:'100%',height:'100%',objectFit:'cover',background:'#e8f5e9'}} onError={(e)=>{ e.currentTarget.src = orionLogo; e.currentTarget.style.objectFit='contain'; }} />
              </div>
              <div className="trail-info" style={{padding:'16px 18px'}}>
                <h3 style={{color:'#2d5016',marginBottom:8,fontSize:'1.05rem'}}>Trail {i}</h3>
                <div className="trail-location" style={{display:'flex',alignItems:'center',gap:8,color:'#666',fontSize:'.9rem',marginBottom:8}}><span>📍</span> Klipriviersberg Nature Reserve</div>
                <div className="trail-stats" style={{display:'flex',gap:12,alignItems:'center',color:'#6b6b6b',borderTop:'1px solid #f1f1f1',paddingTop:12,marginTop:12,fontSize:'.9rem'}}>
                  <div className="trail-stat"><span style={{color:'#4CAF50'}}>★</span> 4.{5+i%3}</div>
                  <div className="trail-stat"><span style={{color:'#4CAF50'}}>🛣️</span> {10+i*2}.6 km</div>
                  <div className="trail-stat"><span style={{color:'#4CAF50'}}>⏰</span> {2+i}h {30+i*10}m</div>
                </div>
              </div>
            </article>
          ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats reveal" aria-hidden="false" style={{padding:'44px 0',background:'linear-gradient(90deg,#2d5016,#4CAF50)',color:'white'}}>
        <div className="container">
          <div className="stats-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:18,maxWidth:1100,margin:'0 auto'}}>
            <div className="stat-item" style={{padding:18}}>
              <div className="stat-number" style={{fontSize:'1.8rem',fontWeight:800}}>450K+</div>
              <div className="stat-title" style={{fontSize:'1rem',opacity:.95,marginBottom:8}}>curated trails</div>
              <p>Discover unexpected gems, even in your own backyard.</p>
            </div>
            <div className="stat-item" style={{padding:18}}>
              <div className="stat-number" style={{fontSize:'1.8rem',fontWeight:800}}>80M+</div>
              <div className="stat-title" style={{fontSize:'1rem',opacity:.95,marginBottom:8}}>fellow explorers</div>
              <p>Share your adventures and learn from our global community.</p>
            </div>
            <div className="stat-item" style={{padding:18}}>
              <div className="stat-number" style={{fontSize:'1.8rem',fontWeight:800}}>2.1B+</div>
              <div className="stat-title" style={{fontSize:'1rem',opacity:.95,marginBottom:8}}>logged kilometers</div>
              <p>Navigate your way and keep a record of all your travels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Activities: 3D Carousel (static, visually enhanced) */}
  <section className="activities container reveal" id="community" style={{padding:'60px 0 20px'}}>
        <h2 className="section-title" style={{fontSize:'1.6rem',marginBottom:18,display:'flex',alignItems:'center',gap:10,color:'#2d5016',fontWeight:700}}><span style={{fontSize:22}}>🥾</span> Browse by activity</h2>
        <AnimatedCarousel />
      </section>

      {/* App Section */}
  <section className="app-section reveal" style={{padding:'56px 0',background:'#f1f8e9',marginTop:8}}>
        <div className="container app-content" style={{textAlign:'center'}}>
          <h2 className="section-title" style={{fontSize:'1.6rem',marginBottom:18,display:'flex',alignItems:'center',gap:10,color:'#2d5016',fontWeight:700}}><span style={{fontSize:22}}>📱</span> Upgrade your adventures</h2>
          <p>Whether you want to explore offline or create your own route, choose the membership that helps you make the most of every minute outdoors.</p>
          <div className="app-badges" style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',marginTop:14}}>
            <div className="app-badge" style={{background:'#2d5016',color:'white',padding:'10px 18px',borderRadius:10,display:'inline-flex',gap:10,alignItems:'center',fontWeight:700}}>🍏 App Store</div>
            <div className="app-badge" style={{background:'#2d5016',color:'white',padding:'10px 18px',borderRadius:10,display:'inline-flex',gap:10,alignItems:'center',fontWeight:700}}>▶ Google Play</div>
          </div>
        </div>
      </section>
  {/* Using outer Footer; removed inner footer */}
    </div>
  );
}

export default LandingPage;
