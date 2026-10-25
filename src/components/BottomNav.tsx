import React from 'react';
import {
  Home,
  Users,
  Stethoscope,
  UserCheck2,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';
import { MainMenuTab } from './Header';

interface BottomNavProps {
  currentTab: MainMenuTab;
  onChangeTab: (tab: MainMenuTab) => void;
  pendingActionsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  pendingActionsCount,
}) => {
  const tabs: {
    id: MainMenuTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'dpjp', label: 'DPJP', icon: Stethoscope },
    { id: 'perawat', label: 'Perawat', icon: UserCheck2 },
    { id: 'handover', label: 'Handover', icon: ArrowRightLeft },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-safe shadow-[0_-3px_12px_rgba(0,0,0,0.06)]">
      <div className="grid grid-cols-5 h-15 items-center px-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all select-none ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none tracking-tight truncate max-w-[54px]">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 w-5 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
