import React, { useState } from 'react';
import { HiLocationMarker, HiX, HiSearch, HiCheck } from 'react-icons/hi';
import { FaCrosshairs } from 'react-icons/fa';
import {
  detectAccurateUserLocation,
  KERALA_DISTRICT_COORDINATES,
  KERALA_TOWN_COORDINATES,
} from '../../services/googleLocationService';

// Re-export coordinates and detector for LandingPage and other consumers
export { detectAccurateUserLocation, KERALA_DISTRICT_COORDINATES, KERALA_TOWN_COORDINATES };

const POPULAR_QUICK_DISTRICTS = [
  { key: 'thiruvananthapuram', label: 'Trivandrum (TVM)', lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram' },
  { key: 'ernakulam', label: 'Kochi (Ernakulam)', lat: 9.9816, lng: 76.2999, name: 'Ernakulam' },
  { key: 'kozhikode', label: 'Calicut (Kozhikode)', lat: 11.2588, lng: 75.7804, name: 'Kozhikode' },
  { key: 'kannur', label: 'Kannur', lat: 11.8745, lng: 75.3704, name: 'Kannur' },
  { key: 'thrissur', label: 'Thrissur', lat: 10.5276, lng: 76.2144, name: 'Thrissur' },
  { key: 'kollam', label: 'Kollam', lat: 8.8932, lng: 76.6141, name: 'Kollam' },
];

export default function ZeashellLocationPromptModal({
  isOpen,
  onClose,
  onLocationSelected,
  currentLocationName,
}) {
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');

  // Handle High-Accuracy Geolocation API
  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);
    setGpsError('');

    try {
      const locationResult = await detectAccurateUserLocation();
      setIsDetectingGPS(false);
      if (onLocationSelected) {
        onLocationSelected(locationResult);
      }
    } catch (err) {
      setIsDetectingGPS(false);
      console.warn('Geolocation detection error:', err?.message || err);
      let errorMsg = 'Could not access location.';
      if (err.code === 1) {
        errorMsg = 'Location permission was denied. Please allow location access in your browser settings or choose a location below.';
      } else if (err.code === 2) {
        errorMsg = 'Location is currently unavailable from your device. Please choose a location below.';
      } else if (err.code === 3) {
        errorMsg = 'Location request timed out. Please tap to try again or choose a location below.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setGpsError(errorMsg);
    }
  };

  const handleSelectDistrict = (item) => {
    if (onLocationSelected) {
      onLocationSelected({
        type: 'district',
        district: item.key,
        districtName: item.name,
        name: `${item.name}, Kerala`,
        lat: item.lat,
        lng: item.lng,
      });
    }
  };

  const handleDeny = () => {
    if (onLocationSelected) {
      onLocationSelected({
        type: 'deny',
        name: 'All Kerala',
        district: 'all',
      });
    } else if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const allDistricts = Object.entries(KERALA_DISTRICT_COORDINATES).map(([k, v]) => ({
    key: k,
    name: v.name,
    title: v.title || v.name,
    lat: v.lat,
    lng: v.lng,
  }));

  const filteredDistricts = districtSearch.trim()
    ? allDistricts.filter(
        (d) =>
          d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
          d.title.toLowerCase().includes(districtSearch.toLowerCase())
      )
    : allDistricts;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          overflow: 'hidden',
          position: 'relative',
          padding: '28px 24px 22px',
          textAlign: 'center',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-prompt-title"
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={handleDeny}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          aria-label="Close"
        >
          <HiX size={18} />
        </button>

        {/* Animated Glowing Location Icon */}
        <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 14px' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.15)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
            }}
          >
            <HiLocationMarker size={30} color="#ffffff" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="location-prompt-title"
          style={{
            margin: '0 0 6px',
            fontSize: '21px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}
        >
          Choose Your Location
        </h2>

        {/* Description */}
        <p
          style={{
            margin: '0 0 16px',
            fontSize: '13.5px',
            color: '#475569',
            lineHeight: 1.45,
          }}
        >
          നിങ്ങളുടെ അടുത്തുള്ള മികച്ച കടകൾ ആദ്യം കാണാൻ ലൊക്കേഷൻ അനുവദിക്കുക അല്ലെങ്കിൽ ജില്ല തിരഞ്ഞെടുക്കുക.
        </p>

        {/* GPS Error Alert */}
        {gpsError && (
          <div
            style={{
              marginBottom: '14px',
              padding: '8px 12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '12px',
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {gpsError}
          </div>
        )}

        {/* 1. Primary GPS Detect Button */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={isDetectingGPS}
          style={{
            width: '100%',
            padding: '12px 18px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            color: '#ffffff',
            fontSize: '14.5px',
            fontWeight: '700',
            cursor: isDetectingGPS ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.2s ease',
            marginBottom: '16px',
          }}
        >
          <FaCrosshairs
            size={15}
            style={{
              animation: isDetectingGPS ? 'spin 1s infinite linear' : 'none',
            }}
          />
          <span>{isDetectingGPS ? 'Detecting Location...' : 'Use Current Location (GPS)'}</span>
        </button>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '4px 0 12px',
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span>OR SELECT DISTRICT</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Quick Popular Districts Chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          {POPULAR_QUICK_DISTRICTS.map((dist) => (
            <button
              key={dist.key}
              type="button"
              onClick={() => handleSelectDistrict(dist)}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#1e293b',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#eff6ff';
                e.currentTarget.style.borderColor = '#93c5fd';
                e.currentTarget.style.color = '#1d4ed8';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#1e293b';
              }}
            >
              <HiLocationMarker size={14} color="#2563eb" />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dist.label}
              </span>
            </button>
          ))}
        </div>

        {/* District Search & Dropdown */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              border: '1.5px solid #cbd5e1',
              borderRadius: '10px',
              background: '#ffffff',
            }}
          >
            <HiSearch size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Search all 14 Kerala districts..."
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '12.5px',
                width: '100%',
                color: '#0f172a',
              }}
            />
            {districtSearch && (
              <button
                type="button"
                onClick={() => setDistrictSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <HiX size={14} />
              </button>
            )}
          </div>

          {districtSearch.trim() && (
            <div
              style={{
                maxHeight: '130px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                marginTop: '6px',
                background: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textAlign: 'left',
              }}
            >
              {filteredDistricts.length === 0 ? (
                <div style={{ padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>
                  No district matched
                </div>
              ) : (
                filteredDistricts.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => handleSelectDistrict(d)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#1e293b',
                    }}
                  >
                    <HiLocationMarker size={14} color="#2563eb" />
                    <span>{d.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom Skip / All Kerala Action */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleDeny}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Explore All Kerala
          </button>
        </div>
      </div>
    </div>
  );
}
