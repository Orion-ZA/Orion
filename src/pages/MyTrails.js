import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";


export default function MyTrails() {
  const [trails, setTrails] = useState({ favourites: [], completed: [], wishlist: [] });
  const [alerts, setAlerts] = useState({}); // { trailId: [alert, ...] }
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  useEffect(() => {
    async function fetchSavedTrails() {
      try {
        // Fetch all saved trails for the user
        const res = await fetch(`https://getsavedtrails-fqtduxc7ua-uc.a.run.app?uid=${userId}`);
        const data = await res.json();
        setTrails(data);

        // Flatten all trails to fetch alerts
        const allTrails = [...data.favourites, ...data.completed, ...data.wishlist];

        const alertsData = {};
        await Promise.all(
          allTrails.map(async (trail) => {
            try {
              const res = await fetch(`https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=${trail.id}`);
              const alertData = await res.json();
              alertsData[trail.id] = alertData.alerts || [];
            } catch (err) {
              console.error(`Error fetching alerts for ${trail.name}:`, err);
              alertsData[trail.id] = [];
            }
          })
        );

        setAlerts(alertsData);
      } catch (err) {
        console.error('Error fetching saved trails:', err);
      }
    }

    fetchSavedTrails();
  }, []);

  const renderTrailList = (trailArray) =>
    trailArray.map((trail) => (
      <li key={trail.id}>
        <strong>{trail.name}</strong>
        {alerts[trail.id] && alerts[trail.id].length > 0 && (
          <ul style={{ color: 'red', marginTop: '0.25rem' }}>
            {alerts[trail.id].map((alert) => (
              <li key={alert.id}>
                [{alert.type}] {alert.message}
              </li>
            ))}
          </ul>
        )}
      </li>
    ));

  return (
    <div className="container fade-in-up">
      <h1>MyTrails</h1>
      <div className="grid cols-3" style={{ marginTop: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3>Favourites</h3>
          <ul style={{ color: 'var(--muted)' }}>{renderTrailList(trails.favourites)}</ul>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h3>Completed</h3>
          <ul style={{ color: 'var(--muted)' }}>{renderTrailList(trails.completed)}</ul>
        </div>
        <div className="card" style={{ padding: '1rem' }}>
          <h3>Wishlist</h3>
          <ul style={{ color: 'var(--muted)' }}>{renderTrailList(trails.wishlist)}</ul>
        </div>
      </div>
    </div>
  );
}
