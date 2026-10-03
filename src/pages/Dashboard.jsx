import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineSearch,
  HiOutlineCurrencyRupee,
  HiOutlineTrendingUp,
  HiOutlineClipboardCheck,
  HiOutlineExclamationCircle,
  HiOutlineSpeakerphone,
} from 'react-icons/hi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatsCard from '../components/UI/StatsCard';
import { dashboardStats, platformGrowthData, categoryDistribution, recentActivity } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import FieldStaffDashboard from './FieldStaffDashboard';
import AdminDashboard from './AdminDashboard';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'white',
          padding: '12px 16px',
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          border: '1px solid #F3F4F6',
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 6, color: '#1A1A2E' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontSize: 13 }}>
            {p.name}: {p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(dashboardStats);
  const [growthData, setGrowthData] = useState(platformGrowthData);
  const [catDistribution, setCatDistribution] = useState(categoryDistribution);
  const [activityFeed, setActivityFeed] = useState(recentActivity);

  useEffect(() => {
    async function loadLiveDashboard() {
      try {
        const liveStats = await adminService.getDashboardStats();
        if (liveStats) {
          setStats((prev) => ({
            totalUsers: liveStats.total_users || liveStats.totalUsers || prev.totalUsers,
            totalMerchants: liveStats.total_merchants || liveStats.totalMerchants || prev.totalMerchants,
            totalSearches: liveStats.total_searches || liveStats.totalSearches || prev.totalSearches,
            activeAds: liveStats.active_ads || liveStats.activeAds || prev.activeAds,
            userGrowth: liveStats.user_growth || liveStats.growth?.users_change_pct || prev.userGrowth,
            merchantGrowth: liveStats.merchant_growth || liveStats.growth?.merchants_change_pct || prev.merchantGrowth,
            searchGrowth: liveStats.search_growth || liveStats.growth?.searches_change_pct || prev.searchGrowth,
            adsGrowth: liveStats.ads_growth || prev.adsGrowth,
          }));
        }
      } catch (err) {
        console.warn('Backend live dashboard stats notice:', err);
      }

      try {
        const chartsData = await adminService.getDashboardCharts();
        if (chartsData) {
          if (Array.isArray(chartsData.growth_trends)) setGrowthData(chartsData.growth_trends);
          if (Array.isArray(chartsData.category_distribution)) setCatDistribution(chartsData.category_distribution);
        }
      } catch (chartErr) {
        console.warn('Backend live dashboard charts notice:', chartErr);
      }

      try {
        const liveActivities = await adminService.getDashboardRecentActivity();
        if (Array.isArray(liveActivities) && liveActivities.length > 0) {
          setActivityFeed(liveActivities);
        }
      } catch (actErr) {
        console.warn('Backend live recent activity notice:', actErr);
      }
    }
    loadLiveDashboard();
  }, []);

  const roleUpper = (user?.role || '').toString().toUpperCase();
  if (roleUpper === 'STAFF' || roleUpper === 'FIELD STAFF' || roleUpper === 'FIELD_STAFF') {
    return <FieldStaffDashboard />;
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          icon={<HiOutlineUsers size={22} />}
          label="Total Users"
          value={dashboardStats.totalUsers.toLocaleString()}
          trend="up"
          trendValue={dashboardStats.userGrowth}
          color="primary"
          delay={0}
        />
        <StatsCard
          icon={<HiOutlineOfficeBuilding size={22} />}
          label="Total Merchants"
          value={dashboardStats.totalMerchants.toLocaleString()}
          trend="up"
          trendValue={dashboardStats.merchantGrowth}
          color="success"
          delay={1}
        />
        <StatsCard
          icon={<HiOutlineSearch size={22} />}
          label="Total Searches"
          value={dashboardStats.totalSearches.toLocaleString()}
          trend="up"
          trendValue={dashboardStats.searchGrowth}
          color="info"
          delay={2}
        />
        <StatsCard
          icon={<HiOutlineCurrencyRupee size={22} />}
          label="Revenue (₹)"
          value={`₹${dashboardStats.totalRevenue.toLocaleString()}`}
          trend="up"
          trendValue={dashboardStats.revenueGrowth}
          color="warning"
          delay={3}
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-charts-grid" style={{ marginBottom: 28 }}>
        {/* Platform Growth */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <h3 className="card-header-title">Platform Growth</h3>
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button className="tab active">Monthly</button>
              <button className="tab">Weekly</button>
            </div>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer>
                <LineChart data={platformGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="users"
                    name="Users"
                    stroke="#6C63FF"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#6C63FF' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="merchants"
                    name="Merchants"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10B981' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <h3 className="card-header-title">Categories</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    height={60}
                    iconSize={8}
                    iconType="circle"
                    formatter={(value) => (
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="dashboard-bottom-grid">
        {/* Recent Activity */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <h3 className="card-header-title">Recent Activity</h3>
            <button className="btn btn-secondary btn-sm">View All</button>
          </div>
          <div className="card-body" style={{ padding: '12px 24px' }}>
            {recentActivity.map((item) => (
              <div key={item.id} className="activity-item">
                <div
                  className="activity-icon"
                  style={{ background: item.bgColor, color: item.color }}
                >
                  {item.type === 'registration' && <HiOutlineClipboardCheck />}
                  {item.type === 'approval' && <HiOutlineTrendingUp />}
                  {item.type === 'complaint' && <HiOutlineExclamationCircle />}
                  {item.type === 'user' && <HiOutlineUsers />}
                  {item.type === 'promotion' && <HiOutlineSpeakerphone />}
                  {item.type === 'suspension' && <HiOutlineExclamationCircle />}
                </div>
                <div className="activity-content">
                  <p
                    className="activity-text"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                  <p className="activity-time">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <h3 className="card-header-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="dashboard-quick-actions-grid">
              {[
                { icon: <HiOutlineClipboardCheck size={24} />, label: 'Pending Registrations', count: '12', color: '#6C63FF', bg: '#F0EFFF' },
                { icon: <HiOutlineExclamationCircle size={24} />, label: 'Open Complaints', count: '5', color: '#EF4444', bg: '#FEE2E2' },
                { icon: <HiOutlineOfficeBuilding size={24} />, label: 'Suspended Merchants', count: '3', color: '#F59E0B', bg: '#FEF3C7' },
                { icon: <HiOutlineSpeakerphone size={24} />, label: 'Active Promotions', count: '4', color: '#10B981', bg: '#D1FAE5' },
              ].map((action, idx) => (
                <button
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    padding: '24px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: action.bg,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span style={{ color: action.color }}>{action.icon}</span>
                  <span style={{ fontSize: 24, fontWeight: 800, color: action.color }}>{action.count}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: action.color, textAlign: 'center' }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
