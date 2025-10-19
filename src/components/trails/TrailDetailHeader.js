import React from 'react';
import { ArrowLeft, Share2, Map, Flag } from 'lucide-react';
import './TrailDetailHeader.css';

const TrailDetailHeader = ({ onBack, onShowOnMap, onShare, onReport }) => {
  return (
    <div className='trail-detail-header'>
      <button onClick={onBack} className='back-button'>
        <ArrowLeft size={20} />
        Back
      </button>

      <div className='header-actions'>
        <button onClick={onShowOnMap} className='show-map-button'>
          <Map size={16} />
          Show on Map
        </button>
        <button onClick={onReport} className='report-button'>
          <Flag size={16} />
          Report
        </button>
        <button onClick={onShare} className='share-button'>
          <Share2 size={16} />
          Share
        </button>
      </div>
    </div>
  );
};

export default TrailDetailHeader;
