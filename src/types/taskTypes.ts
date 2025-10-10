// src/types/taskTypes.ts
export interface Task {
    id: string;
    title: string;
    estimatedTime: number; // in minutes
    actualTime?: number; // in seconds
    completed: boolean;
    createdAt: string;
    completedAt?: string;
    scheduledFor?: string;
}

export interface TimerState {
    isActive: boolean;
    taskId: string | null;
    remainingTime: number; // in seconds
    totalTime: number; // in seconds
    isPaused: boolean;
}

export interface DailyStats {
    date: string;
    totalFocusTime: number; // in minutes
    tasksCompleted: number;
    goalMinutes: number;
}