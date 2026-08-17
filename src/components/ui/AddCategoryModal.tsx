import React, { useState } from 'react';
import { Modal } from './Modal';
import { useCategories } from '../../hooks/useCategories';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'links' | 'notes' | 'tasks';
  sectionId?: string;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, type, sectionId }) => {
  const { createCategory } = useCategories(type);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createCategory(name.trim(), type, sectionId);
      setName('');
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`New ${type.charAt(0).toUpperCase() + type.slice(1)} Category`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-text-main font-medium mb-1 block">Category Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary text-text-main"
            placeholder="e.g. Work, Ideas, Inspiration"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="px-5 py-2.5 font-medium rounded-xl text-muted hover:text-text-main transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || !name.trim()} className="px-5 py-2.5 font-medium rounded-xl text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-colors">
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
