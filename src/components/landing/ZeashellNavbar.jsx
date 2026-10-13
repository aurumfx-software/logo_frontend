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
  HiMicrophone,
  HiUser,
  HiLogout,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import { FaCrosshairs } from 'react-icons/fa';
import { contentApi } from '../../api/operationsApi';

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
  onOpenLocationModal,
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
  onToggleWishlist,
  onOpenWishlistPage,
  isWishlistActive = false,
  customerUser = null,
  onOpenCustomerLogin,
  onCustomerLogout,
}) {
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAllCatsOpen, setIsAllCatsOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [listeningStatusText, setListeningStatusText] = useState('');

  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');
  const hasSubmittedVoiceRef = useRef(false);

  const locationRef = useRef(null);
  const searchRef = useRef(null);
  const allCatsRef = useRef(null);
  const legalMenuRef = useRef(null);

  // Legal / Policies dropdown & modal state
  const [isLegalDropdownOpen, setIsLegalDropdownOpen] = useState(false);
  const [legalModalPolicy, setLegalModalPolicy] = useState(null); // 'terms' | 'privacy' | null
  const [policyContent, setPolicyContent] = useState('');
  const [policyLastUpdated, setPolicyLastUpdated] = useState('');
  const [policyLoading, setPolicyLoading] = useState(false);

  const openPolicyModal = async (policyKey) => {
    setLegalModalPolicy(policyKey);
    setPolicyLoading(true);
    try {
      const data = await contentApi.getPolicy(policyKey);
      if (data && data.content) {
        setPolicyContent(data.content);
        setPolicyLastUpdated(data.last_updated || '2026-10-11');
      } else {
        throw new Error('Policy content not found');
      }
    } catch (err) {
      console.warn('Notice: loading policy fallback:', err);
      if (policyKey === 'terms') {
        setPolicyContent(
          `Welcome to Logo Kerala (operated by AurumFX Pvt Ltd). By accessing or using our platform, you agree to these Terms and Conditions.\n\n1. Hyperlocal Platform Services\nLogo Kerala connects consumers with verified merchants across all 14 districts of Kerala with 0% platform commission.\n\n2. Merchant Listings & Accuracy\nStore details, location coordinates, and offers are verified by our team. Users should verify details directly with the merchant before travel.\n\n3. 0% Commission & Third-Party Purchases\nProduct warranties, service quality, and transactions are direct between users and independent local merchants.`
        );
        setPolicyLastUpdated('2026-10-11');
      } else {
        setPolicyContent(
          `At Logo Kerala (AurumFX Pvt Ltd), your privacy is our priority.\n\n1. Location Data\nWith your permission, we use GPS to show merchants near you. We do not track background location.\n\n2. Direct Contact\nCalling or WhatsApp messaging happens directly through your device's native apps. We do not record calls.\n\n3. Zero Spam\nWe never sell or rent your personal information to third parties.`
        );
        setPolicyLastUpdated('2026-10-11');
      }
    } finally {
      setPolicyLoading(false);
    }
  };

  useEffect(() => {
    const handleOpenPolicy = (e) => {
      if (e?.detail?.policy) {
        openPolicyModal(e.detail.policy);
      }
    };
    window.addEventListener('open-legal-policy', handleOpenPolicy);
    return () => window.removeEventListener('open-legal-policy', handleOpenPolicy);
  }, []);

  // Filtered clean categories list (NO URLs, pure category names only)
  const cleanCategoriesList = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.filter((c) => {
      const name = c.name || c.title || c.category_name || '';
      return name && !name.startsWith('http://') && !name.startsWith('https://');
    });
  }, [categories]);

  const filteredDropdownCategories = useMemo(() => {
    if (!catSearch.trim()) return cleanCategoriesList;
    const q = catSearch.toLowerCase().trim();
    return cleanCategoriesList.filter((c) => {
      const name = c.name || c.title || c.category_name || '';
      return name.toLowerCase().includes(q);
    });
  }, [cleanCategoriesList, catSearch]);

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
      if (allCatsRef.current && !allCatsRef.current.contains(e.target)) {
        setIsAllCatsOpen(false);
      }
      if (legalMenuRef.current && !legalMenuRef.current.contains(e.target)) {
        setIsLegalDropdownOpen(false);
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
        setIsAllCatsOpen(false);
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

  // Web Speech API for interactive Voice Search with Real-Time Typing
  const handleVoiceSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // If microphone is already active, clicking toggles it off
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setListeningStatusText('');
      return;
    }

    // 1. Check browser Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setListeningStatusText('Voice search is not supported in this browser. Please type your search.');
      setTimeout(() => setListeningStatusText(''), 4000);
      return;
    }

    // 2. Production HTTPS security check (Web Speech API requires secure context on remote hosts)
    if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setListeningStatusText('Voice search requires a secure HTTPS connection. Please access via HTTPS.');
      setTimeout(() => setListeningStatusText(''), 4500);
      return;
    }

    // 3. Clear any existing instance to prevent duplicate recognition sessions
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.interimResults = true; // Enables live real-time speech typing!
      recognition.continuous = false; // Auto finishes when speech ceases
      recognition.maxAlternatives = 1;

      liveTranscriptRef.current = '';
      hasSubmittedVoiceRef.current = false;
      setIsListening(true);
      setListeningStatusText('Listening... Speak now');

      // Safety watchdog: prevent stuck listening state (auto-stop after 12s if user stays silent)
      const watchdogTimer = setTimeout(() => {
        if (recognitionRef.current === recognition) {
          try {
            recognition.stop();
          } catch {}
        }
      }, 12000);

      recognition.onstart = () => {
        setIsListening(true);
        setListeningStatusText('Listening... Speak now');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const chunk = event.results[i][0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalTranscript += chunk;
          } else {
            interimTranscript += chunk;
          }
        }

        const currentSpoken = (finalTranscript || interimTranscript).trim();
        if (currentSpoken) {
          liveTranscriptRef.current = currentSpoken;
          setListeningStatusText(currentSpoken);
          // Show typed words appearing in the search bar in REAL-TIME!
          if (onSearchChange) {
            onSearchChange(currentSpoken);
          }
        }

        // When Speech API finalizes the sentence:
        if (finalTranscript.trim() && !hasSubmittedVoiceRef.current) {
          hasSubmittedVoiceRef.current = true;
          clearTimeout(watchdogTimer);
          const cleaned = finalTranscript.trim();
          setListeningStatusText(`Searching for "${cleaned}"...`);
          if (onSearchChange) onSearchChange(cleaned);
          if (onSearchSubmit) onSearchSubmit(cleaned);
        }
      };

      recognition.onerror = (e) => {
        clearTimeout(watchdogTimer);
        console.warn('Speech recognition status:', e.error);
        if (e.error === 'no-speech') {
          setListeningStatusText('No speech heard. Tap mic to retry.');
        } else if (e.error === 'not-allowed') {
          setListeningStatusText('Microphone permission blocked. Please allow mic access in your browser.');
        } else if (e.error === 'network') {
          setListeningStatusText('Network audio error. You can also tap the keyboard mic 🎙️');
        } else if (e.error === 'audio-capture') {
          setListeningStatusText('No microphone detected on your device.');
        } else if (e.error === 'aborted') {
          setListeningStatusText('');
        } else {
          setListeningStatusText(`Voice unavailable (${e.error || 'error'}). Use keyboard.`);
        }
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        clearTimeout(watchdogTimer);
        setIsListening(false);
        recognitionRef.current = null;
        const spoken = liveTranscriptRef.current.trim();
        if (spoken && !hasSubmittedVoiceRef.current) {
          hasSubmittedVoiceRef.current = true;
          setListeningStatusText(`Searching for "${spoken}"...`);
          if (onSearchChange) onSearchChange(spoken);
          if (onSearchSubmit) onSearchSubmit(spoken);
        }
        setTimeout(() => {
          setListeningStatusText('');
        }, 3500);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsListening(false);
      recognitionRef.current = null;
      setListeningStatusText('Could not access microphone.');
      setTimeout(() => setListeningStatusText(''), 3500);
    }
  };

  return (
    <header className={`zeas-blue-navbar-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>
      {/* 1. TOP MAIN ROW (LOGO. KERALA Royal Blue Theme) */}
      <div className="zeas-blue-navbar-main">
        <div className="zeas-blue-navbar-inner">
          {/* Logo Brand */}
          <Link
            to="/"
            className="zeas-blue-navbar-logo"
            onClick={() => {
              if (onOpenWishlistPage) onOpenWishlistPage(false);
            }}
            title="Logo Kerala Home"
          >
            <span className="zeas-blue-logo-text">LOGO</span>
            <HiLocationMarker size={22} color="#2563eb" style={{ marginLeft: 2, flexShrink: 0 }} />
          </Link>

          {/* Location Selector Pill with Popover & Direct Modal Option */}
          <div className="zeas-blue-loc-wrapper" ref={locationRef}>
            <button
              type="button"
              className={`zeas-blue-loc-pill ${isLocationDropdownOpen ? 'active' : ''}`}
              onClick={() => {
                setIsLocationDropdownOpen(!isLocationDropdownOpen);
              }}
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
                    <div className="zeas-blue-gps-title">Use current location (GPS)</div>
                    <div className="zeas-blue-gps-subtitle">
                      {isDetectingGPS ? 'Detecting GPS coordinates...' : 'Discover verified shops closest to you'}
                    </div>
                  </div>
                </button>

                {/* Kerala Button (Selects All Kerala & lists all merchants) */}
                <button
                  type="button"
                  onClick={() => {
                    handleSelectLocation('all', 'Kerala');
                  }}
                  className="zeas-blue-all-kerala-btn"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: '#ffffff',
                    cursor: 'pointer',
                    margin: '6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                  title="View All Merchants Across Kerala"
                >
                  <HiLocationMarker size={18} color="#ffffff" />
                  <span>Kerala</span>
                </button>

                <hr className="zeas-blue-popover-divider" />

                {/* All 14 Districts of Kerala */}
                <div className="zeas-blue-loc-group">
                  <div className="zeas-blue-loc-group-title">ALL 14 DISTRICTS</div>
                  <div className="zeas-blue-loc-list-scroll" style={{ maxHeight: 150 }}>
                    {filteredDistricts.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="zeas-blue-loc-item"
                        onClick={() => handleSelectLocation('district', d.toLowerCase())}
                      >
                        <HiLocationMarker size={15} className="zeas-blue-loc-item-icon" />
                        <span className="zeas-blue-loc-item-text">
                          <strong>{d}</strong> District
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="zeas-blue-popover-divider" />

                {/* Popular Towns in Kerala */}
                <div className="zeas-blue-loc-group">
                  <div className="zeas-blue-loc-group-title">POPULAR TOWNS IN KERALA</div>
                  <div className="zeas-blue-loc-list-scroll" style={{ maxHeight: 150 }}>
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
                </div>
              </div>
            )}
          </div>

          {/* Center Search Bar with Attached Voice Mic & Submit Button */}
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

              {/* Voice Search Microphone Button */}
              <button
                type="button"
                className={`zeas-blue-search-mic-btn ${isListening ? 'listening' : ''}`}
                onClick={handleVoiceSearch}
                onTouchEnd={(e) => e.stopPropagation()}
                title={isListening ? 'Listening... Speak now (Click to stop)' : 'Voice Search (Click & Speak)'}
                aria-label="Voice Search"
              >
                {isListening ? (
                  <span className="zeas-voice-active-icon-wrap">
                    <HiMicrophone size={19} color="#ef4444" />
                    <span className="zeas-voice-ping-ring" />
                  </span>
                ) : (
                  <HiMicrophone size={19} color="#2563eb" />
                )}
              </button>

              {/* The Attached Royal Blue Search Submit Button */}
              <button type="submit" className="zeas-blue-search-submit-btn" aria-label="Search">
                <HiSearch size={20} color="#ffffff" />
              </button>
            </form>

            {/* Live Voice Speech Feedback Banner */}
            {(isListening || listeningStatusText) && (
              <div className={`zeas-voice-feedback-pill ${isListening ? 'is-active' : 'is-done'}`}>
                <div className="zeas-voice-soundwave">
                  <span className="wave-bar bar-1" />
                  <span className="wave-bar bar-2" />
                  <span className="wave-bar bar-3" />
                  <span className="wave-bar bar-4" />
                </div>
                <div className="zeas-voice-feedback-content">
                  <span className="zeas-voice-feedback-label">
                    {isListening ? '🎙️ Listening & Typing...' : '✓ Searching Voice Query'}
                  </span>
                  <span className="zeas-voice-feedback-query">
                    {listeningStatusText || searchQuery || 'Speak now...'}
                  </span>
                </div>
                {isListening && (
                  <button
                    type="button"
                    className="zeas-voice-stop-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (recognitionRef.current) {
                        try {
                          recognitionRef.current.stop();
                        } catch {}
                      }
                      setIsListening(false);
                    }}
                    title="Finish speech"
                  >
                    Done
                  </button>
                )}
              </div>
            )}

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
                    {item.icon ? (
                      <span style={{ fontSize: 16, marginRight: 8 }}>{item.icon}</span>
                    ) : (
                      <HiSearch size={15} className="zeas-blue-sug-icon" />
                    )}
                    <div className="zeas-blue-sug-content">
                      <span className="zeas-blue-sug-title">{item.text}</span>
                      {(item.subtext || item.category || item.location) && (
                        <span className="zeas-blue-sug-sub">
                          {item.subtext || `${item.category} • ${item.location}`}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legal / Policy Dropdown Button next to Search Bar */}
          <div className="zeas-legal-dropdown-wrap" ref={legalMenuRef}>
            <button
              type="button"
              className={`zeas-legal-btn ${isLegalDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsLegalDropdownOpen((prev) => !prev)}
              title="Terms & Privacy Policies"
              aria-label="Terms & Privacy Policies"
            >
              <HiOutlineDocumentText size={19} />
              <span className="zeas-legal-badge-dot" />
            </button>

            {isLegalDropdownOpen && (
              <div className="zeas-legal-menu-card" role="menu">
                <div className="zeas-legal-card-header">
                  <span>Policies & Legal</span>
                </div>
                <button
                  type="button"
                  className="zeas-legal-menu-item"
                  onClick={() => {
                    setIsLegalDropdownOpen(false);
                    openPolicyModal('terms');
                  }}
                >
                  <div className="zeas-legal-item-icon blue">
                    <HiOutlineDocumentText size={17} />
                  </div>
                  <div className="zeas-legal-item-content">
                    <strong>Terms & Conditions</strong>
                    <span>Platform rules & guidelines</span>
                  </div>
                </button>

                <div className="zeas-legal-divider" />

                <button
                  type="button"
                  className="zeas-legal-menu-item"
                  onClick={() => {
                    setIsLegalDropdownOpen(false);
                    openPolicyModal('privacy');
                  }}
                >
                  <div className="zeas-legal-item-icon green">
                    <HiOutlineShieldCheck size={17} />
                  </div>
                  <div className="zeas-legal-item-content">
                    <strong>Privacy Policy</strong>
                    <span>Data protection & zero spam</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Right Action Icons: Favorites / Dedicated Wishlist, Customer Sign In / Sign Out, Admin Portal */}
          <div className="zeas-blue-navbar-actions">
            {/* Dedicated Wishlist Button */}
            <button
              type="button"
              className={`zeas-blue-action-link ${isWishlistActive ? 'active' : ''}`}
              title="Saved Favorites / Wishlist"
              onClick={() => {
                if (onOpenWishlistPage) {
                  onOpenWishlistPage(true);
                } else if (onToggleWishlist) {
                  onToggleWishlist();
                  const el = document.getElementById('establishments-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                background: isWishlistActive ? '#eff6ff' : 'transparent',
                borderRadius: '8px',
              }}
            >
              <div className="zeas-blue-badge-wrap">
                <HiOutlineHeart
                  size={22}
                  className="zeas-blue-action-icon"
                  style={{ color: isWishlistActive ? '#2563eb' : '#334155' }}
                />
                {favoritesCount > 0 && <span className="zeas-blue-badge-dot">{favoritesCount}</span>}
              </div>
              <span
                className="zeas-blue-action-label desktop-only"
                style={{ color: isWishlistActive ? '#2563eb' : '#64748b' }}
              >
                Wishlist
              </span>
            </button>

            {/* Customer Sign In / Sign Out */}
            {customerUser ? (
              <div className="zeas-blue-user-menu">
                <div className="zeas-blue-user-badge" title={`Signed in as ${customerUser.name || 'Customer'}`}>
                  <span className="zeas-blue-user-avatar">
                    {(customerUser.name || 'C').charAt(0).toUpperCase()}
                  </span>
                  <span className="zeas-blue-user-name desktop-only">
                    {customerUser.name || customerUser.phone || 'Customer'}
                  </span>
                </div>
                <button
                  type="button"
                  className="zeas-blue-btn-signout"
                  onClick={onCustomerLogout}
                  title="Sign Out"
                >
                  <HiLogout size={16} />
                  <span className="desktop-only">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="zeas-blue-btn-signin"
                onClick={onOpenCustomerLogin}
                title="Customer Sign In / Login"
              >
                <HiUser size={18} />
                <span>Sign In</span>
              </button>
            )}

            {/* Admin Portal Button */}
            <Link to="/login" className="zeas-blue-btn-admin-portal" title="Admin & Merchant Portal">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* 2. SECONDARY CATEGORY STRIP (Exact Zeashell Category Bar) */}
      <div className="zeas-blue-cat-strip">
        <div className="zeas-blue-cat-strip-inner">
          {/* ALL CATEGORIES Button with Mega Dropdown */}
          <div className="zeas-blue-all-cats-wrapper" ref={allCatsRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`zeas-blue-all-cats-btn ${isAllCatsOpen ? 'active' : ''}`}
              onClick={() => setIsAllCatsOpen((prev) => !prev)}
              aria-expanded={isAllCatsOpen}
            >
              <HiViewGrid size={16} />
              <span>ALL CATEGORIES</span>
              <HiChevronDown
                size={14}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: isAllCatsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Zeashell Style Mega Dropdown Menu (Names Only, Search Filter) */}
            {isAllCatsOpen && (
              <div
                className="zeas-mega-dropdown-card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 'min(720px, 90vw)',
                  background: '#ffffff',
                  borderRadius: 14,
                  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)',
                  border: '1px solid #e2e8f0',
                  zIndex: 1050,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  animation: 'popoverFadeIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                role="menu"
              >
                {/* Search Bar inside Mega Dropdown */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '8px 12px',
                  }}
                >
                  <HiSearch size={18} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Search among all 333 categories..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                    autoFocus
                  />
                  {catSearch && (
                    <button
                      type="button"
                      onClick={() => setCatSearch('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <HiX size={15} />
                    </button>
                  )}
                </div>

                {/* Categories Count & Quick Reset */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Kerala Categories ({filteredDropdownCategories.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAllCatsOpen(false);
                      if (onSelectCategory) onSelectCategory('all');
                      const el = document.getElementById('establishments-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    View All Categories
                  </button>
                </div>

                {/* Category Names Grid (Names Only, NO raw URLs!) */}
                <div
                  style={{
                    maxHeight: '380px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 6,
                    paddingRight: 4,
                  }}
                >
                  {filteredDropdownCategories.map((cat, idx) => {
                    const rawName = cat.name || cat.title || cat.category_name || '';
                    const catName = rawName.startsWith('http') ? '' : rawName;
                    if (!catName) return null;

                    const isSelected =
                      activeCategory !== 'all' &&
                      activeCategory.toLowerCase() === catName.toLowerCase();

                    return (
                      <button
                        key={cat.id || idx}
                        type="button"
                        onClick={() => {
                          setIsAllCatsOpen(false);
                          if (onSelectCategory) onSelectCategory(catName);
                          const el = document.getElementById('establishments-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          background: isSelected ? '#eff6ff' : '#f8fafc',
                          color: isSelected ? '#2563eb' : '#1e293b',
                          border: isSelected ? '1px solid #2563eb' : '1px solid transparent',
                          borderRadius: 8,
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontSize: 12.5,
                          fontWeight: isSelected ? 700 : 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'all 0.15s ease',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#e2e8f0';
                            e.currentTarget.style.color = '#2563eb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.color = '#1e293b';
                          }
                        }}
                      >
                        <span style={{ color: '#2563eb', fontSize: 14 }}>&bull;</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {catName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Categories List (Desktop / Laptop View only) */}
          <div className="zeas-blue-quick-cats desktop-only">
            <button
              type="button"
              className={`zeas-blue-quick-cat-item ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => {
                if (onSelectCategory) onSelectCategory('all');
                const el = document.getElementById('establishments-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              All
            </button>
            {cleanCategoriesList.slice(0, 10).map((cat) => {
              const catTitle = cat.name || cat.title || cat.category_name;
              if (!catTitle) return null;
              const isSelected =
                activeCategory !== 'all' &&
                activeCategory.toLowerCase() === catTitle.toLowerCase();
              return (
                <button
                  key={cat.id || catTitle}
                  type="button"
                  className={`zeas-blue-quick-cat-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    if (onSelectCategory) onSelectCategory(catTitle);
                    const el = document.getElementById('establishments-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
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

      {/* Policy Reader Modal */}
      {legalModalPolicy && (
        <div className="zeas-policy-modal-overlay" onClick={() => setLegalModalPolicy(null)}>
          <div className="zeas-policy-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="zeas-policy-modal-header">
              <div className="zeas-policy-modal-title-wrap">
                <span className="zeas-policy-modal-badge">
                  {legalModalPolicy === 'terms' ? '⚖️ LEGAL & COMPLIANCE' : '🛡️ DATA PRIVACY'}
                </span>
                <h3 className="zeas-policy-modal-title">
                  {legalModalPolicy === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                </h3>
                <span className="zeas-policy-modal-subtitle">
                  Logo Kerala • Hyperlocal Verified Merchant Network • AurumFX Pvt Ltd
                </span>
              </div>
              <button
                type="button"
                className="zeas-policy-modal-close-btn"
                onClick={() => setLegalModalPolicy(null)}
                aria-label="Close Modal"
              >
                <HiX size={20} />
              </button>
            </div>
            <div className="zeas-policy-modal-body">
              {policyLoading ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                  Loading policy content from database...
                </div>
              ) : (
                <div className="zeas-policy-modal-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.7, fontSize: 14 }}>
                  {policyContent}
                </div>
              )}
            </div>
            <div className="zeas-policy-modal-footer">
              <span className="zeas-policy-updated-note">
                Last Updated: {policyLastUpdated || 'October 2026'}
              </span>
              <button
                type="button"
                className="zeas-policy-confirm-btn"
                onClick={() => setLegalModalPolicy(null)}
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
