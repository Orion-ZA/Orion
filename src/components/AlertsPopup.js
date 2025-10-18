import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, Timer } from 'lucide-react';
import './AlertsPopup.css';

const AlertsPopup = ({ isVisible, position, alerts, onMouseLeave }) => {
  const [timeRemaining, setTimeRemaining] = useState({});

  // Helper function to check if an alert is expired
  const isAlertExpired = (alert) => {
    if (!alert || !alert.isTimed || !alert.expiresAt) return false;
    
    try {
      const now = new Date();
      const expiresAt = alert.expiresAt.toDate ? alert.expiresAt.toDate() : new Date(alert.expiresAt);
      return now >= expiresAt;
    } catch (error) {
      console.warn('Error checking alert expiration:', error);
      return false;
    }
  };

  // Filter out expired alerts and handle invalid data
  const activeAlerts = React.useMemo(() => {
    if (!alerts || !Array.isArray(alerts)) return [];
    
    return alerts.filter(alert => {
      if (!alert || typeof alert !== 'object') return false;
      return !isAlertExpired(alert);
    });
  }, [alerts]);

  // Update countdown timers for timed alerts
  useEffect(() => {
    if (!activeAlerts || activeAlerts.length === 0) return;

    const interval = setInterval(() => {
      const newTimeRemaining = {};
      
      activeAlerts.forEach((alert) => {
        if (alert && alert.isTimed && alert.expiresAt) {
          try {
            const now = new Date();
            const expiresAt = alert.expiresAt.toDate ? alert.expiresAt.toDate() : new Date(alert.expiresAt);
            const timeLeft = expiresAt.getTime() - now.getTime();
            
            if (timeLeft > 0) {
              const hours = Math.floor(timeLeft / (1000 * 60 * 60));
              const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
              newTimeRemaining[alert.id || alert.type] = { hours, minutes, seconds };
            } else {
              newTimeRemaining[alert.id || alert.type] = null;
            }
          } catch (error) {
            console.warn('Error calculating time remaining:', error);
            newTimeRemaining[alert.id || alert.type] = null;
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    // Initial calculation
    const initialTimeRemaining = {};
    activeAlerts.forEach((alert) => {
      if (alert && alert.isTimed && alert.expiresAt) {
        try {
          const now = new Date();
          const expiresAt = alert.expiresAt.toDate ? alert.expiresAt.toDate() : new Date(alert.expiresAt);
          const timeLeft = expiresAt.getTime() - now.getTime();
          
          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            initialTimeRemaining[alert.id || alert.type] = { hours, minutes, seconds };
          } else {
            initialTimeRemaining[alert.id || alert.type] = null;
          }
        } catch (error) {
          console.warn('Error calculating initial time remaining:', error);
          initialTimeRemaining[alert.id || alert.type] = null;
        }
      }
    });
    setTimeRemaining(initialTimeRemaining);

    return () => clearInterval(interval);
  }, [activeAlerts]);

  if (!isVisible) return null;

  // Handle position prop validation
  const safePosition = {
    x: typeof position?.x === 'number' ? position.x : 0,
    y: typeof position?.y === 'number' ? position.y : 0
  };

  return (
    <div 
      className="orion-alerts-popup"
      style={{
        position: 'fixed',
        left: `${safePosition.x}px`,
        top: `${safePosition.y}px`,
        zIndex: 75
      }}
      onMouseLeave={onMouseLeave}
    >
      <div className="orion-alerts-popup-content">
        <div className="orion-alerts-popup-header">
          <span className="orion-alerts-popup-title">Trail Alerts</span>
        </div>
        <div className="orion-alerts-popup-body">
          {activeAlerts.length === 0 ? (
            <div className="orion-alerts-popup-empty">
              <span>No active alerts</span>
            </div>
          ) : (
            activeAlerts.map((alert, index) => (
              <div key={alert.id || index} className="orion-alerts-popup-item">
                <div className="orion-alerts-popup-item-header">
                  <div className="orion-alerts-popup-type-container">
                    <span className="orion-alerts-popup-type">[{alert.type}]</span>
                    {alert.isTimed ? (
                      <span className="orion-alerts-popup-timed-badge">
                        <Clock size={10} />
                        Timed
                      </span>
                    ) : (
                      <span className="orion-alerts-popup-permanent-badge">
                        <AlertCircle size={10} />
                        Permanent
                      </span>
                    )}
                  </div>
                  {alert.isTimed && timeRemaining[alert.id || alert.type] && (
                    <span className="orion-alerts-popup-timer">
                      <Timer size={10} />
                      {timeRemaining[alert.id || alert.type].hours}h {timeRemaining[alert.id || alert.type].minutes}m {timeRemaining[alert.id || alert.type].seconds}s
                    </span>
                  )}
                </div>
                <span className="orion-alerts-popup-message">{alert.message || alert.comment || 'No message'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPopup;