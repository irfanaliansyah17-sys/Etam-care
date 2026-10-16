import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Home, Skull, Save, AlertCircle, Bed, Building2 } from 'lucide-react';
import { Patient, Ward } from '../types';

export type StatusChangeType = 'pindah' | 'pulang' | 'meninggal';

interface PatientStatusModalProps {
  isOpen: boolean;
  type: StatusChangeType;
  patient: Patient | null;
  wards: Ward[];
  onClose: () => void;
  onConfirm: (
    patientId: string,
    statusType: StatusChangeType,
    details: {
      date: string;
      time: string;
      targetWard?: string;
      targetBed?: string;
      keepActive?: boolean;
      notes: string;
    }
  ) => void;
}

export const PatientStatusModal: React.FC<PatientStatusModalProps> = ({
  isOpen,
  type,
  patient,
  wards,
  onClose,
  onConfirm,
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [targetWard, setTargetWard] = useState<string>('');
  const [targetBed, setTargetBed] = useState<string>('');
  const [keepActive, setKeepActive] = useState<boolean>(true);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever modal opens or patient changes
  useEffect(() => {
    if (!isOpen || !patient) return;

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    setDate(currentDate);
    setTime(currentTime);

    // Find destination ward
    const otherWards = wards.filter(w => w.name !== patient.room);
    const initialWard = otherWards.length > 0 ? otherWards[0].name : (wards[0]?.name || 'Ruang Melati');
    setTargetWard(initialWard);
    setTargetBed(patient.bed || 'Bed 01');
    setKeepActive(true);
    setNotes('');
    setError(null);
  }, [isOpen, patient, type, wards]);

  if (!isOpen || !patient) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (type === 'pindah') {
      if (!targetWard) {
        setError('Silakan pilih bangsal atau ruangan tujuan.');
        return;
      }
    }

    const defaultNotes =
      type === 'pindah'
        ? `Pindah ke ${targetWard} (${targetBed || patient.bed || 'Bed baru'})`
        : type === 'pulang'
        ? 'Pasien pulang (KRS) dalam kondisi perbaikan'
        : 'Pencatatan pasien meninggal dunia';

    const finalNotes = notes.trim() || defaultNotes;

    try {
      onConfirm(patient.id, type, {
        date: date || new Date().toISOString().split('T')[0],
        time: time || '08:00',
        targetWard: type === 'pindah' ? targetWard : undefined,
        targetBed: type === 'pindah' ? targetBed : undefined,
        keepActive: type === 'pindah' ? keepActive : false,
        notes: finalNotes,
      });
      onClose();
    } catch (err: any) {
      console.error('Error confirming status change:', err);
      setError('Terjadi kendala saat menyimpan. Silakan coba lagi.');
    }
  };

  const getTitleAndIcon = () => {
    switch (type) {
      case 'pindah':
        return {
          title: 'Pindah Ruangan / Bangsal',
          desc: 'Pindahkan pasien ke bangsal atau tempat tidur lain',
          icon: ArrowRightLeft,
          color: 'bg-amber-600',
        };
      case 'pulang':
        return {
          title: 'Pasien Pulang (KRS)',
          desc: 'Pasien menyelesaikan masa rawat inap di ruangan',
          icon: Home,
          color: 'bg-emerald-600',
        };
      case 'meninggal':
        return {
          title: 'Pasien Meninggal Dunia',
          desc: 'Pencatatan klinis pasien meninggal di ruangan',
          icon: Skull,
          color: 'bg-slate-800',
        };
    }
  };

  const info = getTitleAndIcon();
  const Icon = info.icon;

  // Options for wards in pindah modal
  const selectableWards = wards.length > 0 ? wards : [
    { id: 'w-1', name: 'Ruang Teratai', totalBeds: 16 },
    { id: 'w-2', name: 'Ruang Melati', totalBeds: 20 },
    { id: 'w-3', name: 'Ruang Mawar', totalBeds: 12 },
    { id: 'w-4', name: 'Ruang ICU', totalBeds: 8 },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 relative max-h-[92vh]">
        
        {/* Header */}
        <div className={`p-4 text-white ${info.color} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base text-white leading-tight">
                {info.title}
              </h2>
              <p className="text-xs text-white/90 mt-0.5">{info.desc}</p>
            </div>
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

        {/* Patient Identity Banner */}
        <div className="bg-slate-50 p-3.5 border-b border-slate-200 text-xs shrink-0">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-900 text-sm">{patient.name}</div>
            <span className="font-mono text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {patient.rmNumber}
            </span>
          </div>
          <div className="text-slate-500 mt-1 flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Ruangan Saat Ini:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-bold">
              {patient.room} ({patient.bed})
            </span>
          </div>
        </div>

        {/* Form Body - Scrollable */}
        <form
          onSubmit={handleSubmit}
          className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1 custom-scrollbar"
        >
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* If Pindah: Ward and Bed Destination */}
          {type === 'pindah' && (
            <div className="space-y-3 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200">
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bangsal / Ruangan Tujuan</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetWard}
                  onChange={e => setTargetWard(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs bg-white font-bold text-slate-900"
                >
                  {selectableWards.map(w => (
                    <option key={w.id} value={w.name}>
                      {w.name} {w.name === patient.room ? '(Ruangan Saat Ini)' : ''} {w.description ? `· ${w.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Bed className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bed / Tempat Tidur Baru</span>
                </label>
                <input
                  type="text"
                  value={targetBed}
                  onChange={e => setTargetBed(e.target.value)}
                  placeholder="Contoh: Bed 02A, Bed 03"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs bg-white font-semibold text-slate-900"
                />
              </div>

              {/* Status Pasien Setelah Pindah */}
              <div className="pt-1 border-t border-amber-200/80">
                <label className="block font-bold text-slate-800 mb-1.5">
                  Status Pasien Setelah Pindah:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer hover:bg-amber-50/50">
                    <input
                      type="radio"
                      name="keepActive"
                      checked={keepActive === true}
                      onChange={() => setKeepActive(true)}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      <strong>Tetap Aktif Rawat Inap</strong> di ruangan baru ({targetWard || 'bangsal tujuan'})
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-amber-200 cursor-pointer hover:bg-amber-50/50">
                    <input
                      type="radio"
                      name="keepActive"
                      checked={keepActive === false}
                      onChange={() => setKeepActive(false)}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      <strong>Transfer Keluar / Rujuk Bangsal Luar</strong> (Status: Pindah)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jam <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-medium"
              />
            </div>
          </div>

          {/* Notes / Reason */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Keterangan / Alasan {type === 'pindah' ? 'Pindah' : type === 'pulang' ? 'Pulang' : 'Meninggal'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={
                type === 'pindah'
                  ? 'Contoh: Pasien memerlukan perawatan intensif, kondisi stabil, transport via brankar...'
                  : type === 'pulang'
                  ? 'Contoh: Pasien KRS perbaikan, obat pulang diserahkan, kontrol poli...'
                  : 'Contoh: Henti jantung, RJP 3 siklus tidak respon, dinyatakan meninggal oleh dr. DPJP...'
              }
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 placeholder:text-slate-400"
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-100 p-2.5 rounded-xl">
            {type === 'pindah' && keepActive
              ? `Catatan: Pasien akan langsung dipindahkan ke ${targetWard} (${targetBed || patient.bed}) dan tetap aktif dalam pemantauan asuhan keperawatan.`
              : 'Catatan: Seluruh riwayat tanda vital, catatan SOAP, terapi obat, dan timbang terima SBAR tetap tersimpan aman di sistem.'}
          </p>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className={`w-full min-h-[46px] text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs sm:text-sm cursor-pointer ${
                type === 'pindah'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : type === 'pulang'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-slate-900 hover:bg-black shadow-slate-900/20'
              }`}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>
                {type === 'pindah'
                  ? 'Simpan & Pindahkan Pasien Sekarang'
                  : type === 'pulang'
                  ? 'Konfirmasi Pasien Pulang (KRS)'
                  : 'Simpan Pencatatan Meninggal'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
