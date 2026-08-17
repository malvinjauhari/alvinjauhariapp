import React from 'react';
import { Search } from 'lucide-react';

interface ContentHeaderProps {
  title: string;
  subtitle: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onAddClick?: () => void;
  addLabel?: string;
  actions?: React.ReactNode;
}

export const ContentHeader: React.FC<ContentHeaderProps> = ({ 
  title, 
  subtitle, 
  searchQuery, 
  onSearchChange,
  onAddClick,
  addLabel = 'Add New',
  actions
}) => {
  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted mt-1">{subtitle}</p>
      </div>
      {(actions || onSearchChange || onAddClick) && (
        <div className="flex items-center gap-3 w-full md:w-auto">
          {actions}
          {onSearchChange && (
            <div className="relative flex-1 md:w-64">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder={`Search ${title.toLowerCase()}...`} 
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="premium-input pl-10 pr-4 py-2 text-sm w-full" 
              />
            </div>
          )}
          {onAddClick && (
            <button 
              onClick={onAddClick}
              className="premium-btn premium-btn-primary px-5 py-2.5 text-sm whitespace-nowrap shadow-[0_0_15px_rgba(142,162,255,0.2)]"
            >
              {addLabel}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
