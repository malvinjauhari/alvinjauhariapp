import React, { useState } from 'react';
import { useUserCollection } from '../../../hooks/useUserCollection';
import { useFirestoreActions } from '../../../hooks/useFirestoreActions';
import { useCategories } from '../../../hooks/useCategories';
import { NoteItem } from '../../../types';
import { Trash2, Edit2, CheckSquare, X, FileText } from 'lucide-react';
import { ContentHeader } from '../../../components/layout/ContentHeader';
import { FullPageEditor } from '../../../components/ui/FullPageEditor';
import { formatItemDate } from '../../../utils/formatDate';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { AddCategoryModal } from '../../../components/ui/AddCategoryModal';
import { Skeleton } from '../../../components/ui/Skeleton';

import { MoveToCategoryDropdown } from '../../../components/ui/MoveToCategoryDropdown';
import { stripHtml } from '../../../utils/stripHtml';

export const NotesPage = () => {
  const { data: notes, loading } = useUserCollection<NoteItem>('notes');
  const { add, update, remove, removeMany } = useFirestoreActions('notes');
  const { categories } = useCategories('notes');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCat, setSelectedFilterCat] = useState<string>('All');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');

  // Generate unique categories for the filter
  const allCategories = ['All', 'General', ...categories.map(c => c.name)];
  const uniqueCategories = Array.from(new Set(allCategories));

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      note.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (note as any).category?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const noteCat = (note as any).category || 'General';
    const matchesCategory = selectedFilterCat === 'All' || noteCat === selectedFilterCat;
    
    return matchesSearch && matchesCategory;
  });

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await remove(itemToDelete);
    } catch (e) {
      console.error('Failed to delete note', e);
    } finally {
      setItemToDelete(null);
    }
  };

  const promptDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItemToDelete(id);
  };

  const handleBulkDelete = async () => {
    try {
      await removeMany(selectedIds);
      setSelectedIds([]);
    } catch (e) {
      console.error('Failed to bulk delete notes', e);
    } finally {
      setIsBulkDeleteModalOpen(false);
    }
  };

  const toggleSelection = (e: React.MouseEvent | React.ChangeEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const allIds = filteredNotes.map(n => n.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleOpenCreate = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setIsEditing(true);
  };

  const handleOpenEdit = (note: NoteItem) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setCategory((note as any).category || 'General');
    setIsEditing(true);
  };

  const handleSave = async (payload: { title: string; content: string; category: string }) => {
    if (!payload.title.trim() && !payload.content.trim()) return;
    
    try {
      if (editingNote) {
        await update(editingNote.id, payload);
        setEditingNote(prev => prev ? { ...prev, ...payload } : null);
      } else {
        const docRef = await add({ ...payload, source: 'manual' });
        setEditingNote({ id: docRef.id, ...payload, createdAt: new Date() } as any);
      }
    } catch (e) {
      console.error('Failed to save note', e);
      throw e;
    }
  };

  if (isEditing) {
    return (
      <FullPageEditor
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        category={category}
        setCategory={setCategory}
        categoryType="notes"
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-28 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <ContentHeader 
          title="Notes" 
          subtitle="Structured thoughts and ideas."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={handleOpenCreate}
          addLabel="New Note"
          actions={
            <button
              onClick={() => {
                 setIsSelectMode(!isSelectMode);
                 setSelectedIds([]);
              }}
              className={`p-2 rounded-lg transition-colors border ${isSelectMode ? 'bg-primary text-white border-primary' : 'bg-card border-border hover:bg-card/80 hover:text-text-main text-muted'}`}
              title={isSelectMode ? 'Cancel Selection' : 'Select Notes'}
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
            {filteredNotes.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-main">
                <input 
                  type="checkbox"
                  checked={filteredNotes.length > 0 && filteredNotes.every(n => selectedIds.includes(n.id))}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary !cursor-pointer accent-primary"
                />
                Select All
              </label>
            )}
            
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
              <div key={i} className="premium-card p-5 border border-transparent flex flex-col gap-3 min-h-[160px]">
                <div className="flex justify-between items-start gap-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex justify-between items-center pt-2 mt-auto">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted border border-dashed border-border/50 rounded-2xl bg-[rgba(20,24,32,0.2)] animate-fade-up">
            <FileText size={40} className="mb-4 text-muted/30" />
            <h3 className="text-base text-text-main font-medium mb-1">{searchQuery || selectedFilterCat !== 'All' ? 'No notes matched your filters' : 'No notes saved yet'}</h3>
            <p className="text-sm text-center max-w-xs">{searchQuery ? 'Try adjusting your search query or category filter.' : "Use the AI chatbot on the dashboard to quickly capture a thought, or create one manually."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note, i) => (
              <div 
                key={note.id} 
                onClick={() => handleOpenEdit(note)}
                className={`group flex flex-col gap-2 p-6 premium-card cursor-pointer relative animate-fade-up hover:-translate-y-1 transition-all ${selectedIds.includes(note.id) ? '!border-[var(--primary)] !bg-[var(--primary-soft)]' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {isSelectMode && (
                  <div className="absolute top-4 left-4 z-10" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(note.id)}
                        onChange={(e) => toggleSelection(e, note.id)}
                        className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary animate-in fade-in zoom-in-75"
                      />
                  </div>
                )}
                <div className={`flex justify-between items-start ${isSelectMode ? 'pl-8' : ''} transition-all duration-200`}>
                  <h3 className="font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">{note.title}</h3>
                  <button 
                    onClick={(e) => promptDelete(e, note.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all p-1"
                    aria-label="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-muted line-clamp-4 leading-relaxed whitespace-pre-wrap mt-2">{stripHtml(note.content || '')}</p>
                <div className="mt-auto pt-6 flex gap-2 overflow-hidden items-center justify-between">
                  <MoveToCategoryDropdown itemId={note.id} currentCategoryName={(note as any).category} collectionName="notes" categoryType="notes" />
                  <span className="text-xs text-muted font-medium shrink-0">
                    {formatItemDate(note.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
      />

      <ConfirmDeleteModal 
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Notes"
        message={`Are you sure you want to delete ${selectedIds.length} notes? This action cannot be undone.`}
      />

      <AddCategoryModal 
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        type="notes"
      />
    </div>
  );
};

