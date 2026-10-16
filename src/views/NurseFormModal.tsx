import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UserCheck2,
  Save,
  AlertCircle,
  Sparkles,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Nurse, UserRole, ShiftType, Ward } from '../types';

interface NurseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nurseData: Omit<Nurse, 'id'>, existingId?: string) => void;
  initialData?: Nurse | null;
  wards: Ward[];
  defaultShift?: ShiftType;
  defaultWard?: string;
  nurses?: Nurse[];
}

export const NurseFormModal: React.FC<NurseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  wards,
  defaultShift,
  defaultWard,
  nurses = [],
}) => {
  const fallbackWard = defaultWard || (wards && wards.length > 0 ? wards[0].name : 'Ruang Teratai');

  const [name, setName] = useState(() => initialData?.name || '');
  const [role, setRole] = useState<UserRole>(() => initialData?.role || 'Perawat Pelaksana');
  const [currentShift, setCurrentShift] = useState<ShiftType>(
    () => initialData?.currentShift || defaultShift || 'Pagi (07.00 - 14.00)'
  );
  const [ward, setWard] = useState(() => initialData?.ward || fallbackWard);
  const [isActive, setIsActive] = useState(
    () => (initialData?.isActive !== undefined ? initialData.isActive : true)
  );
  const [isOnDuty, setIsOnDuty] = useState(() => (initialData ? Boolean(initialData.isOnDuty) : true));
  const [error, setError] = useState<string | null>(null);

  // Track initialData ID and open state transitions
  const lastTargetIdRef = useRef<string | undefined>(initialData?.id);
  const lastOpenStateRef = useRef(isOpen);

  useEffect(() => {
    // Only re-initialize if modal transitioned from closed to open,
    // OR if the nurse being edited actually changed to a different nurse ID.
    // NEVER re-initialize while the user is actively typing in an already-open modal!
    const justOpened = isOpen && !lastOpenStateRef.current;
    const targetChanged = initialData?.id !== lastTargetIdRef.current;

    lastOpenStateRef.current = isOpen;
    lastTargetIdRef.current = initialData?.id;

    if (justOpened || targetChanged) {
      if (initialData) {
        setName(initialData.name || '');
        setRole(initialData.role || 'Perawat Pelaksana');
        setCurrentShift(initialData.currentShift || defaultShift || 'Pagi (07.00 - 14.00)');
        setWard(initialData.ward || fallbackWard);
        setIsActive(initialData.isActive !== undefined ? initialData.isActive : true);
        setIsOnDuty(Boolean(initialData.isOnDuty));
      } else {
        setName('');
        setRole('Perawat Pelaksana');
        setCurrentShift(defaultShift || 'Pagi (07.00 - 14.00)');
        setWard(defaultWard || fallbackWard);
        setIsActive(true);
        setIsOnDuty(true);
      }
      setError(null);
    }
  }, [isOpen, initialData?.id]);

  if (!isOpen) return null;

  // Title helpers
  const handleAddPrefixNs = () => {
    if (!name.startsWith('Ns. ')) {
      setName(prev => (prev.startsWith('Ns.') ? prev.replace(/^Ns\.\s*/, 'Ns. ') : `Ns. ${prev}`));
    }
  };

  const handleAddSuffixSKep = () => {
    if (!name.includes('S.Kep')) {
      setName(prev => (prev.trim() ? `${prev.trim()}, S.Kep` : 'S.Kep'));
    }
  };

  const handleAddSuffixAMdKep = () => {
    if (!name.includes('A.Md.Kep')) {
      setName(prev => (prev.trim() ? `${prev.trim()}, A.Md.Kep` : 'A.Md.Kep'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Silakan masukkan nama lengkap perawat.');
      return;
    }

    if (trimmed.length < 2) {
      setError('Nama perawat terlalu pendek (minimal 2 karakter).');
      return;
    }

    // Tolak nama perawat yang terdouble / sudah terdaftar
    const isDuplicate = nurses.some(
      n => n.name.trim().toLowerCase() === trimmed.toLowerCase() && n.id !== initialData?.id
    );
    if (isDuplicate) {
      setError(`Perawat dengan nama "${trimmed}" sudah terdaftar dalam sistem. Tidak dapat menambahkan nama perawat yang sama.`);
      return;
    }

    try {
      onSave(
        {
          name: trimmed,
          role,
          currentShift,
          ward: ward || (wards && wards.length > 0 ? wards[0].name : 'Ruang Teratai'),
          isActive,
          isOnDuty,
        },
        initialData?.id
      );
      setError(null);
    } catch (err: any) {
      console.error('Error in NurseFormModal onSave:', err);
      setError('Terjadi kendala saat menyimpan. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 relative">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <UserCheck2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-white leading-tight">
                {initialData ? 'Ubah Data Tenaga Perawat' : 'Tambah Tenaga Perawat Baru'}
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                {initialData
                  ? 'Perbarui informasi profil dan penugasan perawat'
                  : 'Daftarkan nama perawat ke dalam roster jadwal & sistem'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white cursor-pointer active:scale-95"
            aria-label="Tutup"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body - Scrollable with custom scrollbar and tidy inputs */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm overflow-y-auto custom-scrollbar flex-1 scroll-smooth"
        >
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">{error}</span>
            </div>
          )}

          {/* Nama Lengkap & Gelar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-black text-slate-800 text-xs sm:text-sm">
                Nama Lengkap &amp; Gelar <span className="text-rose-500">*</span>
              </label>
              {/* Quick Title Badges */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddPrefixNs}
                  className="min-h-[32px] px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer active:scale-95 transition-all"
                  title="Tambahkan awalan Ns."
                >
                  + Ns.
                </button>
                <button
                  type="button"
                  onClick={handleAddSuffixSKep}
                  className="min-h-[32px] px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer active:scale-95 transition-all"
                  title="Tambahkan akhiran , S.Kep"
                >
                  + S.Kep
                </button>
                <button
                  type="button"
                  onClick={handleAddSuffixAMdKep}
                  className="min-h-[32px] px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 cursor-pointer active:scale-95 transition-all"
                  title="Tambahkan akhiran , A.Md.Kep"
                >
                  + A.Md.Kep
                </button>
              </div>
            </div>

            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ketik nama lengkap perawat (contoh: Ns. Ahmad Fauzi, S.Kep)"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-sm sm:text-base bg-slate-50 focus:bg-white font-bold"
              required
              autoFocus
              autoComplete="off"
            />
            <p className="text-xs text-slate-500">
              Dapat menyertakan gelar akademik (contoh: Ns. Ahmad, S.Kep atau Siti, A.Md.Kep)
            </p>
          </div>

          {/* Jabatan & Bangsal Penugasan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-black text-slate-800 text-xs sm:text-sm">
                  Jabatan / Peran
                </label>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {role}
                </span>
              </div>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs sm:text-sm bg-slate-50 font-bold"
              >
                <option value="Perawat Pelaksana">Perawat Pelaksana</option>
                <option value="PJ Shift">PJ Shift (Penanggung Jawab Shift)</option>
                <option value="Ketua Tim (Katim)">Ketua Tim (Katim)</option>
                <option value="Kepala Ruangan (Karu)">Kepala Ruangan (Karu)</option>
              </select>

              {/* Tombol Cepat Pilihan Jabatan */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setRole('PJ Shift')}
                  className={`min-h-[28px] px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                    role === 'PJ Shift'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  + PJ Shift
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Perawat Pelaksana')}
                  className={`min-h-[28px] px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                    role === 'Perawat Pelaksana'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Pelaksana
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Ketua Tim (Katim)')}
                  className={`min-h-[28px] px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                    role === 'Ketua Tim (Katim)'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Katim
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Kepala Ruangan (Karu)')}
                  className={`min-h-[28px] px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                    role === 'Kepala Ruangan (Karu)'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  Karu
                </button>
              </div>
            </div>

            <div>
              <label className="block font-black text-slate-800 text-xs sm:text-sm mb-1.5">
                Bangsal Penugasan
              </label>
              <select
                value={ward}
                onChange={e => setWard(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs sm:text-sm bg-slate-50 font-bold"
              >
                {wards && wards.length > 0 ? (
                  wards.map(w => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))
                ) : (
                  <option value="Ruang Teratai">Ruang Teratai</option>
                )}
              </select>
            </div>
          </div>

          {/* Duty & Active Checkboxes - Enlarged & Spacious */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200/90 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isOnDuty}
                onChange={e => setIsOnDuty(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer mt-0.5 shrink-0"
              />
              <div>
                <span className="font-black text-slate-900 text-sm sm:text-base block">
                  Langsung bertugas aktif (On Duty)
                </span>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                  Centang agar perawat langsung tercatat dalam daftar perawat ruangan yang sedang bertugas
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer pt-3.5 border-t border-blue-200">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer mt-0.5 shrink-0"
              />
              <div>
                <span className="font-black text-slate-900 text-sm sm:text-base block">
                  Staff aktif
                </span>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
                  Status kepegawaian aktif di rumah sakit (bukan cuti atau libur)
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xs text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Perawat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

