// src/components/DurationSlider.tsx
'use client';

import { useState, useEffect } from 'react';

interface DurationSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}

export default function DurationSlider({
    value,
    onChange,
    min = 5,
    max = 240
}: DurationSliderProps) {
    const [inputValue, setInputValue] = useState(value.toString());

    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value);
        onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Only update if it's a valid number
        const numValue = parseInt(newValue);
        if (!isNaN(numValue) && numValue >= min && numValue <= max) {
            onChange(numValue);
        }
    };

    const handleInputBlur = () => {
        const numValue = parseInt(inputValue);
        if (isNaN(numValue) || numValue < min) {
            onChange(min);
            setInputValue(min.toString());
        } else if (numValue > max) {
            onChange(max);
            setInputValue(max.toString());
        }
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes)
            </label>
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={5}
                        value={value}
                        onChange={handleSliderChange}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb"
                        style={{
                            background: `linear-gradient(to right, #2563eb ${percentage}%, #e5e7eb ${percentage}%)`
                        }}
                    />
                </div>
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    min={min}
                    max={max}
                    className="w-16 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">m</span>
            </div>
        </div>
    );
}