import React, { useState } from 'react';
import { Flag, X, AlertTriangle, MessageSquare, Image, Shield, Info } from 'lucide-react';
import './ReportModal.css';

const ReportModal = ({
  isVisible,
  onClose,
  onSubmit,
  trailId,
  trailName,
  reportType = 'general', // 'trail', 'review', 'image', 'alert', 'general'
  targetId = null, // ID of specific item being reported (review, image, alert).
  loading = false,
}) => {
  const [reportCategory, setReportCategory] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportPriority, setReportPriority] = useState('medium');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const getReportCategories = () => {
    switch (reportType) {
      case 'trail':
        return [
          { value: 'inaccurate_info', label: 'Inaccurate Information', icon: Info },
          { value: 'safety_concern', label: 'Safety Concern', icon: AlertTriangle },
          { value: 'accessibility', label: 'Accessibility Issue', icon: Shield },
          { value: 'maintenance', label: 'Maintenance Needed', icon: Flag },
          { value: 'inappropriate_content', label: 'Inappropriate Content', icon: Flag },
          { value: 'duplicate', label: 'Duplicate Trail', icon: Flag },
          { value: 'other', label: 'Other', icon: Flag },
        ];
      case 'review':
        return [
          { value: 'inappropriate_content', label: 'Inappropriate Content', icon: Flag },
          { value: 'spam', label: 'Spam', icon: Flag },
          { value: 'harassment', label: 'Harassment', icon: Shield },
          { value: 'false_information', label: 'False Information', icon: Info },
          { value: 'off_topic', label: 'Off Topic', icon: MessageSquare },
          { value: 'other', label: 'Other', icon: Flag },
        ];
      case 'image':
        return [
          { value: 'inappropriate_content', label: 'Inappropriate Content', icon: Flag },
          { value: 'not_trail_related', label: 'Not Trail Related', icon: Image },
          { value: 'poor_quality', label: 'Poor Quality', icon: Image },
          { value: 'duplicate', label: 'Duplicate Image', icon: Image },
          { value: 'copyright_violation', label: 'Copyright Violation', icon: Shield },
          { value: 'other', label: 'Other', icon: Flag },
        ];
      case 'alert':
        return [
          { value: 'false_information', label: 'False Information', icon: Info },
          { value: 'outdated', label: 'Outdated Alert', icon: AlertTriangle },
          { value: 'inappropriate', label: 'Inappropriate Content', icon: Flag },
          { value: 'spam', label: 'Spam', icon: Flag },
          { value: 'other', label: 'Other', icon: Flag },
        ];
      default:
        return [
          { value: 'bug_report', label: 'Bug Report', icon: AlertTriangle },
          { value: 'feature_request', label: 'Feature Request', icon: Info },
          { value: 'inappropriate_content', label: 'Inappropriate Content', icon: Flag },
          { value: 'spam', label: 'Spam', icon: Flag },
          { value: 'other', label: 'Other', icon: Flag },
        ];
    }
  };

  const getReportTypeLabel = () => {
    switch (reportType) {
      case 'trail':
        return 'Trail';
      case 'review':
        return 'Review';
      case 'image':
        return 'Image';
      case 'alert':
        return 'Alert';
      default:
        return 'General';
    }
  };

  const handleSubmit = () => {
    if (!reportCategory || !reportDescription.trim()) {
      return;
    }

    const reportData = {
      type: reportType,
      category: reportCategory,
      description: reportDescription,
      priority: reportPriority,
      additionalDetails: additionalDetails,
      targetId: targetId,
      trailId: trailId,
      timestamp: new Date().toISOString(),
    };

    onSubmit(reportData);
  };

  const handleClose = () => {
    // Reset form
    setReportCategory('');
    setReportDescription('');
    setReportPriority('medium');
    setAdditionalDetails('');
    onClose();
  };

  if (!isVisible) return null;

  const categories = getReportCategories();

  return (
    <div className='report-modal-overlay' onClick={handleClose}>
      <div className='report-modal-content' onClick={e => e.stopPropagation()}>
        <div className='report-modal-header'>
          <div className='report-modal-title'>
            <Flag size={20} />
            <h3>Report {getReportTypeLabel()}</h3>
          </div>
          <button className='report-modal-close' onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {trailName && (
          <div className='report-modal-trail-info'>
            <span className='report-modal-trail-label'>Trail:</span>
            <span className='report-modal-trail-name'>{trailName}</span>
          </div>
        )}

        <div className='report-modal-body'>
          <div className='report-form-group'>
            <label htmlFor='report-category'>Report Category *</label>
            <div className='report-category-grid'>
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.value}
                    type='button'
                    className={`report-category-btn ${reportCategory === category.value ? 'active' : ''}`}
                    onClick={() => setReportCategory(category.value)}
                  >
                    <IconComponent size={16} />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className='report-form-group'>
            <label htmlFor='report-description'>Description *</label>
            <textarea
              id='report-description'
              value={reportDescription}
              onChange={e => setReportDescription(e.target.value)}
              placeholder='Please provide a detailed description of the issue...'
              className='report-form-textarea'
              rows={4}
              maxLength={1000}
            />
            <div className='report-form-char-count'>{reportDescription.length}/1000 characters</div>
          </div>

          <div className='report-form-group'>
            <label htmlFor='report-priority'>Priority Level</label>
            <select
              id='report-priority'
              value={reportPriority}
              onChange={e => setReportPriority(e.target.value)}
              className='report-form-select'
            >
              <option value='low'>Low - Minor issue</option>
              <option value='medium'>Medium - Moderate concern</option>
              <option value='high'>High - Serious issue</option>
              <option value='urgent'>Urgent - Safety concern</option>
            </select>
          </div>

          <div className='report-form-group'>
            <label htmlFor='report-additional'>Additional Information</label>
            <textarea
              id='report-additional'
              value={additionalDetails}
              onChange={e => setAdditionalDetails(e.target.value)}
              placeholder='Any additional information that might be helpful...'
              className='report-form-textarea'
              rows={3}
              maxLength={500}
            />
            <div className='report-form-char-count'>{additionalDetails.length}/500 characters</div>
          </div>

          <div className='report-form-notice'>
            <Info size={16} />
            <p>
              Your report will be reviewed by our moderation team. We take all reports seriously and
              will investigate the issue promptly. False reports may result in account restrictions.
            </p>
          </div>
        </div>

        <div className='report-modal-footer'>
          <button
            className='report-btn report-btn-secondary'
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className='report-btn report-btn-primary'
            onClick={handleSubmit}
            disabled={loading || !reportCategory || !reportDescription.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
