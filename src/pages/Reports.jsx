import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineDownload,
  HiOutlineDocumentReport,
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import PageHeader from '../components/UI/PageHeader';

const reportTypes = [
  {
    key: 'merchants',
    label: 'Merchants Report',
    icon: <HiOutlineOfficeBuilding />,
    description: 'Export all merchant data including registrations, status, and performance',
    color: '#6C63FF',
    bg: '#F0EFFF',
  },
  {
    key: 'users',
    label: 'Users Report',
    icon: <HiOutlineUsers />,
    description: 'Export user accounts, activity data, and engagement metrics',
    color: '#10B981',
    bg: '#D1FAE5',
  },
  {
    key: 'transactions',
    label: 'Transactions Report',
    icon: <HiOutlineSwitchHorizontal />,
    description: 'Export all interactions, searches, and transaction logs',
    color: '#F59E0B',
    bg: '#FEF3C7',
  },
];

const monthlyData = [
  { month: 'Jan', merchants: 120, users: 850, transactions: 4500 },
  { month: 'Feb', merchants: 145, users: 1020, transactions: 5200 },
  { month: 'Mar', merchants: 168, users: 1180, transactions: 6100 },
  { month: 'Apr', merchants: 190, users: 1350, transactions: 7000 },
  { month: 'May', merchants: 210, users: 1500, transactions: 7800 },
  { month: 'Jun', merchants: 235, users: 1680, transactions: 8500 },
  { month: 'Jul', merchants: 260, users: 1850, transactions: 9200 },
  { month: 'Aug', merchants: 290, users: 2050, transactions: 10100 },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('merchants');
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: '2024-09-14' });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="Reports"
        subtitle="Export reports of merchants, users, and transactions"
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline">
            <HiOutlineDownload /> Export CSV
          </button>
          <button className="btn btn-primary">
            <HiOutlineDownload /> Export Excel
          </button>
        </div>
      </PageHeader>

      {/* Report Type Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {reportTypes.map((r) => (
          <motion.button
            key={r.key}
            onClick={() => setSelectedReport(r.key)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: 20,
              borderRadius: 'var(--radius-lg)',
              background: selectedReport === r.key ? r.bg : 'white',
              border: selectedReport === r.key ? `2px solid ${r.color}` : '2px solid var(--border-light)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: r.bg,
                color: r.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {r.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>
                {r.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {r.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Date Range */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Date Range:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
            />
            <span style={{ color: 'var(--text-light)' }}>to</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto' }}
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
            />
            <button className="btn btn-secondary btn-sm">Apply</button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-header-title">
            <HiOutlineDocumentReport style={{ marginRight: 8, color: 'var(--primary)' }} />
            {reportTypes.find((r) => r.key === selectedReport)?.label} — Monthly Overview
          </h3>
        </div>
        <div className="card-body">
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #F3F4F6',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar
                  dataKey={selectedReport}
                  fill={reportTypes.find((r) => r.key === selectedReport)?.color}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
