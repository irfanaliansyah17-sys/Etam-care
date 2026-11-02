import React, { useState, useEffect } from 'react';
import { X, Droplet, Save, AlertCircle, Clock, Calendar, Users, CheckCircle2, Activity } from 'lucide-react';
import { Patient, SugarTestType } from '../types';

interface GdsModalProps {
  isOpen: boolean;
  patient: Patient | null;
  patients?: Patient[];
  currentNurseName?: string;
  onClose: () => void;
  onSaveGds: (
    patientId: string,
    gdsValue: number,
    timestamp: string,
    notes?: string,
    sugarType?: SugarTestType | string
  ) => void;
}

export const SUGAR_CATEGORIES: { id: SugarTestType; label: string; desc: string; normalRange: string }[] = [
  {
    id: 'GDS (Sewaktu)',
    label: 'GDS (Sewaktu / Acak)',
    desc: 'Pengukuran sewaktu tanpa puasa',
    normalRange: '< 140 mg/dL',
  },
  {
    id: 'GDP (Puasa)',
    label: 'GDP (Puasa ≥8 Jam)',
    desc: 'Pagi hari sebelum sarapan / puasa',
    normalRange: '70 - 99 mg/dL',
  },
  {
    id: 'GD2PP (2 Jam PP)',
    label: 'GD2PP (2 Jam Setelah Makan)',
    desc: '2 jam paska makan / post prandial',
    normalRange: '< 140 mg/dL',
  },
  {
    id: 'Sebelum Tidur',
    label: 'Sebelum Tidur (Bedtime)',
    desc: 'Sebelum istirahat malam hari',
    normalRange: '100 - 140 mg/dL',
  },
  {
    id: 'Pre-Prandial (Sebelum Makan)',
    label: 'Pre-Prandial (Sebelum Makan)',
    desc: 'Sebelum jadwal makan siang / malam',
    normalRange: '80 - 130 mg/dL',
  },
  {
    id: 'Post-Prandial (Setelah Makan)',
    label: 'Post-Prandial (Setelah Makan)',
    desc: 'Paska konsumsi makanan',
    normalRange: '< 180 mg/dL',
  },
  {
    id: 'Pemeriksaan Khusus',
    label: 'Pemeriksaan Khusus / Lainnya',
    desc: 'Protokol khusus / sliding scale',
    normalRange: 'Sesuai indikasi DPJP',
  },
];

