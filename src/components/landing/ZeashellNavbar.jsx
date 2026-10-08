import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HiLocationMarker,
  HiChevronDown,
  HiSearch,
  HiX,
  HiOutlineHeart,
  HiOutlineSparkles,
  HiChevronRight,
  HiViewGrid,
} from 'react-icons/hi';
import { FaCrosshairs } from 'react-icons/fa';

export const KERALA_POPULAR_TOWNS = [
  { name: 'Kochi', district: 'Ernakulam' },
  { name: 'Kozhikode', district: 'Kozhikode' },
  { name: 'Thiruvananthapuram', district: 'Thiruvananthapuram' },
  { name: 'Kannur', district: 'Kannur' },
  { name: 'Payyanur', district: 'Kannur' },
  { name: 'Thrissur', district: 'Thrissur' },
  { name: 'Palakkad', district: 'Palakkad' },
  { name: 'Kollam', district: 'Kollam' },
  { name: 'Alappuzha', district: 'Alappuzha' },
  { name: 'Malappuram', district: 'Malappuram' },
  { name: 'Kottayam', district: 'Kottayam' },
  { name: 'Kasaragod', district: 'Kasaragod' },
  { name: 'Manjeri', district: 'Malappuram' },
  { name: 'Thalassery', district: 'Kannur' },
  { name: 'Perinthalmanna', district: 'Malappuram' },
  { name: 'Vadakara', district: 'Kozhikode' },
  { name: 'Kayamkulam', district: 'Alappuzha' },
];

export const KERALA_DISTRICTS = [
  'Alappuzha',
  'Ernakulam',
  'Idukki',
  'Kannur',
  'Kasaragod',
  'Kollam',
  'Kottayam',
  'Kozhikode',
  'Malappuram',
  'Palakkad',
  'Pathanamthitta',
  'Thiruvananthapuram',
  'Thrissur',
  'Wayanad',
];

