// src/components/Heatmap.tsx
'use client';

import { useEffect, useState } from 'react';
import { getDailyStats } from '@/lib/storage';
import { DailyStats } from '@/types/taskTypes';

export default function Heatmap() {
    const [stats, setStats] = useState<Record<string, DailyStats>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setStats(getDailyStats());
    }, []);

    if (!mounted) return null;

    // Generate a simplified heatmap grid
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weeks = 52;
    const daysPerWeek = 7;

    return (
        <div className="bg-gray-900 rounded-2xl p-8 overflow-x-auto">
            <div className="flex gap-2">
                <div className="flex flex-col justify-around text-xs text-gray-500 pr-2">
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                </div>
                <div>
                    <div className="flex gap-1 mb-2">
                        {months.map((month, i) => (
                            <div key={i} className="text-xs text-gray-500 w-[52px]">{month}</div>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        {Array.from({ length: weeks }).map((_, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1">
                                {Array.from({ length: daysPerWeek }).map((_, dayIndex) => {
                                    // Random intensity for demo
                                    const hasActivity = Math.random() > 0.7;
                                    const intensity = hasActivity
                                        ? `bg-green-${[400, 500, 600][Math.floor(Math.random() * 3)]}`
                                        : 'bg-gray-700';

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`w-3 h-3 rounded-sm ${intensity}`}
                                            title={`Week ${weekIndex + 1}, Day ${dayIndex + 1}`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}