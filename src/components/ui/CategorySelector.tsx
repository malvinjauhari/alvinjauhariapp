import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { Plus } from 'lucide-react';

interface CategorySelectorProps {
  type: 'links' | 'notes' | 'tasks';
  value: string;
  onChange: (val: string) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ type, value, onChange }) => {
  const { categories, createCategory } = useCategories(type);
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleCreate = async () => {
    if (!newCatName.trim()) return;
    await createCategory(newCatName, type);
    onChange(newCatName.trim());
    setIsCreating(false);
    setNewCatName('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange('General')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-180 border ${
            value === 'General' ? 'bg-[var(--primary-soft)] text-white border-[rgba(142,162,255,0.22)] shadow-[0_0_12px_rgba(142,162,255,0.05)]' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-muted hover:bg-[rgba(255,255,255,0.05)]'
          }`}
        >
          General
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.name)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-180 border ${
              value === c.name ? 'bg-[var(--primary-soft)] text-white border-[rgba(142,162,255,0.22)] shadow-[0_0_12px_rgba(142,162,255,0.05)]' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-muted hover:bg-[rgba(255,255,255,0.05)]'
            }`}
          >
            {c.name}
          </button>
        ))}
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border border-dashed border-border text-muted hover:border-primary hover:text-primary"
          >
            <Plus size={12} /> New
          </button>
        )}
      </div>
      {isCreating && (
        <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-top-1">
          <input
            type="text"
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Category name..."
            className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
          />
          <button type="button" onClick={handleCreate} className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg">Add</button>
          <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 bg-transparent text-muted text-xs font-medium rounded-lg hover:text-text-main">Cancel</button>
        </div>
      )}
    </div>
  );
};
