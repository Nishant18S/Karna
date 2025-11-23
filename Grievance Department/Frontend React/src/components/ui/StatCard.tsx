import React from 'react';
import { Video as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'blue' | 'yellow' | 'cyan' | 'green';
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
}

const colorClasses = {
  blue: {
    border: 'border-t-blue-600',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-600',
  },
  yellow: {
    border: 'border-t-yellow-500',
    icon: 'bg-yellow-100 text-yellow-600',
    value: 'text-yellow-600',
  },
  cyan: {
    border: 'border-t-cyan-500',
    icon: 'bg-cyan-100 text-cyan-600',
    value: 'text-cyan-600',
  },
  green: {
    border: 'border-t-green-500',
    icon: 'bg-green-100 text-green-600',
    value: 'text-green-600',
  },
};

export function StatCard({ title, value, icon: Icon, color, change }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${colors.border} border-t-4 p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className={`text-4xl font-bold ${colors.value}`}>
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colors.icon} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {change && (
        <div className={`flex items-center text-sm font-medium ${
          change.type === 'positive' ? 'text-green-600' : 
          change.type === 'negative' ? 'text-red-600' : 'text-gray-500'
        }`}>
          {change.type === 'positive' && '↗'}
          {change.type === 'negative' && '↘'}
          {change.type === 'neutral' && '→'}
          <span className="ml-1">{change.value}</span>
        </div>
      )}
    </div>
  );
}