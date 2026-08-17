import React, { useState, useMemo, useEffect } from 'react';
import { useUserCollection } from '../../../hooks/useUserCollection';
import { useFirestoreActions } from '../../../hooks/useFirestoreActions';
import { useCategories } from '../../../hooks/useCategories';
import { TaskItem, ChecklistItem, SectionItem } from '../../../types';
import { Trash2, Edit2, Plus, GripVertical, AlertCircle, Calendar } from 'lucide-react';
import { ContentHeader } from '../../../components/layout/ContentHeader';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDeleteModal } from '../../../components/ui/ConfirmDeleteModal';
import { CategorySelector } from '../../../components/ui/CategorySelector';
import { AddCategoryModal } from '../../../components/ui/AddCategoryModal';
import { Skeleton } from '../../../components/ui/Skeleton';

import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  MouseSensor,
  TouchSensor,
  useSensor, 
  useSensors, 
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface SortableTaskCardProps {
  task: TaskItem;
  onToggle: (t: TaskItem) => void;
  onEdit: (t: TaskItem) => void;
  onChangePriority: (t: TaskItem, prio: number | null) => void;
}

const formatColDate = (dStr: string) => {
  if (!dStr) return '';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return dStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateString: string) => {
  try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
      return '';
  }
};

const SortableTaskCard = ({ task, onToggle, onEdit, onChangePriority }: SortableTaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id,
    data: { type: 'Task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border-2 border-dashed border-primary rounded-xl h-[100px] w-full bg-primary/5"
      />
    );
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group flex gap-3 p-3 premium-card ${task.completed ? 'opacity-50 saturate-50' : ''} transition-all relative flex-col mx-1 my-1`}
    >
      <div className="flex gap-3 items-start w-full">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted/30 hover:text-muted mt-1 shrink-0">
           <GripVertical size={16} />
        </div>
        <input 
          type="checkbox" 
          checked={task.completed} 
          onChange={() => onToggle(task)}
          className="mt-1 w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary shrink-0 transition-transform active:scale-90" 
        />
        <div className="flex-1 cursor-pointer min-w-0" onClick={() => onEdit(task)}>
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-sm transition-colors ${task.completed ? 'line-through text-muted' : 'text-text-main'} break-words`}>
              {task.title}
            </h3>
          </div>
          {task.description && <p className="text-xs text-muted mt-1 break-words line-clamp-2">{task.description}</p>}
          
          {task.schedule && (task.schedule.startAt || task.schedule.endAt) && (
            <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-muted bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg py-1.5 px-2 w-fit">
              <Calendar size={12} className="mt-0.5 opacity-70 shrink-0" />
              <div className="flex flex-col font-medium leading-tight">
                {task.schedule.startAt && <span>{formatColDate(task.schedule.startAt)}</span>}
                {(task.schedule.startAt || task.schedule.endAt) && (
                  <span className="opacity-75">
                    {task.schedule.startAt ? formatTime(task.schedule.startAt) : ''}
                    {task.schedule.startAt && task.schedule.endAt ? ' - ' : ''}
                    {task.schedule.endAt ? formatTime(task.schedule.endAt) : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {task.checklist && task.checklist.length > 0 && (
              <div className="flex flex-col gap-1 mt-2 text-xs text-muted">
                <div className="flex items-center gap-1.5 opacity-70">
                    <div className="h-1 flex-1 bg-border rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary" 
                         style={{ width: `${(task.checklist.filter(c => c.completed).length / task.checklist.length) * 100}%` }} 
                       />
                    </div>
                    <span>{task.checklist.filter(c => c.completed).length}/{task.checklist.length}</span>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InlineTaskComposer = ({ categoryName, onSave, onCancel }: { categoryName: string, onSave: (title: string, cat: string) => void, onCancel: () => void }) => {
  const [title, setTitle] = useState('');
  
  const handleComplete = () => {
    if (title.trim()) onSave(title, categoryName);
    onCancel();
  };

  return (
    <div className="p-3 premium-card border-primary/50 brightness-110 animate-in fade-in zoom-in-95 duration-200 mx-1 my-1">
        <textarea 
          autoFocus
          className="w-full bg-transparent border-none outline-none text-sm font-medium text-text-main placeholder:text-muted/50 resize-none min-h-[40px]"
          placeholder="New task..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleComplete();
              }
              if (e.key === 'Escape') onCancel();
          }}
          onBlur={() => {
              if (title.trim()) onSave(title, categoryName);
              setTimeout(onCancel, 100);
          }}
        />
    </div>
  );
};

const DroppableColumnContent = ({ id, children }: { id: string, children: React.ReactNode }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[150px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      {children}
    </div>
  );
};

export const TasksPage = () => {
  const { data: serverTasks, loading } = useUserCollection<TaskItem>('tasks');
  const { add, update, remove } = useFirestoreActions('tasks');
  const catActions = useFirestoreActions('categories');
  const { categories } = useCategories('tasks');
  
  const { data: serverSections, loading: sectionsLoading } = useUserCollection<SectionItem>('sections');
  const sectionActions = useFirestoreActions('sections');
  const sections = serverSections || [];
  const defaultSectionId = 'default';
  
  const [activeSectionId, setActiveSectionId] = useState<string>(defaultSectionId);

  useEffect(() => {
    if (activeSectionId !== defaultSectionId && !sections.find(s => s.id === activeSectionId)) {
      setActiveSectionId(defaultSectionId);
    }
  }, [sections, activeSectionId]);

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isDeletingSection, setIsDeletingSection] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  useEffect(() => {
     setTasks(serverTasks);
  }, [serverTasks]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<string>('');
  const [scheduleStart, setScheduleStart] = useState<string>('');
  const [scheduleEnd, setScheduleEnd] = useState<string>('');

  // DnD state
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [isDraggingOverTrash, setIsDraggingOverTrash] = useState(false);

  const [addingInCat, setAddingInCat] = useState<string | null>(null);

  const [catToDelete, setCatToDelete] = useState<string | null>(null);
  const [editingDatesCat, setEditingDatesCat] = useState<string | null>(null);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const activeCategories = useMemo(() => {
    return categories.filter(c => {
      const sId = c.sectionId || defaultSectionId;
      return sId === activeSectionId;
    });
  }, [categories, activeSectionId]);

  const allCategories = ['General', ...activeCategories.map(c => c.name)];
  const uniqueCategories = Array.from(new Set(allCategories));

  const tasksByColumn = useMemo(() => {
    const cols: Record<string, TaskItem[]> = {};
    uniqueCategories.forEach(c => cols[c] = []);
    tasks.forEach(t => {
       const taskSecId = t.sectionId || defaultSectionId;
       if (taskSecId !== activeSectionId) return;

       const c = (t as any).category || 'General';
       if (!cols[c]) cols[c] = [];
       if (!searchQuery || 
           t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           t.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
         cols[c].push(t);
       }
    });

    Object.keys(cols).forEach(k => {
       cols[k].sort((a, b) => {
         const pA = typeof a.priority === 'number' ? a.priority : 999999;
         const pB = typeof b.priority === 'number' ? b.priority : 999999;
         if (pA !== pB) return pA - pB;

         const orderA = a.order ?? 0;
         const orderB = b.order ?? 0;
         if (orderA !== orderB) return orderA - orderB;
         const dta = a.createdAt?.seconds || 0;
         const dtb = b.createdAt?.seconds || 0;
         return dtb - dta;
       });
    });
    return cols;
  }, [tasks, uniqueCategories, searchQuery]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleToggle = async (task: TaskItem) => {
    try {
      setTasks(p => p.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
      await update(task.id, { completed: !task.completed });
    } catch (e) {
      console.error('Failed to toggle task', e);
    }
  };

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleDeleteSection = async () => {
    if (!isDeletingSection || isDeletingSection === defaultSectionId) return;
    try {
      await sectionActions.remove(isDeletingSection);
      const sectionCats = categories.filter(c => c.sectionId === isDeletingSection);
      for (const cat of sectionCats) {
        await catActions.update(cat.id, { sectionId: defaultSectionId });
      }
      const sectionTasks = tasks.filter(t => t.sectionId === isDeletingSection);
      for (const t of sectionTasks) {
        await update(t.id, { sectionId: defaultSectionId });
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsDeletingSection(null);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      setTasks(p => p.filter(t => t.id !== itemToDelete));
      await remove(itemToDelete);
    } catch (e) {
      console.error('Failed to delete task', e);
    } finally {
      setItemToDelete(null);
    }
  };

  const promptDelete = (id: string) => {
    setItemToDelete(id);
  };

  const handleInlineSave = async (newTitle: string, cat: string) => {
     try {
       const order = tasksByColumn[cat]?.length || 0;
       const payload = {
          title: newTitle.trim(),
          description: '',
          category: cat,
          sectionId: activeSectionId,
          completed: false,
          source: 'manual',
          priority: null,
          order: order
       };
       const tempId = 'temp-' + Date.now();
       setTasks(p => [...p, { id: tempId, ...payload } as any]);
       await add(payload);
     } catch(e) {
       console.error("Failed adding task", e);
     }
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory((task as any).category || 'General');
    setPriority(task.priority !== undefined && task.priority !== null ? task.priority.toString() : '');
    const toLocalDatetime = (isoString?: string | null) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setScheduleStart(toLocalDatetime(task.schedule?.startAt));
    setScheduleEnd(toLocalDatetime(task.schedule?.endAt));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      const parsedPrio = priority.trim() === '' ? null : parseInt(priority, 10);
      
      const toISO = (localString: string) => {
        if (!localString) return null;
        const d = new Date(localString);
        if (isNaN(d.getTime())) return null;
        return d.toISOString();
      };
      
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        sectionId: activeSectionId,
        priority: isNaN(parsedPrio as any) ? null : parsedPrio,
        schedule: (scheduleStart || scheduleEnd) ? {
          startAt: toISO(scheduleStart),
          endAt: toISO(scheduleEnd)
        } : null
      };

      if (editingTask) {
        setTasks(p => p.map(t => t.id === editingTask.id ? { ...t, ...payload } : t));
        await update(editingTask.id, { ...payload, sectionId: activeSectionId });
      } else {
        const order = tasksByColumn[payload.category]?.length || 0;
        await add({ ...payload, completed: false, source: 'manual', order });
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error('Failed to save task', e);
    }
  };

  const handleChangePriority = async (task: TaskItem, prio: number | null) => {
     try {
       setTasks(p => p.map(t => t.id === task.id ? { ...t, priority: prio } : t));
       await update(task.id, { priority: prio });
     } catch(e) {
       console.error('Failed priority', e);
     }
  };

  const handleDeleteCategory = async () => {
     if (!catToDelete) return;
     try {
       const tasksInCat = tasks.filter(t => ((t as any).category || 'General') === catToDelete);
       setTasks(p => p.filter(t => ((t as any).category || 'General') !== catToDelete));
       
       for (const t of tasksInCat) {
          await remove(t.id);
       }
       
       const cId = categories.find(c => c.name === catToDelete)?.id;
       if (cId) {
          await catActions.remove(cId);
       }
     } catch (e) {
       console.error('failed cat deletion', e);
     } finally {
       setCatToDelete(null);
     }
  };

  const handleSaveDates = async () => {
    if (!editingDatesCat) return;
    try {
       const c = categories.find(c => c.name === editingDatesCat);
       if (c) {
          await catActions.update(c.id, {
             startDate: tempStartDate || null,
             endDate: tempEndDate || null
          });
       }
    } catch(e) {
      console.error('Failed to save dates', e);
    } finally {
       setEditingDatesCat(null);
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    const { active } = e;
    setActiveTask(active.data.current?.task || null);
    setIsDraggingOverTrash(false);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { over } = e;
    if (over && over.id === 'trash-zone') {
       setIsDraggingOverTrash(true);
    } else {
       setIsDraggingOverTrash(false);
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    setIsDraggingOverTrash(false);
    
    const { active, over } = e;
    if (!over) return;

    if (over.id === 'trash-zone') {
       try {
         setTasks(p => p.filter(t => t.id !== active.id.toString()));
         await remove(active.id.toString());
       } catch (e) {
         console.error('Failed to delete task via trash', e);
       }
       return;
    }

    const activeTaskData = active.data.current?.task as TaskItem | undefined;
    if (!activeTaskData) return;

    const sourceCat = (activeTaskData as any).category || 'General';
    let targetCat = sourceCat;
    let overId = over.id;

    if (uniqueCategories.includes(over.id.toString())) {
       targetCat = over.id.toString();
    } else {
       const overTaskData = over.data.current?.task as TaskItem | undefined;
       if (overTaskData) {
         targetCat = (overTaskData as any).category || 'General';
       } else {
         // Also handle case where it dropped on the droppable column container ID itself
         if (uniqueCategories.includes(over.id.toString())) {
             targetCat = over.id.toString();
         }
       }
    }

    if (sourceCat !== targetCat) {
      const newColTasks = [...(tasksByColumn[targetCat] || [])];
      let newOrder = newColTasks.length;
      
      const overIndex = newColTasks.findIndex(t => t.id === overId);
      if (overIndex !== -1) {
          newOrder = overIndex;
      }
      
      setTasks(p => p.map(t => {
         if (t.id === active.id) {
           return { ...t, category: targetCat, order: newOrder } as any;
         }
         if (((t as any).category || 'General') === targetCat && (t.order||0) >= newOrder) {
           return { ...t, order: (t.order||0) + 1 };
         }
         return t;
      }));

      try {
        await update(active.id.toString(), { category: targetCat, updatedAt: new Date(), order: newOrder });
        newColTasks.forEach(async (t) => {
           if ((t.order||0) >= newOrder) {
              await update(t.id, { order: (t.order||0) + 1 });
           }
        });
      } catch (e) {
        console.error('Failed to move task across columns', e);
      }
    } else {
       const colTasks = tasksByColumn[sourceCat] || [];
       const oldIndex = colTasks.findIndex(t => t.id === active.id);
       const newIndex = colTasks.findIndex(t => t.id === over.id);
       if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
           const reordered = [...colTasks];
           const [movedItem] = reordered.splice(oldIndex, 1);
           reordered.splice(newIndex, 0, movedItem);
           
           setTasks(p => {
              const others = p.filter(t => ((t as any).category || 'General') !== sourceCat);
              const updated = reordered.map((t, idx) => ({ ...t, order: idx }));
              return [...others, ...updated] as any;
           });
           
           reordered.forEach((t, idx) => {
              update(t.id, { order: idx });
           });
       }
    }
  };

  const formatColDateFallback = (dStr: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full p-4 md:p-8 overflow-hidden bg-background">
      <div className="shrink-0 max-w-full">
        <ContentHeader 
          title="Tasks Board" 
          subtitle="Organize your actions in a flexible space."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden mt-2 md:mt-6">
        
        {/* Sections Sidebar */}
        <div className="shrink-0 md:w-48 lg:w-56 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-border md:pr-4">
          <div className="flex items-center justify-between px-2 mb-1 shrink-0">
             <span className="text-xs font-bold text-muted uppercase tracking-wider hidden md:block">Sections</span>
             <button onClick={() => setIsSectionModalOpen(true)} className="p-1 md:bg-card md:hover:bg-primary/10 md:border md:border-border rounded-md text-muted hover:text-primary transition-colors transition-transform hidden md:flex items-center justify-center" aria-label="New Section">
               <Plus size={14} />
             </button>
             <div className="md:hidden flex items-center shrink-0 mr-4">
               <button onClick={() => setIsSectionModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-medium transition-colors border border-primary/20">
                 <Plus size={12} /> New Section
               </button>
             </div>
          </div>
          
          {[{ id: defaultSectionId, name: 'Main' }, ...sections].map(s => (
            <div 
              key={s.id} 
              onClick={() => { if (editingSectionId !== s.id) setActiveSectionId(s.id); }}
              className={`flex items-center justify-between px-4 md:px-3 py-2.5 rounded-[14px] cursor-pointer transition-all duration-180 shrink-0 md:w-full group ${
                activeSectionId === s.id ? 'bg-[var(--primary-soft)] text-white shadow-sm border border-[rgba(142,162,255,0.22)] font-medium' : 'bg-transparent text-muted border border-transparent hover:bg-border/20 hover:text-text-main'
              }`}
            >
               {editingSectionId === s.id ? (
                 <input 
                   autoFocus
                   type="text"
                   value={editingSectionName}
                   onChange={e => setEditingSectionName(e.target.value)}
                   onBlur={async () => {
                     setEditingSectionId(null);
                     if (editingSectionName.trim() && editingSectionName !== s.name) {
                       await sectionActions.update(s.id, { name: editingSectionName.trim() });
                     }
                   }}
                   onKeyDown={async e => {
                     if (e.key === 'Enter') {
                       setEditingSectionId(null);
                       if (editingSectionName.trim() && editingSectionName !== s.name) {
                         await sectionActions.update(s.id, { name: editingSectionName.trim() });
                       }
                     }
                     if (e.key === 'Escape') {
                       setEditingSectionId(null);
                     }
                   }}
                   className="w-full bg-transparent border-none outline-none text-sm text-text-main font-medium"
                 />
               ) : (
                 <span className="text-sm truncate">{s.name}</span>
               )}
               {s.id !== defaultSectionId && editingSectionId !== s.id && (
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => { e.stopPropagation(); setEditingSectionId(s.id); setEditingSectionName(s.name); }}
                     className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${activeSectionId === s.id ? 'text-white' : 'text-muted'}`}
                   >
                     <Edit2 size={12} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); setIsDeletingSection(s.id); }}
                     className={`p-1 rounded hover:bg-red-500/20 hover:text-red-300 ${activeSectionId === s.id ? 'text-white' : 'text-muted'}`}
                   >
                     <Trash2 size={12} />
                   </button>
                 </div>
               )}
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex gap-2 items-center mb-4 shrink-0 px-2 lg:px-0">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="premium-btn premium-btn-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Add Column
            </button>
          </div>
          
          {(loading || sectionsLoading) && tasks.length === 0 ? (
            <div className="flex flex-row h-max md:h-full gap-4 items-start pb-4 w-max min-w-0 px-1 md:px-0 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col flex-shrink-0 w-[85vw] max-w-[320px] md:w-[320px] bg-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] rounded-2xl p-4 gap-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-[72px] w-full" />
                  <Skeleton className="h-[72px] w-full" />
                  <Skeleton className="h-[72px] w-full" />
                </div>
              ))}
            </div>
          ) : (
        <div className="flex-1 overflow-x-auto overflow-y-auto md:overflow-y-hidden pb-28 scrollbar-thin scrollbar-thumb-muted/20 scrollbar-track-transparent">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-row h-max md:h-full gap-4 items-start pb-4 w-max min-w-0 px-1 md:px-0">
              {uniqueCategories.map(cat => {
                const colTasks = tasksByColumn[cat] || [];
                const catObj = categories.find(c => c.name === cat);
                return (
                  <div 
                    key={cat} 
                    className="flex flex-col flex-shrink-0 w-[85vw] max-w-[320px] md:w-[320px] bg-white/[0.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] rounded-2xl animate-fade-up relative group/col max-h-[75vh] md:max-h-full"
                  >
                    <div className="p-4 flex flex-col gap-2 bg-transparent rounded-t-2xl sticky top-0 z-10 backdrop-blur-sm">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-primary/80" />
                           <h3 className="font-semibold text-sm text-text-main line-clamp-1">{cat}</h3>
                           <span className="text-xs font-medium text-muted bg-card px-2 py-0.5 rounded-full border border-border">
                             {colTasks.length}
                           </span>
                         </div>
                         
                         <div className="flex items-center">
                           <button 
                              onClick={() => {
                                 setEditingDatesCat(cat);
                                 setTempStartDate(catObj?.startDate || '');
                                 setTempEndDate(catObj?.endDate || '');
                                 setIsCatModalOpen(false); // Close other modals if any
                              }}
                              className="text-muted hover:text-primary transition-colors opacity-0 group-hover/col:opacity-100 p-1 md:opacity-0 sm:opacity-100 cursor-pointer"
                              title="Set schedule"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                           </button>
                           {cat !== 'General' && (
                             <button 
                                onClick={() => setCatToDelete(cat)}
                                className="text-muted hover:text-red-500 transition-colors opacity-0 group-hover/col:opacity-100 p-1 md:opacity-0 sm:opacity-100 cursor-pointer"
                                title="Delete Column"
                             >
                                <Trash2 size={14} />
                             </button>
                           )}
                         </div>
                       </div>
                       
                       {(catObj?.startDate || catObj?.endDate) ? (
                         <div className="text-[11px] text-muted font-medium flex gap-1 items-center">
                            {catObj.startDate && catObj.endDate ? (
                               <span>{formatColDateFallback(catObj.startDate)} - {formatColDateFallback(catObj.endDate)}</span>
                            ) : catObj.startDate ? (
                               <span>Start: {formatColDateFallback(catObj.startDate)}</span>
                            ) : (
                               <span>End: {formatColDateFallback(catObj.endDate)}</span>
                            )}
                         </div>
                       ) : null}
                    </div>
                    
                    <DroppableColumnContent id={cat}>
                      <SortableContext 
                        id={cat}
                        items={colTasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                         {colTasks.map(task => (
                            <SortableTaskCard 
                              key={task.id} 
                              task={task} 
                              onToggle={handleToggle}
                              onEdit={handleOpenEdit}
                              onChangePriority={handleChangePriority}
                            />
                         ))}
                      </SortableContext>

                      {addingInCat === cat && (
                         <InlineTaskComposer 
                            categoryName={cat} 
                            onSave={handleInlineSave} 
                            onCancel={() => setAddingInCat(null)} 
                         />
                      )}
                      
                      {!addingInCat && (
                        <button 
                          onClick={() => setAddingInCat(cat)}
                          className="w-[calc(100%-8px)] flex items-center justify-center gap-2 py-3 px-4 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] text-muted hover:text-text-main transition-all rounded-xl text-sm font-medium shrink-0 group mx-1 mb-2 shadow-sm"
                        >
                           <Plus size={16} className="group-hover:scale-110 transition-transform" /> Add Task
                        </button>
                      )}
                    </DroppableColumnContent>
                  </div>
                );
              })}
            </div>

            <div 
              id="trash-zone"
              className={`fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all p-4 z-50 ${
                activeTask ? 'opacity-100 visible h-[80px] w-[300px] shadow-2xl' : 'opacity-0 invisible h-0 w-0 p-0 overflow-hidden'
              } ${
                isDraggingOverTrash 
                ? 'border-red-500 bg-red-500 text-white scale-[1.02]' 
                : 'border-red-500/30 bg-card/90 backdrop-blur-xl text-red-500'
              }`}
            >
               <Trash2 size={24} className={`transition-all ${isDraggingOverTrash ? 'animate-bounce' : ''}`} />
               <span className="text-sm font-semibold tracking-wide">Drop here to delete</span>
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="opacity-90 scale-105 rotate-2 cursor-grabbing pointer-events-none group flex gap-3 p-4 bg-card border border-primary/50 shadow-2xl rounded-xl relative flex-col w-[320px]">
                   <h3 className="font-medium text-sm text-text-main line-clamp-2">{activeTask.title}</h3>
                </div>
              ) : null}
            </DragOverlay>

          </DndContext>
        </div>
      )}
      </div>
      </div>

      <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title="New Section">
        <form onSubmit={async (e) => {
           e.preventDefault();
           if (!newSectionName.trim()) return;
           try {
             const doc = await sectionActions.add({ name: newSectionName.trim() });
             if (doc) setActiveSectionId(doc.id);
             setNewSectionName('');
             setIsSectionModalOpen(false);
           } catch(e) {}
        }} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Section Name</label>
            <input 
              autoFocus
              type="text" 
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              placeholder="e.g. Work, Study, Project"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all text-text-main"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
             <button type="button" onClick={() => setIsSectionModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted hover:text-text-main transition-colors">Cancel</button>
             <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm" disabled={!newSectionName.trim()}>Create Section</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editingDatesCat} onClose={() => setEditingDatesCat(null)} title="Column Schedule">
        <form onSubmit={e => { e.preventDefault(); handleSaveDates(); }} className="flex flex-col gap-4">
          <p className="text-sm text-muted">Set a start and end date for Tasks in {editingDatesCat}</p>
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input 
                   type="date"
                   value={tempStartDate}
                   onChange={e => setTempStartDate(e.target.value)}
                   className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all text-text-main"
                />
             </div>
             <div className="flex-1">
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input 
                   type="date"
                   value={tempEndDate}
                   onChange={e => setTempEndDate(e.target.value)}
                   min={tempStartDate}
                   className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all text-text-main"
                />
             </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
             <button type="button" onClick={() => setEditingDatesCat(null)} className="px-4 py-2 text-sm font-medium text-muted hover:text-text-main transition-colors">Cancel</button>
             <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm">Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Task Details">
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input 
              autoFocus
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-text-main"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[80px] text-text-main"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Column</label>
              <CategorySelector type="tasks" value={category} onChange={setCategory} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Priority (Number)</label>
              <input 
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                placeholder="E.g. 1 (Top)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all text-text-main"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input 
                type="datetime-local"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all text-text-main"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input 
                type="datetime-local"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-all text-text-main"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            {editingTask ? (
                 <button 
                   type="button" 
                   onClick={() => { setIsModalOpen(false); promptDelete(editingTask.id); }}
                   className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                 >
                   <Trash2 size={16} /> Delete
                 </button>
            ) : <div />}
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-muted hover:text-text-main transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Task Permanently"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />

      <ConfirmDeleteModal 
        isOpen={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Column"
        message="Are you sure you want to delete this column? ALL tasks inside this column will be permanently deleted."
      />

      <ConfirmDeleteModal 
        isOpen={!!isDeletingSection}
        onClose={() => setIsDeletingSection(null)}
        onConfirm={handleDeleteSection}
        title="Delete Section"
        message="Are you sure you want to delete this section? All its columns and tasks will be moved to the Main section."
      />

      <AddCategoryModal 
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        type="tasks"
        sectionId={activeSectionId}
      />
    </div>
  );
};
