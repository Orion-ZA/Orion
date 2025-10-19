import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrailDetail } from '../hooks/useTrailDetail';
import { estimateDuration } from '../components/trails/TrailUtils';
import './TrailDetail.css';

// Import components
import TrailDetailHeader from '../components/trails/TrailDetailHeader';
import TrailDetailModals from '../components/trails/TrailDetailModals';
import TrailDetailActions from '../components/trails/TrailDetailActions';
import TrailImageGallery from '../components/trails/TrailImageGallery';
import TrailInfo from '../components/trails/TrailInfo';
import WeatherSection from '../components/trails/WeatherSection';
import TabSection from '../components/trails/TabSection';
import SuccessPopup from '../components/SuccessPopup';

const TrailDetail = () => {
  const navigate = useNavigate();
  const {
    // Trail data
    trail,
    loading,
    error,
    authorName,

    // User data
    user,
    userSaved,

    // Reviews data
    reviews,
    loadingReviews,
    reviewSortBy,
    setReviewSortBy,
    getSortedReviews,

    // Weather data
    weatherData,
    loadingWeather,

    // Alerts data
    alerts,
    loadingAlerts,

    // UI state
    currentImageIndex,
    setCurrentImageIndex,
    activeTab,
    setActiveTab,

    // Modal states
    showContributionModal,
    contributionType,
    newReview,
    setNewReview,
    newRating,
    setNewRating,
    isAnonymous,
    setIsAnonymous,
    newImages,
    showAlertModal,
    setShowAlertModal,
    showReportModal,
    setShowReportModal,
    reportType,
    reportTargetId,
    uploading,

    // Success popup states
    showSuccessPopup,
    successMessage,
    setShowSuccessPopup,

    // Actions
    handleTrailAction,
    handleShare,
    handleDirections,
    handleShowOnMap,
    openContributionModal,
    closeContributionModal,
    handleImageUpload,
    handleAddReview,
    handleAddImages,
    handleAddAlert,
    openReportModal,
    handleSubmitReport,
    goToImage,
  } = useTrailDetail();

  if (loading) {
    return (
      <div className='trail-detail-page'>
        <div className='trail-detail-loading'>
          <div className='loading-spinner'></div>
          <p>Loading trail details...</p>
        </div>
      </div>
    );
  }

  if (error || !trail) {
    return (
      <div className='trail-detail-page'>
        <div className='trail-detail-error'>
          <h2>Trail Not Found</h2>
          <p>{error || "The trail you're looking for doesn't exist."}</p>
          <button onClick={() => navigate('/trails')} className='btn-primary'>
            <ArrowLeft size={16} />
            Back to Trails
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='trail-detail-page'>
      {/* Header */}
      <TrailDetailHeader
        onBack={() => navigate(-1)}
        onShowOnMap={() => handleShowOnMap(navigate)}
        onShare={handleShare}
        onReport={() => openReportModal('trail')}
      />

      {/* Main Content */}
      <div className='trail-detail-content'>
        {/* Image Gallery */}
        <TrailImageGallery
          images={trail.images}
          currentImageIndex={currentImageIndex}
          onImageChange={setCurrentImageIndex}
          onGoToImage={goToImage}
        />

        {/* Trail Info */}
        <TrailInfo
          trail={trail}
          authorName={authorName}
          onDirections={handleDirections}
          estimateDuration={estimateDuration}
        />

        {/* Weather Forecast */}
        <WeatherSection weatherData={weatherData} loadingWeather={loadingWeather} />

        {/* User Actions */}
        <TrailDetailActions
          user={user}
          trail={trail}
          userSaved={userSaved}
          onTrailAction={handleTrailAction}
        />

        {/* Tab Section */}
        <TabSection
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          reviews={reviews}
          trail={trail}
          reviewSortBy={reviewSortBy}
          setReviewSortBy={setReviewSortBy}
          loadingReviews={loadingReviews}
          getSortedReviews={getSortedReviews}
          onOpenContributionModal={openContributionModal}
          currentImageIndex={currentImageIndex}
          setCurrentImageIndex={setCurrentImageIndex}
          alerts={alerts}
          loadingAlerts={loadingAlerts}
          onReport={openReportModal}
        />
      </div>

      {/* Modals */}
      <TrailDetailModals
        // Contribution Modal Props
        showContributionModal={showContributionModal}
        contributionType={contributionType}
        newReview={newReview}
        setNewReview={setNewReview}
        newRating={newRating}
        setNewRating={setNewRating}
        isAnonymous={isAnonymous}
        setIsAnonymous={setIsAnonymous}
        newImages={newImages}
        uploading={uploading}
        onCloseContributionModal={closeContributionModal}
        onAddReview={handleAddReview}
        onAddImages={handleAddImages}
        onImageUpload={handleImageUpload}
        // Alert Modal Props
        showAlertModal={showAlertModal}
        onCloseAlertModal={() => setShowAlertModal(false)}
        onAddAlert={handleAddAlert}
        trailId={trail.id}
        trailName={trail.name}
        // Report Modal Props
        showReportModal={showReportModal}
        onCloseReportModal={() => setShowReportModal(false)}
        onSubmitReport={handleSubmitReport}
        reportType={reportType}
        reportTargetId={reportTargetId}
      />

      {/* Success Popup */}
      <SuccessPopup
        isVisible={showSuccessPopup}
        message={successMessage}
        onClose={() => setShowSuccessPopup(false)}
      />
    </div>
  );
};

export default TrailDetail;
