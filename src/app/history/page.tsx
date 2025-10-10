// src/app/history/page.tsx
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Heatmap from '@/components/Heatmap';

export default function HistoryPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                <div className="max-w-6xl mx-auto">
                    <Link href="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm inline-flex items-center gap-1">
                        <ArrowLeft size={16} />
                        <span>Back to Focus!</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto py-8 px-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">History</h1>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">Year:</label>
                        <div className="relative">
                            <select className="appearance-none px-4 py-2 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Heatmap */}
                <Heatmap />

                {/* Daily Summary */}
                <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">10/9/2025</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Incomplete</span>
                            <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded-lg text-sm font-medium">
                                Goal: 2.01
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}