// src/lib/storage.ts
import { Task, DailyStats } from '@/types/taskTypes';

export const STORAGE_KEYS = {
    TASKS: 'focus_app_tasks',
    DAILY_STATS: 'focus_app_daily_stats',
    DAILY_GOAL: 'focus_app_daily_goal',
};

export const getTasks = (): Task[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    return stored ? JSON.parse(stored) : [];
};

export const saveTasks = (tasks: Task[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const getDailyStats = (): Record<string, DailyStats> => {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
    return stored ? JSON.parse(stored) : {};
};

export const saveDailyStats = (stats: Record<string, DailyStats>) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
};

export const getDailyGoal = (): number => {
    if (typeof window === 'undefined') return 120;
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_GOAL);
    return stored ? parseInt(stored) : 120; // default 2 hours
};

export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const getTodayString = (): string => {
    return new Date().toISOString().split('T')[0];
};