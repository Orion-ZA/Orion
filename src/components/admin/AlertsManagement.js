import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Trash2, AlertTriangle, Calendar, MapPin, MessageSquare, Eye, EyeOff } from 'lucide-react';
import './AlertsManagement.css';

export default function AlertsManagement() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const alertsRef = collection(db, 'Alerts');
      const q = query(alertsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const alertsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAlerts(alertsData);
    } catch (err) {
      setError('Failed to fetch alerts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await deleteDoc(doc(db, 'Alerts', alertId));
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete alert: ' + err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getAlertTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'community':
        return '#007aff';
      case 'authority':
        return '#ff9500';
      case 'emergency':
        return '#ff3b30';
      default:
        return '#a0a0a0';
    }
  };

  const getAlertTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'community':
        return <MessageSquare className="alert-type-icon" />;
      case 'authority':
        return <MapPin className="alert-type-icon" />;
      case 'emergency':
        return <AlertTriangle className="alert-type-icon" />;
      default:
        return <AlertTriangle className="alert-type-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="alerts-management">
        <div className="alerts-loading">
          <div className="loading-spinner"></div>
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alerts-management">
        <div className="alerts-error">
          <AlertTriangle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchAlerts} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-management">
      <div className="alerts-header">
        <h2>Alerts Management</h2>
        <div className="alerts-stats">
          <span className="stat-item">
            <AlertTriangle className="stat-icon" />
            Total Alerts: {alerts.length}
          </span>
          <span className="stat-item">
            <Eye className="stat-icon" />
            Active: {alerts.filter(alert => alert.isActive).length}
          </span>
        </div>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <AlertTriangle className="no-alerts-icon" />
            <p>No alerts found</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`alert-card ${alert.isActive ? 'active' : 'inactive'}`}>
              <div className="alert-header">
                <div className="alert-type">
                  {getAlertTypeIcon(alert.type)}
                  <span 
                    className="alert-type-text"
                    style={{ color: getAlertTypeColor(alert.type) }}
                  >
                    {alert.type || 'Unknown'}
                  </span>
                </div>
                <div className="alert-status">
                  {alert.isActive ? (
                    <Eye className="status-icon active" />
                  ) : (
                    <EyeOff className="status-icon inactive" />
                  )}
                  <span className={`status-text ${alert.isActive ? 'active' : 'inactive'}`}>
                    {alert.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteConfirm(alert)}
                  className="delete-button"
                  title="Delete Alert"
                >
                  <Trash2 className="delete-icon" />
                </button>
              </div>
              
              <div className="alert-content">
                <p className="alert-message">{alert.message || 'No message'}</p>
              </div>
              
              <div className="alert-details">
                <div className="detail-row">
                  <span className="detail-label">Trail ID:</span>
                  <span className="detail-value">{alert.trailId || 'N/A'}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{formatDate(alert.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this alert?</p>
            <div className="alert-preview">
              <p className="alert-preview-message">"{deleteConfirm.message}"</p>
              <p className="alert-preview-type">Type: {deleteConfirm.type}</p>
            </div>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAlert(deleteConfirm.id)}
                className="confirm-delete-button"
              >
                Delete Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
