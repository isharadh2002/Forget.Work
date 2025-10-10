// src/components/TaskList.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/taskTypes';
import { getTasks, saveTasks } from '@/lib/storage';
import { Trash2, HelpCircle, Settings, RotateCw } from 'lucide-react';
import AddTaskForm from './AddTaskForm';
import { TimerWindowManager } from '@/lib/timerWindowManager';

export default function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const timerManagerRef = useRef<TimerWindowManager | null>(null);

    useEffect(() => {
        setMounted(true);
        setTasks(getTasks());

        timerManagerRef.current = new TimerWindowManager(handleCompleteTask);

        return () => {
            if (timerManagerRef.current) {
                timerManagerRef.current.cleanup();
            }
        };
    }, []);

    useEffect(() => {
        if (mounted) {
            saveTasks(tasks);
        }
    }, [tasks, mounted]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'TASK_COMPLETE') {
                handleCompleteTask(event.data.taskId, event.data.actualTime);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

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

    const deleteTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(tasks.filter(t => t.id !== id));
        if (selectedTaskId === id) setSelectedTaskId(null);
    };

    const selectTask = (taskId: string) => {
        setSelectedTaskId(taskId);
    };

    const startFocusTimer = () => {
        if (!selectedTaskId) {
            alert('Please select a task first!');
            return;
        }

        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return;

        if (timerManagerRef.current) {
            timerManagerRef.current.openTimer(task);
        }
    };

    const handleCompleteTask = (taskId: string, actualTime: number) => {
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId
                ? { ...t, completed: true, actualTime, completedAt: new Date().toISOString() }
                : t
        ));
        setSelectedTaskId(null);
    };

    const moveTaskToPending = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId
                ? { ...t, completed: false, actualTime: undefined, completedAt: undefined }
                : t
        ));
    };

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    if (!mounted) return null;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tasks</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">30m → 4:47 PM</p>
                </div>

                <div className="space-y-2 mb-4">
                    {activeTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => selectTask(task.id)}
                            className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-all ${selectedTaskId === task.id
                                ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400 dark:ring-blue-600'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-700'
                                }`}
                        >
                            <span className="text-gray-800 dark:text-gray-200">{task.title}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{task.estimatedTime}m</span>
                                <button
                                    onClick={(e) => deleteTask(task.id, e)}
                                    className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {showAddForm ? (
                        <AddTaskForm
                            onAdd={addTask}
                            onCancel={() => setShowAddForm(false)}
                        />
                    ) : (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full p-3 text-center text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-700 transition-colors"
                        >
                            +
                        </button>
                    )}
                </div>

                {selectedTaskId && (
                    <button
                        onClick={startFocusTimer}
                        className="w-full mb-4 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                    >
                        Start Focus Timer
                    </button>
                )}

                {completedTasks.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Completed Tasks</h3>
                        <div className="space-y-2">
                            {completedTasks.map(task => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-3 rounded border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-green-600 dark:text-green-400">✓</span>
                                        <span className="text-gray-500 dark:text-gray-400 line-through">{task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {task.actualTime ? `${Math.floor(task.actualTime / 60)}m ${task.actualTime % 60}s` : `${task.estimatedTime}m`}
                                        </span>
                                        <button
                                            onClick={(e) => moveTaskToPending(task.id, e)}
                                            className="text-gray-400 dark:text-gray-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                                            title="Do it again"
                                        >
                                            <RotateCw size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => deleteTask(task.id, e)}
                                            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                            title='Delete task'
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-center items-center gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <HelpCircle size={20} />
                    </button>
                    <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <Settings size={20} />
                    </button>
                </div>

                <div className="text-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        Manage Subscription
                    </button>
                </div>
            </div>
        </div>
    );
}