import React from 'react';

const AlertsPopup = ({ isVisible, position, alerts, onMouseLeave }) => {
  if (!isVisible) return null;

  return (
    <div 
      className="alerts-popup"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
      onMouseLeave={onMouseLeave}
    >
      <div className="alerts-popup-content">
        <div className="alerts-popup-header">
          <span className="alerts-popup-title">Trail Alerts</span>
        </div>
        <div className="alerts-popup-body">
          {alerts.map((alert, index) => (
            <div key={alert.id || index} className="alerts-popup-item">
              <span className="alerts-popup-type">[{alert.type}]</span>
              <span className="alerts-popup-message">{alert.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertsPopup;
