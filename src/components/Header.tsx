import React, { useState, useEffect } from 'react';
import {
  Clock,
  Building2,
  Settings,
  BookOpen,
  Home,
  Users,
  Stethoscope,
  UserCheck2,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';
import { UserSession } from '../services/storageService';

export type MainMenuTab =
  | 'beranda'
  | 'dpjp'
  | 'perawat'
  | 'handover'
  | 'laporan';

interface HeaderProps {
  currentTab: MainMenuTab;
  onChangeTab: (tab: MainMenuTab) => void;
  userSession: UserSession;
  onOpenSOP?: () => void;
  onOpenSettings: () => void;
  onOpenSwitchNurse?: () => void;
  onOpenQrModal?: () => void;
  onOpenDownloadModal?: () => void;
  onOpenSplashScreen?: () => void;
  pendingActionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onChangeTab,
  userSession,
  onOpenSOP,
  onOpenSettings,
  onOpenSwitchNurse,
  onOpenQrModal,
  onOpenDownloadModal,
  onOpenSplashScreen,
  pendingActionsCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: MainMenuTab; label: string; icon: React.ElementType }[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'dpjp', label: 'DPJP', icon: Stethoscope },
    { id: 'perawat', label: 'Perawat', icon: UserCheck2 },
    { id: 'handover', label: 'Handover SBAR', icon: ArrowRightLeft },
    { id: 'laporan', label: 'Laporan', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-30 bg-blue-600 text-white shadow-md">
      {/* Top Banner: Logos, Name, Clock, Ward, Nurse, Settings */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        
        {/* Brand Zone with UMKT & RSUD Parikesit Logos */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Partner Logos Container */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/95 rounded-xl px-1.5 sm:px-2 py-1 shadow-xs border border-white/20">
            {/* Logo UMKT */}
            <div
              className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0"
              title="Universitas Muhammadiyah Kalimantan Timur (UMKT)"
            >
              <img
                src="/logo-umkt.png"
                alt="Logo UMKT"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Subtle Divider */}
            <div className="w-[1px] h-4 sm:h-5 bg-slate-300" />

            {/* Logo RSUD Aji Muhammad Parikesit */}
            <div
              onClick={onOpenSplashScreen}
              className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center shrink-0 ${
                onOpenSplashScreen ? 'cursor-pointer hover:scale-110 active:scale-95 transition-transform' : ''
              }`}
              title="RSUD Aji Muhammad Parikesit Kutai Kartanegara"
            >
              <img
                src="/logo-parikesit.svg"
                alt="Logo RSUD AM Parikesit"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* System Name & Ward Indicator */}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                ETAM CARE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-blue-100 font-medium mt-0.5">
              <Building2 className="w-3 h-3 text-blue-200 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-none font-semibold">
                {userSession.ward} · UMKT & RSUD Parikesit
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Date & Clock (Visible on Tablet/Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-blue-700/60 border border-blue-500/40 px-3 py-1.5 rounded-xl text-xs text-blue-100 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
          <span className="font-medium text-white">{currentDate}</span>
          <span className="text-blue-300 font-mono font-bold">{currentTime}</span>
        </div>

        {/* Right: Active Nurse Badge & Settings (SOP removed) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Nurse Badge: Click to switch active nurse account */}
          <button
            onClick={() => {
              if (onOpenSwitchNurse) {
                onOpenSwitchNurse();
              } else {
                onChangeTab('perawat');
              }
            }}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs text-left transition-all border border-white/10 cursor-pointer"
            title="Klik untuk memilih perawat yang sedang menggunakan akun"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
            <div className="leading-tight">
              <div className="font-bold text-white text-[11px] sm:text-xs truncate max-w-[95px] sm:max-w-[140px] flex items-center gap-1">
                <span>{userSession.nurseName.replace('Ns. ', '')}</span>
                {userSession.activeNurseNames && userSession.activeNurseNames.length > 1 && (
                  <span className="text-[9px] bg-emerald-500/80 text-white px-1.5 py-0.2 rounded-full font-black">
                    +{userSession.activeNurseNames.length - 1}
                  </span>
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] text-blue-100 font-medium">
                {userSession.role}
                {userSession.activeNurseNames && userSession.activeNurseNames.length > 1
                  ? ` · ${userSession.activeNurseNames.length} Bertugas`
                  : ''}
              </div>
            </div>
          </button>

          {/* SOP Modal Trigger */}
          {onOpenSOP && (
            <button
              onClick={onOpenSOP}
              className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-colors"
              title="Pedoman Standar Operasional Prosedur (SOP)"
            >
              <BookOpen className="w-4 h-4 text-blue-200" />
            </button>
          )}

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-colors"
            title="Pengaturan Bangsal, DPJP, Perawat & Shift"
          >
            <Settings className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      </div>

      {/* Horizontal Navigation for Desktop/Tablet (NO SIDEBAR!) */}
      <div className="hidden md:block bg-blue-700/80 border-t border-blue-500/40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all relative whitespace-nowrap ${
                    isActive
                      ? 'text-white bg-white/15 rounded-t-lg'
                      : 'text-blue-100 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Real-time Indicator */}
          <div className="flex items-center gap-2 text-[11px] text-emerald-200 bg-blue-800/60 px-3 py-1 rounded-full border border-blue-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold tracking-wide">Real-Time Sync Aktif</span>
          </div>
        </div>
      </div>
    </header>
  );
};
