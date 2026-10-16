import React, { useState, useEffect, useRef } from 'react';
import { X, Stethoscope, Save, AlertCircle } from 'lucide-react';
import { DoctorDPJP } from '../types';

interface DpjpFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docData: Omit<DoctorDPJP, 'id'>, existingId?: string) => void;
  initialData?: DoctorDPJP | null;
  existingDoctors?: DoctorDPJP[];
}

export const DpjpFormModal: React.FC<DpjpFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingDoctors = [],
}) => {
  const [name, setName] = useState(() => initialData?.name || '');
  const [specialization, setSpecialization] = useState(
    () => initialData?.specialization || ''
  );
  const [status, setStatus] = useState<DoctorDPJP['status']>(
    () => initialData?.status || 'Aktif'
  );
  const [error, setError] = useState<string | null>(null);

  const lastOpenStateRef = useRef(isOpen);
  const lastTargetIdRef = useRef<string | undefined>(initialData?.id);

  useEffect(() => {
    const justOpened = isOpen && !lastOpenStateRef.current;
    const targetChanged = initialData?.id !== lastTargetIdRef.current;

    lastOpenStateRef.current = isOpen;
    lastTargetIdRef.current = initialData?.id;

    if (!justOpened && !targetChanged) return;

    if (initialData) {
      setName(initialData.name);
      setSpecialization(initialData.specialization || '');
      setStatus(initialData.status);
    } else {
      setName('');
      setSpecialization('');
      setStatus('Aktif');
    }
    setError(null);
  }, [initialData?.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Nama dokter DPJP wajib diisi');
      return;
    }

    // Tolak nama dokter yang terdouble / sudah terdaftar
    const isDuplicate = existingDoctors.some(
      d => d.name.trim().toLowerCase() === trimmedName.toLowerCase() && d.id !== initialData?.id
    );
    if (isDuplicate) {
      setError(`Dokter dengan nama "${trimmedName}" sudah tersimpan dalam daftar DPJP. Tidak dapat menambahkan nama dokter yang sama.`);
      return;
    }

    // Bidang spesialisasi opsional (tidak wajib diisi)
    const cleanSpec = specialization.trim() || 'Dokter Umum';

    onSave(
      {
        name: trimmedName,
        specialization: cleanSpec,
        status,
      },
      initialData?.id
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative z-10">
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-200" />
            <h2 className="font-bold text-base text-white">
              {initialData ? 'Ubah Dokter DPJP' : 'Tambah Dokter DPJP Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white cursor-pointer active:scale-95"
            aria-label="Tutup"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap &amp; Gelar Dokter <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: dr. Ahmad Subagyo, Sp.B"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs sm:text-sm bg-slate-50 focus:bg-white font-semibold"
              required
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700">
                Bidang Spesialisasi
              </label>
              <span className="text-[11px] font-semibold text-slate-400">
                (Opsional / Boleh Dikosongkan)
              </span>
            </div>
            <input
              type="text"
              value={specialization}
              onChange={e => setSpecialization(e.target.value)}
              placeholder="Contoh: Spesialis Bedah Umum, Penyakit Dalam... (boleh kosong)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs sm:text-sm bg-slate-50 focus:bg-white font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status Keaktifan</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Aktif', 'On-Call', 'Cuti'] as DoctorDPJP['status'][]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                    status === st
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs sm:text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer text-xs sm:text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Dokter DPJP'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
