import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import './SuccessPopup.css';

const SuccessPopup = ({ isVisible, message, onClose }) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      const timer = setTimeout(() => {
        setShowAnimation(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 2800); // Show for 2.8 seconds to allow progress bar to complete

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="success-popup-overlay">
      <div className={`success-popup ${showAnimation ? 'show' : ''}`}>
        <div className="success-icon">
          <CheckCircle size={48} />
        </div>
        <h3 className="success-title">Success!</h3>
        <p className="success-message">{message}</p>
        <div className="success-progress">
          <div className="success-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;
