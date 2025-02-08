'use client';

import { 
  LayoutDashboard, 
  FileText, 
  Bell, 
  User, 
  Settings 
} from 'lucide-react';
import Link from 'next/link';

type DashboardView = 'dashboard' | 'requests' | 'notifications' | 'profile' | 'settings';

interface BottomNavProps {
  currentView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}

export function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const navItems = [
    { view: 'dashboard' as DashboardView, icon: LayoutDashboard, label: 'Home' },
    { view: 'requests' as DashboardView, icon: FileText, label: 'Requests' },
    { view: 'notifications' as DashboardView, icon: Bell, label: 'Alerts' },
    { view: 'profile' as DashboardView, icon: User, label: 'Profile' },
    { view: 'settings' as DashboardView, icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <nav className="flex justify-around items-center h-16">
        {navItems.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => onNavigate(view)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1
              ${currentView === view ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
} 