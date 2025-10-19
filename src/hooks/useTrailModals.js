import { useState } from 'react';
import { useToast } from '../components/ToastContext';
import {
  addTrailReview,
  uploadTrailImages,
  updateTrailImages,
  addTrailAlert,
  submitTrailReport,
} from '../utils/trailApi';

export const useTrailModals = (user, trailId, trailName, setTrail, fetchTrailReviews) => {
  const { show: showToast } = useToast();

  // Modal visibility states
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Contribution modal states
  const [contributionType, setContributionType] = useState('');
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [newImages, setNewImages] = useState([]);

  // Report modal states
  const [reportType, setReportType] = useState('general');
  const [reportTargetId, setReportTargetId] = useState(null);

  // Success popup states
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Loading state
  const [uploading, setUploading] = useState(false);

  // Contribution functions
  const openContributionModal = type => {
    if (!user) {
      showToast('Please log in to contribute', 'error');
      return;
    }

    if (type === 'alert') {
      setShowAlertModal(true);
      return;
    }

    setContributionType(type);
    setShowContributionModal(true);
  };

  const closeContributionModal = () => {
    setShowContributionModal(false);
    setContributionType('');
    setNewReview('');
    setNewRating(5);
    setIsAnonymous(false);
    setNewImages([]);
    setUploading(false);
  };

  const handleImageUpload = event => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setNewImages(files);
    }
  };

  const handleAddReview = async () => {
    if (!newReview.trim()) {
      showToast('Please enter a review', 'error');
      return;
    }

    try {
      setUploading(true);
      const userDisplayName = isAnonymous ? 'Anonymous' : user.displayName || user.email || 'User';

      await addTrailReview(trailId, {
        comment: newReview,
        rating: newRating,
        userId: user.uid,
        userName: userDisplayName,
        userEmail: user.email,
      });

      await fetchTrailReviews();
      closeContributionModal();
      showToast('Your review has been submitted successfully!', 'success');
    } catch (err) {
      console.error('Failed to add review:', err);
      showToast('Failed to add review: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddImages = async () => {
    if (!newImages.length) {
      showToast('Please select images to upload', 'error');
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls = await uploadTrailImages(trailId, newImages);
      await updateTrailImages(trailId, uploadedUrls);

      setTrail(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...uploadedUrls],
      }));

      closeContributionModal();
      showToast('Images uploaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to upload images:', err);
      showToast('Failed to upload images: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddAlert = async alertData => {
    try {
      setUploading(true);
      await addTrailAlert({
        trailId: trailId,
        ...alertData,
      });

      setShowAlertModal(false);
      showToast('Your alert has been submitted successfully!', 'success');
    } catch (err) {
      console.error('Failed to add alert:', err);
      showToast('Failed to add alert: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Report functions
  const openReportModal = (type = 'general', targetId = null) => {
    setReportType(type);
    setReportTargetId(targetId);
    setShowReportModal(true);
  };

  const handleSubmitReport = async reportData => {
    try {
      setUploading(true);
      await submitTrailReport({
        ...reportData,
        reporterId: user?.uid || 'anonymous',
        reporterEmail: user?.email || null,
        trailId: trailId,
        trailName: trailName,
      });

      setShowReportModal(false);
      setSuccessMessage(
        'Your report has been submitted successfully. Thank you for helping improve our community!'
      );
      setShowSuccessPopup(true);
    } catch (err) {
      console.error('Failed to submit report:', err);
      showToast('Failed to submit report: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return {
    // Modal states
    showContributionModal,
    showAlertModal,
    showReportModal,
    contributionType,
    newReview,
    setNewReview,
    newRating,
    setNewRating,
    isAnonymous,
    setIsAnonymous,
    newImages,
    setNewImages,
    reportType,
    reportTargetId,
    uploading,

    // Success popup states
    showSuccessPopup,
    successMessage,
    setShowSuccessPopup,

    // Modal actions
    openContributionModal,
    closeContributionModal,
    handleImageUpload,
    handleAddReview,
    handleAddImages,
    handleAddAlert,
    openReportModal,
    handleSubmitReport,
    setShowAlertModal,
    setShowReportModal,
  };
};
