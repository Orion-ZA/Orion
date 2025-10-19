import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useStatsData } from '../hooks/useStatsData';
import styles from './Welcome.module.css';

const HERO_IMAGES = [
  {
    src: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-1-2880w-6e6e862799af562dc5b549f4b109f63ff716e021db2e69d07921c35f897f8fbe.jpg',
    alt: 'Hikers on a green valley trail with sun-lit mountains',
    mobile:
      'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-1-750w-e55b27ea43ac2ff29cabebae3fb7905207870fa46146f65c6800a5f56b111195.jpg',
  },
  {
    src: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-2-2880w-864c12d33ee64138f720d5837f8fd4ce6587ec7663a5c98ad73f5598f0952d4d.jpg',
    alt: 'A mother and son on a bridge overlooking a lake and mountains',
    mobile:
      'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-2-750w-e4f145ced6dd677fadeac43b65a66d722f145a51c7f9c79dc4272d33abdce9d6.jpg',
  },
  {
    src: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-3-2880w-0fc634d683f51f86d56796345fcb0afdd6b20befd6e2ce721cc5947936f133a5.jpg',
    alt: 'Hikers with dogs on a forest trail facing an overcast city',
    mobile:
      'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-3-750w-d616e4cc757c0366b2f40a33db5157fa16a54974a76976fb4920c3a7d13d422b.jpg',
  },
  {
    src: 'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-4-2880w-ef352527cc85ee36ae869d56f7a988261b79ebf103807a623ce2c27685c8fdd8.jpg',
    alt: 'Hikers in a vibrant green forest',
    mobile:
      'https://cdn-assets-2.alltrails.com/assets/hero-images/hero-logged-out-4-750w-4016a1173e03d6dc860e8fba2d2c4735f0b465e68daaca706cd3ce39dfa9f74e.jpg',
  },
];

const ABOUT_HIGHLIGHTS = [
  {
    title: 'Community powered data',
    copy: 'Realtime trail alerts, recent reviews, and photos curated by thousands of local explorers so you always know what to expect.',
  },
  {
    title: 'Sustainable adventures',
    copy: 'We partner with parks and conservancies to champion Leave No Trace principles and protect the places we roam.',
  },
  {
    title: 'Designed for every device',
    copy: 'Plan from your desktop, then enjoy quick trail access, offline downloads, and safety tools on mobile when you head outside.',
  },
];

const SHOWCASE_SECTIONS = [
  {
    id: 'explorer',
    eyebrow: 'Trail Explorer',
    title: 'Plan smarter adventures with precision filters',
    description:
      'Dial in the perfect route using difficulty, elevation, distance, tags, and crowd-sourced insights. Preview weather overlays and terrain in a single glance.',
    bullets: [
      'Smart filtering & saved searches',
      'Live weather + topo previews',
      'Trail health and seasonal alerts',
    ],
    action: { label: 'Jump into Explorer', to: '/trails' },
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=60',
  },
  {
    id: 'submit',
    eyebrow: 'Trail Submission',
    title: 'Share discoveries and build the collective map',
    description:
      'Upload GPS recordings, photos, and rich notes in minutes. Orion cleans the data, flags hazards, and notifies your community instantly.',
    bullets: [
      'Guided submission workflow',
      'Automatic geo-cleanup & QA',
      'Instant visibility to followers',
    ],
    action: { label: 'Start a submission', to: '/trails#submit' },
    image:
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1400&q=60',
  },
  {
    id: 'reviews',
    eyebrow: 'Reviews & Media',
    title: 'Relive the story with immersive media hubs',
    description:
      'Scroll cinematic trip reports, drone flyovers, and bite-sized video recaps — all organized per trail so you can scout conditions before you arrive.',
    bullets: [
      'High-res galleries & reels',
      'Verified condition updates',
      'AI summaries for quick reads',
    ],
    action: { label: 'Browse community stories', to: '/reviews' },
    image:
      'https://images.unsplash.com/photo-1526779259212-939e64788e3c?auto=format&fit=crop&w=1400&q=60',
  },
];

