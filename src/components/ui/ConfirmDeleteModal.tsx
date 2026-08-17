import React, { useState } from 'react';
import { Modal } from './Modal';
import { Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Item", 
  message = "Are you sure you want to delete this item? This action cannot be undone." 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-text-main text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3 mt-4">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-text-main transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
