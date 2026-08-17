import React, { useState, useRef, useEffect } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useFirestoreActions } from '../../hooks/useFirestoreActions';

interface MoveToCategoryDropdownProps {
  itemId: string;
  currentCategoryName?: string;
  collectionName: 'links' | 'notes' | 'tasks' | 'temporaryNotes';
  categoryType: 'links' | 'notes' | 'tasks';
}

export const MoveToCategoryDropdown: React.FC<MoveToCategoryDropdownProps> = ({
  itemId,
  currentCategoryName = 'General',
  collectionName,
  categoryType
}) => {
  const { categories, loading } = useCategories(categoryType);
  const { update } = useFirestoreActions(collectionName);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (catName: string) => {
    setIsOpen(false);
    if (catName === currentCategoryName) return;
    try {
      await update(itemId, { 
         category: catName,
         categoryName: catName 
      });
    } catch (e) {
      console.error('Failed to move category', e);
    }
  };

  const validCategories = Array.isArray(categories) ? categories : [];
  
  return (
    <div className="relative inline-block text-left" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-primary/10 text-primary rounded truncate hover:bg-primary/20 transition-colors flex items-center gap-1"
      >
        {currentCategoryName || 'General'}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {isOpen && (
        <div className="origin-top-left absolute mt-1 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 z-20 border border-border">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {!loading && validCategories.length === 0 && (
              <span className="block px-4 py-2 text-xs text-muted">No categories</span>
            )}
            <button
               onClick={() => handleSelect('General')}
               className={`block w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors ${currentCategoryName === 'General' || !currentCategoryName ? 'text-primary font-medium bg-primary/5' : 'text-text-main'}`}
            >
               General
            </button>
            {validCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.name)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors ${currentCategoryName === cat.name ? 'text-primary font-medium bg-primary/5' : 'text-text-main'}`}
                role="menuitem"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
