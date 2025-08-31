// src/components/lists/TrailList.js
import React from 'react';

export default function TrailList({ trails, userLocation, selectedTrail, onSelectTrail, calculateDistance, maxDistance }) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
      <div style={{padding: '1rem', borderRadius: '8px', border: '1px solid #ccc'}}>
        <strong>Trails Near You ({trails.length})</strong>
        {userLocation && (
          <span style={{fontSize: '0.8rem', marginLeft: '0.5rem', color: '#666'}}>
            within {maxDistance} km
          </span>
        )}
        <div style={{maxHeight: '520px', overflowY: 'auto', marginTop: '0.5rem'}}>
          {trails.length === 0 ? (
            <p style={{color: '#666'}}>No trails found. Try adjusting your filters or increasing the distance.</p>
          ) : (
            trails.map(trail => {
              const distance = userLocation ? calculateDistance(userLocation.latitude, userLocation.longitude, trail.location.latitude, trail.location.longitude).toFixed(1) : 'N/A';
              return (
                <div 
                  key={trail.id} 
                  style={{
                    padding: '0.75rem', 
                    borderBottom: '1px solid #eee', 
                    cursor: 'pointer', 
                    backgroundColor: selectedTrail?.id === trail.id ? '#f0f8ff' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => onSelectTrail(trail)}
                  onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f8ff';
                      e.currentTarget.style.color = '#333';
                  }}
                  onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedTrail?.id === trail.id ? '#f0f8ff' : 'transparent';
                      e.currentTarget.style.color = selectedTrail?.id === trail.id ? 'grey' : '#e6edf3';
                  }}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <strong>{trail.name}</strong>
                    <span style={{color: trail.difficulty === 'Easy' ? '#4CAF50' : trail.difficulty === 'Moderate' ? '#FF9800' : '#F44336', fontWeight: 'bold'}}>
                      {trail.difficulty}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: '#555', fontSize: '0.9rem'}}>
                    <span>{trail.distance} km • {trail.elevationGain} m gain</span>
                    <span>⭐ {trail.rating}</span>
                  </div>
                  {userLocation && (
                    <div style={{marginTop: '0.25rem', fontSize: '0.8rem', color: '#666'}}>
                      📍 {distance} km away
                    </div>
                  )}
                  {trail.tags && trail.tags.length > 0 && (
                    <div style={{marginTop: '0.25rem', fontSize: '0.8rem', color: '#666'}}>
                      🏷️ {trail.tags.join(', ')}
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