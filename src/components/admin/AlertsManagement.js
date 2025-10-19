import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import {
  Trash2,
  AlertTriangle,
  Calendar,
  MapPin,
  MessageSquare,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
} from 'lucide-react';
import './AlertsManagement.css';

export default function AlertsManagement() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({});

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Helper function to check if an alert is expired
  const isAlertExpired = alert => {
    if (!alert || !alert.isTimed || !alert.expiresAt) return false;

    try {
      const now = new Date();
      const expiresAt = alert.expiresAt.toDate
        ? alert.expiresAt.toDate()
        : new Date(alert.expiresAt);
      return now >= expiresAt;
    } catch (error) {
      console.warn('Error checking alert expiration:', error);
      return false;
    }
  };

  // Update countdown timers for timed alerts
  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    const interval = setInterval(() => {
      const newTimeRemaining = {};

      alerts.forEach(alert => {
        if (alert && alert.isTimed && alert.expiresAt && alert.isActive && !isAlertExpired(alert)) {
          try {
            const now = new Date();
            const expiresAt = alert.expiresAt.toDate
              ? alert.expiresAt.toDate()
              : new Date(alert.expiresAt);
            const timeLeft = expiresAt.getTime() - now.getTime();

            if (timeLeft > 0) {
              const hours = Math.floor(timeLeft / (1000 * 60 * 60));
              const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
              newTimeRemaining[alert.id] = { hours, minutes, seconds };
            } else {
              newTimeRemaining[alert.id] = null;
            }
          } catch (error) {
            console.warn('Error calculating time remaining:', error);
            newTimeRemaining[alert.id] = null;
          }
        }
      });

      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [alerts]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const alertsRef = collection(db, 'Alerts');
      const q = query(alertsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const alertsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAlerts(alertsData);
    } catch (err) {
      setError('Failed to fetch alerts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async alertId => {
    try {
      await deleteDoc(doc(db, 'Alerts', alertId));
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      setDeleteConfirm(null);
    } catch (err) {
      console.warn('Error deleting alert:', err);
      setError('Failed to delete alert: ' + err.message);
    }
  };

  const formatDate = timestamp => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getAlertTypeColor = type => {
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

  const getAlertTypeIcon = type => {
    switch (type?.toLowerCase()) {
      case 'community':
        return <MessageSquare className='admin-alert-type-icon' />;
      case 'authority':
        return <MapPin className='admin-alert-type-icon' />;
      case 'emergency':
        return <AlertTriangle className='admin-alert-type-icon' />;
      default:
        return <AlertTriangle className='admin-alert-type-icon' />;
    }
  };

  if (loading) {
    return (
      <div className='admin-alerts-management'>
        <div className='admin-alerts-loading'>
          <div className='admin-loading-spinner'></div>
          <p>Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='admin-alerts-management'>
        <div className='admin-alerts-error'>
          <AlertTriangle className='admin-error-icon' />
          <p>{error}</p>
          <button onClick={fetchAlerts} className='admin-retry-button'>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='admin-alerts-management'>
      <div className='admin-alerts-header'>
        <h2>Alerts Management</h2>
        <div className='admin-alerts-stats'>
          <span className='admin-stat-item'>
            <AlertTriangle className='admin-stat-icon' />
            Total Alerts: {alerts.length}
          </span>
          <span className='admin-stat-item'>
            <Eye className='admin-stat-icon' />
            Active: {alerts.filter(alert => alert.isActive).length}
          </span>
        </div>
      </div>

      <div className='admin-alerts-list'>
        {alerts.length === 0 ? (
          <div className='admin-no-alerts'>
            <AlertTriangle className='admin-no-alerts-icon' />
            <p>No alerts found</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`admin-alert-card ${alert.isActive ? 'active' : 'inactive'}`}
            >
              <div className='admin-alert-header'>
                <div className='admin-alert-type'>
                  {getAlertTypeIcon(alert.type)}
                  <span
                    className='admin-alert-type-text'
                    style={{ color: getAlertTypeColor(alert.type) }}
                  >
                    {alert.type || 'Unknown'}
                  </span>
                  {alert.isTimed ? (
                    <span className='admin-alert-timed-badge'>
                      <Clock size={12} />
                      Timed
                    </span>
                  ) : (
                    <span className='admin-alert-permanent-badge'>
                      <AlertCircle size={12} />
                      Permanent
                    </span>
                  )}
                </div>
                <div className='admin-alert-status'>
                  {alert.isActive ? (
                    <Eye className='admin-status-icon active' />
                  ) : (
                    <EyeOff className='admin-status-icon inactive' />
                  )}
                  <span className={`admin-status-text ${alert.isActive ? 'active' : 'inactive'}`}>
                    {alert.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteConfirm(alert)}
                  className='admin-delete-button'
                  title='Delete Alert'
                >
                  <Trash2 className='admin-delete-icon' />
                </button>
              </div>

              <div className='admin-alert-content'>
                <p className='admin-alert-message'>{alert.message || 'No message'}</p>
              </div>

              <div className='admin-alert-details'>
                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Trail ID:</span>
                  <span className='admin-detail-value'>{alert.trailId || 'N/A'}</span>
                </div>

                <div className='admin-detail-row'>
                  <span className='admin-detail-label'>Created:</span>
                  <span className='admin-detail-value'>{formatDate(alert.timestamp)}</span>
                </div>

                {alert.isTimed && (
                  <div className='admin-detail-row'>
                    <span className='admin-detail-label'>
                      <Clock className='admin-detail-icon' />
                      Timer:
                    </span>
                    <span className='admin-detail-value'>
                      {isAlertExpired(alert) ? (
                        <span className='admin-timer-expired'>Expired</span>
                      ) : timeRemaining[alert.id] ? (
                        <span className='admin-timer-active'>
                          {timeRemaining[alert.id].hours}h {timeRemaining[alert.id].minutes}m{' '}
                          {timeRemaining[alert.id].seconds}s remaining
                        </span>
                      ) : (
                        <span className='admin-timer-expired'>Expired</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {deleteConfirm && (
        <div className='admin-delete-modal-overlay'>
          <div className='admin-delete-modal'>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this alert?</p>
            <div className='admin-alert-preview'>
              <p className='admin-alert-preview-message'>"{deleteConfirm.message}"</p>
              <p className='admin-alert-preview-type'>Type: {deleteConfirm.type}</p>
            </div>
            <p className='admin-warning-text'>This action cannot be undone.</p>
            <div className='admin-modal-actions'>
              <button onClick={() => setDeleteConfirm(null)} className='admin-cancel-button'>
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAlert(deleteConfirm.id)}
                className='admin-confirm-delete-button'
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
