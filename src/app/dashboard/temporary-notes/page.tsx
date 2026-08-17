import React, { useState } from 'react';
import { useUserCollection } from '../../../hooks/useUserCollection';
import { useFirestoreActions } from '../../../hooks/useFirestoreActions';
import { TemporaryNoteItem } from '../../../types';
import { Trash2, CheckSquare, X } from 'lucide-react';
import { ContentHeader } from '../../../components/layout/ContentHeader';
import { FullPageEditor } from '../../../components/ui/FullPageEditor';
import { formatItemDate } from '../../../utils/formatDate';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { stripHtml } from '../../../utils/stripHtml';
import { Skeleton } from '../../../components/ui/Skeleton';

export const TemporaryNotesPage = () => {
  const { data: tempNotes, loading } = useUserCollection<TemporaryNoteItem>('temporaryNotes');
  const { update, remove, removeMany, add } = useFirestoreActions('temporaryNotes');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<TemporaryNoteItem | null>(null);
  const [content, setContent] = useState('');

  const filteredNotes = tempNotes.filter(note => 
    note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      setIsSelectMode(false);
    } catch (e) {
      console.error('Failed to clear multiple temporary notes', e);
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

  const handleOpenEdit = (note: TemporaryNoteItem) => {
    setEditingNote(note);
    setContent(note.content || '');
    setIsEditing(true);
  };

  const handleOpenCreate = () => {
    setEditingNote(null);
    setContent('');
    setIsEditing(true);
  };

  const handleSave = async (payload: { title: string; content: string; category: string }) => {
    if (!payload.content.trim() && !editingNote) return;
    
    try {
      if (editingNote) {
        await update(editingNote.id, { content: payload.content });
        setEditingNote(prev => prev ? { ...prev, content: payload.content } : null);
      } else {
        const docRef = await add({ content: payload.content, source: 'manual' });
        setEditingNote({ id: docRef.id, content: payload.content, createdAt: new Date() } as any);
      }
    } catch (e) {
      console.error('Failed to save temp note', e);
      throw e;
    }
  };

  if (isEditing) {
    return (
      <FullPageEditor
        title="" // no title for temp notes
        setTitle={() => {}} // ignore
        content={content}
        setContent={setContent}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
        hideTitle={true}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-28 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <ContentHeader 
          title="Temporary Notes" 
          subtitle="Quick captures waiting for organization."
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

        {isSelectMode && (
          <div className="flex justify-between items-center mb-4 h-12 premium-card rounded-xl px-4 animate-fade-up">
            {filteredNotes.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-text-main font-medium">
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
                  <Trash2 size={16} /> Discard Selected ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="premium-card p-4 border border-transparent flex flex-col gap-2">
                 <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-1/2" />
                 </div>
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-3/4" />
                 <div className="flex justify-between items-center mt-2">
                    <Skeleton className="h-4 w-24" />
                 </div>
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted border border-dashed border-border/50 rounded-2xl bg-[rgba(20,24,32,0.2)] animate-fade-up">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-muted/30"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            <h3 className="text-base text-text-main font-medium mb-1">{searchQuery ? 'No matching notes' : 'No temporary notes yet'}</h3>
            <p className="text-sm text-center max-w-xs">{searchQuery ? 'Try adjusting your search query.' : 'Capture rough, quick thoughts before they disappear. Great for drafting.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredNotes.map((note, i) => (
              <div 
                key={note.id} 
                onClick={() => handleOpenEdit(note)}
                className={`group flex flex-col gap-3 p-4 premium-card cursor-pointer relative animate-fade-up hover:-translate-y-0.5 transition-all ${selectedIds.includes(note.id) ? '!border-[var(--primary)] !bg-[var(--primary-soft)]' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-full flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-start gap-3">
                      {isSelectMode && (
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(note.id)}
                          onChange={(e) => toggleSelection(e, note.id)}
                          className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary shrink-0 mt-1 animate-in fade-in zoom-in-75"
                        />
                      )}
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-text-main leading-relaxed whitespace-pre-wrap line-clamp-4">{stripHtml(note.content || '')}</p>
                        {note.aiConfidence && note.aiConfidence < 0.6 && (
                          <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded w-fit">Low Confidence Fallback</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button 
                      onClick={(e) => promptDelete(e, note.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all p-1"
                      aria-label="Discard"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="text-xs text-muted font-medium mt-auto">
                      {formatItemDate(note.createdAt)}
                    </span>
                  </div>
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
        title="Discard Note"
        message="Are you sure you want to discard this temporary note? This action cannot be undone."
      />
      <ConfirmDeleteModal 
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Discard Selected Notes"
        message={`Are you sure you want to discard ${selectedIds.length} temporary notes? This action cannot be undone.`}
      />
    </div>
  );
};

