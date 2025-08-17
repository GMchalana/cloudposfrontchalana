'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { MoonIcon, SunIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">POS System</h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">
                {user.username}
              </span>
              <button
                onClick={() => logout()}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <ArrowLeftOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}