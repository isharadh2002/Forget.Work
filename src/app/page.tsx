// src/app/page.tsx
import TaskList from '@/components/TaskList';
import Link from 'next/link';
import { Clock, Settings, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Top Actions */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Link
            href="/history"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="History"
          >
            <Clock size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
          <ThemeToggle />
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} className="text-gray-600 dark:text-gray-400" />
          </Link>
        </div>

        <TaskList />
      </div>
    </div>
  );
}