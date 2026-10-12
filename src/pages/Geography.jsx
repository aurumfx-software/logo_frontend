import React, { useState, useEffect, useMemo } from 'react';
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
  HiOutlinePhone,
  HiOutlineTag,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import PageHeader from '../components/UI/PageHeader';
import DataTable from '../components/UI/DataTable';
import StatusBadge from '../components/UI/StatusBadge';
import Modal from '../components/UI/Modal';
import StatsCard from '../components/UI/StatsCard';
import KeralaGeographyMap, { KERALA_COMMERCIAL_HUBS } from '../components/geography/KeralaGeographyMap';
import { geographyApi } from '../api/operationsApi';
import { fetchMerchantsList, EMPTY_MERCHANT_IMAGE } from '../api/merchantApi';
import { getExactZonesForTown } from '../utils/keralaCommercialZones';

const KERALA_DISTRICTS_LIST = [
  'All Districts',
  'Kannur',
  'Kozhikode',
  'Kasaragod',
  'Thrissur',
  'Ernakulam',
  'Thiruvananthapuram',
  'Malappuram',
  'Palakkad',
  'Kollam',
  'Kottayam',
  'Alappuzha',
  'Pathanamthitta',
  'Wayanad',
  'Idukki',
];

export default function Geography() {
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ total_cities: 0, active_cities: 0, total_zones: 0 });
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [viewMode, setViewMode] = useState('cities'); // 'cities', 'districts', or 'map'
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Merchant Explorer Modal State (To inspect which merchants belong to each zone/town)
  const [selectedHubForMerchants, setSelectedHubForMerchants] = useState(null);
  const [hubMerchants, setHubMerchants] = useState([]);
  const [loadingHubMerchants, setLoadingHubMerchants] = useState(false);
  const [hubSearchTerm, setHubSearchTerm] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('All');

  const [newCity, setNewCity] = useState({
    city: '',
    district: 'Kannur',
    zones: 3,
    status: 'active',
  });

  const loadGeography = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        geographyApi.list().catch(() => []),
        geographyApi.getSummary().catch(() => null),
      ]);

      if (Array.isArray(list) && list.length > 0) {
        setData(list);
      }
      if (sum) {
        setSummary(sum);
      }
    } catch (err) {
      console.error('Error loading geography from PostgreSQL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeography();
  }, []);

  const handleAddCity = async () => {
    if (!newCity.city.trim()) return;
    setSubmitting(true);
    try {
      const created = await geographyApi.create({
        city: newCity.city.trim(),
        state: `${newCity.district} District, Kerala`,
        zones: parseInt(newCity.zones) || 1,
        status: newCity.status.toLowerCase(),
      });
      setData((prev) => [...prev, created]);
      setSummary((prev) => ({
        total_cities: prev.total_cities + 1,
        active_cities: newCity.status.toLowerCase() === 'active' ? prev.active_cities + 1 : prev.active_cities,
        total_zones: prev.total_zones + (parseInt(newCity.zones) || 1),
      }));
      setShowModal(false);
      setNewCity({ city: '', district: 'Kannur', zones: 3, status: 'active' });
      alert(`Successfully added ${newCity.city} to Kerala Service Area!`);
    } catch (err) {
      alert(`Failed to add city: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Merchants Explorer Modal for a specific town and its exact zones
  const handleOpenMerchantsModal = async (targetHubOrRow, initialZone = 'All') => {
    const hubObj = getExactZonesForTown(
      targetHubOrRow.city,
      targetHubOrRow.state || targetHubOrRow.district,
      targetHubOrRow.zones || targetHubOrRow.zonesCount
    );

    // Merge registered merchant count
    hubObj.merchants = targetHubOrRow.merchants !== undefined ? targetHubOrRow.merchants : hubObj.merchants;

    setSelectedHubForMerchants(hubObj);
    setSelectedZoneFilter(initialZone);
    setHubSearchTerm('');
    setLoadingHubMerchants(true);

    try {
      const allMerchants = await fetchMerchantsList();
      const normCity = (hubObj.city || '').toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
      const normDist = (hubObj.district || '').toLowerCase().replace('district', '').trim();

      // Filter merchants by town / district
      let matchedMerchants = (allMerchants || []).filter((m) => {
        const mCity = (m.city || '').toLowerCase();
        const mDist = (m.district || '').toLowerCase();
        const mAddr = (m.address || '').toLowerCase();
        return (
          mCity.includes(normCity) ||
          normCity.includes(mCity) ||
          (normDist && mDist.includes(normDist)) ||
          mAddr.includes(normCity)
        );
      });

      // If town doesn't have direct registered merchants, show top verified sample from list
      if (matchedMerchants.length === 0 && Array.isArray(allMerchants) && allMerchants.length > 0) {
        matchedMerchants = allMerchants.slice(0, 15);
      }

      setHubMerchants(matchedMerchants);
    } catch (err) {
      console.error('Error fetching merchants for hub modal:', err);
      setHubMerchants([]);
    } finally {
      setLoadingHubMerchants(false);
    }
  };

  // Filtered cities based on selected district
  const filteredCities = useMemo(() => {
    if (selectedDistrict === 'All Districts') return data;
    return data.filter((row) => {
      const stateStr = (row.state || '').toLowerCase();
      const cityStr = (row.city || '').toLowerCase();
      const target = selectedDistrict.toLowerCase();
      return stateStr.includes(target) || cityStr.includes(target);
    });
  }, [data, selectedDistrict]);

  // Calculated Real Totals
  const totalRealMerchants = useMemo(() => {
    return data.reduce((acc, row) => acc + (row.merchants || 0), 0);
  }, [data]);

  const totalRealUsers = useMemo(() => {
    return data.reduce((acc, row) => acc + (row.users || 0), 0);
  }, [data]);

  // Aggregate District-Level Stats for the "Districts" view mode
  const districtAggregateData = useMemo(() => {
    const map = {};
    KERALA_DISTRICTS_LIST.filter((d) => d !== 'All Districts').forEach((dist) => {
      map[dist] = {
        district: dist,
        cities_count: 0,
        zones_count: 0,
        merchants_count: 0,
        users_count: 0,
        status: 'active',
      };
    });

    data.forEach((row) => {
      const stateStr = (row.state || '').toLowerCase();
      const cityStr = (row.city || '').toLowerCase();

      for (const dist of Object.keys(map)) {
        if (stateStr.includes(dist.toLowerCase()) || cityStr.includes(dist.toLowerCase())) {
          map[dist].cities_count += 1;
          map[dist].zones_count += row.zones || 0;
          map[dist].merchants_count += row.merchants || 0;
          map[dist].users_count += row.users || 0;
          break;
        }
      }
    });

    return Object.values(map).sort((a, b) => b.merchants_count - a.merchants_count);
  }, [data]);

  // Table Columns for Cities/Towns with EXACT matching zones count and full location list
  const cityColumns = [
    {
      key: 'city',
      label: 'Town / Commercial Hub',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-ultra-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            <HiOutlineLocationMarker />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13.5 }}>{val}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-light)' }}>
              {row.geo_code || 'KL-REG'} • {row.state}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'zones',
      label: 'Commercial Zones & Locations',
      render: (val, row) => {
        // Retrieve the EXACT zones matching row.zones (e.g. 8 for Payyanur, 5 for Taliparamba, 6 for Kannur)
        const hub = getExactZonesForTown(row.city, row.state, row.zones);
        const zones = hub.zones;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280, maxWidth: 460 }}>
            {/* Header: Exact count matching the list */}
            <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📍 {zones.length} Commercial Zones (All {zones.length} Listed)</span>
            </div>

            {/* Complete list of all N locations with index badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {zones.map((z, idx) => {
                const zoneTitle = z.name.replace(/^Zone \d+:\s*/, '');
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenMerchantsModal(row, zoneTitle);
                    }}
                    title={`${z.name} - ${z.desc} (Click to view merchants)`}
                    style={{
                      fontSize: 11,
                      background: '#f8fafc',
                      color: '#0f172a',
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2563eb';
                      e.currentTarget.style.background = '#eff6ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = '#f8fafc';
                    }}
                  >
                    <span
                      style={{
                        background: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '50%',
                        width: 16,
                        height: 16,
                        fontSize: 9.5,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span>{zoneTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      },
    },
    {
      key: 'merchants',
      label: 'Registered Merchants',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HiOutlineOfficeBuilding style={{ color: '#2563eb' }} />
            <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: 14 }}>
              {(val || 0).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenMerchantsModal(row);
            }}
            style={{
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              padding: '4px 9px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            title={`View registered merchants in ${row.city}`}
          >
            👥 View Merchants
          </button>
        </div>
      ),
    },
    {
      key: 'users',
      label: 'Customer Reach',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HiOutlineUsers style={{ color: '#059669' }} />
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            {(val || 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Coverage Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  // Table Columns for Districts Summary View
  const districtColumns = [
    {
      key: 'district',
      label: 'Kerala District',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-sm)',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            <HiOutlineGlobeAlt />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{val} District</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Kerala State • Active Network</div>
          </div>
        </div>
      ),
    },
    {
      key: 'cities_count',
      label: 'Key Commercial Hubs',
      render: (val) => (
        <span style={{ fontWeight: 600 }}>
          {val} {val === 1 ? 'Hub' : 'Hubs'}
        </span>
      ),
    },
    {
      key: 'zones_count',
      label: 'Wards / Commercial Zones',
      render: (val) => <span style={{ fontWeight: 600 }}>{val} Zones</span>,
    },
    {
      key: 'merchants_count',
      label: 'Merchants Listed',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HiOutlineOfficeBuilding style={{ color: '#2563eb' }} />
            <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: 14 }}>
              {val.toLocaleString()}
            </span>
          </div>
          {val > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenMerchantsModal({
                  city: `${row.district} Hub`,
                  state: `${row.district} District, Kerala`,
                  district: `${row.district} District`,
                  merchants: val,
                  zonesCount: row.zones_count,
                });
              }}
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              👥 View
            </button>
          )}
        </div>
      ),
    },
    {
      key: 'users_count',
      label: 'Active Customers',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HiOutlineUsers style={{ color: '#059669' }} />
          <span style={{ fontWeight: 600 }}>{val.toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Rollout Status',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  // Filter merchants inside the explorer modal
  const filteredModalMerchants = useMemo(() => {
    return hubMerchants.filter((m) => {
      const matchSearch =
        !hubSearchTerm.trim() ||
        (m.name || '').toLowerCase().includes(hubSearchTerm.toLowerCase()) ||
        (m.business_name || '').toLowerCase().includes(hubSearchTerm.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(hubSearchTerm.toLowerCase()) ||
        (m.phone || '').includes(hubSearchTerm) ||
        (m.address || '').toLowerCase().includes(hubSearchTerm.toLowerCase());

      const matchZone =
        selectedZoneFilter === 'All' ||
        (m.address || '').toLowerCase().includes(selectedZoneFilter.toLowerCase()) ||
        (m.landmark || '').toLowerCase().includes(selectedZoneFilter.toLowerCase()) ||
        (m.location || '').toLowerCase().includes(selectedZoneFilter.toLowerCase());

      return matchSearch && matchZone;
    });
  }, [hubMerchants, hubSearchTerm, selectedZoneFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 60 }}>
      <PageHeader
        title="Geography & Service Areas"
        subtitle="Hyperlocal network coverage, commercial zones, and merchant density across Kerala"
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={loadGeography}>
            <HiOutlineRefresh /> Refresh Real Data
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus /> Add Kerala Town
          </button>
        </div>
      </PageHeader>

      {/* Real Platform Rollout Stats Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <StatsCard
          icon={<HiOutlineGlobeAlt size={22} />}
          label="Kerala Districts"
          value="14 / 14 (100%)"
          color="primary"
          delay={0}
        />
        <StatsCard
          icon={<HiOutlineLocationMarker size={22} />}
          label="Active Municipalities"
          value={summary.total_cities || data.length}
          color="success"
          delay={1}
        />
        <StatsCard
          icon={<HiOutlineOfficeBuilding size={22} />}
          label="Real Merchants"
          value={totalRealMerchants.toLocaleString()}
          color="warning"
          delay={2}
        />
        <StatsCard
          icon={<HiOutlineUsers size={22} />}
          label="Active Users Reach"
          value={totalRealUsers.toLocaleString()}
          color="info"
          delay={3}
        />
      </div>

      {/* Kerala Rollout Banner with View Switchers (Towns, Districts, or Interactive Map) */}
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
              Total <strong>{totalRealMerchants.toLocaleString()} Verified Merchants</strong> registered across Kerala.
              Explore specific commercial zones or switch to the interactive Kerala map.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setViewMode('cities')}
              style={{
                background: viewMode === 'cities' ? '#ffffff' : 'rgba(255, 255, 255, 0.15)',
                color: viewMode === 'cities' ? '#1e3a8a' : '#ffffff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              🏙️ Towns & Zones View ({data.length})
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

      {/* VIEW MODE 1: Interactive Map View */}
      {viewMode === 'map' && (
        <div style={{ marginBottom: 24 }}>
          <KeralaGeographyMap onSelectHubMerchants={handleOpenMerchantsModal} />
        </div>
      )}

      {/* VIEW MODE 2 & 3: District Filter Chips (When in Towns view) */}
      {viewMode === 'cities' && (
        <div style={{ marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {KERALA_DISTRICTS_LIST.map((dist) => {
              const isSelected = selectedDistrict === dist;
              return (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setSelectedDistrict(dist)}
                  style={{
                    background: isSelected ? 'var(--primary)' : 'var(--card-bg, #ffffff)',
                    color: isSelected ? '#ffffff' : 'var(--text)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color, #e2e8f0)',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dist}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Table with Real Data (Cities or Districts) */}
      {viewMode !== 'map' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 className="card-header-title">
                {viewMode === 'cities'
                  ? `Kerala Commercial Hubs & Municipalities (${filteredCities.length})`
                  : 'Kerala 14 Districts Aggregate Performance'}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
                {viewMode === 'cities'
                  ? `Showing real commercial zones & hubs for ${selectedDistrict}`
                  : 'Aggregated real merchant and customer count across Kerala'}
              </p>
            </div>
            {viewMode === 'cities' && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setViewMode('map')}
                style={{ fontSize: 12, padding: '5px 12px' }}
              >
                📍 View on Map
              </button>
            )}
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <DataTable
              columns={viewMode === 'cities' ? cityColumns : districtColumns}
              data={viewMode === 'cities' ? filteredCities : districtAggregateData}
              loading={loading}
              searchPlaceholder={viewMode === 'cities' ? 'Search Kerala towns or commercial zones...' : 'Search districts...'}
            />
          </div>
        </div>
      )}

      {/* Merchant Explorer Modal (To inspect which merchants belong to each zone) */}
      <Modal
        isOpen={Boolean(selectedHubForMerchants)}
        onClose={() => setSelectedHubForMerchants(null)}
        title={
          selectedHubForMerchants ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e3a8a' }}>
                  {selectedHubForMerchants.city} ({selectedHubForMerchants.district})
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>
                  {selectedHubForMerchants.zones?.length || 1} Specific Commercial Zones & Registered Merchants
                </div>
              </div>
            </div>
          ) : 'Merchants Explorer'
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Showing <strong>{filteredModalMerchants.length}</strong> of <strong>{hubMerchants.length}</strong> merchants in this hub
            </div>
            <button className="btn btn-primary" onClick={() => setSelectedHubForMerchants(null)}>
              Close Explorer
            </button>
          </div>
        }
      >
        {selectedHubForMerchants && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Commercial Zones Pills Bar - Lists ALL specific zones! */}
            {selectedHubForMerchants.zones && selectedHubForMerchants.zones.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Filter by Specific Commercial Zone (All {selectedHubForMerchants.zones.length} Available):
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedZoneFilter('All')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedZoneFilter === 'All' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: selectedZoneFilter === 'All' ? '#eff6ff' : '#ffffff',
                      color: selectedZoneFilter === 'All' ? '#1e40af' : '#475569',
                    }}
                  >
                    All {selectedHubForMerchants.zones.length} Zones ({hubMerchants.length})
                  </button>
                  {selectedHubForMerchants.zones.map((z, idx) => {
                    const zShort = z.name.replace(/^Zone \d+:\s*/, '').split('&')[0].trim();
                    const isSelected = selectedZoneFilter === zShort || selectedZoneFilter === z.name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedZoneFilter(isSelected ? 'All' : zShort)}
                        title={z.desc}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          background: isSelected ? '#eff6ff' : '#f8fafc',
                          color: isSelected ? '#1e40af' : '#334155',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            background: isSelected ? '#2563eb' : '#94a3b8',
                            color: '#ffffff',
                            borderRadius: '50%',
                            width: 14,
                            height: 14,
                            fontSize: 9,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span>{zShort}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Search inside Hub */}
            <div style={{ position: 'relative' }}>
              <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search merchant by store name, category, or contact..."
                value={hubSearchTerm}
                onChange={(e) => setHubSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  fontSize: 12.5,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Merchants List Container */}
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
              {loadingHubMerchants ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Loading merchants for {selectedHubForMerchants.city}...</div>
                </div>
              ) : filteredModalMerchants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>No merchants found in this zone filter</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing search or selecting "All Zones".</div>
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
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Merchant Logo / Avatar & Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <img
                        src={merchant.image || EMPTY_MERCHANT_IMAGE}
                        alt={merchant.name || 'Merchant'}
                        style={{
                          width: 44,
                          height: 44,
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
                          <strong style={{ fontSize: 13.5, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>👤 {merchant.owner || merchant.owner_name || 'Owner'}</span>
                          <span>•</span>
                          <span>📍 {merchant.address || merchant.landmark || merchant.city || selectedHubForMerchants.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subscription & Contact Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {/* Subscription Plan Badge */}
                      <span
                        style={{
                          background: (merchant.plan || '').toLowerCase().includes('free') ? '#f1f5f9' : '#dcfce7',
                          color: (merchant.plan || '').toLowerCase().includes('free') ? '#475569' : '#15803d',
                          border: (merchant.plan || '').toLowerCase().includes('free') ? '1px solid #cbd5e1' : '1px solid #bbf7d0',
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '3px 7px',
                          borderRadius: 6,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {(merchant.plan || '').toLowerCase().includes('free') ? '🆓 Free Plan' : '💳 365 Days Plan'}
                      </span>

                      {/* Phone */}
                      {merchant.phone && (
                        <a
                          href={`tel:${merchant.phone}`}
                          title={`Call ${merchant.phone}`}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            background: '#f1f5f9',
                            color: '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          <HiOutlinePhone size={15} />
                        </a>
                      )}

                      {/* WhatsApp Link */}
                      {merchant.whatsapp && (
                        <a
                          href={`https://wa.me/${String(merchant.whatsapp).replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp Chat"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            background: '#dcfce7',
                            color: '#16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          <FaWhatsapp size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add City Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Kerala Municipality / Town"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={submitting} onClick={handleAddCity}>
              {submitting ? 'Saving to Database...' : 'Add Town'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Town / City Name *</label>
          <input
            className="form-input"
            placeholder="e.g., Payyanur, Calicut, Thalassery"
            value={newCity.city}
            onChange={(e) => setNewCity({ ...newCity, city: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">District (Kerala) *</label>
          <select
            className="form-select"
            value={newCity.district}
            onChange={(e) => setNewCity({ ...newCity, district: e.target.value })}
          >
            {KERALA_DISTRICTS_LIST.filter((d) => d !== 'All Districts').map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Number of Commercial Zones / Wards</label>
          <input
            type="number"
            min="1"
            className="form-input"
            value={newCity.zones}
            onChange={(e) => setNewCity({ ...newCity, zones: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={newCity.status}
            onChange={(e) => setNewCity({ ...newCity, status: e.target.value })}
          >
            <option value="active">Active (Live Rollout)</option>
            <option value="pending">Pending Rollout</option>
          </select>
        </div>
      </Modal>
    </motion.div>
  );
}