export const GdsModal: React.FC<GdsModalProps> = ({
  isOpen,
  patient,
  patients = [],
  currentNurseName = 'Perawat Bertugas',
  onClose,
  onSaveGds,
}) => {
  const activePatients = patients.filter(p => p.lifeStatus === 'aktif');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const [gdsValue, setGdsValue] = useState<string>('');
  const [sugarType, setSugarType] = useState<SugarTestType>('GDS (Sewaktu)');
  const [date, setDate] = useState<string>(defaultDate);
  const [time, setTime] = useState<string>(defaultTime);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (patient) {
      setSelectedPatientId(patient.id);
      if (patient.gds !== undefined && patient.gds !== null) {
        setGdsValue(String(patient.gds));
      } else {
        setGdsValue('');
      }
    } else if (activePatients.length > 0) {
      setSelectedPatientId(prev => (prev ? prev : activePatients[0].id));
    }
  }, [patient, isOpen, activePatients]);

  useEffect(() => {
    const current = new Date();
    setDate(current.toISOString().split('T')[0]);
    setTime(
      `${String(current.getHours()).padStart(2, '0')}:${String(
        current.getMinutes()
      ).padStart(2, '0')}`
    );
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const effectivePatient =
    patient || activePatients.find(p => p.id === selectedPatientId) || activePatients[0] || null;

  if (!effectivePatient) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Droplet className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Pasien Aktif</h3>
          <p className="text-xs text-slate-500">
            Daftarkan pasien terlebih dahulu sebelum mencatat hasil pemeriksaan gula darah.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Clinical interpretation based on test type
  const getSugarInterpretation = (val: number, type: SugarTestType) => {
    if (val < 70) {
      return {
        label: 'Hipoglikemia (< 70 mg/dL)',
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        note: 'Waspada lemas, keringat dingin, pusing, tremor. Berikan sumber glukosa / D40% sesuai instruksi DPJP.',
      };
    }

    if (type === 'GDP (Puasa)') {
      if (val <= 99) {
        return {
          label: 'Normal Puasa (70 - 99 mg/dL)',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          note: 'Kadar gula darah puasa dalam rentang optimal.',
        };
      }
      if (val <= 125) {
        return {
          label: 'Pra-Diabetes / Glukosa Puasa Terganggu (100 - 125 mg/dL)',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          note: 'Meningkat di atas normal puasa. Perhatikan asupan diet dan monitoring lanjutan.',
        };
      }
      return {
        label: 'Hiperglikemia Puasa (≥ 126 mg/dL)',
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        note: 'Kadar gula darah puasa tinggi. Laporkan ke DPJP untuk penyesuaian regimen terapi / insulin.',
      };
    }

    // GDS, GD2PP, etc.
    if (val <= 140) {
      return {
        label: 'Normal (70 - 140 mg/dL)',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        note: 'Kadar gula darah dalam batas optimal.',
      };
    }
    if (val < 200) {
      return {
        label: 'Toleransi Glukosa Terganggu / Pra-Diabetes (141 - 199 mg/dL)',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        note: 'Perlu pemantauan berkala dan evaluasi pola nutrisi/cairan.',
      };
    }
    return {
      label: 'Hiperglikemia (≥ 200 mg/dL)',
      color: 'bg-rose-100 text-rose-800 border-rose-300',
      note: 'Tinggi. Konsultasikan ke DPJP dan evaluasi pemberian insulin sesuai protokol koreksi.',
    };
  };

  const currentGdsNum = Number(gdsValue);
  const interpretation =
    !isNaN(currentGdsNum) && gdsValue.trim() !== ''
      ? getSugarInterpretation(currentGdsNum, sugarType)
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = Number(gdsValue.trim());
    if (isNaN(parsed) || parsed <= 0) {
      setError('Masukkan angka kadar gula darah yang valid (misal: 110, 145, 210).');
      return;
    }

    const timestamp = `${date} ${time}`;
    onSaveGds(effectivePatient.id, parsed, timestamp, notes.trim() || undefined, sugarType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white leading-tight">
                Pencatatan Pemeriksaan Gula Darah
              </h2>
              <p className="text-[11px] text-amber-100">
                Pilih kategori jenis pemeriksaan gula &amp; catat hasil pengukuran
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white active:scale-95 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Selection Banner */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs shrink-0">
          {!patient && activePatients.length > 1 ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Pilih Pasien Target:</span>
              </label>
              <select
                value={effectivePatient.id}
                onChange={e => {
                  setSelectedPatientId(e.target.value);
                  const pt = activePatients.find(p => p.id === e.target.value);
                  if (pt && pt.gds !== undefined && pt.gds !== null) {
                    setGdsValue(String(pt.gds));
                  } else {
                    setGdsValue('');
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                {activePatients.map(pt => (
                  <option key={pt.id} value={pt.id}>
                    {pt.bed} - {pt.name} (RM: {pt.rmNumber}) · Gula Terakhir: {pt.gds ? `${pt.gds} mg/dL` : '-'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{effectivePatient.name}</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  RM: {effectivePatient.rmNumber} · Bed: {effectivePatient.bed} · {effectivePatient.room}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Gula Terakhir: {effectivePatient.gds ? `${effectivePatient.gds} mg/dL` : 'Belum Ada'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* KATEGORI JENIS PEMERIKSAAN GULA DARAH */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                <span>Pilih Kategori Jenis Gula Darah:</span>
              </label>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Wajib Dipilih
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SUGAR_CATEGORIES.map(cat => {
                const isSelected = sugarType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSugarType(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/90 border-amber-500 shadow-2xs ring-2 ring-amber-400/20 text-amber-950'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-amber-900' : 'text-slate-800'}`}>
                        {cat.label}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nilai Gula Darah */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800 text-xs">
              Hasil Kadar Gula Darah <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={gdsValue}
                onChange={e => setGdsValue(e.target.value)}
                placeholder="Contoh: 95, 120, 145, 230..."
                min="20"
                max="800"
                className="w-full pl-3 pr-16 py-3 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none text-xl font-black text-slate-900 bg-amber-50/30"
                required
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                mg/dL
              </span>
            </div>

            {/* Quick Sugar Value Chips */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {['70', '90', '110', '126', '140', '180', '200', '250', '300'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGdsValue(val)}
                  className={`text-[10.5px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    gdsValue === val
                      ? 'bg-amber-600 text-white border-amber-600 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Interpretation Badge */}
            {interpretation && (
              <div className={`mt-2 p-2.5 rounded-xl border text-[11px] space-y-0.5 ${interpretation.color}`}>
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{interpretation.label}</span>
                </div>
                <p className="text-[10px] opacity-90">{interpretation.note}</p>
              </div>
            )}
          </div>

          {/* Waktu Pemeriksaan: Tanggal & Jam */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-600 block">
              Waktu Pemeriksaan:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium"
              />
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium font-mono"
              />
            </div>
          </div>

          {/* Catatan Tambahan (Opsional) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
              Keterangan / Kondisi Tambahan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Sebelum suntik insulin 8 IU, setelah sarapan bubur, lemas..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[46px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Catatan Gula Darah Pasien</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
