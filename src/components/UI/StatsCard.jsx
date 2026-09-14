import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ icon, label, value, trend, trendValue, color, delay = 0 }) {
  const colorMap = {
    primary: { bg: '#F0EFFF', text: '#6C63FF' },
    success: { bg: '#D1FAE5', text: '#10B981' },
    warning: { bg: '#FEF3C7', text: '#F59E0B' },
    danger: { bg: '#FEE2E2', text: '#EF4444' },
    info: { bg: '#DBEAFE', text: '#3B82F6' },
    secondary: { bg: '#FFE8E8', text: '#FF6B6B' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
    >
      <div
        className="stat-card-icon"
        style={{ background: c.bg, color: c.text }}
      >
        {icon}
      </div>
      <div className="stat-card-info">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {trendValue && (
          <div className={`stat-card-trend ${trend}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </div>
    </motion.div>
  );
}
