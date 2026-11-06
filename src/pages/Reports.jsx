import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineDownload,
  HiOutlineDocumentReport,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineSwitchHorizontal,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineTrendingUp,
  HiOutlineGlobeAlt,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineShoppingBag,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlinePhone,
  HiX,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import PageHeader from '../components/UI/PageHeader';
import StatsCard from '../components/UI/StatsCard';
import { reportsApi } from '../api/operationsApi';

const reportTypes = [
  {
    key: 'merchants',
    label: 'Merchants Growth Report',
    icon: <HiOutlineOfficeBuilding />,
    description: 'Real monthly merchant onboarding across 14 Kerala districts (Paid vs Free)',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    key: 'users',
    label: 'User Engagement Report',
    icon: <HiOutlineUsers />,
    description: 'Active customer accounts, district reach, searches, and favorites saved',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  {
    key: 'transactions',
    label: 'Customer Leads & Direct Inquiries',
    icon: <HiOutlineSwitchHorizontal />,
    description: 'Customer searches, promotion clicks, impressions, WhatsApp chats & orders',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('merchants');
  const [chartMode, setChartMode] = useState('monthly'); // 'monthly' | 'cumulative'
  const [selectedYear, setSelectedYear] = useState('2026'); // '2026', '2025', '2024', 'all'
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sectorSearch, setSectorSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // Live Backend Data State
  const [reportData, setReportData] = useState(null);

  // ── Load Reports from GET /api/v1/admin/reports ──
  const loadReports = async (yearParam = selectedYear) => {
    setLoading(true);
    setError('');
    try {
      const isAll = yearParam === 'all' || yearParam === 0;
      const yr = isAll ? null : parseInt(yearParam);
      const data = await reportsApi.getAdminReports({
        year: yr,
        allYears: isAll,
        dateFrom: dateRange.from || undefined,
        dateTo: dateRange.to || undefined,
        sector: sectorSearch || undefined,
      });
      setReportData(data);
    } catch (err) {
      console.error('Failed to load live reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(selectedYear);
  }, [selectedYear]);

  const handleYearChange = (yr) => {
    setSelectedYear(yr);
  };

  // ── Export Real CSV from GET /api/v1/admin/reports/export ──
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const isAll = selectedYear === 'all' || selectedYear === 0;
      const yr = isAll ? null : parseInt(selectedYear);
      await reportsApi.downloadExportCsv({
        year: yr,
        allYears: isAll,
        dateFrom: dateRange.from || undefined,
        dateTo: dateRange.to || undefined,
        sector: sectorSearch || undefined,
      });
    } catch (err) {
      console.error('Export CSV error:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Extract Cards & Metrics
  const cards = reportData?.cards;
  const merchantAdditions = cards?.merchant_additions || { total: 0, paid: 0, paid_percent: 0, free: 0, free_percent: 0 };
  const activeCustomers = cards?.active_customers ?? 0;
  const customerLeads = cards?.customer_leads_and_calls ?? 0;
  const verification = cards?.verification || { approved: 0, pending: 0, rejected: 0, total: 0, rate_percent: 100, label: 'Approved' };

  // Monthly trend chart array
  const monthlyTrend = useMemo(() => {
    if (Array.isArray(reportData?.monthly_trend) && reportData.monthly_trend.length > 0) {
      return reportData.monthly_trend;
    }
    return [];
  }, [reportData]);

  // Districts array
  const districts = useMemo(() => {
    if (Array.isArray(reportData?.districts)) {
      return reportData.districts;
    }
    return [];
  }, [reportData]);

  // Business Sectors filtered by search
  const sectors = useMemo(() => {
    const list = Array.isArray(reportData?.sectors) ? reportData.sectors : [];
    if (!sectorSearch.trim()) return list;
    const q = sectorSearch.toLowerCase().trim();
    return list.filter((s) => (s.sector || '').toLowerCase().includes(q));
  }, [reportData, sectorSearch]);

  const engagement = reportData?.engagement || {};
  const leads = reportData?.leads || {};

  // Custom Interactive Tooltip
  const CustomReportTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const currentItem = payload[0]?.payload;
    if (!currentItem) return null;

    const monthLabel = currentItem.label || currentItem.month;
    const paidCount = currentItem.paid || 0;
    const freeCount = currentItem.free || 0;
    const totalCount = currentItem.total || 0;
    const cumulativeCount = currentItem.cumulative || 0;

    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(8px)',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
          border: '1px solid #e2e8f0',
          minWidth: 260,
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
          <strong style={{ fontSize: 13.5, color: '#0f172a' }}>
            📅 {monthLabel} {selectedYear === 'all' ? '(All Years)' : selectedYear}
          </strong>
          <span style={{ fontSize: 10, fontWeight: 800, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 9999 }}>
            {chartMode === 'cumulative' ? 'CUMULATIVE' : 'MONTHLY'}
          </span>
        </div>

        {chartMode === 'monthly' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Merchants Added:</span>
              <strong style={{ color: '#2563eb', fontSize: 15 }}>
                {totalCount.toLocaleString()}
              </strong>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>💳 Paid Plan:</span>
                <strong style={{ color: '#16a34a' }}>
                  {paidCount.toLocaleString()} {totalCount > 0 ? `(${Math.round((paidCount / totalCount) * 100)}%)` : ''}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>🆓 Free Tier:</span>
                <strong style={{ color: '#64748b' }}>
                  {freeCount.toLocaleString()} {totalCount > 0 ? `(${Math.round((freeCount / totalCount) * 100)}%)` : ''}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Added this Month:</span>
              <strong style={{ color: '#2563eb' }}>+{totalCount.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '6px 10px', borderRadius: 8 }}>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>Cumulative Total:</span>
              <strong style={{ color: '#1e40af', fontSize: 15 }}>{cumulativeCount.toLocaleString()}</strong>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: 60 }}>
      {/* Top Header */}
      <PageHeader
        title="Admin Reports & Analytics"
        subtitle="Live platform data: merchant additions (paid vs free), user engagement, leads & Kerala district rollout"
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            disabled={loading}
            onClick={() => loadReports(selectedYear)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineRefresh className={loading ? 'animate-spin' : ''} />
            <span>Refresh Live Data</span>
          </button>
          <button
            className="btn btn-primary"
            disabled={exporting || loading}
            onClick={handleExportCsv}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <HiOutlineDownload />
            <span>{exporting ? 'Exporting...' : `Export Real CSV (${selectedYear === 'all' ? 'All' : selectedYear})`}</span>
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
      {/* 1. TOP REPORT CARDS                                           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Card 1: Merchant Additions, Paid / Free */}
        <div>
          <StatsCard
            icon={<HiOutlineOfficeBuilding size={22} />}
            label={selectedYear === 'all' ? 'All-Time Merchant Additions' : `${selectedYear} Merchant Additions`}
            value={merchantAdditions.total.toLocaleString()}
            color="primary"
            delay={0}
          />
          <div
            style={{
              marginTop: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              💳 Paid: {merchantAdditions.paid.toLocaleString()} ({merchantAdditions.paid_percent}%)
            </span>
            <span style={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              🆓 Free: {merchantAdditions.free.toLocaleString()} ({merchantAdditions.free_percent}%)
            </span>
          </div>
        </div>

        {/* Card 2: Active Customer Accounts */}
        <StatsCard
          icon={<HiOutlineUsers size={22} />}
          label="Active Customer Accounts"
          value={activeCustomers.toLocaleString()}
          color="success"
          delay={1}
        />

        {/* Card 3: Customer Leads & Calls */}
        <StatsCard
          icon={<HiOutlineSwitchHorizontal size={22} />}
          label="Customer Leads & Calls"
          value={customerLeads.toLocaleString()}
          color="warning"
          delay={2}
        />

        {/* Card 4: Verification Rate */}
        <div>
          <StatsCard
            icon={<HiOutlineCheckCircle size={22} />}
            label="Verification Rate"
            value={`${verification.rate_percent}% ${verification.label || 'Approved'}`}
            color="info"
            delay={3}
          />
          <div
            style={{
              marginTop: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ color: '#15803d', fontWeight: 700 }}>
              ✓ Approved: {verification.approved}
            </span>
            <span style={{ color: '#b45309', fontWeight: 600 }}>
              ⏳ Pending: {verification.pending}
            </span>
            {verification.rejected > 0 && (
              <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                ✕ Rejected: {verification.rejected}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 2. THREE REPORT CARDS SWITCHER                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {reportTypes.map((r) => {
          const isSelected = selectedReport === r.key;
          return (
            <motion.button
              key={r.key}
              type="button"
              onClick={() => setSelectedReport(r.key)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: 18,
                borderRadius: 'var(--radius-lg, 12px)',
                background: isSelected ? r.bg : '#ffffff',
                border: isSelected ? `2px solid ${r.color}` : '1.5px solid var(--border-light, #e2e8f0)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: r.bg,
                  color: r.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                  border: `1px solid ${r.color}33`,
                }}
              >
                {r.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text, #0f172a)' }}>
                  {r.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary, #64748b)', lineHeight: 1.4 }}>
                  {r.description}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 3. DATE & YEAR FILTER TOOLBAR                                 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Year Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>📅 Year:</span>
                <select
                  className="form-input"
                  style={{ width: 'auto', fontSize: 13, fontWeight: 700, padding: '6px 12px', background: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                >
                  <option value="2026">2026 (Current Year)</option>
                  <option value="2025">2025 (Full Year)</option>
                  <option value="2024">2024 (Launch Year)</option>
                  <option value="all">All Years Combined</option>
                </select>
              </div>

              {/* Date Range Picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>Range:</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', fontSize: 13 }}
                  value={dateRange.from}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
                />
                <span style={{ color: 'var(--text-light, #94a3b8)', fontSize: 12 }}>to</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', fontSize: 13 }}
                  value={dateRange.to}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => loadReports(selectedYear)}
                  disabled={loading}
                >
                  Apply
                </button>
                {(dateRange.from || dateRange.to) && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setDateRange({ from: '', to: '' });
                      loadReports(selectedYear);
                    }}
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            </div>

            {/* Quick Year Pill Selectors */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { key: '2026', label: '2026' },
                { key: '2025', label: '2025' },
                { key: '2024', label: '2024' },
                { key: 'all', label: 'All Years' },
              ].map((y) => (
                <button
                  key={y.key}
                  type="button"
                  className={`btn btn-sm ${selectedYear === y.key ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '5px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleYearChange(y.key)}
                >
                  {y.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 4. MAIN CONTENT BY REPORT TAB                                 */}
      {/* ═════════════════════════════════════════════════════════════ */}

      {/* ── TAB 1: MERCHANTS GROWTH REPORT ── */}
      {selectedReport === 'merchants' && (
        <>
          {/* 12-Month Performance Trend Chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="card-header-title">
                  <HiOutlineDocumentReport style={{ marginRight: 8, color: 'var(--primary, #2563eb)' }} />
                  12-Month Merchant Growth: {selectedYear === 'all' ? 'All Years Combined' : `Year ${selectedYear}`}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-light, #94a3b8)', marginTop: 2 }}>
                  Live merchant onboarding data from database. Paid subscriptions vs free listings.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Mode Switcher: Monthly Additions vs Cumulative */}
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
                  <button
                    type="button"
                    onClick={() => setChartMode('monthly')}
                    style={{
                      border: 'none',
                      background: chartMode === 'monthly' ? '#ffffff' : 'transparent',
                      color: chartMode === 'monthly' ? '#2563eb' : '#64748b',
                      fontWeight: chartMode === 'monthly' ? 700 : 500,
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      boxShadow: chartMode === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Monthly Additions
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('cumulative')}
                    style={{
                      border: 'none',
                      background: chartMode === 'cumulative' ? '#ffffff' : 'transparent',
                      color: chartMode === 'cumulative' ? '#2563eb' : '#64748b',
                      fontWeight: chartMode === 'cumulative' ? 700 : 500,
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      boxShadow: chartMode === 'cumulative' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    Cumulative Total ({merchantAdditions.total.toLocaleString()})
                  </button>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '4px 10px',
                    borderRadius: 9999,
                    background: '#eff6ff',
                    color: '#2563eb',
                  }}
                >
                  {selectedYear === 'all' ? 'ALL YEARS' : `YEAR ${selectedYear}`}
                </span>
              </div>
            </div>

            <div className="card-body">
              {/* Formula banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 16px',
                  marginBottom: 16,
                  fontSize: 12,
                  color: '#334155',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#2563eb' }}>
                    {chartMode === 'monthly' ? '📊 Monthly Breakdown:' : '📐 Cumulative Growth:'}
                  </span>
                  <span>
                    {chartMode === 'monthly'
                      ? 'Displaying monthly merchant enrollments across Kerala'
                      : 'Progressive cumulative total of enrolled merchants over time'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dcfce7', padding: '4px 10px', borderRadius: 6, color: '#15803d', fontWeight: 700, fontSize: 11.5 }}>
                    <span>💳 Paid:</span>
                    <span>{merchantAdditions.paid.toLocaleString()} ({merchantAdditions.paid_percent}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: '4px 10px', borderRadius: 6, color: '#475569', fontWeight: 700, fontSize: 11.5 }}>
                    <span>🆓 Free:</span>
                    <span>{merchantAdditions.free.toLocaleString()} ({merchantAdditions.free_percent}%)</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="chart-container" style={{ height: 350 }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                    <HiOutlineRefresh className="animate-spin" style={{ fontSize: 28, marginRight: 8 }} />
                    <span>Loading trend data...</span>
                  </div>
                ) : monthlyTrend.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                    No trend data available for selected filter.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="label" stroke="#64748B" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                      <Tooltip content={<CustomReportTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                      <Legend />
                      {chartMode === 'monthly' ? (
                        <>
                          <Bar
                            dataKey="paid"
                            name="Paid Subscriptions"
                            fill="#2563eb"
                            stackId="planStack"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="free"
                            name="Free Listings"
                            fill="#93c5fd"
                            stackId="planStack"
                            radius={[6, 6, 0, 0]}
                          />
                        </>
                      ) : (
                        <Bar
                          dataKey="cumulative"
                          name={`Cumulative Merchant Total (${selectedYear === 'all' ? 'All Years' : selectedYear})`}
                          fill="#2563eb"
                          radius={[6, 6, 0, 0]}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* District Merchant Distribution & Top Business Sectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Useful Section 1: District Merchant Performance */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="card-header-title">
                  <HiOutlineGlobeAlt style={{ marginRight: 8, color: '#2563eb' }} />
                  Kerala District Merchant Distribution
                </h3>
                <span className="badge badge-info" style={{ fontSize: 11 }}>
                  {districts.length} Districts
                </span>
              </div>
              <div className="card-body" style={{ maxHeight: 380, overflowY: 'auto' }}>
                {districts.length === 0 ? (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8' }}>
                    No district distribution data available.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {districts.map((d, idx) => {
                      const pct = d.percent !== undefined ? d.percent : 0;
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                            <strong style={{ color: 'var(--text, #0f172a)' }}>{d.district}</strong>
                            <span style={{ color: 'var(--text-light, #64748b)', fontWeight: 600 }}>
                              {d.merchants.toLocaleString()} merchants ({pct}%)
                            </span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, Math.max(2, pct))}%`,
                                background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                                borderRadius: 9999,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Useful Section 2: Top Business Sectors in Kerala */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                className="card-header"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
              >
                <div>
                  <h3 className="card-header-title">
                    <HiOutlineTrendingUp style={{ marginRight: 8, color: '#10b981' }} />
                    Top Business Sectors in Kerala
                  </h3>
                  <p style={{ fontSize: 11.5, color: 'var(--text-light, #64748b)', marginTop: 2 }}>
                    {sectors.length} categories found
                  </p>
                </div>

                {/* Instant Sector Search Box */}
                <div style={{ position: 'relative', width: 180 }}>
                  <HiOutlineSearch
                    size={14}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    placeholder="Filter sectors..."
                    value={sectorSearch}
                    onChange={(e) => setSectorSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 26px 6px 30px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                      outline: 'none',
                      background: '#f8fafc',
                    }}
                  />
                  {sectorSearch && (
                    <button
                      type="button"
                      onClick={() => setSectorSearch('')}
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
              </div>

              <div
                className="card-body"
                style={{
                  maxHeight: 320,
                  overflowY: 'auto',
                  padding: '12px 18px',
                }}
              >
                {sectors.length === 0 ? (
                  <div style={{ padding: '36px 12px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    No business sector found matching "{sectorSearch}".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sectors.map((sec, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 14px',
                          borderRadius: 10,
                          background: '#f8fafc',
                          border: '1px solid #f1f5f9',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{sec.sector}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {sec.percent}% of registered network
                          </div>
                        </div>

                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#1e40af',
                            fontWeight: 700,
                            fontSize: 12,
                            padding: '3px 10px',
                            borderRadius: 6,
                            whiteSpace: 'nowrap',
                            border: '1px solid #dbeafe',
                          }}
                        >
                          {sec.shops.toLocaleString()} shops
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: USER ENGAGEMENT REPORT ── */}
      {selectedReport === 'users' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-header-title">
              <HiOutlineUsers style={{ marginRight: 8, color: '#10B981' }} />
              User Engagement & Activity Report
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-light, #94a3b8)', marginTop: 2 }}>
              Customer accounts, district reach, merchant searches, and saved favorites across Kerala
            </p>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#059669', marginBottom: 6 }}>
                  <HiOutlineUsers size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Active Customers</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {(engagement.active_customers ?? activeCustomers).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Registered customer accounts</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', marginBottom: 6 }}>
                  <HiOutlineGlobeAlt size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Districts Reached</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {engagement.districts_reached ?? 14} <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>/ 14</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Kerala districts with active customers</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#d97706', marginBottom: 6 }}>
                  <HiOutlineSearch size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Customer Searches</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {(engagement.searches ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Store & product discovery queries</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e11d48', marginBottom: 6 }}>
                  <HiOutlineHeart size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Saved Favorites</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {(engagement.favorites ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Merchants bookmarked by users</div>
              </div>
            </div>

            {/* Engagement callout banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                color: '#ffffff',
                padding: '20px 24px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Kerala Customer Reach Velocity</h4>
                <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
                  Customers actively save preferred local stores, track QR cashback promotions, and initiate WhatsApp orders without middleman commission.
                </p>
              </div>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                100% Hyperlocal
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: CUSTOMER LEADS & CALLS REPORT ── */}
      {selectedReport === 'transactions' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-header-title">
              <HiOutlineSwitchHorizontal style={{ marginRight: 8, color: '#F59E0B' }} />
              Customer Leads & Direct Merchant Inquiries
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-light, #94a3b8)', marginTop: 2 }}>
              Detailed breakdown of customer discovery, promotional impressions, WhatsApp direct chats, and orders
            </p>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b45309', marginBottom: 6 }}>
                  <HiOutlinePhone size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Direct Calls & Leads</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {(leads.customer_leads_and_calls ?? customerLeads).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Total customer-to-merchant inquiries</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#2563eb', marginBottom: 6 }}>
                  <HiOutlineEye size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Promo Impressions</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {(leads.promotion_impressions ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Banner views on mobile app</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#16a34a', marginBottom: 6 }}>
                  <FaWhatsapp size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>WhatsApp Merchants</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {(leads.whatsapp_merchants ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Stores reachable via direct WhatsApp</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '18px 20px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7c3aed', marginBottom: 6 }}>
                  <HiOutlineShoppingBag size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Product Orders</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>
                  {(leads.product_orders ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Direct marketplace order requests</div>
              </div>
            </div>

            {/* Zero commission highlight */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
                color: '#ffffff',
                padding: '20px 24px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  0% Commission Direct Customer Deals
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
                  Stores connected through the Logo Directory keep 100% of deal value with direct WhatsApp and phone orders.
                </p>
              </div>
              <span
                style={{
                  background: '#10B981',
                  color: '#ffffff',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Zero Intermediary Cut
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
