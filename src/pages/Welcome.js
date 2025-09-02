import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css';

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

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % HERO_IMAGES.length), 6000);
    return () => clearInterval(id);
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
    <div className="welcome-page">
      <section className="welcome-hero" aria-labelledby="welcome-heading">
        {/* Background slides */}
        {HERO_IMAGES.map((img, i) => (
          <picture key={i} className={`welcome-slide ${idx === i ? 'active' : ''}`}>
            <source media="(max-width: 767.95px)" srcSet={img.mobile} type="image/jpg" />
            <img src={img.src} alt={img.alt} loading={i === 0 ? 'eager' : 'lazy'} />
          </picture>
        ))}
        <div className="welcome-hero-gradient" aria-hidden="true"></div>

        {/* Content */}
        <div className="welcome-content">
          <h1 id="welcome-heading" className="welcome-title">
            <span className="typewriter">{typedTitle}</span>
          </h1>
          <p className="welcome-subtitle">Find trails, see community reviews, and plan your next outdoor adventure.</p>

          <div className="welcome-search" role="search" aria-label="Search trails">
            <div className="welcome-search-inner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="welcome-search-icon"><path fillRule="evenodd" clipRule="evenodd" d="M3.75 10.875a7.125 7.125 0 1 1 14.25 0 7.125 7.125 0 0 1-14.25 0Zm7.125-8.625a8.625 8.625 0 1 0 5.546 15.231l4.049 4.05a.75.75 0 0 0 1.06-1.061l-4.049-4.05a8.625 8.625 0 0 0-6.606-14.17Z"></path></svg>
              <input type="search" placeholder="Search by city, park, or trail name" aria-label="Search" />
              <button type="button" className="welcome-search-btn">Search</button>
            </div>
          </div>

          <div className="welcome-explore">
            <Link to="/explorer">Explore nearby trails</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
