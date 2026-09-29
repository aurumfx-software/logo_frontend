import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HiLocationMarker, HiCheckCircle, HiX, HiExternalLink, HiCursorClick } from 'react-icons/hi';

/* ─── Leaflet lazy loader ────────────────────────────────── */
let leafletLoaded = false;
let L = null;

async function loadLeaflet() {
  if (leafletLoaded && L) return L;

  // Inject Leaflet CSS once
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  // Lazy import the Leaflet JS bundle
  const mod = await import('leaflet');
  L = mod.default || mod;

  // Fix default marker icon paths that break in Vite/Webpack
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  leafletLoaded = true;
  return L;
}

/* ─── Reverse geocode (Nominatim) ────────────────────────── */
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`
    );
    if (!res.ok) throw new Error('fail');
    return await res.json();
  } catch {
    return null;
  }
}

const keralaDistricts = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
  'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
  'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod',
];

/* ══════════════════════════════════════════════════════════ */
/*   INTERACTIVE MAP PICKER COMPONENT                         */
/* ══════════════════════════════════════════════════════════ */
function InteractiveMapPicker({ lat, lon, onPinMoved }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isReversing, setIsReversing] = useState(false);

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already mounted

    const Leaflet = await loadLeaflet();

    const initialLat = lat || 12.1026;
    const initialLon = lon || 75.2016;

    const map = Leaflet.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 16,
      zoomControl: true,
    });

    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add draggable marker
    const marker = Leaflet.marker([initialLat, initialLon], { draggable: true }).addTo(map);
    marker.bindPopup('<b>📍 Drag me to correct location</b>').openPopup();

    // On marker drag end → reverse geocode
    marker.on('dragend', async (e) => {
      const { lat: newLat, lng: newLon } = e.target.getLatLng();
      setIsReversing(true);
      const geoData = await reverseGeocode(newLat, newLon);
      setIsReversing(false);

      let city = geoData?.address?.city || geoData?.address?.town || geoData?.address?.village || 'Payyanur';
      let district = geoData?.address?.state_district || geoData?.address?.county || 'Kannur';
      const state = geoData?.address?.state || '';
      if (district.toLowerCase().includes('district')) district = district.replace(/district/gi, '').trim();
      const matched = keralaDistricts.find((d) => (geoData?.display_name || '').toLowerCase().includes(d.toLowerCase()));
      if (matched) district = matched;

      const address = geoData?.display_name || `${newLat.toFixed(6)}, ${newLon.toFixed(6)}`;

      marker.bindPopup(`<b>📍 ${city}</b><br/><small>${address.slice(0, 80)}...</small>`).openPopup();

      if (onPinMoved) {
        onPinMoved({ lat: newLat, lon: newLon, latitude: newLat, longitude: newLon, address, city, district, state });
      }
    });

    // Click anywhere on map → move pin
    map.on('click', async (e) => {
      const { lat: newLat, lng: newLon } = e.latlng;
      marker.setLatLng([newLat, newLon]);
      setIsReversing(true);
      const geoData = await reverseGeocode(newLat, newLon);
      setIsReversing(false);

      let city = geoData?.address?.city || geoData?.address?.town || geoData?.address?.village || 'Payyanur';
      let district = geoData?.address?.state_district || geoData?.address?.county || 'Kannur';
      const state = geoData?.address?.state || '';
      if (district.toLowerCase().includes('district')) district = district.replace(/district/gi, '').trim();
      const matched = keralaDistricts.find((d) => (geoData?.display_name || '').toLowerCase().includes(d.toLowerCase()));
      if (matched) district = matched;

      const address = geoData?.display_name || `${newLat.toFixed(6)}, ${newLon.toFixed(6)}`;

      marker.bindPopup(`<b>📍 ${city}</b><br/><small>${address.slice(0, 80)}...</small>`).openPopup();

      if (onPinMoved) {
        onPinMoved({ lat: newLat, lon: newLon, latitude: newLat, longitude: newLon, address, city, district, state });
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
  }, []);  // intentionally no deps — init once

  // If lat/lon changes from outside (e.g. search autocomplete), fly map to new position
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !lat || !lon) return;
    const Leaflet = L;
    if (!Leaflet) return;
    markerRef.current.setLatLng([lat, lon]);
    mapInstanceRef.current.flyTo([lat, lon], 16, { animate: true, duration: 1 });
  }, [lat, lon]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [initMap]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: 280,
          borderRadius: 12,
          border: '2px solid #BFDBFE',
          overflow: 'hidden',
          zIndex: 1,
        }}
      />

      {/* Hint overlay */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(30,27,75,0.85)',
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
          padding: '5px 14px',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}
      >
        <HiCursorClick size={14} />
        Click on map or drag pin to correct location
      </div>

      {/* Reverse geocoding indicator */}
      {isReversing && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(16,185,129,0.92)',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            padding: '5px 14px',
            borderRadius: 20,
            zIndex: 10,
          }}
        >
          🔄 Getting address for new location...
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*   MAIN EXPORTED COMPONENT — GoogleMapsLocationInput        */
/* ══════════════════════════════════════════════════════════ */
export default function GoogleMapsLocationInput({
  value = '',
  onChange,
  onSelectLocation,
  placeholder = 'Search location (e.g. Payyanur, Kannur, Kochi)...',
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapCoords, setMapCoords] = useState({ lat: null, lon: null });
  const wrapperRef = useRef(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query.trim().length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Kerala, India')}&limit=5&addressdetails=1&accept-language=en`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.length > 0 ? data : getMockSuggestions(query));
        } else {
          setSuggestions(getMockSuggestions(query));
        }
      } catch {
        setSuggestions(getMockSuggestions(query));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const getMockSuggestions = (q) => {
    const list = [
      { display_name: 'Payyanur, Kannur District, Kerala, India', name: 'Payyanur', city: 'Payyanur', district: 'Kannur', lat: '12.1026', lon: '75.2016' },
      { display_name: 'Taliparamba, Kannur District, Kerala, India', name: 'Taliparamba', city: 'Taliparamba', district: 'Kannur', lat: '12.0436', lon: '75.3582' },
      { display_name: 'Kannur, Kerala, India', name: 'Kannur', city: 'Kannur', district: 'Kannur', lat: '11.8745', lon: '75.3704' },
      { display_name: 'Fort Kochi, Ernakulam District, Kerala, India', name: 'Fort Kochi', city: 'Kochi', district: 'Ernakulam', lat: '9.9658', lon: '76.2421' },
      { display_name: 'Kozhikode, Kerala, India', name: 'Kozhikode', city: 'Calicut', district: 'Kozhikode', lat: '11.2588', lon: '75.7804' },
    ];
    return list.filter((i) => i.display_name.toLowerCase().includes(q.toLowerCase()));
  };

  const fireLocation = (locationObj) => {
    if (onChange) onChange(locationObj.address);
    if (onSelectLocation) onSelectLocation(locationObj);
    setMapCoords({ lat: locationObj.lat || locationObj.latitude, lon: locationObj.lon || locationObj.longitude });
    setShowMap(true);
  };

  const handleSelect = (item) => {
    const mainTitle = item.name || item.display_name.split(',')[0];
    const fullAddress = item.display_name;
    let district = item.address?.state_district || item.district || 'Kannur';
    if (district.toLowerCase().includes('district')) district = district.replace(/district/gi, '').trim();
    const matchedDist = keralaDistricts.find((d) => fullAddress.toLowerCase().includes(d.toLowerCase()));
    if (matchedDist) district = matchedDist;
    const city = item.address?.city || item.address?.town || item.address?.village || item.city || mainTitle;
    const state = item.address?.state || '';

    setQuery(fullAddress);
    setSelectedPlace({ name: mainTitle, fullAddress, district, city, lat: item.lat, lon: item.lon });
    setIsOpen(false);
    fireLocation({ name: mainTitle, address: fullAddress, city, district, state, lat: parseFloat(item.lat), lon: parseFloat(item.lon), latitude: parseFloat(item.lat), longitude: parseFloat(item.lon), googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` });
  };

  const handleGPSDetect = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const geoData = await reverseGeocode(lat, lon);
        const fullAddr = geoData?.display_name || `GPS (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
        let city = geoData?.address?.city || geoData?.address?.town || geoData?.address?.village || 'Payyanur';
        let district = geoData?.address?.state_district || geoData?.address?.county || 'Kannur';
        const state = geoData?.address?.state || '';
        if (district.toLowerCase().includes('district')) district = district.replace(/district/gi, '').trim();
        const matched = keralaDistricts.find((d) => fullAddr.toLowerCase().includes(d.toLowerCase()));
        if (matched) district = matched;

        const loc = { name: city, address: fullAddr, city, district, state, lat, lon, latitude: lat, longitude: lon, googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}` };
        setQuery(fullAddr);
        setSelectedPlace(loc);
        setIsLocating(false);
        fireLocation(loc);
      },
      (err) => { setIsLocating(false); alert(`GPS error: ${err.message}`); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Called when user drags pin or clicks map
  const handlePinMoved = (newLoc) => {
    setQuery(newLoc.address);
    setMapCoords({ lat: newLoc.lat, lon: newLoc.lon });
    const loc = { ...newLoc, latitude: newLoc.lat, longitude: newLoc.lon, state: newLoc.state || '', googleMapsUrl: `https://www.google.com/maps?q=${newLoc.lat},${newLoc.lon}` };
    setSelectedPlace({ name: newLoc.city, fullAddress: newLoc.address, district: newLoc.district, city: newLoc.city, lat: newLoc.lat, lon: newLoc.lon });
    if (onChange) onChange(newLoc.address);
    if (onSelectLocation) onSelectLocation(loc);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Search Input + GPS Button Row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <HiLocationMarker style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6C63FF', fontSize: 18 }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 38, paddingRight: 32 }}
            placeholder={placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); if (onChange) onChange(e.target.value); }}
            onFocus={() => setIsOpen(true)}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSelectedPlace(null); setShowMap(false); if (onChange) onChange(''); }}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <HiX />
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleGPSDetect}
          title="Detect current GPS location"
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <HiLocationMarker />
          {isLocating ? 'Locating...' : 'GPS'}
        </button>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setShowMap((p) => !p)}
          title="Open interactive map to pick / correct location"
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, color: showMap ? '#6C63FF' : undefined, borderColor: showMap ? '#6C63FF' : undefined }}
        >
          🗺️ {showMap ? 'Hide Map' : 'Pick on Map'}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div className="gmaps-suggestions-menu">
          {loading ? (
            <div className="gmaps-suggestion-item loading">Searching locations...</div>
          ) : suggestions.length === 0 ? (
            <div className="gmaps-suggestion-item empty">Type to search location</div>
          ) : (
            suggestions.map((item, idx) => (
              <div key={idx} className="gmaps-suggestion-item" onClick={() => handleSelect(item)}>
                <HiLocationMarker className="gmaps-item-icon" />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, color: '#1E293B' }}>
                    {item.name || item.display_name.split(',')[0]}
                  </strong>
                  <span style={{ fontSize: 11, color: '#64748B' }}>{item.display_name}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Location Badge */}
      {selectedPlace && (
        <div className="gmaps-selected-badge">
          <HiCheckCircle style={{ color: '#10B981', fontSize: 16 }} />
          <span>
            <strong>{selectedPlace.city || selectedPlace.name}</strong> — {selectedPlace.district}
            {mapCoords.lat && (
              <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8, fontFamily: 'monospace' }}>
                ({Number(mapCoords.lat).toFixed(5)}, {Number(mapCoords.lon).toFixed(5)})
              </span>
            )}
          </span>
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

      {/* ── Interactive Leaflet Map ── */}
      {showMap && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
            <HiCursorClick style={{ color: '#6C63FF' }} />
            <span><strong>Click anywhere on the map</strong> or <strong>drag the pin</strong> to correct/refine the exact location — address updates automatically.</span>
          </div>
          <InteractiveMapPicker
            lat={mapCoords.lat ? parseFloat(mapCoords.lat) : 12.1026}
            lon={mapCoords.lon ? parseFloat(mapCoords.lon) : 75.2016}
            onPinMoved={handlePinMoved}
          />
        </div>
      )}
    </div>
  );
}
