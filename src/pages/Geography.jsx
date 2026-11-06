import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineLocationMarker,
  HiOutlineRefresh,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineGlobeAlt,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePhone,
  HiOutlineExternalLink,
  HiX,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import PageHeader from '../components/UI/PageHeader';
import Modal from '../components/UI/Modal';
import StatsCard from '../components/UI/StatsCard';
import KeralaGeographyMap from '../components/geography/KeralaGeographyMap';
import { geographyApi } from '../api/operationsApi';
import { fetchMerchantsList, EMPTY_MERCHANT_IMAGE } from '../api/merchantApi';

const KERALA_DISTRICTS = [
  'All Districts',
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

export default function Geography() {
  // View mode: 'towns', 'districts', or 'map'
  const [viewMode, setViewMode] = useState('towns');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Live Backend Data
  const [loading, setLoading] = useState(true);
  const [geoData, setGeoData] = useState(null);
  const [error, setError] = useState('');

  // Add Town Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTownDistrict, setNewTownDistrict] = useState('Kannur');
  const [newTownName, setNewTownName] = useState('');
  const [newTownZones, setNewTownZones] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [addModalError, setAddModalError] = useState('');
  const [addModalSuccess, setAddModalSuccess] = useState('');

  // Merchant Explorer Modal State (inspect merchants in selected town)
  const [selectedTownForMerchants, setSelectedTownForMerchants] = useState(null);
  const [townMerchants, setTownMerchants] = useState([]);
  const [loadingTownMerchants, setLoadingTownMerchants] = useState(false);
  const [merchantSearchTerm, setMerchantSearchTerm] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');

  // ── Load Geography from GET /api/v1/admin/geography ──
  const loadGeography = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const data = await geographyApi.getAdminGeography({
        district: selectedDistrict === 'All Districts' ? '' : selectedDistrict,
        search: searchTerm,
        page: targetPage,
        pageSize,
      });
      setGeoData(data);
      setPage(data.page || targetPage);
    } catch (err) {
      console.error('Failed to load geography data:', err);
      setError(err.message || 'Failed to load geography data');
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict, searchTerm, pageSize, page]);

  useEffect(() => {
    loadGeography(1);
  }, [selectedDistrict]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadGeography(1);
  };

  // ── Add Kerala Town (POST /api/v1/admin/geography/towns) ──
  const handleAddTownSubmit = async (e) => {
    e.preventDefault();
    setAddModalError('');
    setAddModalSuccess('');

    if (!newTownName.trim()) {
      setAddModalError('Please enter a town or commercial hub name.');
      return;
    }

    setSubmitting(true);
    try {
      const zonesList = newTownZones
        .split(',')
        .map((z) => z.trim())
        .filter(Boolean);

      await geographyApi.addTown({
        district: newTownDistrict,
        town: newTownName.trim(),
        zones: zonesList,
      });

      setAddModalSuccess(`Successfully added ${newTownName} to ${newTownDistrict} district!`);
      setNewTownName('');
      setNewTownZones('');
      await loadGeography(1);
      setTimeout(() => {
        setShowAddModal(false);
        setAddModalSuccess('');
      }, 1200);
    } catch (err) {
      console.error('Add town error:', err);
      setAddModalError(err.message || 'Failed to add town');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open Merchant Explorer Modal for a Town ──
  const handleOpenTownMerchants = async (townObj, initialZone = 'All') => {
    setSelectedTownForMerchants(townObj);
    setSelectedZoneFilter(initialZone);
    setMerchantSearchTerm('');
    setLoadingTownMerchants(true);

    try {
      const allMerchants = await fetchMerchantsList();
      const normTown = (townObj.town || '').toLowerCase().trim();
      const normDist = (townObj.district || '').toLowerCase().trim();

      let matched = (allMerchants || []).filter((m) => {
        const mCity = (m.city || '').toLowerCase();
        const mDist = (m.district || '').toLowerCase();
        const mAddr = (m.address || '').toLowerCase();
        return (
          mCity.includes(normTown) ||
          normTown.includes(mCity) ||
          mAddr.includes(normTown) ||
          (normDist && mDist.includes(normDist))
        );
      });

      if (matched.length === 0 && Array.isArray(allMerchants) && allMerchants.length > 0) {
        matched = allMerchants.slice(0, 15);
      }
      setTownMerchants(matched);
    } catch (err) {
      console.error('Failed to load merchants for town:', err);
      setTownMerchants([]);
    } finally {
      setLoadingTownMerchants(false);
    }
  };

  // Extract cards data
  const cards = geoData?.cards || {
    kerala_districts_covered: 14,
    kerala_districts_total: 14,
    kerala_districts_percent: 100,
    active_municipalities: 0,
    real_merchants: 0,
    verified_merchants: 0,
    active_users_reach: 0,
  };

  const districtList = Array.isArray(geoData?.districts) ? geoData.districts : [];
  const townsList = Array.isArray(geoData?.towns) ? geoData.towns : [];
  const totalTowns = geoData?.total ?? townsList.length;
  const totalPages = Math.max(1, Math.ceil(totalTowns / pageSize));

  // Filtered merchants inside modal
  const filteredModalMerchants = useMemo(() => {
    return townMerchants.filter((m) => {
      const matchSearch =
        !merchantSearchTerm.trim() ||
        (m.name || '').toLowerCase().includes(merchantSearchTerm.toLowerCase()) ||
        (m.business_name || '').toLowerCase().includes(merchantSearchTerm.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(merchantSearchTerm.toLowerCase()) ||
        (m.phone || '').includes(merchantSearchTerm) ||
        (m.address || '').toLowerCase().includes(merchantSearchTerm.toLowerCase());

      const matchZone =
        selectedZoneFilter === 'All' ||
        (m.address || '').toLowerCase().includes(selectedZoneFilter.toLowerCase()) ||
        (m.landmark || '').toLowerCase().includes(selectedZoneFilter.toLowerCase()) ||
        (m.location || '').toLowerCase().includes(selectedZoneFilter.toLowerCase());

      return matchSearch && matchZone;
    });
  }, [townMerchants, merchantSearchTerm, selectedZoneFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 60 }}>
      {/* Top Header */}
      <PageHeader
        title="Geography & Service Areas"
        subtitle="14 Kerala districts coverage, active municipalities, real merchant reach, and hyperlocal commercial zones"
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            disabled={loading}
            onClick={() => loadGeography(page)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineRefresh className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setAddModalError('');
              setAddModalSuccess('');
              setShowAddModal(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlinePlus />
            <span>Add Kerala Town</span>
          </button>
        </div>
      </PageHeader>

      {/* Error alert */}
      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 16px',
            background: '#FEE2E2',
            borderLeft: '4px solid #EF4444',
            borderRadius: 8,
            color: '#B91C1C',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 1. STATS CARDS (Kerala Districts 14/14, Municipalities, etc.) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Kerala Districts 14/14 */}
        <StatsCard
          icon={<HiOutlineGlobeAlt size={22} />}
          label="Kerala Districts"
          value={`${cards.kerala_districts_covered} / ${cards.kerala_districts_total} (${cards.kerala_districts_percent}%)`}
          color="primary"
          delay={0}
        />

        {/* Card 2: Active Municipalities */}
        <StatsCard
          icon={<HiOutlineLocationMarker size={22} />}
          label="Active Municipalities"
          value={(cards.active_municipalities || 0).toLocaleString()}
          color="success"
          delay={1}
        />

        {/* Card 3: Real Merchants */}
        <StatsCard
          icon={<HiOutlineOfficeBuilding size={22} />}
          label="Real Merchants"
          value={(cards.real_merchants || 0).toLocaleString()}
          color="warning"
          delay={2}
        />

        {/* Card 4: Active Users Reach */}
        <StatsCard
          icon={<HiOutlineUsers size={22} />}
          label="Active Users Reach"
          value={(cards.active_users_reach || 0).toLocaleString()}
          color="info"
          delay={3}
        />
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 2. BLUE BANNER WITH VERIFIED MERCHANTS & VIEW SWITCHERS       */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          color: '#ffffff',
          padding: '20px 24px',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🌴</span>
              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                Kerala State Hyperlocal Network Rollout
              </h4>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  letterSpacing: 0.5,
                }}
              >
                LIVE PLATFORM SYNC
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.9 }}>
              Total <strong>{(cards.verified_merchants || cards.real_merchants || 0).toLocaleString()} Verified Merchants</strong> registered across Kerala.
              Explore specific commercial zones or switch to the interactive Kerala map.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setViewMode('towns')}
              style={{
                background: viewMode === 'towns' ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
                color: viewMode === 'towns' ? '#1e3a8a' : '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🏙️ Towns & Zones View ({totalTowns})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('districts')}
              style={{
                background: viewMode === 'districts' ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
                color: viewMode === 'districts' ? '#1e3a8a' : '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🗺️ 14 Districts Summary
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                background: viewMode === 'map' ? '#ffffff' : 'rgba(255, 255, 255, 0.22)',
                color: viewMode === 'map' ? '#1e3a8a' : '#ffffff',
                border: viewMode === 'map' ? 'none' : '1px solid rgba(255,255,255,0.4)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: viewMode === 'map' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              📍 Interactive Kerala Map
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 3. DISTRICT CHIPS (All 14 Districts with Merchant Counts)     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {viewMode === 'towns' && (
        <div style={{ marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setSelectedDistrict('All Districts');
                setPage(1);
              }}
              style={{
                background: selectedDistrict === 'All Districts' ? 'var(--primary, #2563eb)' : '#ffffff',
                color: selectedDistrict === 'All Districts' ? '#ffffff' : '#334155',
                border: selectedDistrict === 'All Districts' ? '1.5px solid var(--primary, #2563eb)' : '1px solid #cbd5e1',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: 12.5,
                fontWeight: selectedDistrict === 'All Districts' ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              All Districts ({totalTowns} Towns)
            </button>

            {districtList.map((dist) => {
              const isSelected = selectedDistrict === dist.name;
              return (
                <button
                  key={dist.name}
                  type="button"
                  onClick={() => {
                    setSelectedDistrict(dist.name);
                    setPage(1);
                  }}
                  style={{
                    background: isSelected ? 'var(--primary, #2563eb)' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: isSelected ? '1.5px solid var(--primary, #2563eb)' : '1px solid #cbd5e1',
                    padding: '6px 12px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{dist.name}</span>
                  <span
                    style={{
                      background: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#475569',
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {dist.merchants || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 4. VIEW MODE 1: TOWNS TABLE                                   */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {viewMode === 'towns' && (
        <div className="card">
          <div
            className="card-header"
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div>
              <h3 className="card-header-title" style={{ fontSize: 16, fontWeight: 700 }}>
                Kerala Towns & Commercial Zones Table
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary, #64748b)', marginTop: 2 }}>
                Towns from database and merchant store locations in {selectedDistrict}
              </p>
            </div>

            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', width: 240 }}>
                <HiOutlineSearch
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                />
                <input
                  type="text"
                  placeholder="Search town, zone, or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{
                    paddingLeft: 32,
                    paddingRight: searchTerm ? 28 : 10,
                    fontSize: 12.5,
                    height: 36,
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      loadGeography(1);
                    }}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <HiX size={13} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" style={{ height: 36 }}>
                Search
              </button>
            </form>
          </div>

          {/* Table Container */}
          <div className="table-container">
            {loading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <HiOutlineRefresh className="animate-spin" style={{ fontSize: 32, color: '#3B82F6', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Loading towns & coverage...</div>
              </div>
            ) : townsList.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <HiOutlineLocationMarker style={{ fontSize: 40, color: '#cbd5e1', marginBottom: 10 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>No towns found</div>
                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>
                  No towns registered for {selectedDistrict}. You can click "Add Kerala Town" above to add one.
                </div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Town / Commercial Hub</th>
                    <th>District</th>
                    <th>Commercial Zones</th>
                    <th style={{ textAlign: 'center' }}>Registered Merchants</th>
                    <th style={{ textAlign: 'center' }}>Customer Reach</th>
                    <th style={{ textAlign: 'center' }}>Coverage Status</th>
                    <th style={{ textAlign: 'center' }}>Merchants</th>
                  </tr>
                </thead>
                <tbody>
                  {townsList.map((t, idx) => {
                    const isCovered = (t.coverage_status || '').toUpperCase() === 'COVERED';
                    const zones = Array.isArray(t.zones) ? t.zones : [];

                    return (
                      <tr key={t.id || idx}>
                        {/* Town Name */}
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#2563eb' }}>📍</span>
                            <span>{t.town}</span>
                          </div>
                        </td>

                        {/* District */}
                        <td>
                          <span
                            style={{
                              background: '#eff6ff',
                              color: '#1e40af',
                              fontWeight: 700,
                              fontSize: 11.5,
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}
                          >
                            {t.district}
                          </span>
                        </td>

                        {/* Commercial Zones */}
                        <td>
                          {zones.length > 0 ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 340 }}>
                              {zones.map((z, zIdx) => (
                                <span
                                  key={zIdx}
                                  style={{
                                    fontSize: 11,
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    fontWeight: 500,
                                  }}
                                >
                                  {z}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12, fontStyle: 'italic' }}>
                              Primary Hub
                            </span>
                          )}
                        </td>

                        {/* Registered Merchants */}
                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>
                          {(t.registered_merchants || 0).toLocaleString()}
                        </td>

                        {/* Customer Reach */}
                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 13, color: '#059669' }}>
                          {(t.customer_reach || 0).toLocaleString()} users
                        </td>

                        {/* Coverage Status */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                              backgroundColor: isCovered ? '#DCFCE7' : '#FEF3C7',
                              color: isCovered ? '#15803D' : '#B45309',
                              border: `1px solid ${isCovered ? '#BBF7D0' : '#FDE68A'}`,
                            }}
                          >
                            {t.coverage_status || (isCovered ? 'COVERED' : 'NO_COVERAGE')}
                          </span>
                        </td>

                        {/* Action: View Merchants */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenTownMerchants(t)}
                            className="btn btn-outline"
                            style={{
                              padding: '4px 10px',
                              fontSize: 11.5,
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <HiOutlineOfficeBuilding />
                            <span>Merchants</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && totalTowns > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 24px',
                borderTop: '1px solid var(--border-light, #e2e8f0)',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>
                Showing {Math.min((page - 1) * pageSize + 1, totalTowns)} to{' '}
                {Math.min(page * pageSize, totalTowns)} of {totalTowns} towns
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => loadGeography(page - 1)}
                  disabled={page <= 1 || loading}
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    fontSize: 13,
                    opacity: page <= 1 ? 0.5 : 1,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <HiOutlineChevronLeft />
                  <span>Previous</span>
                </button>

                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #0f172a)', padding: '0 8px' }}>
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => loadGeography(page + 1)}
                  disabled={page >= totalPages || loading}
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    fontSize: 13,
                    opacity: page >= totalPages ? 0.5 : 1,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span>Next</span>
                  <HiOutlineChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 5. VIEW MODE 2: 14 DISTRICTS SUMMARY                          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {viewMode === 'districts' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-header-title">
              <HiOutlineGlobeAlt style={{ marginRight: 8, color: 'var(--primary, #2563eb)' }} />
              Kerala 14 Districts Aggregate Performance
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-light, #94a3b8)', marginTop: 2 }}>
              Aggregated real merchant count, customer reach, and covered towns across all 14 revenue districts
            </p>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>District Name</th>
                  <th style={{ textAlign: 'center' }}>Registered Merchants</th>
                  <th style={{ textAlign: 'center' }}>Customer Accounts</th>
                  <th style={{ textAlign: 'center' }}>Commercial Towns / Hubs</th>
                  <th style={{ textAlign: 'center' }}>Coverage Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {districtList.map((d) => (
                  <tr key={d.name}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📍</span>
                        <span>{d.name} District</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#2563eb' }}>
                      {(d.merchants || 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#059669' }}>
                      {(d.customers || 0).toLocaleString()} users
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>
                      {d.towns || 0} towns
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          backgroundColor: d.merchants > 0 ? '#DCFCE7' : '#F1F5F9',
                          color: d.merchants > 0 ? '#15803D' : '#64748B',
                        }}
                      >
                        {d.merchants > 0 ? 'ACTIVE NETWORK' : 'INITIAL ROLLOUT'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDistrict(d.name);
                          setViewMode('towns');
                          setPage(1);
                        }}
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        Explore Towns →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 6. VIEW MODE 3: INTERACTIVE KERALA MAP                        */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {viewMode === 'map' && (
        <div style={{ marginBottom: 24 }}>
          <KeralaGeographyMap onSelectHubMerchants={(hub) => handleOpenTownMerchants(hub)} />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 7. ADD KERALA TOWN MODAL (POST /api/v1/admin/geography/towns) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Kerala Town or Commercial Hub"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting}
              onClick={handleAddTownSubmit}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {submitting ? 'Adding...' : 'Add Town'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddTownSubmit}>
          {addModalError && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: '#FEE2E2',
                borderLeft: '4px solid #EF4444',
                borderRadius: 6,
                color: '#B91C1C',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {addModalError}
            </div>
          )}

          {addModalSuccess && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: '#D1FAE5',
                borderLeft: '4px solid #10B981',
                borderRadius: 6,
                color: '#065F46',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {addModalSuccess}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              District (Kerala) *
            </label>
            <select
              className="form-select"
              value={newTownDistrict}
              onChange={(e) => setNewTownDistrict(e.target.value)}
              required
            >
              {KERALA_DISTRICTS.filter((d) => d !== 'All Districts').map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Town / Commercial Hub Name *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Payyanur, Vadakara, Tirur, Aluva"
              value={newTownName}
              onChange={(e) => setNewTownName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Commercial Zones / Wards <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Comma separated)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Payyanur Hub, Old Bus Stand, Railway Station Road"
              value={newTownZones}
              onChange={(e) => setNewTownZones(e.target.value)}
            />
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
              Separate multiple zones with commas. Example: "Payyanur Hub, Old Bus Stand"
            </span>
          </div>
        </form>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 8. MERCHANT EXPLORER MODAL (Inspect merchants for town)       */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={Boolean(selectedTownForMerchants)}
        onClose={() => setSelectedTownForMerchants(null)}
        title={
          selectedTownForMerchants ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e3a8a' }}>
                  {selectedTownForMerchants.town} ({selectedTownForMerchants.district})
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                  {selectedTownForMerchants.registered_merchants || townMerchants.length} Registered Merchants in this Town
                </div>
              </div>
            </div>
          ) : 'Merchants Explorer'
        }
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Showing <strong>{filteredModalMerchants.length}</strong> of <strong>{townMerchants.length}</strong> merchants
            </div>
            <button className="btn btn-primary" onClick={() => setSelectedTownForMerchants(null)}>
              Close
            </button>
          </div>
        }
      >
        {selectedTownForMerchants && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick Search */}
            <div style={{ position: 'relative' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search merchant by store name, owner, or category..."
                value={merchantSearchTerm}
                onChange={(e) => setMerchantSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  fontSize: 13,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                }}
              />
            </div>

            {/* Merchants List */}
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingTownMerchants ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  Loading merchants for {selectedTownForMerchants.town}...
                </div>
              ) : filteredModalMerchants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
                  No merchants found matching your query.
                </div>
              ) : (
                filteredModalMerchants.map((merchant, idx) => (
                  <div
                    key={merchant.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '10px 14px',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <img
                        src={merchant.image || EMPTY_MERCHANT_IMAGE}
                        alt={merchant.name || 'Merchant'}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 8,
                          objectFit: 'cover',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = EMPTY_MERCHANT_IMAGE;
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 13.5, color: '#0f172a' }}>
                            {merchant.name || merchant.business_name || 'Store'}
                          </strong>
                          <span
                            style={{
                              background: '#eff6ff',
                              color: '#2563eb',
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {merchant.category || 'Retail'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                          <span>👤 {merchant.owner || merchant.owner_name || 'Owner'}</span>
                          &nbsp;•&nbsp;
                          <span>📍 {merchant.address || merchant.landmark || merchant.city || selectedTownForMerchants.town}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {merchant.phone && (
                        <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
                          📞 {merchant.phone}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
