
import React, { useState, useRef } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TimerMode, Language } from '../types';
import { breakDownTaskWithAI } from '../services/geminiService';

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  currentMode: TimerMode;
  language: Language;
  onToggle: (id: string) => void;
}

interface SortableTaskItemProps {
  task: Task;
  isActive: boolean;
  isEditing: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  editTitle: string;
  editDate: string;
  editPomodoros: number;
  setEditTitle: (val: string) => void;
  setEditDate: (val: string) => void;
  setEditPomodoros: (val: number) => void;
  onToggle: (id: string) => void;
  onSelectToggle: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onEditStart: (task: Task, e: React.MouseEvent) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onActivate: (id: string) => void;
  onQuickDateUpdate: (id: string, date: string) => void;
  onQuickPomodoroUpdate: (id: string, val: number) => void;
  language: Language;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  isActive,
  isEditing,
  isSelectionMode,
  isSelected,
  editTitle,
  editDate,
  editPomodoros,
  setEditTitle,
  setEditDate,
  setEditPomodoros,
  onToggle,
  onSelectToggle,
  onDelete,
  onEditStart,
  onEditSave,
  onEditCancel,
  onActivate,
  onQuickDateUpdate,
  onQuickPomodoroUpdate,
  language
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id,
    disabled: isSelectionMode || isEditing 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
  };

  const getTodayLocalISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isToday = (dateStr: string) => {
    const today = getTodayLocalISO();
    return dateStr === today;
  };

  const isPast = (dateStr: string) => {
    const today = getTodayLocalISO();
    return dateStr < today;
  };

  const isDueSoon = (dateStr: string) => {
    if (task.completed) return false;
    const today = getTodayLocalISO();
    return dateStr === today;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === Language.ZH ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const t = {
    dueDate: language === Language.ZH ? '截止日期' : 'Due Date',
    none: language === Language.ZH ? '未设置' : 'None',
    dueSoon: language === Language.ZH ? '即将到期' : 'Due Soon',
    overdue: language === Language.ZH ? '已逾期' : 'Overdue',
    pomoEstimate: language === Language.ZH ? '预计番茄钟' : 'Estimate',
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      onSelectToggle(task.id);
    } else {
      onEditStart(task, e);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border ${
        isActive && !isSelectionMode
          ? 'bg-white dark:bg-gray-800 shadow-ios-btn border-morandi-work/20 translate-y-[-1px]' 
          : isSelected && isSelectionMode
          ? 'bg-morandi-work/5 dark:bg-morandi-work/10 border-morandi-work/30'
          : 'bg-white/40 dark:bg-gray-800/40 border-transparent hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-sm'
      }`}
    >
      {isActive && !isSelectionMode && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-morandi-work rounded-r-full"></div>}
      
      <div className="flex items-center gap-4 flex-1 min-w-0 pl-2">
        {isSelectionMode ? (
          <div 
            onClick={() => onSelectToggle(task.id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer ${
            isSelected ? 'bg-morandi-work border-morandi-work shadow-sm scale-110' : 'border-gray-300 dark:border-gray-600 bg-transparent'
          }`}>
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
              task.completed ? 'bg-morandi-break border-morandi-break scale-110 shadow-lg' : 'border-gray-300 dark:border-gray-600 hover:border-morandi-work bg-white dark:bg-gray-700'
            } active:scale-95`}
          >
            {task.completed && (
              <svg className="w-3.5 h-3.5 text-white animate-[bounce_0.3s_ease-in-out]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
              </svg>
            )}
          </button>
        )}
        
        {isEditing ? (
          <div className="flex flex-col gap-2 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
            <input 
              autoFocus 
              value={editTitle} 
              onChange={(e) => setEditTitle(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && onEditSave()}
              className="bg-transparent border-b-2 border-morandi-work focus:border-morandi-work outline-none text-morandi-text-primary dark:text-gray-100 py-0.5 text-base font-medium min-w-0" 
            />
            
            <div className="flex gap-2">
                <div className="relative flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit overflow-hidden hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group/editdate">
                    <input 
                        type="date" 
                        value={editDate} 
                        onChange={(e) => setEditDate(e.target.value)} 
                        className="date-input-overlay"
                    />
                    <svg className="w-3 h-3 text-gray-400 group-hover/editdate:text-morandi-work transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] text-gray-400 font-medium group-hover/editdate:text-morandi-work transition-colors">{t.dueDate}:</span>
                    <span className="text-[10px] text-gray-500 font-mono select-none pointer-events-none">
                        {editDate ? formatDate(editDate) : t.none}
                    </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <button onClick={() => setEditPomodoros(Math.max(1, editPomodoros - 1))} className="text-gray-400 hover:text-morandi-work p-0.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    </button>
                    <span className="text-[10px] font-bold text-morandi-work min-w-[2ch] text-center">{editPomodoros}</span>
                    <button onClick={() => setEditPomodoros(editPomodoros + 1)} className="text-gray-400 hover:text-morandi-work p-0.5">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col min-w-0 flex-1 cursor-text" onClick={handleTitleClick}>
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`truncate flex-1 select-none text-base transition-all duration-300 ${task.completed ? 'text-gray-400 dark:text-gray-600 line-through' : 'text-morandi-text-primary dark:text-gray-200 font-medium'} ${isActive && !isSelectionMode ? 'font-semibold' : ''}`}>{task.title}</span>
                <span className="ml-auto flex text-[10px] text-morandi-text-secondary dark:text-gray-500 font-bold bg-gray-100/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md items-center gap-1 flex-none">
                    <span className="text-morandi-work">🍅</span>
                    <span className="min-w-[4ch] text-center">{task.completedPomodoros} / {task.estimatedPomodoros}</span>
                </span>
                <div className="relative group/badge ml-1 flex-none">
                  <input 
                    type="date" 
                    value={task.dueDate || ''} 
                    onChange={(e) => onQuickDateUpdate(task.id, e.target.value)} 
                    className="date-input-overlay"
                  />
                  {task.dueDate ? (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      task.completed 
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 border-transparent opacity-50' 
                        : isToday(task.dueDate) || isPast(task.dueDate)
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200/30'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 border-blue-200/30'
                    }`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {formatDate(task.dueDate)}
                    </div>
                  ) : (
                    <div className="p-2 text-gray-300 hover:text-morandi-work cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                </div>
            </div>
            {task.dueDate && !task.completed && (
              isPast(task.dueDate) ? (
                <div className="flex items-center gap-1 mt-0.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-tighter">{t.overdue}</span>
                </div>
              ) : isDueSoon(task.dueDate) ? (
                <div className="flex items-center gap-1 mt-0.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">{t.dueSoon}</span>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!isEditing && <></>}

        {!isSelectionMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isEditing ? (
                <>
                  <button onClick={(e) => { e.stopPropagation(); onEditSave(); }} className="text-green-500 p-2 rounded-lg hover:bg-green-50 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                  <button onClick={(e) => { e.stopPropagation(); onEditCancel(); }} className="text-gray-400 p-2 rounded-lg hover:bg-gray-100 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </>
              ) : (
                <>
                  <button onClick={(e) => onEditStart(task, e)} className="text-gray-400 dark:text-gray-500 hover:text-morandi-work hover:bg-morandi-work/10 p-2 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg></button>
                  <button onClick={(e) => onDelete(task.id, e)} className="text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg></button>
                  <div {...attributes} {...listeners} className="touch-none cursor-grab text-gray-300 dark:text-gray-600 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg></div>
                </>
              )}
          </div>
        )}
      </div>
    </li>
  );
};

