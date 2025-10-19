import React from 'react';
import ContributionModal from './ContributionModal';
import AlertModal from '../modals/AlertModal';
import ReportModal from '../modals/ReportModal';

const TrailDetailModals = ({
  // Contribution Modal Props
  showContributionModal,
  contributionType,
  newReview,
  setNewReview,
  newRating,
  setNewRating,
  isAnonymous,
  setIsAnonymous,
  newImages,
  uploading,
  onCloseContributionModal,
  onAddReview,
  onAddImages,
  onImageUpload,

  // Alert Modal Props
  showAlertModal,
  onCloseAlertModal,
  onAddAlert,
  trailId,
  trailName,

  // Report Modal Props
  showReportModal,
  onCloseReportModal,
  onSubmitReport,
  reportType,
  reportTargetId,
}) => {
  return (
    <>
      {/* Contribution Modal */}
      <ContributionModal
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
        onCloseContributionModal={onCloseContributionModal}
        onAddReview={onAddReview}
        onAddImages={onAddImages}
        onImageUpload={onImageUpload}
      />

      {/* Alert Modal */}
      <AlertModal
        isVisible={showAlertModal}
        onClose={onCloseAlertModal}
        onSubmit={onAddAlert}
        trailId={trailId}
        trailName={trailName}
        loading={uploading}
      />

      {/* Report Modal */}
      <ReportModal
        isVisible={showReportModal}
        onClose={onCloseReportModal}
        onSubmit={onSubmitReport}
        trailId={trailId}
        trailName={trailName}
        reportType={reportType}
        targetId={reportTargetId}
        loading={uploading}
      />
    </>
  );
};

export default TrailDetailModals;
