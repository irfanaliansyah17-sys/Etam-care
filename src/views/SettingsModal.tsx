import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Save,
  Check,
  Plus,
  Edit2,
  Trash2,
  UserCheck2,
} from 'lucide-react';
import { Ward, DoctorDPJP, Nurse, UserRole, ShiftType, Patient } from '../types';
import { UserSession } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onSaveSession: (session: UserSession) => void;
  wards: Ward[];
  onOpenAddWard: () => void;
  onEditWard: (ward: Ward) => void;
  onDeleteWard: (ward: Ward) => void;
  patients: Patient[];
  doctors: DoctorDPJP[];
  nurses: Nurse[];
  onNavigateToTab: (tab: 'dpjp' | 'perawat') => void;
  onOpenSplashScreen?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onSaveSession,
  wards,
  onOpenAddWard,
  onEditWard,
  onDeleteWard,
  patients,
  doctors,
  nurses,
  onNavigateToTab,
  onOpenSplashScreen,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'wards' | 'system'>('profile');

  const [formData, setFormData] = useState<UserSession>({
    nurseName: userSession.nurseName,
    role: userSession.role,
    shift: userSession.shift,
    ward: userSession.ward,
  });

  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSession(formData);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="font-bold text-base text-white">Pengaturan Sistem ETAM CARE</h2>
              <p className="text-[11px] text-blue-100">RSUD AM Parikesit &amp; UMKT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Audit Trail & Reset Demo Removed) */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-center border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Profil Pengguna
          </button>
          <button
            onClick={() => setActiveTab('wards')}
            className={`flex-1 py-3 text-center border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'wards'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Daftar Bangsal ({wards.length})
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-3 text-center border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Informasi Sistem
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          
          {/* TAB 1: PROFIL PENGGUNA */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengaturan profil perawat berhasil diperbarui!</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Perawat Aktif (Pengguna Sesi)
                </label>

                {nurses.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">
                      Klik nama perawat di bawah untuk memilih akun:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                      {nurses.map(n => {
                        const isSelected = formData.nurseName === n.name;
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                nurseName: n.name,
                                role: n.role,
                                ward: n.ward || formData.ward,
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            <UserCheck2 className="w-3.5 h-3.5" />
                            <span>{n.name}</span>
                            <span className="text-[10px] opacity-80">({n.role.split(' ')[0]})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.nurseName}
                    onChange={e => setFormData({ ...formData, nurseName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-800"
                    placeholder="Nama Lengkap &amp; Gelar Perawat"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peran / Jabatan</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-medium text-slate-800 bg-white"
                  >
                    <option value="Perawat Pelaksana">Perawat Pelaksana</option>
                    <option value="PJ Shift">PJ Shift (Penanggung Jawab Shift)</option>
                    <option value="Ketua Tim (Katim)">Ketua Tim (Katim)</option>
                    <option value="Kepala Ruangan (Karu)">Kepala Ruangan (Karu)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bangsal / Ruang Rawat Inap</label>
                  <select
                    value={formData.ward}
                    onChange={e => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs font-medium text-slate-800 bg-white"
                  >
                    {wards.map(w => (
                      <option key={w.id} value={w.name}>
                        {w.name} ({w.totalBeds} TT)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="min-h-[44px] w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md text-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Sesi</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: DAFTAR BANGSAL */}
          {activeTab === 'wards' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 bg-blue-50 p-3 rounded-xl border border-blue-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Manajemen Bangsal &amp; Ruangan</h3>
                  <p className="text-[11px] text-slate-600">Kelola daftar bangsal perawatan rawat inap</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAddWard}
                  className="min-h-[40px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Bangsal</span>
                </button>
              </div>

              <div className="space-y-2">
                {wards.map(ward => {
                  const patientCount = patients.filter(
                    p => p.room === ward.name && p.lifeStatus === 'aktif'
                  ).length;

                  return (
                    <div
                      key={ward.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-xs">{ward.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
                            {ward.description || 'Rawat Inap'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Kapasitas: <span className="font-semibold text-slate-700">{ward.totalBeds} TT</span> · Terisi saat ini: <span className="font-semibold text-blue-600">{patientCount} pasien</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditWard(ward)}
                          className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title="Ubah Bangsal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteWard(ward)}
                          className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Bangsal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: INFORMASI SISTEM (RESET DEMO REMOVED) */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              {/* Keterangan Sistem */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 text-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-blue-950 text-sm">ETAM CARE · RSUD AM Parikesit</span>
                  </div>
                  {onOpenSplashScreen && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSplashScreen();
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-100 rounded-lg border border-blue-300 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <img src="/logo-parikesit.svg" alt="RSUD AM Parikesit" className="w-3.5 h-3.5 object-contain" />
                      <span>Lihat Layar Pembuka</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Aplikasi Integrated Nursing Management System ini dikembangkan untuk mendukung pelayanan keperawatan profesional di <strong>RSUD Aji Muhammad Parikesit Kutai Kartanegara</strong> bekerja sama dengan <strong>Universitas Muhammadiyah Kalimantan Timur (UMKT)</strong>.
                </p>
                <div className="text-[11px] text-blue-800 font-semibold bg-white/80 p-2.5 rounded-xl border border-blue-100 leading-normal">
                  Fokus: Peningkatan Keselamatan Pasien, Timbang Terima SBAR Terstruktur, Dokumentasi Asuhan Keperawatan Terpadu, dan Pemantauan TTV Terkini Berbasis Mobile-First.
                </div>
              </div>

              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 space-y-1 text-slate-700">
                <span className="font-bold text-blue-900 block text-xs">Status Sinkronisasi &amp; Database</span>
                <p className="text-xs leading-relaxed">
                  Semua data pasien, dokter DPJP, jadwal shift perawat, timbang terima SBAR, dan catatan klinis tersinkronisasi otomatis antar perangkat serta tersimpan persisten di server.
                </p>
              </div>

              {/* Tautan Web Resmi Rumah Sakit */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>Tautan Akses Resmi RS:</span>
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
                    Resmi &amp; Bersih
                  </span>
                </div>
                <div className="font-mono font-bold text-blue-700 bg-white p-2 rounded-lg border border-emerald-200 text-xs select-all">
                  https://s.id/etamcare
                </div>
                <p className="text-[11px] text-slate-600">
                  Dapat dibagikan ke WhatsApp perawat atau ditempel pada QR bangsal tanpa nama teknis server AI.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
                <span>Versi Aplikasi:</span>
                <span className="font-mono font-bold text-slate-800">ETAM CARE v2.4 (Production Ready)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
