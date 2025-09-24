import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from './SearchContext';
import './SearchBar.css';

const SearchBar = ({ 
  placeholder = "Search by city, park, or trail name", 
  className = "",
  showSuggestions = true,
  onSearch,
  initialValue = ""
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsLocal, setShowSuggestionsLocal] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const {
    searchSuggestions,
    setSearchSuggestions,
    getSuggestions,
    handleSearch: contextHandleSearch
  } = useSearch();

  // Update input value when initialValue changes
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);


  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (showSuggestions) {
      getSuggestions(value);
      setShowSuggestionsLocal(true);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setShowSuggestionsLocal(false);
    
    if (onSearch) {
      onSearch(suggestion);
    } else {
      contextHandleSearch(suggestion);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      if (onSearch) {
        onSearch(inputValue.trim());
      } else {
        contextHandleSearch(inputValue.trim());
      }
      setShowSuggestionsLocal(false);
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (showSuggestions && inputValue.length >= 2) {
      setShowSuggestionsLocal(true);
    }
  };

  // Handle input blur
  const handleBlur = (e) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestionsLocal(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestionsLocal(false);
      inputRef.current?.blur();
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setShowSuggestionsLocal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`search-bar-container ${className}`}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            className="search-icon"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              clipRule="evenodd" 
              d="M3.75 10.875a7.125 7.125 0 1 1 14.25 0 7.125 7.125 0 0 1-14.25 0Zm7.125-8.625a8.625 8.625 0 1 0 5.546 15.231l4.049 4.05a.75.75 0 0 0 1.06-1.061l-4.049-4.05a8.625 8.625 0 0 0-6.606-14.17Z"
            />
          </svg>
          
          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="search-input"
            aria-label="Search trails"
            autoComplete="off"
          />
          
          <button 
            type="submit" 
            className="search-button"
            aria-label="Search"
          >
            Search
          </button>
        </div>
      </form>



      {/* Suggestions Dropdown */}
      {showSuggestions && 
       showSuggestionsLocal && 
       searchSuggestions && 
       searchSuggestions.length > 0 && 
       isFocused && (
        <div ref={suggestionsRef} className="search-suggestions">
          {searchSuggestions.map((suggestion, index) => {
            // Handle both old string format and new object format
            const suggestionData = typeof suggestion === 'string' 
              ? { displayName: suggestion, type: 'legacy', description: '', location: '', tags: [] }
              : suggestion;
            
            return (
              <button
                key={index}
                type="button"
                className="suggestion-item"
                style={{
                  animationDelay: `${index * 0.05}s`
                }}
                onClick={() => handleSuggestionClick(suggestionData.displayName || suggestionData.name)}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              >
                <div className="suggestion-icon-container">
                  {suggestionData.type === 'trail' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="suggestion-icon trail-icon" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" clipRule="evenodd" />
                    </svg>
                  ) : suggestionData.type === 'geocoded' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="suggestion-icon location-icon" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="suggestion-icon" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <div className="suggestion-content">
                  <div className="suggestion-header">
                    <span className="suggestion-title">{suggestionData.displayName || suggestionData.name}</span>
                    <div className="suggestion-badges">
                      {suggestionData.status && suggestionData.status === 'closed' && (
                        <span className="suggestion-status closed">🔒 Closed</span>
                      )}
                      {suggestionData.type && suggestionData.type !== 'legacy' && (
                        <span className="suggestion-type">{suggestionData.type}</span>
                      )}
                    </div>
                  </div>
                  
                         {(suggestionData.description || suggestionData.location || suggestionData.difficulty || suggestionData.distance || suggestionData.elevationGain) && (
                           <div className="suggestion-details">
                             {suggestionData.description && (
                               <span className="suggestion-description">{suggestionData.description}</span>
                             )}
                             {suggestionData.location && (
                               <span className="suggestion-location">📍 {suggestionData.location}</span>
                             )}
                             {(suggestionData.difficulty || suggestionData.distance || suggestionData.elevationGain) && (
                               <span className="suggestion-meta">
                                 {suggestionData.difficulty && `🏔️ ${suggestionData.difficulty}`}
                                 {suggestionData.difficulty && (suggestionData.distance || suggestionData.elevationGain) && ' • '}
                                 {suggestionData.distance && `📏 ${suggestionData.distance}`}
                                 {suggestionData.distance && suggestionData.elevationGain && ' • '}
                                 {suggestionData.elevationGain && `⛰️ ${suggestionData.elevationGain}`}
                               </span>
                             )}
                           </div>
                         )}
                  
                  {suggestionData.tags && suggestionData.tags.length > 0 && (
                    <div className="suggestion-tags">
                      {suggestionData.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span key={tagIndex} className="suggestion-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
