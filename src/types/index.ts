import { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  telegram?: {
    linked: boolean;
    telegramUserId?: string;
    username?: string;
    linkedAt?: any; // Firestore Timestamp
  };
  createdAt: any;
  updatedAt: any;
};

export type SectionItem = {
  id: string;
  userId: string;
  name: string;
  createdAt: any;
  updatedAt: any;
};

export type CategoryItem = {
  id: string;
  userId: string;
  name: string;
  type: 'links' | 'notes' | 'tasks';
  sectionId?: string;
  startDate?: any;
  endDate?: any;
  createdAt: any;
  updatedAt: any;
};

export type LinkItem = {
  id: string;
  userId: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  favicon?: string;
  tags?: string[];
  source: 'manual' | 'chatbot' | 'telegram';
  createdAt: any;
  updatedAt: any;
};

export type NoteItem = {
  id: string;
  userId: string;
  title: string;
  content: string;
  plainTextPreview?: string;
  source: 'manual' | 'chatbot' | 'telegram';
  createdAt: any;
  updatedAt: any;
};

export type TemporaryNoteItem = {
  id: string;
  userId: string;
  content: string;
  source: 'manual' | 'chatbot' | 'telegram';
  status: 'active' | 'archived';
  pinned?: boolean;
  aiConfidence?: number;
  createdAt: any;
  updatedAt: any;
};

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type TaskItem = {
  id: string;
  userId: string;
  sectionId?: string;
  columnId?: string;
  category?: string; // Legacy column marker
  title: string;
  description?: string;
  completed: boolean;
  checklist?: ChecklistItem[];
  priority?: number | null;
  dueDate?: any;
  schedule?: {
    startAt?: string | null;
    endAt?: string | null;
    timezone?: string;
  } | null;
  order?: number;
  source: 'manual' | 'chatbot' | 'telegram';
  createdAt: any;
  updatedAt: any;
};

export type CaptureHistoryItem = {
  id: string;
  userId: string;
  rawInput: string;
  source: 'chatbot' | 'telegram';
  detectedType: 'link' | 'note' | 'temporary_note' | 'task' | 'mixed' | 'unknown';
  savedCollection: 'links' | 'notes' | 'temporaryNotes' | 'tasks';
  savedItemId?: string;
  aiConfidence?: number;
  status: 'success' | 'fallback' | 'failed';
  createdAt: any;
};

export type WalletType = 'Bank' | 'E-Wallet' | 'Cash';

export type WalletItem = {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  logoUrl?: string; // Optional custom logo or predefined standard logo identifier
  createdAt: any;
  updatedAt: any;
};

export type TransactionType = 'income' | 'expense';

export type TransactionItem = {
  id: string;
  userId: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: any; // Firestore timestamp or ISO string
  notes?: string;
  createdAt: any;
  updatedAt: any;
};

