import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardList,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Check,
  Building2,
  User,
  HeartPulse,
} from 'lucide-react';
import { Patient, NursingAction, ShiftType } from '../types';

interface NursingActionModalProps {
  isOpen: boolean;
  patient: Patient | null;
  patients: Patient[];
  actions: NursingAction[];
  currentNurseName: string;
  currentShift: ShiftType;
  onClose: () => void;
  onSaveAction: (actionData: Omit<NursingAction, 'id'>, existingId?: string) => void;
  onToggleComplete: (actionId: string) => void;
  onDeleteAction?: (actionId: string) => void;
  onOpenHandoverWithPatient?: (patientId: string) => void;
}

export const NursingActionModal: React.FC<NursingActionModalProps> = ({
  isOpen,
  patient,
  patients,
  actions,
  currentNurseName,
  currentShift,
  onClose,
  onSaveAction,
  onToggleComplete,
  onDeleteAction,
  onOpenHandoverWithPatient,
}) => {
  const activePatients = patients.filter(p => p.lifeStatus === 'aktif');

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patient?.id || activePatients[0]?.id || ''
  );

  // New action form state (Sederhana & Simpel)
  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  const defaultDate = now.toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NursingAction['category']>('Observasi');
  const [time, setTime] = useState(defaultTime);
  const [date, setDate] = useState(defaultDate);
  const [isCompletedNow, setIsCompletedNow] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Quick action templates for nurses (1-click autofill)
  const quickActionTemplates = [
    { title: 'Injeksi Obat Terapi DPJP', category: 'Medikasi' as const },
    { title: 'Perawatan & Ganti Balutan Luka', category: 'Perawatan Luka' as const },
    { title: 'Pemasangan / Perawatan Infus', category: 'Nutrisi/Cairan' as const },
    { title: 'Inhalasi / Nebulisasi Bronkodilator', category: 'Oksigenasi' as const },
    { title: 'Observasi TTV & Kondisi Pasien', category: 'Observasi' as const },
    { title: 'Mobilisasi / Ubah Posisi Pasien', category: 'Lainnya' as const },
    { title: 'Pengambilan Sampel Darah Lab', category: 'Observasi' as const },
    { title: 'Pemasangan Kateter Urin', category: 'Nutrisi/Cairan' as const },
  ];

  useEffect(() => {
    if (patient) {
      setSelectedPatientId(patient.id);
    } else if (activePatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(activePatients[0].id);
    }
    setError(null);
  }, [patient, isOpen, activePatients]);

  if (!isOpen) return null;

  const currentPatient =
    activePatients.find(p => p.id === selectedPatientId) || patient || activePatients[0];

  // Actions for the currently selected patient
  const patientActions = actions
    .filter(a => a.patientId === currentPatient?.id)
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

  const completedActions = patientActions.filter(a => a.completed);
  const pendingActions = patientActions.filter(a => !a.completed);

  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) {
      setError('Pilih pasien terlebih dahulu.');
      return;
    }
    if (!title.trim()) {
      setError('Tuliskan nama tindakan keperawatan.');
      return;
    }

    const timestamp = `${date} ${time}`;
    onSaveAction({
      patientId: currentPatient.id,
      timestamp,
      category,
      title: title.trim(),
      notes: notes.trim() || undefined,
      completed: isCompletedNow,
      completedAt: isCompletedNow ? timestamp : undefined,
      nurseName: currentNurseName,
      shift: currentShift,
    });

    // Reset simple form (default to belum dilakukan / pending)
    setTitle('');
    setNotes('');
    setIsCompletedNow(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base text-white leading-tight">
                Pencatatan Tindakan Keperawatan
              </h2>
              <p className="text-[11px] text-blue-100">
                Pilih pasien &amp; catat rencana tindakan keperawatan
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

        {/* 1. Opsi Memilih Pasien (Dropdown & Info Singkat Pasien) */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-200 shrink-0">
          <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Pilih Pasien Rawat Inap:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              {activePatients.length} Pasien Aktif
            </span>
          </label>

          <select
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 shadow-2xs"
          >
            {activePatients.map(p => (
              <option key={p.id} value={p.id}>
                [{p.bed} - {p.room}] {p.name} ({p.gender}, {p.age} th) - RM: {p.rmNumber}
              </option>
            ))}
          </select>

          {currentPatient && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-mono">
                  {currentPatient.bed}
                </span>
                <span className="font-bold text-slate-800 truncate">{currentPatient.name}</span>
                <span>·</span>
                <span className="truncate">Dx: {currentPatient.medicalDiagnosis}</span>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                  currentPatient.status === 'kritis'
                    ? 'bg-rose-100 text-rose-800'
                    : currentPatient.status === 'perhatian'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {currentPatient.status}
              </span>
            </div>
          )}
        </div>

        {/* Content Body: Scrollable area with Form Tambah & Daftar Tindakan */}
        <div className="flex-1 overflow-y-auto patient-modal-scrollbar p-3.5 sm:p-4 space-y-4 text-xs">
          
          {/* 2. FORM TAMBAH TINDAKAN SECARA SEDERHANA & SIMPEL */}
          <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-blue-950 text-xs sm:text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Tambah Tindakan Baru (Sederhana &amp; Cepat)</span>
              </h3>
              <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                Shift {currentShift.split(' ')[0]}
              </span>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddAction} className="space-y-2.5">
              {/* Nama Tindakan */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Tindakan Keperawatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Contoh: Injeksi Ceftriaxone 1 gr IV, Ganti kassa luka, dll..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 bg-white font-medium text-xs sm:text-sm"
                  required
                />
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-500">
                  Pilihan Cepat (Klik untuk mengisi):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickActionTemplates.map(t => (
                    <button
                      key={t.title}
                      type="button"
                      onClick={() => {
                        setTitle(t.title);
                        setCategory(t.category);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        title === t.title
                          ? 'bg-blue-600 text-white border-blue-600 font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jam Tindakan dan Status Selesai */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">

                <div>
                  <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">
                    Jam Tindakan
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-medium"
                    required
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-end">
                  <label className={`w-full flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-colors ${
                    isCompletedNow
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isCompletedNow}
                      onChange={e => setIsCompletedNow(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className={`font-bold text-[11px] leading-tight ${
                        isCompletedNow ? 'text-emerald-800' : 'text-slate-700'
                      }`}>
                        {isCompletedNow ? 'Sudah Dilakukan' : 'Belum Dilakukan'}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {isCompletedNow ? 'Tindakan selesai' : 'Rencana / pending'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Catatan / Keterangan Respon (Opsional) */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Catatan respon pasien (opsional, misal: Pasien kooperatif, alergi (-)...)"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Tindakan Keperawatan</span>
              </button>
            </form>
          </div>

          {/* 3. DAFTAR TINDAKAN APA SAJA YANG SUDAH DILAKUKAN KE PASIEN */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Tindakan Pada Pasien ({completedActions.length} Selesai / {patientActions.length} Total)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Daftar riwayat implementasi asuhan keperawatan pasien
                </p>
              </div>
            </div>

            {patientActions.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-1.5">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">Belum ada tindakan tercatat untuk pasien ini.</p>
                <p className="text-[11px] text-slate-400">
                  Gunakan formulir sederhana di atas untuk mencatat tindakan yang sudah Anda lakukan.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {patientActions.map(action => (
                  <div
                    key={action.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 shadow-2xs ${
                      action.completed
                        ? 'bg-white border-emerald-200'
                        : 'bg-amber-50/40 border-amber-200'
                    }`}
                  >
                    {/* Toggle Complete Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => onToggleComplete(action.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                        action.completed
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-transparent border border-slate-300 hover:border-emerald-500'
                      }`}
                      title={action.completed ? 'Sudah Dilakukan (Klik untuk ubah)' : 'Belum Selesai (Klik untuk tandai selesai)'}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <span
                            className={`font-bold text-xs sm:text-sm ${
                              action.completed ? 'text-slate-900' : 'text-amber-950'
                            }`}
                          >
                            {action.title}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                            action.completed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {action.completed ? 'Sudah Dilakukan' : 'Pending / Rencana'}
                        </span>
                      </div>

                      {action.notes && (
                        <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          {action.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{action.timestamp}</span>
                          <span>·</span>
                          <span className="text-slate-700 font-semibold">{action.nurseName}</span>
                          <span>({action.shift.split(' ')[0]})</span>
                        </div>

                        {onDeleteAction && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus tindakan "${action.title}"?`)) {
                                onDeleteAction(action.id);
                              }
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                            title="Hapus tindakan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs active:scale-95 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
