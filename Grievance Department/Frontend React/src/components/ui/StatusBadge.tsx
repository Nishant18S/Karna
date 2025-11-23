import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'priority';
  size?: 'sm' | 'md';
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'in-progress': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

export function StatusBadge({ status, type = 'status', size = 'md' }: StatusBadgeProps) {
  const colors = type === 'status' ? statusColors : priorityColors;
  const colorClass = colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass} rounded-full border font-semibold uppercase tracking-wide ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
      {status.replace('-', ' ')}
    </span>
  );
}