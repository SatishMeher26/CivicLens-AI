import React from 'react';
import { IssueCategory } from '../../services/types';
import {
  Wrench, Droplets, Trash2, Lightbulb,
  Trees, Construction, HelpCircle, TrafficCone
} from 'lucide-react';

interface CategoryBadgeProps {
  category: IssueCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const categoryDetails: Record<IssueCategory, { label: string; icon: any; color: string }> = {
  roads_infrastructure: { label: 'Roads & Infrastructure', icon: Construction, color: 'text-amber-700 bg-amber-50' },
  drainage_flooding: { label: 'Drainage & Flooding', icon: Droplets, color: 'text-blue-700 bg-blue-50' },
  solid_waste: { label: 'Solid Waste & Sanitation', icon: Trash2, color: 'text-emerald-700 bg-emerald-50' },
  streetlighting: { label: 'Streetlighting & Power', icon: Lightbulb, color: 'text-yellow-700 bg-yellow-50' },
  water_supply: { label: 'Water Supply Pipeline', icon: Droplets, color: 'text-cyan-700 bg-cyan-50' },
  public_parks: { label: 'Public Parks & Trees', icon: Trees, color: 'text-green-700 bg-green-50' },
  traffic_signals: { label: 'Traffic & Signals', icon: TrafficCone, color: 'text-purple-700 bg-purple-50' },
  other: { label: 'General Civic Issue', icon: HelpCircle, color: 'text-slate-700 bg-slate-50' }
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, showIcon = true, size = 'md' }) => {
  const meta = categoryDetails[category] || categoryDetails.other;
  const Icon = meta.icon;

  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span className={`inline-flex items-center gap-1.5 ${pad} rounded-md font-medium ${meta.color} border border-black/5 shrink-0`}>
      {showIcon && <Icon className={iconSize} />}
      <span className="truncate">{meta.label}</span>
    </span>
  );
};
