import React, { useState } from 'react';
import { useUserCollection } from '../../../hooks/useUserCollection';
import { useFirestoreActions } from '../../../hooks/useFirestoreActions';
import { useCategories } from '../../../hooks/useCategories';
import { LinkItem } from '../../../types';
import { ExternalLink, Trash2, Edit2, CheckSquare, X } from 'lucide-react';
import { ContentHeader } from '../../../components/layout/ContentHeader';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { CategorySelector } from '../../../components/ui/CategorySelector';
import { AddCategoryModal } from '../../../components/ui/AddCategoryModal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatItemDate } from '../../../utils/formatDate';

import { MoveToCategoryDropdown } from '../../../components/ui/MoveToCategoryDropdown';

export const LinksPage = () => {
  const { data: links, loading } = useUserCollection<LinkItem>('links');
  const { add, update, remove, removeMany } = useFirestoreActions('links');
  const { categories } = useCategories('links');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCat, setSelectedFilterCat] = useState<string>('All');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');

  // Generate unique categories for the filter
  const allCategories = ['All', 'General', ...categories.map(c => c.name)];
  const uniqueCategories = Array.from(new Set(allCategories));

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      link.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedFilterCat === 'All' || (link.category || 'General') === selectedFilterCat;
    
    return matchesSearch && matchesCategory;
  });

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await remove(itemToDelete);
    } catch (e) {
      console.error('Failed to delete link', e);
    } finally {
      setItemToDelete(null);
    }
  };

  const promptDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setItemToDelete(id);
  };

  const handleBulkDelete = async () => {
    try {
      await removeMany(selectedIds);
      setSelectedIds([]);
      setIsSelectMode(false);
    } catch (e) {
      console.error('Failed to delete multiple links', e);
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const toggleSelection = (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (catLinks: LinkItem[]) => {
    const allIds = catLinks.map(l => l.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleOpenCreate = () => {
    setEditingLink(null);
    setUrl('');
    setTitle('');
    setDescription('');
    setCategory('General');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, link: LinkItem) => {
    e.preventDefault();
    setEditingLink(link);
    setUrl(link.url);
    setTitle(link.title || '');
    setDescription(link.description || '');
    setCategory(link.category || 'General');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    try {
      const payload = {
        url: url.trim(),
        title: title.trim() || url.trim(),
        description: description.trim(),
        category: category.trim() || 'General'
      };

      if (editingLink) {
        await update(editingLink.id, payload);
      } else {
        await add({ ...payload, source: 'manual' });
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error('Failed to save link', e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-28 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <ContentHeader 
          title="Links" 
          subtitle="Saved resources and references."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={handleOpenCreate}
          addLabel="Add Link"
          actions={
            <button
              onClick={() => {
                 setIsSelectMode(!isSelectMode);
                 setSelectedIds([]);
              }}
              className={`p-2 rounded-lg transition-colors border ${isSelectMode ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-card/80 hover:text-text-main text-muted'}`}
              title={isSelectMode ? 'Cancel Selection' : 'Select Links'}
            >
              {isSelectMode ? <X size={18} /> : <CheckSquare size={18} />}
            </button>
          }
        />

        {/* Category Filters */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between overflow-x-auto pb-4 mb-4 scrollbar-hide">
          <div className="flex gap-2 items-center flex-1">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFilterCat(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-180 border ${
                  selectedFilterCat === cat 
                    ? 'bg-[var(--primary-soft)] text-white border-[rgba(142,162,255,0.22)] shadow-[0_0_12px_rgba(142,162,255,0.05)]' 
                    : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-muted hover:bg-[rgba(255,255,255,0.05)] hover:text-text-main'
                }`}
              >
                {cat}
              </button>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="premium-btn premium-btn-secondary px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-1"
            >
              + Add
            </button>
          </div>
        </div>

        {isSelectMode && (
          <div className="flex justify-between items-center mb-6 h-12 premium-card rounded-xl px-4 animate-fade-up">
            <div className="text-sm font-medium text-text-main px-2">Select items to bulk delete</div>
            <div className="flex items-center gap-2 ml-auto">
              {selectedIds.length > 0 && (
                <button 
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="px-4 py-2 bg-red-500/20 text-red-500 rounded-xl text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm border border-red-500/30"
                >
                  <Trash2 size={16} /> Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="premium-card p-4 border border-transparent flex flex-col gap-3 group">
                <div className="flex justify-between items-start gap-4 mb-1">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Skeleton className="w-5 h-5 rounded-md" />
                  <Skeleton className="h-4 w-40" />
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/30">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted border border-dashed border-border/50 rounded-2xl bg-[rgba(20,24,32,0.2)] animate-fade-up">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-muted/30"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            <h3 className="text-base text-text-main font-medium mb-1">{searchQuery || selectedFilterCat !== 'All' ? 'No links matched your filters' : 'No links saved yet'}</h3>
            <p className="text-sm text-center max-w-xs">{searchQuery ? 'Try adjusting your search query or category filter.' : 'Save useful resources, articles, and references here.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {uniqueCategories.map(cat => {
              const catLinks = filteredLinks.filter(l => (l.category || 'General') === cat);
              if (catLinks.length === 0) return null;
              
              return (
                <div key={cat} className="flex flex-col gap-4 animate-fade-up">
                  <div className="flex items-center gap-3 pb-2 pt-2">
                    {isSelectMode && (
                      <input 
                        type="checkbox" 
                        onChange={() => toggleSelectAll(catLinks)}
                        checked={catLinks.length > 0 && catLinks.every(l => selectedIds.includes(l.id))}
                        className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary shrink-0 animate-in fade-in zoom-in-75"
                      />
                    )}
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="w-1.5 h-4 rounded-full bg-primary/50" />
                      {cat}
                      <span className="text-xs font-medium text-muted bg-[rgba(255,255,255,0.02)] px-2 py-0.5 rounded-full inline-block shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] border-white/5 border">
                        {catLinks.length}
                      </span>
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    {catLinks.map((link, i) => (
                      <div key={link.id} className="flex items-center gap-3">
                        {isSelectMode && (
                          <input 
                            type="checkbox"
                            checked={selectedIds.includes(link.id)}
                            onChange={(e) => toggleSelection(e, link.id)}
                            className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary shrink-0 ml-1 animate-in fade-in zoom-in-75"
                          />
                        )}
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className={`flex-1 flex flex-col sm:flex-row sm:items-center gap-3 p-4 premium-card transition-all group relative hover:-translate-y-0.5 ${selectedIds.includes(link.id) ? '!border-[var(--primary)] !bg-[var(--primary-soft)]' : ''}`}
                        >
                        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                          <h3 className="font-medium text-text-main line-clamp-1 group-hover:text-primary transition-colors pr-8">{link.title || link.url}</h3>
                          {link.description && <p className="text-sm text-muted/80 line-clamp-2 leading-relaxed">{link.description}</p>}
                          <span className="text-[11px] font-medium text-muted/60 mt-1 uppercase tracking-wider flex items-center gap-2">
                             {formatItemDate(link.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted sm:ml-4 shrink-0 sm:justify-end">
                          <MoveToCategoryDropdown itemId={link.id} currentCategoryName={link.category} collectionName="links" categoryType="links" />
                          <div className="flex gap-1 text-muted bg-[rgba(0,0,0,0.2)] rounded-lg p-1 opacity-100 sm:opacity-0 sm:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                            <button 
                              onClick={(e) => handleOpenEdit(e, link)}
                              className="hover:text-primary transition-all p-1.5 hover:bg-white/5 rounded-md"
                              aria-label="Edit link"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button 
                              onClick={(e) => promptDelete(e, link.id)}
                              className="hover:text-red-400 transition-all p-1.5 hover:bg-white/5 rounded-md"
                              aria-label="Delete link"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="p-2 sm:absolute sm:top-3 sm:right-3 text-muted/30 group-hover:text-primary/70 transition-colors"><ExternalLink size={18} /></div>
                        </div>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLink ? 'Edit Link' : 'Add Link'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL <span className="text-red-500">*</span></label>
            <input 
              autoFocus
              required
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-text-main"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-text-main"
              placeholder="Custom title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary border focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[60px] text-text-main"
              placeholder="A short note about this link..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <CategorySelector type="links" value={category} onChange={setCategory} />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted hover:text-text-main transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
              {editingLink ? 'Save Changes' : 'Save Link'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Link"
        message="Are you sure you want to delete this link? This action cannot be undone."
      />

      <ConfirmDeleteModal 
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Links"
        message={`Are you sure you want to delete ${selectedIds.length} links? This action cannot be undone.`}
      />

      <AddCategoryModal 
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        type="links"
      />
    </div>
  );
};

