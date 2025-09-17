import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Welcome.module.css';

const HERO_IMAGES = [
  {
    src: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-1-2880w-6e6e862799af562dc5b549f4b109f63ff716e021db2e69d07921c35f897f8fbe.jpg',
    alt: 'Hikers on a green valley trail with sun-lit mountains',
    mobile: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-1-750w-e55b27ea43ac2ff29cabebae3fb7905207870fa46146f65c6800a5f56b111195.jpg',
  },
  {
    src: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-2-2880w-864c12d33ee64138f720d5837f8fd4ce6587ec7663a5c98ad73f5598f0952d4d.jpg',
    alt: 'A mother and son on a bridge overlooking a lake and mountains',
    mobile: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-2-750w-e4f145ced6dd677fadeac43b65a66d722f145a51c7f9c79dc4272d33abdce9d6.jpg',
  },
  {
    src: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-3-2880w-0fc634d683f51f86d56796345fcb0afdd6b20befd6e2ce721cc5947936f133a5.jpg',
    alt: 'Hikers with dogs on a forest trail facing an overcast city',
    mobile: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-3-750w-d616e4cc757c0366b2f40a33db5157fa16a54974a76976fb4920c3a7d13d422b.jpg',
  },
  {
    src: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-4-2880w-ef352527cc85ee36ae869d56f7a988261b79ebf103807a623ce2c27685c8fdd8.jpg',
    alt: 'Hikers in a vibrant green forest',
    mobile: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-4-750w-4016a1173e03d6dc860e8fba2d2c4735f0b465e68daaca706cd3ce39dfa9f74e.jpg',
  },
];

