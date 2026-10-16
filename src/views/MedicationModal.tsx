import React, { useState, useEffect } from 'react';
import { X, Pill, Save, AlertCircle, Clock, Calendar, Users } from 'lucide-react';
import { Patient, PatientMedication, DoctorDPJP } from '../types';

interface MedicationModalProps {
  isOpen: boolean;
  patient: Patient | null;
  patients?: Patient[];
  doctors: DoctorDPJP[];
  initialData?: PatientMedication | null;
  onClose: () => void;
  onSave: (medData: Omit<PatientMedication, 'id'>, existingId?: string) => void;
}

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  patient,
  patients = [],
  doctors,
  initialData,
  onClose,
  onSave,
}) => {
  const activePatients = patients.filter(p => p.lifeStatus === 'aktif');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  // 1 Input Sederhana untuk Nama & Dosis Obat
  const [medicationInput, setMedicationInput] = useState('');
  // Tanggal & Jam opsional (1 baris simpel)
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [error, setError] = useState<string | null>(null);

  const quickMeds = [
    'Ceftriaxone 1 gr IV',
    'Ketorolac 30 mg IV',
    'Omeprazole 40 mg IV',
    'Paracetamol 500 mg oral',
    'Ranitidine 50 mg IV',
    'Ondansetron 4 mg IV',
    'Furosemide 20 mg IV',
  ];

  useEffect(() => {
    if (patient) {
      setSelectedPatientId(patient.id);
    } else if (activePatients.length > 0) {
      setSelectedPatientId(prev => (prev ? prev : activePatients[0].id));
    }
  }, [patient, isOpen, activePatients]);

  useEffect(() => {
    if (initialData) {
      const combined = initialData.dosage && initialData.dosage !== initialData.name
        ? `${initialData.name} ${initialData.dosage}`
        : initialData.name || '';
      setMedicationInput(combined);
      setDate(initialData.date || initialData.startDate || defaultDate);
      setTime(initialData.time || initialData.scheduleTimes || defaultTime);
    } else {
      setMedicationInput('');
      setDate(defaultDate);
      setTime(defaultTime);
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const effectivePatient =
    patient || activePatients.find(p => p.id === selectedPatientId) || activePatients[0] || null;

  if (!effectivePatient) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Pill className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Pasien Aktif</h3>
          <p className="text-xs text-slate-500">
            Daftarkan pasien terlebih dahulu sebelum mencatat terapi obat.
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = medicationInput.trim();
    if (!trimmed) {
      setError('Masukkan nama & dosis obat.');
      return;
    }

    // Default to current date and time if empty / not provided
    const effectiveDate = date.trim() || new Date().toISOString().split('T')[0];
    const effectiveTime =
      time.trim() ||
      `${String(new Date().getHours()).padStart(2, '0')}:${String(
        new Date().getMinutes()
      ).padStart(2, '0')}`;

    // Split name and dosage or keep combined neatly
    let name = trimmed;
    let dosage = 'Sesuai advis DPJP';

    // Simple heuristic: if contains number or mg/gr/ampul/tablet
    const match = trimmed.match(/^(.+?)\s+(\d+.*)$/i);
    if (match) {
      name = match[1].trim();
      dosage = match[2].trim();
    } else {
      name = trimmed;
      dosage = trimmed;
    }

    onSave(
      {
        patientId: effectivePatient.id,
        name,
        dosage,
        date: effectiveDate,
        time: effectiveTime,
        startDate: effectiveDate,
        scheduleTimes: effectiveTime,
        route: initialData?.route || 'IV',
        frequency: initialData?.frequency || `Pukul ${effectiveTime}`,
        status: initialData?.status || 'Aktif',
        prescribedBy:
          initialData?.prescribedBy ||
          effectivePatient.dpjps?.[0] ||
          effectivePatient.dpjp ||
          doctors[0]?.name ||
          'DPJP',
      },
      initialData?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white leading-tight">
                {initialData ? 'Ubah Data Obat' : 'Catat Obat Sederhana'}
              </h2>
              <p className="text-[11px] text-purple-100">
                1 kolom praktis untuk nama obat &amp; dosis
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
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Pilih Pasien:</span>
              </label>
              <select
                value={effectivePatient.id}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500 shadow-2xs"
              >
                {activePatients.map(pt => (
                  <option key={pt.id} value={pt.id}>
                    {pt.bed} - {pt.name} (RM: {pt.rmNumber}) · {pt.room}
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase tracking-wider">
                {effectivePatient.status}
              </span>
            </div>
          )}
        </div>

        {/* Form Body - Sederhana: 1 Tempat Obat & Dosis + 1 Baris Tanggal/Waktu Opsional */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1 Tempat: Nama Obat & Dosis Disatukan */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Nama &amp; Dosis Obat <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={medicationInput}
              onChange={e => setMedicationInput(e.target.value)}
              placeholder="Contoh: Paracetamol 500 mg 3x1, Ceftriaxone 1 gr IV..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-purple-500 text-xs sm:text-sm bg-white font-medium"
              required
              autoFocus
            />

            {/* Pilihan Cepat */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickMeds.map(med => (
                <button
                  key={med}
                  type="button"
                  onClick={() => setMedicationInput(med)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    medicationInput === med
                      ? 'bg-purple-600 text-white border-purple-600 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {med}
                </button>
              ))}
            </div>
          </div>

          {/* 1 Tempat Terkait Tanggal dan Waktu (Opsional, Default Waktu Sekarang) */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-slate-600 block">
              Tanggal &amp; Jam Pemberian (Opsional / Otomatis Sekarang):
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
              className="w-full min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs sm:text-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan Obat' : 'Simpan Obat Pasien'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
