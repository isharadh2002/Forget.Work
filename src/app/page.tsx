// src/app/page.tsx
import TaskList from '@/components/TaskList';
import Link from 'next/link';
import { Clock, Settings, X } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Got a feature in mind or something you&apos;d love to see?{' '}
            <a href="#" className="text-blue-600 underline">
              Vote or make new suggestions on our public roadmap →
            </a>
          </p>
          <button className="text-gray-400 hover:text-gray-600 text-xl">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Top Actions */}
        <div className="flex items-center justify-end gap-3 mb-6">
          <Link
            href="/history"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="History"
          >
            <Clock size={20} className="text-gray-600" />
          </Link>
          <Link
            href="/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} className="text-gray-600" />
          </Link>
        </div>

        <TaskList />
      </div>
    </div>
  );
}