const ACTIVITY_CARDS = [
  {
    name: 'Nature Trails',
    img: 'https://images.unsplash.com/photo-1456613820599-bfe244172af5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1000',
    message:
      'Explore beautiful natural trails through forests, meadows, and scenic landscapes perfect for hiking and walking.',
    filters: { tags: ['nature', 'park'], difficulty: 'all' },
  },
  {
    name: 'Adventure Roads',
    img: 'https://images.unsplash.com/photo-1534474601473-7a9798e26582?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687',
    message:
      'Challenge yourself on rocky terrain and accessible road trails perfect for mountain biking and cycling adventures.',
    filters: { tags: ['road', 'rocky'], difficulty: 'all' },
  },
  {
    name: 'Park Running',
    img: 'https://images.unsplash.com/photo-1487956382158-bb926046304a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1471',
    message:
      'Hit the trails in beautiful parks with well-maintained paths ideal for trail running and jogging.',
    filters: { tags: ['nature', 'park'], difficulty: 'all' },
  },
  {
    name: 'Wildlife Watching',
    img: 'https://plus.unsplash.com/premium_photo-1723629720325-de28508c996d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470',
    message:
      'Discover peaceful field trails and natural areas perfect for bird watching and wildlife photography.',
    filters: { tags: ['nature', 'field'], difficulty: 'easy' },
  },
  {
    name: 'Park Camping',
    img: 'https://plus.unsplash.com/premium_photo-1682094788204-c2f060ad3fb0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cGFyayUyMGNhbXBpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=500',
    message:
      'Find the perfect camping spots in parks and natural areas with beautiful scenery and great amenities.',
    filters: { tags: ['park', 'nature'], difficulty: 'all' },
  },
  {
    name: 'Rocky Adventures',
    img: 'https://plus.unsplash.com/premium_photo-1664476477451-299966d55b33?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8Um9ja3klMjBBZHZlbnR1cmVzfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=500',
    message:
      'Conquer challenging rocky terrain and natural rock formations perfect for climbing and technical hiking.',
    filters: { tags: ['rocky', 'nature'], difficulty: 'hard' },
  },
  {
    name: 'Lake Trails',
    img: 'https://plus.unsplash.com/premium_photo-1663021824165-4256f8381934?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1469',
    message:
      'Explore scenic trails around lakes and water bodies perfect for kayaking, fishing, and water activities.',
    filters: { tags: ['lake', 'nature'], difficulty: 'all' },
  },
  {
    name: 'Mountain Terrain',
    img: 'https://images.unsplash.com/photo-1465513670158-c3ac6c8d1a87?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470',
    message:
      'Navigate rocky mountain trails and natural terrain perfect for skiing, snowshoeing, and alpine adventures.',
    filters: { tags: ['rocky', 'nature'], difficulty: 'all' },
  },
  {
    name: 'Backcountry Parks',
    img: 'https://images.unsplash.com/photo-1583146200984-f2dfc3d1e27c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGFya3N8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=500',
    message:
      'Embark on multi-day adventures through park backcountry with moderate trails and stunning natural beauty.',
    filters: { tags: ['nature', 'park'], difficulty: 'moderate' },
  },
  {
    name: 'Family Picnics',
    img: 'https://images.unsplash.com/photo-1592753054398-9fa298d40e85?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=765',
    message:
      'Discover easy trails with picnic areas and family-friendly amenities perfect for all ages and abilities.',
    filters: { tags: ['picnic', 'park'], difficulty: 'easy' },
  },
];

const clearTimeoutQueue = queueRef => {
  if (!queueRef?.current) return;
  queueRef.current.forEach(id => window.clearTimeout(id));
  queueRef.current = [];
};

