// src/components/TaskList.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/taskTypes';
import { getTasks, saveTasks, formatDuration } from '@/lib/storage';
import { Trash2, HelpCircle, Settings, RotateCw, Pencil, GripVertical, Play } from 'lucide-react';
import AddTaskForm from './AddTaskForm';
import EditTaskForm from './EditTaskForm';
import { TimerWindowManager } from '@/lib/timerWindowManager';
import { Reorder } from 'framer-motion';

export default function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [timeDisplay, setTimeDisplay] = useState<string>('');
    const timerManagerRef = useRef<TimerWindowManager | null>(null);

    useEffect(() => {
        setMounted(true);
        const loadedTasks = getTasks();
        setTasks(loadedTasks);

        // Check if any task has an active timer state and select it
        const activeTimerTask = loadedTasks.find(t => t.timerState?.isRunning);
        if (activeTimerTask) {
            setSelectedTaskId(activeTimerTask.id);
        }

        timerManagerRef.current = new TimerWindowManager(
            handleCompleteTask,
            handleTimerStateChange
        );

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
            } else if (event.data.type === 'TIMER_STATE_CHANGE') {
                handleTimerStateChange(
                    event.data.taskId,
                    event.data.remainingTime,
                    event.data.isPaused
                );
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const updateDisplay = () => {
            setTimeDisplay(getTimeDisplay());
        };

        updateDisplay();

        // Update time display every minute
        const interval = setInterval(updateDisplay, 60000);

        return () => clearInterval(interval);
    }, [mounted, selectedTaskId, tasks]);

    const handleTimerStateChange = (taskId: string, remainingTime: number, isPaused: boolean) => {
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId
                ? {
                    ...t,
                    timerState: {
                        isRunning: true,
                        remainingTime,
                        isPaused,
                        startedAt: t.timerState?.startedAt || new Date().toISOString(),
                        pausedAt: isPaused ? new Date().toISOString() : undefined
                    }
                }
                : t
        ));
    };

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

    const editTask = (id: string, title: string, estimatedTime: number) => {
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === id ? { ...t, title, estimatedTime } : t
        ));
        setEditingTaskId(null);
    };

    const deleteTask = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(tasks.filter(t => t.id !== id));
        if (selectedTaskId === id) setSelectedTaskId(null);
        if (editingTaskId === id) setEditingTaskId(null);
    };

    const selectTask = (taskId: string) => {
        if (editingTaskId) return;
        setSelectedTaskId(taskId);
    };

    const startEditTask = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTaskId(taskId);
        setSelectedTaskId(null);
    };

    const startFocusTimer = () => {
        if (!selectedTaskId) {
            alert('Please select a task first!');
            return;
        }

        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return;

        // Update task to mark timer as running
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === selectedTaskId
                ? {
                    ...t,
                    timerState: {
                        isRunning: true,
                        remainingTime: t.timerState?.remainingTime ?? t.estimatedTime * 60,
                        isPaused: false,
                        startedAt: new Date().toISOString()
                    }
                }
                : t
        ));

        if (timerManagerRef.current) {
            timerManagerRef.current.openTimer(task);
        }
    };

    const resumeTimer = (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        setSelectedTaskId(taskId);

        if (timerManagerRef.current) {
            timerManagerRef.current.openTimer(task);
        }
    };

    const handleCompleteTask = (taskId: string, actualTime: number) => {
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId
                ? {
                    ...t,
                    completed: true,
                    actualTime,
                    completedAt: new Date().toISOString(),
                    timerState: undefined // Clear timer state on completion
                }
                : t
        ));
        setSelectedTaskId(null);
    };

    const moveTaskToPending = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId
                ? {
                    ...t,
                    completed: false,
                    actualTime: undefined,
                    completedAt: undefined,
                    timerState: undefined
                }
                : t
        ));
    };

    // Handle reorder for active tasks
    const handleReorder = (newOrder: Task[]) => {
        const completedTasks = tasks.filter(t => t.completed);
        setTasks([...newOrder, ...completedTasks]);
    };

    // Calculate dynamic time display
    const getTimeDisplay = (): string => {
        const now = new Date();

        if (selectedTaskId) {
            const selectedTask = tasks.find(t => t.id === selectedTaskId);
            if (selectedTask) {
                // If task has active timer state, show remaining time
                if (selectedTask.timerState?.isRunning) {
                    const mins = Math.floor(selectedTask.timerState.remainingTime / 60);
                    const secs = selectedTask.timerState.remainingTime % 60;
                    return `Timer: ${mins}:${secs.toString().padStart(2, '0')} ${selectedTask.timerState.isPaused ? '(Paused)' : ''}`;
                }

                const endTime = new Date(now.getTime() + selectedTask.estimatedTime * 60000);
                const hours = endTime.getHours();
                const minutes = endTime.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const displayHours = hours % 12 || 12;
                const displayMinutes = minutes.toString().padStart(2, '0');
                return `${formatDuration(selectedTask.estimatedTime)} → ${displayHours}:${displayMinutes} ${ampm}`;
            }
        }

        // If no task selected, show pending tasks info
        const activeTasks = tasks.filter(t => !t.completed);
        if (activeTasks.length > 0) {
            const totalMinutes = activeTasks.reduce((sum, task) => sum + task.estimatedTime, 0);
            const taskText = activeTasks.length === 1 ? 'task' : 'tasks';
            return `${activeTasks.length} ${taskText} · ${formatDuration(totalMinutes)} total`;
        }

        return 'No pending tasks';
    };

    // Format time for task display (used in the task list items)
    const formatTaskTime = (minutes: number): string => {
        return formatDuration(minutes);
    };

    // Format actual time in seconds for completed tasks
    const formatActualTime = (seconds: number): string => {
        const totalMinutes = Math.floor(seconds / 60);
        const secs = seconds % 60;

        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            if (mins > 0) {
                return `${hours}h ${mins}m ${secs}s`;
            }
            return `${hours}h ${secs}s`;
        }

        return `${totalMinutes}m ${secs}s`;
    };

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    if (!mounted) return null;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tasks</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{timeDisplay}</p>
                </div>

                <Reorder.Group
                    axis="y"
                    values={activeTasks}
                    onReorder={handleReorder}
                    className="mb-4"
                    layoutScroll
                    style={{ overflowY: 'visible' }}
                >
                    {activeTasks.map(task => (
                        editingTaskId === task.id ? (
                            <div
                                key={task.id}
                                className="mb-2"
                                style={{
                                    animation: 'slideDown 0.2s ease-out'
                                }}
                            >
                                <EditTaskForm
                                    task={task}
                                    onSave={editTask}
                                    onCancel={() => setEditingTaskId(null)}
                                />
                            </div>
                        ) : (
                            <Reorder.Item
                                key={task.id}
                                value={task}
                                className="mb-2"
                                initial={false}
                                onDragStart={() => setIsDragging(true)}
                                onDragEnd={() => {
                                    setIsDragging(false);
                                }}
                                whileDrag={{
                                    scale: 1.03,
                                    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.15)",
                                    zIndex: 999,
                                    cursor: "grabbing"
                                }}
                                animate={{
                                    scale: 1,
                                    boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
                                }}
                                transition={{
                                    scale: { duration: 0.2 },
                                    boxShadow: { duration: 0.2 }
                                }}
                                layout
                                style={{
                                    position: 'relative',
                                    listStyle: 'none',
                                    cursor: 'grab'
                                }}
                            >
                                <div className={`flex items-center justify-between p-3 rounded border transition-colors ${selectedTaskId === task.id
                                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400 dark:ring-blue-600'
                                    : task.timerState?.isRunning
                                        ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-400 dark:border-yellow-600'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900'
                                    }`}>
                                    <div
                                        className="flex items-center gap-2 flex-1"
                                        onClick={(e) => {
                                            if (!isDragging) {
                                                e.stopPropagation();
                                                selectTask(task.id);
                                            }
                                        }}
                                        onPointerDown={(e) => {
                                            // Small delay to detect if it's a click or drag
                                            const pointerDownTime = Date.now();
                                            const handlePointerUp = () => {
                                                const timeDiff = Date.now() - pointerDownTime;
                                                // If released quickly (< 200ms), it's a click
                                                if (timeDiff < 200 && !isDragging) {
                                                    selectTask(task.id);
                                                }
                                                document.removeEventListener('pointerup', handlePointerUp);
                                            };
                                            document.addEventListener('pointerup', handlePointerUp);
                                        }}
                                    >
                                        <GripVertical size={16} className="text-gray-400 dark:text-gray-500" />
                                        <span className="text-gray-800 dark:text-gray-200 select-none">{task.title}</span>
                                        {task.timerState?.isRunning && (
                                            <span className="text-xs px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full">
                                                {task.timerState.isPaused ? 'Paused' : 'Running'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 select-none">
                                            {task.timerState?.isRunning
                                                ? formatTaskTime(Math.floor(task.timerState.remainingTime / 60))
                                                : formatTaskTime(task.estimatedTime)
                                            }
                                        </span>
                                        {task.timerState?.isRunning && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    resumeTimer(task.id);
                                                }}
                                                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors z-10"
                                                title="Resume timer"
                                            >
                                                <Play size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => startEditTask(task.id, e)}
                                            className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-10"
                                            title="Edit task"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => deleteTask(task.id, e)}
                                            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors z-10"
                                            title="Delete task"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </Reorder.Item>
                        )
                    ))}
                </Reorder.Group>

                <div
                    className="mb-4"
                    style={{
                        animation: showAddForm ? 'slideDown 0.2s ease-out' : 'none'
                    }}
                >
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
                        className="w-full mb-4 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                    >
                        {tasks.find(t => t.id === selectedTaskId)?.timerState?.isRunning
                            ? 'Resume Focus Timer'
                            : 'Start Focus Timer'
                        }
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
                                            {task.actualTime ? formatActualTime(task.actualTime) : formatTaskTime(task.estimatedTime)}
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