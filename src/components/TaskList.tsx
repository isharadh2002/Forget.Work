// src/components/TaskList.tsx
'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/taskTypes';
import { getTasks, saveTasks } from '@/lib/storage';
import { Trash2, HelpCircle, Sun, Settings } from 'lucide-react';
import AddTaskForm from './AddTaskForm';
import TimerPopup from './TimerPopup';

export default function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTasks(getTasks());
    }, []);

    useEffect(() => {
        if (mounted) {
            saveTasks(tasks);
        }
    }, [tasks, mounted]);

    const addTask = (title: string, estimatedTime: number) => {
        const newTask: Task = {
            id: Date.now().toString(),
            title,
            estimatedTime,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        setTasks([...tasks, newTask]);
        setShowAddForm(false);
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const startFocus = (taskId: string) => {
        setActiveTaskId(taskId);
    };

    const completeTask = (taskId: string, actualTime: number) => {
        setTasks(tasks.map(t =>
            t.id === taskId
                ? { ...t, completed: true, actualTime, completedAt: new Date().toISOString() }
                : t
        ));
        setActiveTaskId(null);
    };

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    if (!mounted) return null;

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6">
                    {/* Header */}
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                        <p className="text-sm text-gray-500">30m → 4:47 PM</p>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2 mb-4">
                        {activeTasks.map(task => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border border-gray-100"
                            >
                                <span className="text-gray-800">{task.title}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">{task.estimatedTime}m</span>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Task Form or Button */}
                        {showAddForm ? (
                            <AddTaskForm
                                onAdd={addTask}
                                onCancel={() => setShowAddForm(false)}
                            />
                        ) : (
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="w-full p-3 text-center text-gray-400 hover:bg-gray-50 rounded border border-dashed border-gray-300 transition-colors"
                            >
                                +
                            </button>
                        )}
                    </div>

                    {/* Bottom Icons */}
                    <div className="flex justify-center items-center gap-6 pt-4 border-t border-gray-100">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <HelpCircle size={20} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Sun size={20} />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>

                    {/* Manage Subscription Link */}
                    <div className="text-center mt-4 pt-4 border-t border-gray-100">
                        <button className="text-sm text-gray-500 hover:text-gray-700">
                            Manage Subscription
                        </button>
                    </div>
                </div>
            </div>

            {/* Timer Popup */}
            {activeTaskId && (
                <TimerPopup
                    task={tasks.find(t => t.id === activeTaskId)!}
                    onComplete={completeTask}
                    onCancel={() => setActiveTaskId(null)}
                />
            )}
        </>
    );
}