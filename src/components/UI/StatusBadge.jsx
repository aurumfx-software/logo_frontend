import React from 'react';

const statusConfig = {
  active: 'badge-active',
  approved: 'badge-approved',
  pending: 'badge-pending',
  suspended: 'badge-suspended',
  rejected: 'badge-rejected',
  inactive: 'badge-inactive',
  info: 'badge-info',
  open: 'badge-pending',
  resolved: 'badge-active',
  'in-progress': 'badge-info',
  high: 'badge-suspended',
  medium: 'badge-pending',
  low: 'badge-active',
};

export default function StatusBadge({ status }) {
  const className = statusConfig[status?.toLowerCase()] || 'badge-inactive';
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ') : 'Unknown';

  return (
    <span className={`badge ${className}`}>
      <span className="badge-dot"></span>
      {label}
    </span>
  );
}
