import React, { useState, useEffect, useRef } from 'react';
import { X, Building2, Save, AlertCircle } from 'lucide-react';
import { Ward } from '../types';

interface WardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wardData: Omit<Ward, 'id'>, existingId?: string) => void;
  initialData?: Ward | null;
}

export const WardFormModal: React.FC<WardFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState(() => initialData?.name || '');
  const [totalBeds, setTotalBeds] = useState(() => String(initialData?.totalBeds || 16));
  const [description, setDescription] = useState(() => initialData?.description || '');
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
      setTotalBeds(String(initialData.totalBeds));
      setDescription(initialData.description || '');
    } else {
      setName('');
      setTotalBeds('16');
      setDescription('');
    }
    setError(null);
  }, [initialData?.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama bangsal wajib diisi');
      return;
    }

    onSave(
      {
        name: name.trim(),
        totalBeds: Number(totalBeds) || 16,
        description: description.trim(),
      },
      initialData?.id
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative z-10">
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-200" />
            <h2 className="font-bold text-base text-white">
              {initialData ? 'Ubah Data Bangsal' : 'Tambah Bangsal Baru'}
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Bangsal / Ruangan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Ruang Cempaka"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs sm:text-sm bg-slate-50 focus:bg-white font-semibold"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Jumlah Tempat Tidur (Bed)
            </label>
            <input
              type="number"
              value={totalBeds}
              onChange={e => setTotalBeds(e.target.value)}
              placeholder="16"
              min="1"
              max="100"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs sm:text-sm bg-slate-50 focus:bg-white font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Keterangan / Spesialisasi Bangsal
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Contoh: Rawat Inap Bedah & Orthopedi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
            />
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
              <span>{initialData ? 'Simpan Perubahan' : 'Tambah Bangsal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
