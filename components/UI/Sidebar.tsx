'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon,
  ShoppingCartIcon,
  TagIcon,
  FolderIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Products', href: '/products', icon: TagIcon },
    { name: 'Categories', href: '/categories', icon: FolderIcon },
    { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-gray-800 shadow">
      <div className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center p-2 rounded-lg ${pathname === item.href 
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}