export default function Welcome() {
  const [idx, setIdx] = useState(0);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const { stats, loading: statsLoading, error: statsError } = useStatsData();

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(id);
  }, []);

  // Observe stats section visibility to trigger animations
  useEffect(() => {
    if (!statsRef.current) return;

    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: immediately show stats if IntersectionObserver is not available
      setStatsVisible(true);
      return;
    }

    const el = statsRef.current;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setStatsVisible(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
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
      <section
        id='home'
        className={`${styles['welcome-hero']} ${styles['anchor-target']}`}
        aria-labelledby='welcome-heading'
      >
        {/* Background slides */}
        {HERO_IMAGES.map((img, i) => (
          <picture
            key={i}
            className={`${styles['welcome-slide']} ${idx === i ? styles['active'] : ''}`}
          >
            <source media='(max-width: 767.95px)' srcSet={img.mobile} type='image/jpg' />
            <img src={img.src} alt={img.alt} loading={i === 0 ? 'eager' : 'lazy'} />
          </picture>
        ))}
        <div className={styles['welcome-hero-gradient']} aria-hidden='true'></div>

        {/* Content */}
        <div className={`${styles['welcome-content']} reveal`} style={{ '--delay': '120ms' }}>
          <h1 id='welcome-heading' className={styles['welcome-title']}>
            <span className={styles['typewriter']}>{typedTitle}</span>
          </h1>
          <p className={styles['welcome-subtitle']}>
            Find trails, see community reviews, and plan your next outdoor adventure.
          </p>

          <div className={styles['welcome-search']} role='search' aria-label='Search trails'>
            <SearchBar
              placeholder='Search by city, park, or trail name'
              className={styles['welcome-search-bar']}
            />
          </div>

          <div className={styles['welcome-explore']}>
            <Link to='/trails'>Explore nearby trails</Link>
          </div>
        </div>
      </section>

      {SHOWCASE_SECTIONS.map(
        ({ id, eyebrow, title, description, bullets, action, image }, index) => (
          <section
            key={id}
            id={id}
            className={`${styles['highlight-section']} ${styles['anchor-target']} ${index % 2 ? styles['is-reversed'] : ''} reveal`}
            style={{ '--delay': `${180 + index * 90}ms` }}
            aria-labelledby={`${id}-heading`}
          >
            <div className={styles['highlight-inner']}>
              <div className={styles['highlight-copy']}>
                <p className={styles['section-eyebrow']}>{eyebrow}</p>
                <h2 id={`${id}-heading`}>{title}</h2>
                <p>{description}</p>
                <ul className={styles['highlight-points']}>
                  {bullets.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <Link to={action.to} className={styles['cta-link']}>
                  {action.label}
                </Link>
              </div>
              <div className={styles['highlight-media']}>
                <div
                  className={styles['highlight-media-frame']}
                  style={{ '--bg-image': `url(${image})` }}
                ></div>
              </div>
            </div>
          </section>
        )
      )}

      {/* Stats Section */}
      <section
        ref={statsRef}
        id='stats'
        className={`${styles['stats-section']} ${styles['anchor-target']} reveal`}
        style={{ '--delay': '220ms' }}
        aria-label='Orion hiking stats'
      >
        <div className={styles['stats-inner']}>
          <div className={styles['stats-grid']}>
            <StatCard
              label='Trails mapped'
              end={stats.trailsMapped}
              start={0}
              visible={statsVisible}
              loading={statsLoading}
            />
            <StatCard
              label='Total distance'
              end={stats.totalDistance}
              start={0}
              suffix=' km'
              visible={statsVisible}
              loading={statsLoading}
            />
            <StatCard
              label='Elevation gain'
              end={stats.elevationGain}
              start={0}
              suffix=' m'
              visible={statsVisible}
              loading={statsLoading}
            />
            <StatCard
              label='Active hikers'
              end={stats.activeHikers}
              start={0}
              visible={statsVisible}
              loading={statsLoading}
            />
          </div>
        </div>
      </section>

      {/* Browse by Activity Section */}
      <ActivitySection />

      <section
        id='about'
        className={`${styles['about-section']} ${styles['anchor-target']} reveal`}
        style={{ '--delay': '280ms' }}
        aria-labelledby='about-heading'
      >
        <div className={styles['about-inner']}>
          <div className={styles['about-copy']}>
            <p className={styles['section-eyebrow']}>About Orion</p>
            <h2 id='about-heading'>Charting new paths with the trail community</h2>
            <p>
              Orion helps millions of outdoor lovers find the right trail, navigate safely, and
              share their story — all while stewarding the environments we explore. Every dataset,
              alert, and review you see is refined through our hybrid of verified partners and
              passionate hikers like you.
            </p>
            <div className={styles['about-cta']}>
              <Link to='/signup' className={styles['cta-link']}>
                Join the community
              </Link>
              <Link to='/feedback' className={styles['cta-link-secondary']}>
                See what&apos;s new
              </Link>
            </div>
          </div>

          <div className={styles['about-grid']}>
            {ABOUT_HIGHLIGHTS.map(({ title, copy }, i) => (
              <article
                key={title}
                className={`${styles['about-card']} reveal`}
                style={{ '--delay': `${340 + i * 80}ms` }}
              >
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
function ActivitySection() {
  return (
    <section
      id='activities'
      className={`${styles['activities-section']} ${styles['anchor-target']} reveal`}
      style={{ '--delay': '260ms' }}
      aria-labelledby='browse-activity-heading'
    >
      <div className={styles['activities-inner']}>
        <h2 id='browse-activity-heading' className={styles['section-title']}>
          Browse by activity
        </h2>
        <div className={styles['activity-grid']}>
          {ACTIVITY_CARDS.map((card, index) => (
            <InteractiveActivityCard
              key={card.name}
              name={card.name}
              image={card.img}
              message={card.message}
              filters={card.filters}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function InteractiveActivityCard({ name, image, message, filters, index }) {
  const [isActive, setIsActive] = useState(false);
  const [typedText, setTypedText] = useState('');
  const timeoutsRef = useRef([]);
  const textRef = useRef(name);

  useEffect(() => {
    textRef.current = name;
  }, [name]);

  useEffect(() => () => clearTimeoutQueue(timeoutsRef), []);

  useEffect(() => {
    if (!isActive) {
      clearTimeoutQueue(timeoutsRef);
      setTypedText('');
      return;
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setTypedText(textRef.current);
      return () => clearTimeoutQueue(timeoutsRef);
    }

    let charIndex = 0;

    function schedule(nextDelay) {
      const id = window.setTimeout(step, nextDelay);
      timeoutsRef.current.push(id);
    }

    function step() {
      const full = textRef.current;
      if (charIndex >= full.length) return;

      charIndex += 1;
      setTypedText(full.slice(0, charIndex));

      if (charIndex < full.length) {
        schedule(charIndex === 1 ? 120 : 55);
      }
    }

    schedule(90);

    return () => clearTimeoutQueue(timeoutsRef);
  }, [isActive, name]);

  const showCursor = isActive && typedText.length < name.length;

  // Function to handle card click and navigate to reviews with filters
  const handleCardClick = () => {
    const params = new URLSearchParams();

    if (filters.tags && filters.tags.length > 0) {
      params.set('tags', filters.tags.join(','));
    }

    if (filters.difficulty && filters.difficulty !== 'all') {
      params.set('difficulty', filters.difficulty);
    }

    const queryString = params.toString();
    const url = queryString ? `/reviews?${queryString}` : '/reviews';

    window.location.href = url;
  };

  return (
    <article
      className={`${styles['activity-card']} reveal`}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
      onTouchStart={() => setIsActive(true)}
      onTouchEnd={() => setIsActive(false)}
      onTouchCancel={() => setIsActive(false)}
      onClick={handleCardClick}
      tabIndex={0}
      aria-label={`${name} activity highlight. ${message}`}
      title={`Click to view ${name} trails and reviews`}
      style={{
        '--delay': `${240 + index * 70}ms`,
        cursor: 'pointer',
      }}
    >
      <img
        src={image}
        alt={`${name} terrain`}
        className={styles['activity-image']}
        loading='lazy'
      />
      <div
        className={`${styles['activity-overlay']} ${isActive ? styles['visible'] : ''}`}
        aria-live={isActive ? 'polite' : 'off'}
      >
        <p className={styles['activity-typing']}>
          {typedText}
          {showCursor && (
            <span className={styles['typing-cursor']} aria-hidden='true'>
              |
            </span>
          )}
        </p>
        <p
          className={`${styles['activity-message']} ${typedText === name ? styles['message-visible'] : ''}`}
        >
          {message}
        </p>
      </div>
    </article>
  );
}

function StatCard({
  label,
  start = 0,
  end,
  duration = 1200,
  prefix = '',
  suffix = '',
  visible,
  loading = false,
}) {
  const [value, setValue] = useState(start);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!visible || startedRef.current || loading) return;
    startedRef.current = true;
    let rafId;
    const startTime = performance.now();

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

    const tick = now => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current = start + (end - start) * eased;
      setValue(current);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible, start, end, duration, loading]);

  // Reset animation when loading changes
  useEffect(() => {
    if (loading) {
      startedRef.current = false;
      setValue(start);
    }
  }, [loading, start]);

  return (
    <div className={styles['stat-card']} role='figure' aria-label={`${label} ${Math.round(value)}`}>
      <div className={styles['stat-value']}>
        {loading ? (
          <span className={styles['loading-placeholder']}>...</span>
        ) : (
          <>
            {prefix}
            {new Intl.NumberFormat().format(Math.round(value))}
            {suffix}
          </>
        )}
      </div>
      <div className={styles['stat-label']}>{label}</div>
    </div>
  );
}
