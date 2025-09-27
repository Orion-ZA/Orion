// src/components/lists/TrailList.js
import React, { useEffect, useState } from 'react';

// Add these helper functions
async function fetchTrailReviews(trailId) {
  const res = await fetch(
    `https://us-central1-orion-sdp.cloudfunctions.net/getTrailReviews?trailId=${trailId}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.reviews || [];
}

function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
  return sum / reviews.length;
}

export default function TrailList({ trails, userLocation, selectedTrail, onSelectTrail, calculateDistance, maxDistance }) {
  const [trailsWithRatings, setTrailsWithRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateRatings = async () => {
      const trailsWithCalculatedRatings = await Promise.all(
        trails.map(async (trail) => {
          // If averageRating is already calculated, use it
          if (trail.averageRating !== undefined) {
            return trail;
          }
          
          // Otherwise, fetch reviews and calculate
          const reviews = await fetchTrailReviews(trail.id);
          const averageRating = calculateAverageRating(reviews);
          const reviewCount = reviews.length;
          
          return {
            ...trail,
            averageRating,
            reviewCount
          };
        })
      );
      
      setTrailsWithRatings(trailsWithCalculatedRatings);
      setLoading(false);
    };

    calculateRatings();
  }, [trails]);

  if (loading) return <p>Loading ratings...</p>;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      <div style={{padding: '1rem', borderRadius: '8px', border: '1px solid #ccc'}}>
        <strong>Trails Near You ({trailsWithRatings.length})</strong>
        {userLocation && (
          <span style={{fontSize: '0.8rem', marginLeft: '0.5rem', color: '#666'}}>
            within {maxDistance} km
          </span>
        )}
        <div style={{maxHeight: '520px', overflowY: 'auto', marginTop: '0.5rem'}}>
          {trailsWithRatings.length === 0 ? (
            <p style={{color: '#666'}}>No trails found. Try adjusting your filters or increasing the distance.</p>
          ) : (
            trailsWithRatings.map(trail => {
              const distance = userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, trail.location.latitude, trail.location.longitude).toFixed(1) : 'N/A';
              
              return (
                <div 
                  key={trail.id} 
                  style={{
                    padding: '0.75rem', 
                    borderBottom: '1px solid #eee', 
                    cursor: 'pointer', 
                    backgroundColor: selectedTrail?.id === trail.id ? '#f0f0f0' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => onSelectTrail(trail)}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <strong>{trail.name}</strong>
                    <span style={{color: trail.difficulty === 'Easy' ? '#4CAF50' : trail.difficulty === 'Moderate' ? '#FF9800' : '#F44336', fontWeight: 'bold'}}>
                      {trail.difficulty}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: '#555', fontSize: '0.9rem'}}>
                    <span>{trail.distance} km • {trail.elevationGain} m gain</span>
                    <span>
                      ⭐ {trail.averageRating ? trail.averageRating.toFixed(1) : 'N/A'} 
                      {trail.reviewCount > 0}
                    </span>
                  </div>
                  {userLocation && (
                    <div style={{marginTop: '0.25rem', fontSize: '0.8rem', color: '#666'}}>
                      📍 {distance} km away
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}