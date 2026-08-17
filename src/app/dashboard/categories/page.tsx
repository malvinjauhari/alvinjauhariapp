import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useCategories } from '../../../hooks/useCategories';
import { useUserCollection } from '../../../hooks/useUserCollection';
import { useFirestoreActions } from '../../../hooks/useFirestoreActions';
import { ContentHeader } from '../../../components/layout/ContentHeader';
import { CategoryItem } from '../../../types';
import { Trash2, Edit2 } from 'lucide-react';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';

export const CategoriesPage = () => {
  const { user } = useAuth();
  const { allCategories: categories, loading, update, remove } = useCategories();
  
  const { data: links = [] } = useUserCollection<any>('links');
  const { data: notes = [] } = useUserCollection<any>('notes');
  const { data: tasks = [] } = useUserCollection<any>('tasks');
  const linkActions = useFirestoreActions('links');
  const noteActions = useFirestoreActions('notes');
  const taskActions = useFirestoreActions('tasks');

  const [searchQuery, setSearchQuery] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const validCategories = Array.isArray(categories) ? categories : [];
  
  const filteredCategories = validCategories.filter(cat => {
    if (searchQuery && !cat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const promptDelete = (e: React.MouseEvent, cat: CategoryItem) => {
    e.stopPropagation();
    setDeletingCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      if (deletingCategory.type === 'links') {
        const affected = links.filter((l: any) => l.category === deletingCategory.name);
         for (const item of affected) {
            await linkActions.update(item.id, { category: 'General' });
         }
      } else if (deletingCategory.type === 'notes') {
        const affected = notes.filter((n: any) => n.category === deletingCategory.name);
         for (const item of affected) {
            await noteActions.update(item.id, { category: 'General' });
         }
      } else if (deletingCategory.type === 'tasks') {
        const affected = tasks.filter((t: any) => t.category === deletingCategory.name);
         for (const item of affected) {
            await taskActions.update(item.id, { category: 'General' });
         }
      }
      
      await remove(deletingCategory.id);
    } catch (e) {
      console.error('Failed to delete category', e);
    } finally {
       setIsDeleteModalOpen(false);
       setDeletingCategory(null);
    }
  };

  const promptEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editingCategory || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingCategory.name !== editName.trim()) {
        await update(editingCategory.id, { name: editName.trim() });
        
        if (editingCategory.type === 'links') {
            const affected = links.filter((l: any) => l.category === editingCategory.name);
            for (const item of affected) {
                await linkActions.update(item.id, { category: editName.trim() });
            }
        } else if (editingCategory.type === 'notes') {
            const affected = notes.filter((n: any) => n.category === editingCategory.name);
            for (const item of affected) {
                await noteActions.update(item.id, { category: editName.trim() });
            }
        } else if (editingCategory.type === 'tasks') {
            const affected = tasks.filter((t: any) => t.category === editingCategory.name);
            for (const item of affected) {
                await taskActions.update(item.id, { category: editName.trim() });
            }
        }
      }
      setIsEditModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedCategories = {
    links: filteredCategories.filter(c => c.type === 'links'),
    notes: filteredCategories.filter(c => c.type === 'notes'),
    tasks: filteredCategories.filter(c => c.type === 'tasks'),
  };

  const renderGroup = (type: string, title: string) => {
    const group = groupedCategories[type as keyof typeof groupedCategories];
    if (!group || group.length === 0) return null;

    return (
      <div className="mb-8 animate-fade-up">
        <h3 className="font-semibold text-lg border-b border-border/50 pb-2 mb-4 text-text-main flex items-center gap-2">
          {title} <span className="px-2 py-0.5 text-xs bg-card border border-border rounded-full text-muted font-normal">{group.length}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 transition-colors group">
              <div className="flex flex-col">
                 <span className="font-semibold text-text-main truncate pr-2">{cat.name}</span>
                 <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/10 text-primary w-fit rounded mt-1">{cat.type || 'general'}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => promptEdit(cat)} className="p-2 text-muted hover:text-primary transition-colors" aria-label="Edit">
                    <Edit2 size={16} />
                 </button>
                 <button onClick={(e) => promptDelete(e, cat)} className="p-2 text-muted hover:text-red-500 transition-colors" aria-label="Delete">
                    <Trash2 size={16} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 pb-28 md:pb-8">
      <div className="max-w-6xl mx-auto">
         <ContentHeader 
            title="Categories" 
            subtitle="Manage tags and organization across your workspace."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {loading ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="premium-card p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-4">
                     <Skeleton className="h-5 w-3/4" />
                     <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
                  </div>
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between items-center mt-2">
                     <Skeleton className="h-4 w-16 rounded-full" />
                     <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted border border-dashed border-border/50 rounded-2xl bg-[rgba(20,24,32,0.2)] animate-fade-up mt-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-muted/30"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              <h3 className="text-base text-text-main font-medium mb-1">{searchQuery ? 'No categories matched your search' : 'No custom categories yet'}</h3>
              <p className="text-sm text-center max-w-xs">{searchQuery ? 'Try adjusting your search query.' : 'Create categories from the dashboard to organize your notes, tasks, and links.'}</p>
            </div>
          ) : (
            <div>
              {renderGroup('links', 'Link Categories')}
              {renderGroup('notes', 'Note Categories')}
              {renderGroup('tasks', 'Kanban Columns')}
            </div>
          )}
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deletingCategory?.name}"? Any items using this category will be moved to 'General'.`}
      />

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Category">
        <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-text-main font-medium mb-1 block">Category Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g. Work, Ideas"
              autoFocus
            />
            <p className="text-xs text-muted mt-2">
              Renaming a category will automatically update all items currently using it.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 font-medium rounded-xl text-muted hover:text-text-main transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || !editName.trim() || editName.trim() === editingCategory?.name} className="px-5 py-2.5 font-medium rounded-xl text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-colors">
              {isSubmitting ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
