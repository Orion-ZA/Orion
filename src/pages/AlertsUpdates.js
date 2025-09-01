import React, { useEffect, useState } from 'react';

export default function AlertsUpdates() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replace with your actual Cloud Function URL
  const ALERTS_API_URL = 'https://us-central1-orion-sdp.cloudfunctions.net/getAlerts';

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(ALERTS_API_URL); // fetch all alerts
        const data = await res.json();
        setAlerts(data.alerts || []);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  return (
    <div className="container fade-in-up">
      <h1>Alerts & Updates</h1>
      <div className="grid cols-2" style={{ marginTop: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3>Active Alerts</h3>
          {loading ? (
            <p>Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No active alerts at this time.</p>
          ) : (
            <ul style={{ color: 'var(--muted)' }}>
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <span className={`badge ${alert.type === 'authority' ? 'danger' : ''}`}>
                    {alert.type === 'authority' ? 'Closure' : 'Condition'}
                  </span>{' '}
                  {alert.message}
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
        </div>
      </div>
    </div>
  );
}
