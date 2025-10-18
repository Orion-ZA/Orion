import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Flag, Eye, Trash2, CheckCircle, XCircle, Clock, User, Calendar, AlertTriangle } from 'lucide-react';
import SuccessPopup from '../SuccessPopup';
import './ReportsManagement.css';

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const reportsRef = collection(db, 'Reports');
      const q = query(reportsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().timestamp)
      }));
      
      setReports(reportsData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const reportRef = doc(db, 'Reports', reportId);
      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus }
          : report
      ));
      
      displaySuccessPopup(`Report status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating report status:', err);
      setError('Failed to update report status');
    }
  };

  const deleteReport = async (reportId) => {
    try {
      await deleteDoc(doc(db, 'Reports', reportId));
      setReports(prev => prev.filter(report => report.id !== reportId));
      displaySuccessPopup('Report deleted successfully');
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    }
  };

  const displaySuccessPopup = (message) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
  };

  const hideSuccessPopup = () => {
    setShowSuccessPopup(false);
    setSuccessMessage('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'reviewed': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'dismissed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'reviewed': return <Eye size={16} />;
      case 'resolved': return <CheckCircle size={16} />;
      case 'dismissed': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'trail': return <Flag size={16} />;
      case 'review': return <User size={16} />;
      case 'image': return <Eye size={16} />;
      case 'alert': return <AlertTriangle size={16} />;
      default: return <Flag size={16} />;
    }
  };

  const filteredReports = reports.filter(report => {
    const statusMatch = statusFilter === 'all' || report.status === statusFilter;
    const typeMatch = typeFilter === 'all' || report.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="reports-management">
        <div className="reports-loading">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-management">
        <div className="reports-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-management">
      {/* Header */}
      <div className="reports-header">
        <h2>Reports Management</h2>
        <div className="reports-stats">
          <div className="stat-item">
            <Flag className="stat-icon" />
            <span>{reports.length} Total Reports</span>
          </div>
          <div className="stat-item">
            <Clock className="stat-icon" />
            <span>{reports.filter(r => r.status === 'pending').length} Pending</span>
          </div>
          <div className="stat-item">
            <CheckCircle className="stat-icon" />
            <span>{reports.filter(r => r.status === 'resolved').length} Resolved</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="trail">Trail</option>
            <option value="review">Review</option>
            <option value="image">Image</option>
            <option value="alert">Alert</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="reports-list">
        {filteredReports.length === 0 ? (
          <div className="empty-state">
            <p>No reports found matching the current filters</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="report-header">
                <div className="report-type">
                  {getTypeIcon(report.type)}
                  <span className="report-type-text">{report.type?.toUpperCase() || 'UNKNOWN'}</span>
                </div>
                <div className="report-status">
                  <span 
                    className="report-status-badge"
                    style={{ color: getStatusColor(report.status) }}
                  >
                    {getStatusIcon(report.status)}
                    {report.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div className="report-actions">
                  <select
                    value={report.status || 'pending'}
                    onChange={(e) => updateReportStatus(report.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="delete-report-btn"
                    title="Delete Report"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="report-content">
                <div className="report-details">
                  <h4 className="report-category">{report.category?.replace('_', ' ').toUpperCase() || 'UNKNOWN CATEGORY'}</h4>
                  <p className="report-description">{report.description}</p>
                  {report.additionalDetails && (
                    <p className="report-additional">{report.additionalDetails}</p>
                  )}
                </div>

                <div className="report-meta">
                  <div className="report-meta-item">
                    <User size={14} />
                    <span>Reporter: {report.reporterId || 'Anonymous'}</span>
                  </div>
                  <div className="report-meta-item">
                    <Calendar size={14} />
                    <span>Reported: {formatDate(report.createdAt)}</span>
                  </div>
                  {report.trailId && (
                    <div className="report-meta-item">
                      <Flag size={14} />
                      <span>Trail: {report.trailName || report.trailId}</span>
                    </div>
                  )}
                  {report.targetId && (
                    <div className="report-meta-item">
                      <span>Target: {report.targetId}</span>
                    </div>
                  )}
                  {report.priority && (
                    <div className="report-meta-item">
                      <span className={`priority-badge priority-${report.priority}`}>
                        {report.priority.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Success Popup */}
      <SuccessPopup
        isVisible={showSuccessPopup}
        message={successMessage}
        onClose={hideSuccessPopup}
      />
    </div>
  );
};

export default ReportsManagement;
