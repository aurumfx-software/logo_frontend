import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  HiOutlineLocationMarker,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineExternalLink,
  HiOutlineSearch,
  HiOutlineGlobeAlt,
} from 'react-icons/hi';
import { KERALA_TOWN_ZONES_MASTER } from '../../utils/keralaCommercialZones';

export const KERALA_COMMERCIAL_HUBS = Object.entries(KERALA_TOWN_ZONES_MASTER).map(([key, val]) => ({
  id: `hub-${key.replace(/[^a-z0-9]/g, '-')}`,
  ...val,
}));

export default function KeralaGeographyMap({ onSelectHubMerchants }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const [selectedHub, setSelectedHub] = useState(KERALA_COMMERCIAL_HUBS[0]);
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter hubs
  const displayedHubs = KERALA_COMMERCIAL_HUBS.filter((hub) => {
    const matchDist = filterDistrict === 'All' || hub.district.toLowerCase().includes(filterDistrict.toLowerCase());
    const matchSearch =
      !searchTerm.trim() ||
      hub.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hub.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hub.zones.some((z) => z.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchDist && matchSearch;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Kerala Central Bounds
      const map = L.map(mapContainerRef.current, {
        center: [10.8505, 76.2711],
        zoom: 7.4,
        minZoom: 6.8,
        maxZoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Render Markers for each Kerala Commercial Hub
    displayedHubs.forEach((hub) => {
      const isTopHub = hub.merchants >= 50;
      const markerHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isTopHub ? '44px' : '36px'};
          height: ${isTopHub ? '44px' : '36px'};
          background: ${isTopHub ? 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' : '#0284c7'};
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
          color: #ffffff;
          font-weight: 800;
          font-size: ${isTopHub ? '12px' : '10.5px'};
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${hub.merchants}
          ${isTopHub ? '<span style="position: absolute; top: -6px; right: -4px; background: #ef4444; color: #fff; font-size: 8px; font-weight: 800; padding: 1px 4px; border-radius: 8px; border: 1px solid #fff;">HOT</span>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'kerala-hub-marker',
        html: markerHtml,
        iconSize: [isTopHub ? 44 : 36, isTopHub ? 44 : 36],
        iconAnchor: [isTopHub ? 22 : 18, isTopHub ? 22 : 18],
      });

      const marker = L.marker([hub.lat, hub.lng], { icon: customIcon }).addTo(map);

      // Popup content with ALL specific zones listed
      const zonesListHtml = hub.zones
        .map((z, idx) => `<div style="margin-bottom: 4px; color: #0f172a; line-height: 1.3;">📍 <strong>${z.name}</strong> (${z.count} shops)</div>`)
        .join('');

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 260px; max-width: 320px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="font-size: 14px; color: #1e3a8a;">📍 ${hub.city}</strong>
            <span style="background: #eff6ff; color: #2563eb; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${hub.district}</span>
          </div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 8px;">
            <div>🏢 <strong>${hub.merchants} Registered Merchants</strong></div>
            <div>👥 <strong>${hub.users.toLocaleString()} Customer Users Reach</strong></div>
            <div>🏷️ <strong>${hub.zones.length} Commercial Zones (All ${hub.zones.length} Listed)</strong></div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; font-size: 11px; margin-bottom: 10px; max-height: 140px; overflow-y: auto;">
            <div style="font-weight: 700; color: #475569; margin-bottom: 4px;">All ${hub.zones.length} Specific Commercial Zones:</div>
            ${zonesListHtml}
          </div>
          <button
            id="btn-merchants-${hub.id}"
            style="
              width: 100%;
              background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
              color: #ffffff;
              border: none;
              border-radius: 6px;
              padding: 7px 12px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
            "
          >
            👥 View ${hub.merchants} Merchants in ${hub.city.split(' ')[0]}
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        setSelectedHub(hub);
        const btn = document.getElementById(`btn-merchants-${hub.id}`);
        if (btn && onSelectHubMerchants) {
          btn.onclick = () => onSelectHubMerchants(hub);
        }
      });

      markersRef.current[hub.id] = marker;
    });

    return () => {
      // Keep map instance alive for fast toggling
    };
  }, [displayedHubs, onSelectHubMerchants]);

  // Fly to selected hub
  const handleSelectHub = (hub) => {
    setSelectedHub(hub);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([hub.lat, hub.lng], 11, { duration: 1.2 });
      const marker = markersRef.current[hub.id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 400);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Map Filter Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: '#ffffff',
          padding: '12px 18px',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#1e40af', fontSize: 13.5 }}>
            <HiOutlineGlobeAlt size={18} />
            <span>Kerala Commercial Hubs & Commercial Zones Map</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Filter District:</span>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#1e293b',
              }}
            >
              <option value="All">All 14 Districts</option>
              {Array.from(new Set(KERALA_COMMERCIAL_HUBS.map((h) => h.district.replace(' District', '')))).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Search */}
        <div style={{ position: 'relative', width: 220 }}>
          <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search town or zone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 10px 5px 32px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Main Map + Zone Inspector Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: 16 }}>
        {/* Leaflet Map Canvas */}
        <div
          style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
            height: 520,
            background: '#e2e8f0',
          }}
        >
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Map Overlay Badge */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(6px)',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
              color: '#1e40af',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🌴 {displayedHubs.length} Active Kerala Commercial Hubs</span>
          </div>
        </div>

        {/* Selected Commercial Hub & Detailed Zone Breakdown Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: 520,
          }}
        >
          {/* Hub Header */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4 }}>
                {selectedHub.district}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {selectedHub.zones.length} Commercial Zones
              </span>
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>
              📍 {selectedHub.city}
            </h3>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, opacity: 0.95 }}>
              <span>🏢 <strong>{selectedHub.merchants}</strong> Merchants</span>
              <span>👥 <strong>{selectedHub.users.toLocaleString()}</strong> Customer Reach</span>
            </div>
          </div>

          {/* Specific Zone Names List - Shows ALL zones! */}
          <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              All {selectedHub.zones.length} Specific Commercial Zones & Density:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedHub.zones.map((zone, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '10px 12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <strong style={{ fontSize: 13, color: '#0f172a' }}>
                      {zone.name}
                    </strong>
                    <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>
                      {zone.count} shops
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>
                    {zone.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid #f1f5f9', background: '#fafafa', display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => onSelectHubMerchants && onSelectHubMerchants(selectedHub)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              }}
            >
              <HiOutlineOfficeBuilding size={16} />
              <span>View {selectedHub.merchants} Merchants in {selectedHub.city.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Jump Pill Hubs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>Quick Focus:</span>
        {KERALA_COMMERCIAL_HUBS.map((hub) => (
          <button
            key={hub.id}
            type="button"
            onClick={() => handleSelectHub(hub)}
            style={{
              padding: '5px 12px',
              borderRadius: 8,
              border: selectedHub.id === hub.id ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
              background: selectedHub.id === hub.id ? '#eff6ff' : '#ffffff',
              color: selectedHub.id === hub.id ? '#1e40af' : '#475569',
              fontSize: 12,
              fontWeight: selectedHub.id === hub.id ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {hub.city.split(' ')[0]} ({hub.merchants})
          </button>
        ))}
      </div>
    </div>
  );
}
