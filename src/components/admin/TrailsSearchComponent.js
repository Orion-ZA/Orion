import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import './TrailsSearchComponent.css';

const TrailsManagementSearch = ({ onSearch, placeholder = 'Search trails...' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = value => {
    setSearchTerm(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className='trails-management-search'>
      <div className='trails-management-search-input-container'>
        <Search className='trails-management-search-icon' />
        <input
          type='text'
          value={searchTerm}
          onChange={e => handleSearch(e.target.value)}
          placeholder={placeholder}
          className='trails-management-search-input'
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className='trails-management-search-clear-button'
            title='Clear search'
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TrailsManagementSearch;
