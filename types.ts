
export enum TimerMode {
  WORK = 'WORK',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK'
}

export enum Language {
  ZH = 'ZH',
  EN = 'EN'
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string; // ISO string for date
  estimatedPomodoros: number;
  completedPomodoros: number;
  completedAt?: string;
}

export interface TaskBreakdownResponse {
  tasks: string[];
}

export interface QuoteData {
  text: string;
  isLiked: boolean;
}

export interface QuoteCache {
  [TimerMode.WORK]: QuoteData[];
  [TimerMode.SHORT_BREAK]: QuoteData[];
  [TimerMode.LONG_BREAK]: QuoteData[];
}
