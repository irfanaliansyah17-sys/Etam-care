import React, { useState, useMemo } from 'react';
import {
  X,
  UserCheck2,
  Check,
  Search,
  Plus,
  Shield,
  Clock,
  Sparkles,
  Building2,
} from 'lucide-react';
import { Nurse, ShiftType, UserRole } from '../types';
import { UserSession } from '../services/storageService';

interface SwitchNurseModalProps {
  isOpen: boolean;
  onClose: () => void;
  nurses: Nurse[];
  userSession: UserSession;
  onSelectNurse: (nurse: Nurse) => void;
  onOpenAddNurse?: () => void;
}

export const SwitchNurseModal: React.FC<SwitchNurseModalProps> = ({
  isOpen,
  onClose,
  nurses,
  userSession,
  onSelectNurse,
  onOpenAddNurse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNurses = useMemo(() => {
    return nurses.filter(n => {
      const matchSearch =
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.ward.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSearch;
    });
  }, [nurses, searchQuery]);

  if (!isOpen) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Kepala Ruangan (Karu)':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Ketua Tim (Katim)':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PJ Shift':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold';
      default:
        return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <UserCheck2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white leading-tight">
                Pilih Profil Pengguna Akun
              </h2>
              <p className="text-[11px] text-blue-100">
                Tentukan siapa perawat yang sedang bertugas menggunakan sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          {/* Current Active Nurse Highlight */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
              Profil Aktif Saat Ini
            </span>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-sm truncate">
                  {userSession.nurseName}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-600">
                  <span className="font-semibold text-blue-900">{userSession.role}</span>
                  <span>·</span>
                  <span className="text-slate-500">{userSession.ward}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Sedang Login</span>
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama perawat atau jabatan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* List of Registered Nurses */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              Pilih perawat yang menggunakan sistem ({filteredNurses.length}):
            </span>

            {filteredNurses.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Tidak ada perawat yang cocok dengan pencarian.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredNurses.map(nurse => {
                  const isCurrent = userSession.nurseName === nurse.name;

                  return (
                    <div
                      key={nurse.id}
                      onClick={() => {
                        onSelectNurse(nurse);
                        onClose();
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {nurse.name.replace('Ns. ', '').charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {nurse.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px]">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${getRoleBadge(
                                nurse.role
                              )}`}
                            >
                              {nurse.role}
                            </span>
                            <span className="text-slate-400 text-[10px]">· {nurse.ward}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCurrent ? (
                          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Pilih Akun
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {onOpenAddNurse && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddNurse();
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Perawat Baru</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs ml-auto cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
