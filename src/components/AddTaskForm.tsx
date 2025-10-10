// src/components/AddTaskForm.tsx
'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';

interface AddTaskFormProps {
    onAdd: (title: string, estimatedTime: number) => void;
    onCancel: () => void;
}

export default function AddTaskForm({ onAdd, onCancel }: AddTaskFormProps) {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState(30);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd(title, time);
            setTitle('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                autoFocus
            />
            <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-gray-400 dark:text-gray-500" />
                <select
                    value={time}
                    onChange={(e) => setTime(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                    <option value={15}>15m</option>
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>1h</option>
                    <option value={90}>1.5h</option>
                    <option value={120}>2h</option>
                </select>
            </div>
            <div className="flex gap-2">
                <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                    Add
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}