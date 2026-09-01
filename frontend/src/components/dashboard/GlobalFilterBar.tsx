import React from 'react';
import type { 
  GlobalFilterState, 
  DateRangeOption, 
  RegionOption, 
  CategoryOption 
} from '@/types/dashboard';
import { Button } from '@/components/ui/Button';
import { SlidersHorizontal, RotateCcw, Calendar, Globe, Tag } from 'lucide-react';

interface GlobalFilterBarProps {
  filters: GlobalFilterState;
  onUpdateFilters: (newFilters: Partial<GlobalFilterState>) => void;
  onResetFilters: () => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters
}) => {
  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      {/* Filters Group */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 pr-2 border-r border-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span>Global Filters:</span>
        </div>

        {/* 1. Date Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
          <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <select
            value={filters.dateRange}
            onChange={(e) => onUpdateFilters({ dateRange: e.target.value as DateRangeOption })}
            className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer text-slate-100"
          >
            <option value="7d" className="bg-slate-900">Last 7 Days</option>
            <option value="30d" className="bg-slate-900">Last 30 Days</option>
            <option value="3m" className="bg-slate-900">Last 3 Months</option>
            <option value="6m" className="bg-slate-900">Last 6 Months</option>
            <option value="1y" className="bg-slate-900">Last Year</option>
            <option value="custom" className="bg-slate-900">Custom Range</option>
          </select>
        </div>

        {/* 2. Region Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
          <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <select
            value={filters.region}
            onChange={(e) => onUpdateFilters({ region: e.target.value as RegionOption })}
            className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer text-slate-100"
          >
            <option value="all" className="bg-slate-900">All Regions</option>
            <option value="north" className="bg-slate-900">North America</option>
            <option value="south" className="bg-slate-900">South Region</option>
            <option value="east" className="bg-slate-900">East Region</option>
            <option value="west" className="bg-slate-900">West Region</option>
          </select>
        </div>

        {/* 3. Category Selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
          <Tag className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <select
            value={filters.category}
            onChange={(e) => onUpdateFilters({ category: e.target.value as CategoryOption })}
            className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer text-slate-100"
          >
            <option value="all" className="bg-slate-900">All Categories</option>
            <option value="electronics" className="bg-slate-900">Electronics</option>
            <option value="clothing" className="bg-slate-900">Clothing</option>
            <option value="home" className="bg-slate-900">Home & Living</option>
            <option value="accessories" className="bg-slate-900">Accessories</option>
          </select>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onResetFilters}
        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-400" />}
        className="text-xs text-slate-400 hover:text-cyan-400 font-semibold"
      >
        Reset Filters
      </Button>
    </div>
  );
};