export default function Welcome() {
  const [idx, setIdx] = useState(0);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(id);
  }, []);

  // Observe stats section visibility to trigger animations
  useEffect(() => {
    if (!statsRef.current) return;
    const el = statsRef.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Typewriter effect for title
  const fullTitle = 'Welcome to Orion';
  const [typedTitle, setTypedTitle] = useState('');
  useEffect(() => {
    let i = 0;
    setTypedTitle('');
    const type = () => {
      if (i <= fullTitle.length) {
        setTypedTitle(fullTitle.slice(0, i));
        i++;
        setTimeout(type, i === 1 ? 400 : 60); // Slight pause at start
      }
    };
    type();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles['welcome-page']}>
      <section className={styles['welcome-hero']} aria-labelledby="welcome-heading">
        {/* Background slides */}
        {HERO_IMAGES.map((img, i) => (
          <picture key={i} className={`${styles['welcome-slide']} ${idx === i ? styles['active'] : ''}`}>
            <source media="(max-width: 767.95px)" srcSet={img.mobile} type="image/jpg" />
            <img src={img.src} alt={img.alt} loading={i === 0 ? 'eager' : 'lazy'} />
          </picture>
        ))}
        <div className={styles['welcome-hero-gradient']} aria-hidden="true"></div>

        {/* Content */}
        <div className={styles['welcome-content']}>
          <h1 id="welcome-heading" className={styles['welcome-title']}>
            <span className={styles['typewriter']}>{typedTitle}</span>
          </h1>
          <p className={styles['welcome-subtitle']}>Find trails, see community reviews, and plan your next outdoor adventure.</p>

          <div className={styles['welcome-search']} role="search" aria-label="Search trails">
            <div className={styles['welcome-search-inner']}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles['welcome-search-icon']}><path fillRule="evenodd" clipRule="evenodd" d="M3.75 10.875a7.125 7.125 0 1 1 14.25 0 7.125 7.125 0 0 1-14.25 0Zm7.125-8.625a8.625 8.625 0 1 0 5.546 15.231l4.049 4.05a.75.75 0 0 0 1.06-1.061l-4.049-4.05a8.625 8.625 0 0 0-6.606-14.17Z"></path></svg>
              <input type="search" placeholder="Search by city, park, or trail name" aria-label="Search" />
              <button type="button" className={styles['welcome-search-btn']}>Search</button>
            </div>
          </div>

          <div className={styles['welcome-explore']}>
            <Link to="/trails">Explore nearby trails</Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className={styles['stats-section']} aria-label="Orion hiking stats">
        <div className={styles['stats-inner']}>
          <div className={styles['stats-grid']}>
            <StatCard
              label="Trails mapped"
              end={1248}
              start={0}
              visible={statsVisible}
            />
            <StatCard
              label="Total distance"
              end={8742}
              start={0}
              suffix=" km"
              visible={statsVisible}
            />
            <StatCard
              label="Elevation gain"
              end={215000}
              start={0}
              suffix=" m"
              visible={statsVisible}
            />
            <StatCard
              label="Active hikers"
              end={12430}
              start={0}
              visible={statsVisible}
            />
          </div>
        </div>
      </section>

      {/* Browse by Activity Section */}
      <section className={styles['activities-section']} aria-labelledby="browse-activity-heading">
        <div className={styles['activities-inner']}>
          <h2 id="browse-activity-heading" className={styles['section-title']}>Browse by activity</h2>
          <div className={styles['activity-grid']}>
            {[
              { name: 'Hiking', img: 'https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aGlraW5nfGVufDB8fDB8fHww' },
              { name: 'Mountain biking', img: 'https://images.unsplash.com/photo-1594942939850-d8da299577f3?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
              { name: 'Trail running', img: 'https://plus.unsplash.com/premium_photo-1664301432574-9b4e85c2b2d3?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
              { name: 'Bird watching', img: 'https://plus.unsplash.com/premium_photo-1723478690606-f953ea1dab3a?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
              { name: 'Camping', img: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
              { name: 'Rock climbing', img: 'https://images.unsplash.com/photo-1507034589631-9433cc6bc453?q=80&w=684&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
              { name: 'Kayaking', img: 'https://images.unsplash.com/photo-1480480565647-1c4385c7c0bf?q=80&w=1331&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
              { name: 'Skiing', img: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c2tpaW5nfGVufDB8fDB8fHww' },
              { name: 'Backpacking', img: 'https://plus.unsplash.com/premium_photo-1679691282638-733300daccd4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YmFja3BhY2tpbmd8ZW58MHx8MHx8fDA%3D' },
            ].map((act, i, arr) => (
              <TiltCard
                key={act.name}
                className={styles['activity-card']}
                style={{ '--img': `url(${act.img})`, animationDelay: `${0.05 + i * 0.08}s` }}
                name={act.name}
              />
            ))}
            {/* Last image card */}
            <TiltCard
              key="Surfing"
              className={styles['activity-card']}
              style={{ '--img': 'url(https://images.unsplash.com/photo-1530870110042-98b2cb110834?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)', animationDelay: `${0.05 + 10 * 0.08}s` }}
              name="Surfing"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// TiltCard: adds mousemove tilt effect and hover intensity
function TiltCard({ className, style, name }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotateY = ((x - midX) / midX) * 10;
      const rotateX = -((y - midY) / midY) * 10;
      el.style.transform = `translateY(6px) scale(1.04) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      el.style.boxShadow = '0 32px 72px rgba(0,221,235,0.22), 0 24px 52px rgba(91,66,243,0.28)';
    };
    const reset = () => {
      el.style.transform = '';
      el.style.boxShadow = '';
    };
    el.addEventListener('mousemove', handle);
    el.addEventListener('mouseleave', reset);
    return () => {
      el.removeEventListener('mousemove', handle);
      el.removeEventListener('mouseleave', reset);
    };
  }, []);
  return (
    <div ref={ref} className={className} style={style}>
      <div className={styles['activity-card-inner']}>
        <div className={styles['activity-name']}>{name}</div>
      </div>
    </div>
  );
}

function StatCard({ label, start = 0, end, duration = 1200, prefix = '', suffix = '', visible }) {
  const [value, setValue] = useState(start);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!visible || startedRef.current) return;
    startedRef.current = true;
    let rafId;
    const startTime = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current = start + (end - start) * eased;
      setValue(current);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible, start, end, duration]);

  return (
    <div className={styles['stat-card']} role="figure" aria-label={`${label} ${Math.round(value)}`}>
      <div className={styles['stat-value']}>{prefix}{new Intl.NumberFormat().format(Math.round(value))}{suffix}</div>
      <div className={styles['stat-label']}>{label}</div>
    </div>
  );
}
