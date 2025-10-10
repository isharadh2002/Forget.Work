// src/components/TimerPopup.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/taskTypes';
import { formatTime } from '@/lib/storage';
import { Play, Pause, X } from 'lucide-react';

interface TimerPopupProps {
    task: Task;
    onComplete: (taskId: string, actualTime: number) => void;
    onCancel: () => void;
}

export default function TimerPopup({ task, onComplete, onCancel }: TimerPopupProps) {
    const [remainingTime, setRemainingTime] = useState(task.estimatedTime * 60);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isPaused && remainingTime > 0) {
            intervalRef.current = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        onComplete(task.id, task.estimatedTime * 60);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPaused, remainingTime, task.id, task.estimatedTime, onComplete]);

    const progress = ((task.estimatedTime * 60 - remainingTime) / (task.estimatedTime * 60)) * 100;
    const isLowTime = remainingTime <= (task.estimatedTime * 60 * 0.2);

    return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-6">
            {/* Close Button */}
            <button
                onClick={onCancel}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <X size={24} className="text-gray-600" />
            </button>

            {/* Top Timer Display */}
            <div className="text-center mb-8">
                <div className={`text-6xl font-bold mb-2 ${isLowTime ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatTime(remainingTime)} {isLowTime && '🔥'}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-3xl mb-12">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${isLowTime ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Focus Time Card */}
            <div className="bg-yellow-400 rounded-2xl px-12 py-8 mb-8 text-center shadow-lg">
                <div className="text-sm font-medium text-gray-800 mb-2">Focus Time</div>
                <div className="text-5xl font-bold text-gray-900">{formatTime(remainingTime)}</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
                <div className="bg-gray-200 rounded-xl p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">Tasks Done</div>
                    <div className="text-4xl font-bold text-gray-900">4</div>
                </div>
                <div className="bg-gray-200 rounded-xl p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">Daily Goal</div>
                    <div className="text-4xl font-bold text-gray-900">0%</div>
                    <div className="text-xs text-gray-500 mt-1">Goal: 2h</div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="px-8 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                >
                    {isPaused ? (
                        <>
                            <Play size={20} />
                            Resume Today
                        </>
                    ) : (
                        <>
                            <Pause size={20} />
                            Pause
                        </>
                    )}
                </button>
                <button
                    onClick={onCancel}
                    className="px-8 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                    Plan Next day
                </button>
            </div>
        </div>
    );
}