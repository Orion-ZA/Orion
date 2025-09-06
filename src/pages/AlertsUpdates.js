import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";


export default function AlertsUpdates() {
  const [alerts, setAlerts] = useState([]);
  const [savedTrails, setSavedTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);

  // Replace with your actual Cloud Function URLs
  const ALERTS_API_URL = 'https://gettrailalerts-fqtduxc7ua-uc.a.run.app';
  const SAVED_TRAILS_API_URL = 'https://getsavedtrails-fqtduxc7ua-uc.a.run.app'; 

  // Replace with actual user ID - you might get this from your auth context
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    async function fetchUserData() {
      if (!userId) {
        setUserLoading(false);
        return;
      }

      try {
        // Fetch user's saved trails
        const trailsRes = await fetch(`${SAVED_TRAILS_API_URL}?uid=${userId}`);
        const trailsData = await trailsRes.json();
        
        // Combine all saved trails from different categories
        const allSavedTrails = [
          ...(trailsData.favourites || []),
          ...(trailsData.wishlist || []),
          ...(trailsData.completed || [])
        ];
        
        setSavedTrails(allSavedTrails);
      } catch (err) {
        console.error('Failed to fetch saved trails:', err);
      } finally {
        setUserLoading(false);
      }
    }

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    async function fetchAlertsForSavedTrails() {
      if (savedTrails.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Fetch alerts for each saved trail individually
        const alertPromises = savedTrails.map(async (trail) => {
          try {
            const res = await fetch(`${ALERTS_API_URL}?trailId=${trail.id}`);
            const data = await res.json();
            // Add trail information to each alert
            return Array.isArray(data.alerts) 
              ? data.alerts.map(alert => ({ ...alert, trailName: trail.name || trail.title }))
              : [];
          } catch (err) {
            console.error(`Failed to fetch alerts for trail ${trail.id}:`, err);
            return [];
          }
        });

        const alertsArrays = await Promise.all(alertPromises);
        // Flatten the array of arrays and remove duplicates if any
        const allAlerts = alertsArrays.flat();
        setAlerts(allAlerts);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    // Only fetch alerts if we have saved trails data
    if (!userLoading) {
      fetchAlertsForSavedTrails();
    }
  }, [savedTrails, userLoading]);

  // Combined loading state
  const isLoading = loading || userLoading;

  return (
    <div className="container fade-in-up">
      <h1>Alerts & Updates</h1>
      <div className="grid cols-2" style={{ marginTop: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3>Active Alerts for Your Saved Trails</h3>
          {isLoading ? (
            <p>Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>
              {savedTrails.length === 0 
                ? 'No saved trails found. Add trails to your favorites, wishlist, or completed list to see alerts.'
                : 'No active alerts for your saved trails at this time.'
              }
            </p>
          ) : (
            <ul style={{ color: 'var(--muted)', listStyle: 'none', padding: 0 }}>
              {alerts.map((alert, index) => (
                <li key={alert.id || index} style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}>
                  <span className={`badge ${alert.type === 'authority' ? 'danger' : 'warning'}`}>
                    {alert.type === 'authority' ? 'Closure' : 'Condition'}
                  </span>{' '}
                  <strong>{alert.message}</strong>
                  {alert.trailName && (
                    <div style={{ fontSize: '0.9em', marginTop: '0.5rem', color: 'var(--text)' }}>
                      Trail: <strong>{alert.trailName}</strong>
                    </div>
                  )}
                  {alert.date && (
                    <div style={{ fontSize: '0.8em', marginTop: '0.25rem', color: 'var(--muted)' }}>
                      Posted: {new Date(alert.date).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <h3>Subscriptions</h3>
          <p className="muted">Sign up to get alerts on saved trails.</p>
          <div className="grid cols-2">
            <input className="input" placeholder="Email address" />
            <button className="button">Subscribe</button>
          </div>
          
          {/* Display saved trails count */}
          {!userLoading && (
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'var(--light)', borderRadius: '4px' }}>
              <small>
                Tracking alerts for <strong>{savedTrails.length}</strong> saved trails
                {alerts.length > 0 && (
                  <>, with <strong>{alerts.length}</strong> active alerts</>
                )}
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}