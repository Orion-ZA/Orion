// HelpCenterIcon.js
import React from 'react';

const HelpCenterIcon = ({ 
  size = 24, 
  color = "currentColor", 
  filled = false, 
  className = "",
  withCircle = false,
  circleColor = "rgba(91, 192, 190, 0.2)"
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {withCircle && (
        <circle 
          cx="12" 
          cy="12" 
          r="11" 
          fill={circleColor}
          stroke="none"
        />
      )}
      
      {filled ? (
        <>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" fill={color} />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#fff" strokeWidth="1.5" />
          <line x1="12" y1="17" x2="12.01" y2="17" stroke="#fff" strokeWidth="2" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      )}
    </svg>
  );
};

export default HelpCenterIcon;