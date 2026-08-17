import { useUserCollection } from './useUserCollection';
import { useFirestoreActions } from './useFirestoreActions';
import { CategoryItem } from '../types';

export function useCategories(type?: 'links' | 'notes' | 'tasks') {
  const { data: allCategories, loading } = useUserCollection<CategoryItem>('categories');
  const { add, update, remove } = useFirestoreActions('categories');

  const categories = type ? allCategories.filter(c => c.type === type) : allCategories;

  const createCategory = async (name: string, catType: 'links' | 'notes' | 'tasks', sectionId?: string) => {
    if (!name.trim()) return null;
    try {
      const payload: any = {
        name: name.trim(),
        type: catType
      };
      if (sectionId) payload.sectionId = sectionId;
      const docRef = await add(payload);
      return docRef.id;
    } catch (e) {
      console.error('Failed to create category', e);
      return null;
    }
  };

  return { categories, allCategories, loading, createCategory, update, remove };
}
