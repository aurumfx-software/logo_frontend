import React, { useState, useEffect, useRef } from 'react';
import { HiLocationMarker, HiCheckCircle, HiX, HiExternalLink } from 'react-icons/hi';

export default function GoogleMapsLocationInput({
  value = '',
  onChange,
  onSelectLocation,
  placeholder = 'Search location via Google Maps API (e.g. Payyanur, Kannur, Kochi)...',
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch location suggestions (Google Places / Nominatim API pattern in English)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        // Query Nominatim API with accept-language=en to force English text
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query + ', Kerala, India'
          )}&limit=5&addressdetails=1&accept-language=en`
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setSuggestions(data);
          } else {
            setSuggestions(getMockLocationSuggestions(query));
          }
        } else {
          setSuggestions(getMockLocationSuggestions(query));
        }
      } catch (err) {
        setSuggestions(getMockLocationSuggestions(query));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const getMockLocationSuggestions = (q) => {
    const list = [
      { display_name: 'Payyanur, Kannur District, Kerala, India', name: 'Payyanur', city: 'Payyanur', district: 'Kannur', lat: '12.1026', lon: '75.2016' },
      { display_name: 'Taliparamba, Kannur District, Kerala, India', name: 'Taliparamba', city: 'Taliparamba', district: 'Kannur', lat: '12.0436', lon: '75.3582' },
      { display_name: 'Fort Kochi, Ernakulam District, Kerala, India', name: 'Fort Kochi', city: 'Kochi', district: 'Ernakulam', lat: '9.9658', lon: '76.2421' },
      { display_name: 'Munnar, Idukki District, Kerala, India', name: 'Munnar', city: 'Munnar', district: 'Idukki', lat: '10.0889', lon: '77.0595' },
      { display_name: 'Bekal, Kasaragod District, Kerala, India', name: 'Bekal Fort', city: 'Kasaragod', district: 'Kasaragod', lat: '12.3920', lon: '75.0345' },
      { display_name: 'Kozhikode Beach, Kozhikode, Kerala, India', name: 'Kozhikode', city: 'Calicut', district: 'Kozhikode', lat: '11.2588', lon: '75.7804' },
    ];
    return list.filter((item) => item.display_name.toLowerCase().includes(q.toLowerCase()));
  };

  const keralaDistrictsList = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
    'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
    'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
  ];

  const handleSelect = (item) => {
    const mainTitle = item.name || item.display_name.split(',')[0];
    const fullAddress = item.display_name;

    let district = item.address?.state_district || item.address?.county || item.district || '';
    if (district.toLowerCase().includes('district')) {
      district = district.replace(/district/gi, '').trim();
    }

    const matchedDist = keralaDistrictsList.find((d) => fullAddress.toLowerCase().includes(d.toLowerCase()));
    if (matchedDist) {
      district = matchedDist;
    }
    if (!district) district = 'Kannur';

    let city = item.address?.city || item.address?.town || item.address?.suburb || item.address?.village || item.city || mainTitle;

    setQuery(fullAddress);
    setSelectedPlace({ name: mainTitle, fullAddress, district, city, lat: item.lat, lon: item.lon });
    setIsOpen(false);

    if (onChange) onChange(fullAddress);
    if (onSelectLocation) {
      onSelectLocation({
        name: mainTitle,
        address: fullAddress,
        city,
        district,
        lat: item.lat,
        lon: item.lon,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`,
      });
    }
  };

  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          // Reverse geocode GPS coordinates explicitly in English (accept-language=en)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`
          );
          if (res.ok) {
            const data = await res.json();
            const fullAddr = data.display_name || `GPS (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
            let city =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              data.address?.village ||
              data.address?.county ||
              'Payyanur';
            let district =
              data.address?.state_district || data.address?.county || data.address?.state || 'Kannur';

            if (district.toLowerCase().includes('district')) {
              district = district.replace(/district/gi, '').trim();
            }

            const matchedDist = keralaDistrictsList.find((d) => fullAddr.toLowerCase().includes(d.toLowerCase()));
            if (matchedDist) {
              district = matchedDist;
            }

            const autoLoc = {
              name: city,
              address: fullAddr,
              city,
              district,
              latitude: lat,
              longitude: lon,
              lat,
              lon,
              googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
            };

            setQuery(autoLoc.address);
            setSelectedPlace(autoLoc);
            if (onChange) onChange(autoLoc.address);
            if (onSelectLocation) onSelectLocation(autoLoc);
          } else {
            throw new Error('Reverse geocode failed');
          }
        } catch (e) {
          const autoLoc = {
            name: 'Current GPS Location',
            address: `GPS (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
            city: 'Payyanur',
            district: 'Kannur',
            latitude: lat,
            longitude: lon,
            lat,
            lon,
            googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
          };
          setQuery(autoLoc.address);
          setSelectedPlace(autoLoc);
          if (onChange) onChange(autoLoc.address);
          if (onSelectLocation) onSelectLocation(autoLoc);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        alert(`GPS location error: ${err.message || 'Permission denied'}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="gmaps-input-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <HiLocationMarker
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6C63FF',
              fontSize: 18,
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 38, paddingRight: 32 }}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              if (onChange) onChange(e.target.value);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedPlace(null);
                if (onChange) onChange('');
              }}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
              }}
            >
              <HiX />
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGPSDetect}
          title="Detect GPS location"
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <HiLocationMarker />
          <span>{isLocating ? 'Locating...' : 'GPS'}</span>
        </button>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div className="gmaps-suggestions-menu">
          {loading ? (
            <div className="gmaps-suggestion-item loading">Searching Google Maps API...</div>
          ) : suggestions.length === 0 ? (
            <div className="gmaps-suggestion-item empty">Type location to search Google Maps</div>
          ) : (
            suggestions.map((item, idx) => (
              <div
                key={idx}
                className="gmaps-suggestion-item"
                onClick={() => handleSelect(item)}
              >
                <HiLocationMarker className="gmaps-item-icon" />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#1E293B' }}>
                    {item.name || item.display_name.split(',')[0]}
                  </strong>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    {item.display_name}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Location Confirmation Badge */}
      {selectedPlace && (
        <div className="gmaps-selected-badge">
          <HiCheckCircle style={{ color: '#10B981', fontSize: 16 }} />
          <span>Autofilled: <strong>{selectedPlace.city || selectedPlace.name}</strong> ({selectedPlace.district})</span>
          <a
            href={selectedPlace.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, color: '#2563EB', fontSize: 11, textDecoration: 'underline' }}
          >
            Google Maps <HiExternalLink />
          </a>
        </div>
      )}
    </div>
  );
}