export default function ZeashellNavbar({
  currentLocationName = 'Kerala',
  onDetectGPS,
  isDetectingGPS = false,
  onSelectTownOrDistrict,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  searchSuggestions = [],
  onSelectSuggestion,
  favoritesCount = 0,
  onOpenOnboardModal,
  categories = [],
  activeCategory = 'all',
  onSelectCategory,
  onOpenAllCategories,
}) {
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const locationRef = useRef(null);
  const searchRef = useRef(null);

  // Scroll detection for sticky shadow
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setIsLocationDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLocationDropdownOpen(false);
        setShowSearchSuggestions(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter locations in dropdown
  const filteredTowns = useMemo(() => {
    if (!locationSearch.trim()) return KERALA_POPULAR_TOWNS;
    const q = locationSearch.toLowerCase();
    return KERALA_POPULAR_TOWNS.filter(
      (t) => t.name.toLowerCase().includes(q) || t.district.toLowerCase().includes(q)
    );
  }, [locationSearch]);

  const filteredDistricts = useMemo(() => {
    if (!locationSearch.trim()) return KERALA_DISTRICTS;
    const q = locationSearch.toLowerCase();
    return KERALA_DISTRICTS.filter((d) => d.toLowerCase().includes(q));
  }, [locationSearch]);

  const todayDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const handleSelectLocation = (type, val) => {
    setIsLocationDropdownOpen(false);
    setLocationSearch('');
    if (onSelectTownOrDistrict) {
      onSelectTownOrDistrict(type, val);
    }
  };

  const handleGPSClick = () => {
    setIsLocationDropdownOpen(false);
    if (onDetectGPS) onDetectGPS();
  };

  return (
    <header className={`zeas-blue-navbar-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>
      {/* 1. TOP MAIN ROW (Zeashell Exact OLX Layout in Royal Blue Theme) */}
      <div className="zeas-blue-navbar-main">
        <div className="zeas-blue-navbar-inner">
          {/* Logo Brand */}
          <Link to="/" className="zeas-blue-navbar-logo">
            <span className="zeas-blue-logo-text">LOGO</span>
            <span className="zeas-blue-logo-dot">.</span>
            <span className="zeas-blue-logo-sub">KERALA</span>
          </Link>

          {/* Location Selector Pill with Attached Dropdown Popover */}
          <div className="zeas-blue-loc-wrapper" ref={locationRef}>
            <button
              type="button"
              className={`zeas-blue-loc-pill ${isLocationDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              aria-expanded={isLocationDropdownOpen}
              aria-label="Select Kerala location"
            >
              <HiLocationMarker className="zeas-blue-loc-pill-icon" size={18} />
              <span className="zeas-blue-loc-pill-text" title={currentLocationName}>
                {currentLocationName}
              </span>
              <HiChevronDown
                className={`zeas-blue-loc-pill-chevron ${isLocationDropdownOpen ? 'rotate' : ''}`}
                size={16}
              />
            </button>

            {/* Exact Location Dropdown Popover */}
            {isLocationDropdownOpen && (
              <div className="zeas-blue-loc-popover" role="dialog" aria-label="Select Locality or District">
                {/* Search input in location dropdown */}
                <div className="zeas-blue-loc-search-box">
                  <HiSearch size={16} className="zeas-blue-loc-search-icon" />
                  <input
                    type="text"
                    placeholder="Search town, district or area..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    autoFocus
                  />
                  {locationSearch && (
                    <button
                      type="button"
                      className="zeas-blue-loc-search-clear"
                      onClick={() => setLocationSearch('')}
                      aria-label="Clear location search"
                    >
                      <HiX size={14} />
                    </button>
                  )}
                </div>

                {/* GPS Detect Action */}
                <button type="button" className="zeas-blue-gps-btn" onClick={handleGPSClick}>
                  <div className="zeas-blue-gps-icon-circle">
                    <FaCrosshairs size={14} />
                  </div>
                  <div className="zeas-blue-gps-text-wrap">
                    <div className="zeas-blue-gps-title">Use current location</div>
                    <div className="zeas-blue-gps-subtitle">
                      {isDetectingGPS ? 'Detecting GPS coordinates...' : 'Discover verified shops closest to you'}
                    </div>
                  </div>
                </button>

                <hr className="zeas-blue-popover-divider" />

                {/* Popular Towns in Kerala */}
                <div className="zeas-blue-loc-group">
                  <div className="zeas-blue-loc-group-title">POPULAR TOWNS IN KERALA</div>
                  <div className="zeas-blue-loc-list-scroll">
                    {filteredTowns.map((loc) => (
                      <button
                        key={`${loc.name}-${loc.district}`}
                        type="button"
                        className="zeas-blue-loc-item"
                        onClick={() => handleSelectLocation('town', loc.name)}
                      >
                        <HiLocationMarker size={15} className="zeas-blue-loc-item-icon" />
                        <span className="zeas-blue-loc-item-text">
                          <strong>{loc.name}</strong>, {loc.district}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="zeas-blue-loc-group-title" style={{ marginTop: 12 }}>
                    ALL 14 KERALA DISTRICTS
                  </div>
                  <div className="zeas-blue-loc-list-scroll">
                    {filteredDistricts.map((district) => (
                      <button
                        key={district}
                        type="button"
                        className="zeas-blue-loc-item"
                        onClick={() => handleSelectLocation('district', district)}
                      >
                        <HiLocationMarker size={15} className="zeas-blue-loc-item-icon" />
                        <span className="zeas-blue-loc-item-text">{district} District</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center Search Bar with Attached Submit Button */}
          <div className="zeas-blue-search-wrapper" ref={searchRef}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowSearchSuggestions(false);
                if (onSearchSubmit) onSearchSubmit();
              }}
              className="zeas-blue-search-form"
            >
              <input
                type="text"
                className="zeas-blue-search-input"
                placeholder='Search "Restaurants, Supermarkets, Mobile Shops, Clinics..."'
                value={searchQuery}
                onChange={(e) => {
                  if (onSearchChange) onSearchChange(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => {
                  if (searchSuggestions.length > 0) setShowSearchSuggestions(true);
                }}
                aria-label="Search verified shops and services"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="zeas-blue-search-clear-btn"
                  onClick={() => {
                    if (onSearchChange) onSearchChange('');
                    setShowSearchSuggestions(false);
                  }}
                  aria-label="Clear search query"
                >
                  <HiX size={15} />
                </button>
              )}

              {/* The Attached Royal Blue Search Submit Button */}
              <button type="submit" className="zeas-blue-search-submit-btn" aria-label="Search">
                <HiSearch size={20} color="#ffffff" />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div className="zeas-blue-suggestions-box">
                {searchSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="zeas-blue-suggestion-row"
                    onMouseDown={() => {
                      setShowSearchSuggestions(false);
                      if (onSelectSuggestion) onSelectSuggestion(item);
                    }}
                  >
                    <HiSearch size={15} className="zeas-blue-sug-icon" />
                    <div className="zeas-blue-sug-content">
                      <span className="zeas-blue-sug-title">{item.text}</span>
                      {(item.category || item.location) && (
                        <span className="zeas-blue-sug-sub">
                          {item.category} &bull; {item.location}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Icons: Favorites, + List Merchant, Admin Portal */}
          <div className="zeas-blue-navbar-actions">
            {/* Wishlist / Favorites */}
            <button
              type="button"
              className="zeas-blue-action-link"
              title="Saved Favorites"
              onClick={() => {
                const el = document.getElementById('establishments-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="zeas-blue-badge-wrap">
                <HiOutlineHeart size={22} className="zeas-blue-action-icon" />
                {favoritesCount > 0 && <span className="zeas-blue-badge-dot">{favoritesCount}</span>}
              </div>
              <span className="zeas-blue-action-label desktop-only">Wishlist</span>
            </button>

            {/* + List Merchant Button */}
            <button
              type="button"
              className="zeas-blue-btn-list-merchant"
              onClick={onOpenOnboardModal}
            >
              + List Merchant
            </button>

            {/* Admin Portal Button */}
            <Link to="/login" className="zeas-blue-btn-admin-portal">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY CATEGORY STRIP (Exact Zeashell Category Bar) */}
      <div className="zeas-blue-cat-strip">
        <div className="zeas-blue-cat-strip-inner">
          {/* ALL CATEGORIES Button */}
          <button
            type="button"
            className="zeas-blue-all-cats-btn"
            onClick={onOpenAllCategories}
          >
            <HiViewGrid size={16} />
            <span>ALL CATEGORIES</span>
            <HiChevronDown size={14} />
          </button>

          {/* Quick Categories List */}
          <div className="zeas-blue-quick-cats">
            <button
              type="button"
              className={`zeas-blue-quick-cat-item ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => onSelectCategory && onSelectCategory('all')}
            >
              All
            </button>
            {categories.slice(0, 10).map((cat) => {
              const catTitle = cat.title || cat.name;
              return (
                <button
                  key={cat.id || catTitle}
                  type="button"
                  className={`zeas-blue-quick-cat-item ${activeCategory === catTitle ? 'active' : ''}`}
                  onClick={() => onSelectCategory && onSelectCategory(catTitle)}
                >
                  {catTitle}
                </button>
              );
            })}
          </div>

          {/* Today's Date Badge */}
          <div className="zeas-blue-date-badge desktop-only">
            <span>📅 {todayDateFormatted}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
