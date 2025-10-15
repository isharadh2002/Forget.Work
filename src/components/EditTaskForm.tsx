// src/components/EditTaskForm.tsx
'use client';

import { useState } from 'react';
import { Task } from '@/types/taskTypes';
import DurationSlider from './DurationSlider';

interface EditTaskFormProps {
    task: Task;
    onSave: (id: string, title: string, estimatedTime: number) => void;
    onCancel: () => void;
}

export default function EditTaskForm({ task, onSave, onCancel }: EditTaskFormProps) {
    const [title, setTitle] = useState(task.title);
    const [time, setTime] = useState(task.estimatedTime);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSave(task.id, title, time);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="mb-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    autoFocus
                />
            </div>

            <div className="mb-4">
                <DurationSlider
                    value={time}
                    onChange={setTime}
                    min={5}
                    max={240}
                />
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}