const TaskList: React.FC<TaskListProps> = ({ tasks, setTasks, activeTaskId, setActiveTaskId, language, onToggle }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState(1);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [lastAiPrompt, setLastAiPrompt] = useState<string | null>(null);
  const [lastGeneratedIds, setLastGeneratedIds] = useState<string[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPomodoros, setEditPomodoros] = useState(1);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const titleInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const t = {
    title: language === Language.ZH ? '今日专注' : 'Today\'s Focus',
    placeholder: language === Language.ZH ? '添加新任务...' : 'Add a new task...',
    retry: language === Language.ZH ? '不满意？重试' : 'Not happy? Retry',
    empty: language === Language.ZH ? '暂无任务' : 'No tasks',
    aiBreakdown: language === Language.ZH ? 'AI 拆解 (Ctrl+Enter)' : 'AI Breakdown (Ctrl+Enter)',
    addTask: language === Language.ZH ? '添加任务 (Enter)' : 'Add Task (Enter)',
    select: language === Language.ZH ? '选择' : 'Select',
    cancel: language === Language.ZH ? '取消' : 'Cancel',
    deleteSelected: language === Language.ZH ? `删除已选 (${selectedIds.size})` : `Delete (${selectedIds.size})`,
    selectAll: language === Language.ZH ? '全选' : 'Select All',
    deselectAll: language === Language.ZH ? '取消全选' : 'Deselect',
    dueDate: language === Language.ZH ? '截止日期' : 'Due Date',
    none: language === Language.ZH ? '未设置' : 'None',
    sortByDate: language === Language.ZH ? '按日期排序' : 'Sort by Date',
    sortNearToFar: language === Language.ZH ? '从近到远' : 'Soonest First',
    sortFarToNear: language === Language.ZH ? '从远到近' : 'Furthest First',
    pomodoros: language === Language.ZH ? '预计番茄钟' : 'Estimate Pomos',
  };

  const sortTasksByDate = () => {
    const newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDir);
    
    setTasks(prev => {
      const sorted = [...prev].sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        
        if (!a.completed) {
          if (a.dueDate && b.dueDate) {
            return newDir === 'asc' 
              ? a.dueDate.localeCompare(b.dueDate) 
              : b.dueDate.localeCompare(a.dueDate);
          }
          if (a.dueDate) return -1;
          if (b.dueDate) return 1;
        }
        return 0;
      });
      return sorted;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSortDirection(null);
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addTask = (title: string, date: string, pomos: number) => {
    if (!title.trim()) return;
    const newTask: Task = { 
      id: crypto.randomUUID(), 
      title: title.trim(), 
      completed: false,
      dueDate: date || undefined,
      estimatedPomodoros: pomos,
      completedPomodoros: 0
    };
    setTasks(prev => [newTask, ...prev]);
    if (!activeTaskId) setActiveTaskId(newTask.id);
    
    setNewTaskTitle('');
    setNewTaskDate('');
    setNewTaskPomodoros(1);
    titleInputRef.current?.focus();
  };

  const performAiBreakdown = async (prompt: string, isRegenerate: boolean = false) => {
     if (!prompt.trim() || isAiLoading) return;
     setIsAiLoading(true);
     if (isRegenerate) setTasks(prev => prev.filter(t => !lastGeneratedIds.includes(t.id)));
     try {
      const subtasks = await breakDownTaskWithAI(prompt, language);
      const newIds: string[] = [];
      const newTasks: Task[] = subtasks.map(title => {
          const id = crypto.randomUUID();
          newIds.push(id);
          return { 
            id, 
            title: title.trim(), 
            completed: false, 
            dueDate: newTaskDate || undefined,
            estimatedPomodoros: 1,
            completedPomodoros: 0
          };
      });
      setTasks(prev => [...newTasks, ...prev]);
      if (newTasks.length > 0) setActiveTaskId(newTasks[0].id);
      setLastAiPrompt(prompt);
      setLastGeneratedIds(newIds);
      if (!isRegenerate) {
        setNewTaskTitle('');
        setNewTaskDate('');
        setNewTaskPomodoros(1);
      }
      titleInputRef.current?.focus();
    } catch (e) { 
      console.warn("AI breakdown error handled silently");
    } finally { 
      setIsAiLoading(false); 
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      performAiBreakdown(newTaskTitle);
    }
  };

  const handleDateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask(newTaskTitle, newTaskDate, newTaskPomodoros);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };

  const toggleTaskSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const deleteSelectedTasks = () => {
    if (selectedIds.size === 0) return;
    setTasks(prev => prev.filter(t => !selectedIds.has(t.id)));
    if (activeTaskId && selectedIds.has(activeTaskId)) {
      setActiveTaskId(null);
    }
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map(t => t.id)));
    }
  };

  const handleEditSave = () => {
    if (editingTaskId && editTitle.trim()) {
      setTasks(prev => prev.map(t => t.id === editingTaskId ? {
        ...t, 
        title: editTitle.trim(),
        dueDate: editDate || undefined,
        estimatedPomodoros: editPomodoros
      } : t));
    }
    setEditingTaskId(null);
  };

  const handleQuickDateUpdate = (id: string, date: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, dueDate: date || undefined } : t));
  };

  const handleQuickPomodoroUpdate = (id: string, val: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, estimatedPomodoros: Math.max(1, val) } : t));
  };

  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return t.none;
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === Language.ZH ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6 pb-20">
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-[2rem] shadow-glass dark:shadow-glass-dark border border-white/40 dark:border-white/5 p-6 transition-colors duration-500">
        <div className="flex justify-between items-center mb-5 px-1">
          <h2 className="text-base font-semibold text-morandi-text-primary dark:text-gray-100 tracking-tight">{t.title}</h2>
          <div className="flex gap-2 items-center">
            {!isSelectionMode && tasks.length >= 2 && (
              <button 
                onClick={sortTasksByDate}
                title={t.sortByDate}
                className={`p-1.5 pl-2.5 pr-3 rounded-xl flex items-center gap-1.5 transition-all ${sortDirection ? 'bg-morandi-work/10 text-morandi-work shadow-inner border border-morandi-work/20' : 'text-morandi-text-secondary hover:text-morandi-work hover:bg-morandi-work/10'}`}
              >
                <svg className={`w-4 h-4 transition-transform duration-300 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                {sortDirection && (
                  <span className="text-[10px] font-bold tracking-tight">
                    {sortDirection === 'asc' ? t.sortNearToFar : t.sortFarToNear}
                  </span>
                )}
              </button>
            )}
            {isSelectionMode && tasks.length > 0 && (
               <button 
                onClick={toggleSelectAll}
                className="text-xs font-medium text-morandi-text-secondary hover:text-morandi-work transition-colors px-2 py-1"
               >
                 {selectedIds.size === tasks.length ? t.deselectAll : t.selectAll}
               </button>
            )}
            {(tasks.length >= 2 || isSelectionMode) && (
              <button 
                onClick={toggleSelectionMode} 
                className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${isSelectionMode ? 'bg-morandi-work text-white shadow-sm' : 'text-morandi-work hover:bg-morandi-work/10'}`}
              >
                {isSelectionMode ? t.cancel : t.select}
              </button>
            )}
          </div>
        </div>
        
        {!isSelectionMode && (
          <div className="mb-6 flex flex-col gap-2">
              <form onSubmit={(e) => { e.preventDefault(); addTask(newTaskTitle, newTaskDate, newTaskPomodoros); }} className="relative">
                  <div className="relative group bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl border border-transparent focus-within:bg-white dark:focus-within:bg-gray-800 focus-within:border-morandi-work/30 transition-all">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                          {isAiLoading ? (
                            <svg className="animate-spin h-5 w-5 text-purple-500" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" />
                            </svg>
                          )}
                      </div>
                      
                      <input 
                        ref={titleInputRef}
                        type="text" 
                        value={newTaskTitle} 
                        onChange={(e) => setNewTaskTitle(e.target.value)} 
                        onKeyDown={handleKeyDown}
                        placeholder={t.placeholder} 
                        className="w-full pl-11 pr-24 py-4 bg-transparent outline-none text-morandi-text-primary dark:text-gray-100 font-medium placeholder:text-gray-400" 
                        disabled={isAiLoading} 
                      />

                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                          <button 
                            type="button" 
                            onClick={() => performAiBreakdown(newTaskTitle)} 
                            disabled={!newTaskTitle || isAiLoading} 
                            title={t.aiBreakdown}
                            className="p-2 text-purple-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5z" /></svg>
                          </button>
                          <button 
                            type="submit" 
                            disabled={!newTaskTitle || isAiLoading} 
                            title={t.addTask}
                            className="p-2 text-morandi-work hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all"
                          >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" /></svg>
                          </button>
                      </div>
                  </div>

                  <div className="flex items-center gap-3 pl-2 mt-2">
                    {/* Date Picker */}
                    <div className="relative flex items-center gap-1.5 text-[10px] text-gray-400 font-medium bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded-lg group/date hover:text-morandi-work transition-colors">
                      <input 
                        type="date" 
                        value={newTaskDate} 
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        onKeyDown={handleDateKeyDown}
                        className="date-input-overlay"
                      />
                      <svg className="w-3 h-3 group-hover/date:text-morandi-work transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="group-hover/date:text-morandi-work transition-colors">{t.dueDate}:</span>
                      <span className="text-gray-500 font-mono ml-0.5 pointer-events-none select-none">
                        {formatDateLabel(newTaskDate)}
                      </span>
                    </div>

                    {/* Pomodoro Estimator */}
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded-lg">
                        <span className="text-morandi-work">🍅</span>
                        <span className="mr-1">{t.pomodoros}:</span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setNewTaskPomodoros(Math.max(1, newTaskPomodoros - 1))} className="text-gray-400 hover:text-morandi-work p-0.5 transition-colors">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                            </button>
                            <span className="text-morandi-work font-bold min-w-[1.5ch] text-center">{newTaskPomodoros}</span>
                            <button type="button" onClick={() => setNewTaskPomodoros(newTaskPomodoros + 1)} className="text-gray-400 hover:text-morandi-work p-0.5 transition-colors">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                  </div>
              </form>
              
              {lastAiPrompt && !isAiLoading && (
                  <div className="flex justify-end px-1">
                      <button onClick={() => performAiBreakdown(lastAiPrompt, true)} className="text-[11px] font-medium text-purple-500/80 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-2 py-1 rounded-lg flex items-center gap-1.5 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>{t.retry}</button>
                  </div>
              )}
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-1 -mr-2 custom-scrollbar pb-2">
                {tasks.length === 0 && <li className="flex flex-col items-center justify-center py-12 text-gray-300"><span className="text-sm font-medium">{t.empty}</span></li>}
                {tasks.map(task => (
                    <SortableTaskItem 
                      key={task.id} 
                      task={task} 
                      isActive={activeTaskId === task.id} 
                      isEditing={editingTaskId === task.id} 
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedIds.has(task.id)}
                      editTitle={editTitle} 
                      editDate={editDate}
                      editPomodoros={editPomodoros}
                      setEditTitle={setEditTitle} 
                      setEditDate={setEditDate}
                      setEditPomodoros={setEditPomodoros}
                      onToggle={onToggle} 
                      onSelectToggle={toggleTaskSelection}
                      onDelete={(id, e) => { e.stopPropagation(); setTasks(prev => prev.filter(t => t.id !== id)); if(activeTaskId === id) setActiveTaskId(null); }} 
                      onEditStart={(t, e) => { e.stopPropagation(); setEditingTaskId(t.id); setEditTitle(t.title); setEditDate(t.dueDate || ''); setEditPomodoros(t.estimatedPomodoros); }} 
                      onEditSave={handleEditSave} 
                      onEditCancel={() => setEditingTaskId(null)} 
                      onActivate={setActiveTaskId} 
                      onQuickDateUpdate={handleQuickDateUpdate}
                      onQuickPomodoroUpdate={handleQuickPomodoroUpdate}
                      language={language}
                    />
                ))}
                </ul>
            </SortableContext>
        </DndContext>
      </div>

      {isSelectionMode && tasks.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs animate-[bounceIn_0.5s_cubic-bezier(0.68,-0.55,0.27,1.55)]">
          <button 
            onClick={deleteSelectedTasks}
            disabled={selectedIds.size === 0}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-2xl transition-all flex items-center justify-center gap-3 ${selectedIds.size > 0 ? 'bg-red-500 hover:bg-red-600 active:scale-95' : 'bg-gray-400 opacity-50 cursor-not-allowed'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            {t.deleteSelected}
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
