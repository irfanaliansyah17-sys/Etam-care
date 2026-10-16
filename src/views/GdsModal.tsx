import React, { useState, useEffect } from 'react';
import { X, Droplet, Save, AlertCircle, Clock, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { Patient } from '../types';

interface GdsModalProps {
  isOpen: boolean;
  patient: Patient | null;
  patients?: Patient[];
  currentNurseName?: string;
  onClose: () => void;
  onSaveGds: (patientId: string, gdsValue: number, timestamp: string, notes?: string) => void;
}

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
  const [date, setDate] = useState<string>(defaultDate);
  const [time, setTime] = useState<string>(defaultTime);
  const [notes, setNotes] = useState<string>('GDS Sewaktu');
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
            Daftarkan pasien terlebih dahulu sebelum mencatat GDS.
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

  const getGdsInterpretation = (val: number) => {
    if (val < 70) {
      return {
        label: 'Hipoglikemia (< 70 mg/dL)',
        color: 'bg-rose-100 text-rose-800 border-rose-300',
        note: 'Waspada lemas, keringat dingin, pusing. Siapkan glukosa/D40% jika diperlukan.',
      };
    }
    if (val <= 140) {
      return {
        label: 'Normal (70 - 140 mg/dL)',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        note: 'Kadar glukosa darah dalam batas optimal.',
      };
    }
    if (val < 200) {
      return {
        label: 'Meningkat / Pra-Diabetes (141 - 199 mg/dL)',
        color: 'bg-amber-100 text-amber-800 border-amber-300',
        note: 'Perlu pemantauan berkala dan diet rendah gula.',
      };
    }
    return {
      label: 'Hiperglikemia (≥ 200 mg/dL)',
      color: 'bg-rose-100 text-rose-800 border-rose-300',
      note: 'Tinggi. Laporkan ke DPJP atau sesuaikan dosis insulin sesuai protokol.',
    };
  };

  const currentGdsNum = Number(gdsValue);
  const interpretation = !isNaN(currentGdsNum) && gdsValue.trim() !== '' ? getGdsInterpretation(currentGdsNum) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = Number(gdsValue.trim());
    if (isNaN(parsed) || parsed <= 0) {
      setError('Masukkan angka GDS yang valid (misal: 120, 145, 210).');
      return;
    }

    const timestamp = `${date} ${time}`;
    onSaveGds(effectivePatient.id, parsed, timestamp, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
              <Droplet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white leading-tight">
                Pencatatan Khusus GDS Pasien
              </h2>
              <p className="text-[11px] text-amber-100">
                Catat Gula Darah Sewaktu fleksibel kapanpun tanpa harus input seluruh TTV
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

        {/* Patient Selection Banner / Dropdown */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs">
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
                    {pt.bed} - {pt.name} (RM: {pt.rmNumber}) · GDS Terakhir: {pt.gds ? `${pt.gds} mg/dL` : '-'}
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
                  GDS Saat Ini: {effectivePatient.gds ? `${effectivePatient.gds} mg/dL` : 'Belum Ada'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nilai GDS */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Hasil Pengukuran GDS (Gula Darah Sewaktu) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={gdsValue}
                onChange={e => setGdsValue(e.target.value)}
                placeholder="Contoh: 110, 145, 230..."
                min="20"
                max="800"
                className="w-full pl-3 pr-16 py-3 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none text-lg font-black text-slate-900 bg-amber-50/30"
                required
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                mg/dL
              </span>
            </div>

            {/* Quick GDS Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['80', '100', '120', '140', '160', '180', '200', '250'].map(val => (
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

          {/* Kondisi Pengambilan GDS */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Waktu / Kondisi Pengambilan
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'GDS Sewaktu',
                'GDP (Puasa)',
                'GDS 2 Jam PP',
                'Sebelum Tidur',
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setNotes(opt)}
                  className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    notes === opt
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Tanggal & Jam */}
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

          <div className="pt-1">
            <button
              type="submit"
              className="w-full min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Catatan GDS Pasien</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
