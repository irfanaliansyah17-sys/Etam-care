import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Save, AlertCircle, Calendar, HeartPulse, Search, Check } from 'lucide-react';
import { Patient, PatientCondition, InsuranceType, Ward, DoctorDPJP } from '../types';
import { calculateAge } from '../services/storageService';

const DRAFT_STORAGE_KEY = 'etamcare_new_patient_draft';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: Omit<Patient, 'id'>, existingId?: string) => void;
  initialData?: Patient | null;
  wards: Ward[];
  doctors: DoctorDPJP[];
  existingPatients: Patient[];
}

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  wards,
  doctors,
  existingPatients,
}) => {
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const getInitialFormData = (data?: Patient | null) => {
    if (data) {
      const activeDoctors = data.dpjps && data.dpjps.length > 0
        ? data.dpjps
        : data.dpjp
        ? [data.dpjp]
        : [];
      return {
        name: data.name || '',
        rmNumber: data.rmNumber || '',
        gender: (data.gender || 'L') as 'L' | 'P',
        birthDate: data.birthDate || '1980-01-01',
        age: data.birthDate ? calculateAge(data.birthDate) : data.age || 40,
        room: data.room || wards[0]?.name || 'Ruang Teratai',
        bed: data.bed || 'Bed 01A',
        admissionDate: data.admissionDate || defaultDate,
        admissionTime: data.admissionTime || defaultTime,
        medicalDiagnosis: data.medicalDiagnosis || '',
        nursingDiagnosis: data.nursingDiagnosis || '',
        complaint: data.complaint || '',
        status: data.status || ('stabil' as PatientCondition),
        dpjps: Array.from(new Set(activeDoctors.filter(Boolean))),
        insurance: data.insurance || ('BPJS - Kelas 1' as InsuranceType),
        plannedActions: data.plannedActions || '',
        bpSystolic: String(data.bpSystolic !== undefined ? data.bpSystolic : 120),
        bpDiastolic: String(data.bpDiastolic !== undefined ? data.bpDiastolic : 80),
        heartRate: String(data.heartRate !== undefined ? data.heartRate : 80),
        respiratoryRate: String(data.respiratoryRate !== undefined ? data.respiratoryRate : 20),
        temperature: String(data.temperature !== undefined ? data.temperature : 36.8),
        spo2: String(data.spo2 !== undefined ? data.spo2 : 98),
        gds: data.gds !== undefined ? String(data.gds) : '',
        nurseInCharge: data.nurseInCharge || '',
        allergies: data.allergies || 'Tidak ada',
        notes: data.notes || '',
      };
    }
    const defaultDoc = doctors[0]?.name ? [doctors[0].name] : [];
    return {
      name: '',
      rmNumber: `RM-${Math.floor(100000 + Math.random() * 900000)}`,
      gender: 'L' as 'L' | 'P',
      birthDate: '1985-05-15',
      age: calculateAge('1985-05-15'),
      room: wards[0]?.name || 'Ruang Teratai',
      bed: 'Bed 01A',
      admissionDate: defaultDate,
      admissionTime: defaultTime,
      medicalDiagnosis: '',
      nursingDiagnosis: '',
      complaint: '',
      status: 'stabil' as PatientCondition,
      dpjps: defaultDoc,
      insurance: 'BPJS - Kelas 1' as InsuranceType,
      plannedActions: '',
      bpSystolic: '120',
      bpDiastolic: '80',
      heartRate: '80',
      respiratoryRate: '20',
      temperature: '36.8',
      spo2: '98',
      gds: '',
      nurseInCharge: '',
      allergies: 'Tidak ada',
      notes: '',
    };
  };

  type PatientFormData = ReturnType<typeof getInitialFormData>;

  const [formData, setFormData] = useState<PatientFormData>(() => {
    if (!initialData) {
      try {
        const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object' && parsed.name) {
            return {
              ...getInitialFormData(null),
              ...parsed,
            } as PatientFormData;
          }
        }
      } catch {}
    }
    return getInitialFormData(initialData);
  });
  const [error, setError] = useState<string | null>(null);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  // Track initialData ID, open state transitions, and user edits to NEVER wipe data while typing
  const lastOpenStateRef = useRef(isOpen);
  const lastTargetIdRef = useRef<string | undefined>(initialData?.id);
  const hasUserEditedRef = useRef(false);

  // Helper to update form fields and preserve draft in sessionStorage
  const updateFormField = <K extends keyof PatientFormData>(
    field: K,
    value: PatientFormData[K]
  ) => {
    hasUserEditedRef.current = true;
    setFormData((prev: PatientFormData) => {
      const next: PatientFormData = { ...prev, [field]: value };
      if (!initialData) {
        try {
          sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Auto-calculate age whenever birthDate changes
  const handleBirthDateChange = (val: string) => {
    hasUserEditedRef.current = true;
    const calculated = calculateAge(val);
    setFormData((prev: PatientFormData) => {
      const next: PatientFormData = {
        ...prev,
        birthDate: val,
        age: calculated,
      };
      if (!initialData) {
        try {
          sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  // Sync formData ONLY when modal just opened or when target patient actually changed
  useEffect(() => {
    const justOpened = isOpen && !lastOpenStateRef.current;
    const targetChanged = initialData?.id !== lastTargetIdRef.current;

    lastOpenStateRef.current = isOpen;
    lastTargetIdRef.current = initialData?.id;

    if (!justOpened && !targetChanged) return;

    // Jika user sedang aktif mengetik dan target pasien tidak berganti, JANGAN reset data!
    if (hasUserEditedRef.current && !targetChanged) return;

    if (!initialData) {
      try {
        const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object') {
            setFormData({
              ...getInitialFormData(null),
              ...parsed,
            } as PatientFormData);
            hasUserEditedRef.current = true;
            setError(null);
            return;
          }
        }
      } catch {}
    }

    setFormData(getInitialFormData(initialData));
    hasUserEditedRef.current = false;
    setError(null);
  }, [initialData?.id, isOpen]);

  const handleClose = () => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    hasUserEditedRef.current = false;
    onClose();
  };

  if (!isOpen) return null;

  const toggleDoctorSelection = (docName: string) => {
    hasUserEditedRef.current = true;
    setFormData((prev: PatientFormData) => {
      const exists = prev.dpjps.includes(docName);
      let newDpjps: string[];
      if (exists) {
        // Prevent unselecting all (must have at least 1 DPJP)
        if (prev.dpjps.length === 1) {
          setError('Pasien harus memiliki minimal 1 dokter DPJP');
          return prev;
        }
        setError(null);
        newDpjps = prev.dpjps.filter((d: string) => d !== docName);
      } else {
        setError(null);
        newDpjps = [...prev.dpjps, docName];
      }
      const next: PatientFormData = { ...prev, dpjps: newDpjps };
      if (!initialData) {
        try {
          sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = formData.name.trim();
    if (!cleanName) {
      setError('Nama pasien wajib diisi');
      return;
    }

    // Tolak nama pasien yang terdouble / sudah terdaftar
    const isDuplicateName = existingPatients.some(
      p =>
        p.name.trim().toLowerCase() === cleanName.toLowerCase() &&
        p.id !== initialData?.id
    );
    if (isDuplicateName) {
      setError(`Pasien dengan nama "${cleanName}" sudah terdaftar dalam sistem. Tidak dapat menambahkan nama pasien yang sama.`);
      return;
    }

    const cleanRM = formData.rmNumber.trim();
    if (!cleanRM) {
      setError('Nomor RM wajib diisi');
      return;
    }

    // Check duplicate RM
    const isDuplicate = existingPatients.some(
      p =>
        p.rmNumber.toLowerCase() === cleanRM.toLowerCase() &&
        p.id !== initialData?.id
    );
    if (isDuplicate) {
      setError(`Nomor RM "${cleanRM}" sudah terdaftar pada pasien lain`);
      return;
    }

    if (!formData.medicalDiagnosis.trim()) {
      setError('Diagnosis medis wajib diisi');
      return;
    }
    if (formData.dpjps.length === 0) {
      setError('Pilih minimal 1 dokter DPJP');
      return;
    }

    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    hasUserEditedRef.current = false;

    const sanitizedDpjps: string[] = Array.from(new Set(formData.dpjps.filter(Boolean) as string[]));
    const primaryDpjp: string = sanitizedDpjps[0] || '';

    onSave(
      {
        ...(initialData || {}),
        name: cleanName,
        rmNumber: cleanRM,
        gender: formData.gender,
        birthDate: formData.birthDate,
        age: formData.age,
        room: formData.room,
        bed: formData.bed.trim(),
        admissionDate: formData.admissionDate,
        admissionTime: formData.admissionTime,
        medicalDiagnosis: formData.medicalDiagnosis.trim(),
        nursingDiagnosis: formData.nursingDiagnosis.trim(),
        complaint: formData.complaint.trim() || undefined,
        status: formData.status,
        lifeStatus: initialData?.lifeStatus || 'aktif',
        dpjps: sanitizedDpjps,
        dpjp: primaryDpjp,
        insurance: formData.insurance,
        plannedActions: formData.plannedActions.trim(),
        bpSystolic: Number(formData.bpSystolic) || 120,
        bpDiastolic: Number(formData.bpDiastolic) || 80,
        heartRate: Number(formData.heartRate) || 80,
        respiratoryRate: Number(formData.respiratoryRate) || 20,
        temperature: Number(formData.temperature) || 36.8,
        spo2: Number(formData.spo2) || 98,
        gds: formData.gds && !isNaN(Number(formData.gds)) ? Number(formData.gds) : undefined,
        nurseInCharge: formData.nurseInCharge.trim() || undefined,
        allergies: formData.allergies.trim(),
        notes: formData.notes.trim(),
      },
      initialData?.id
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-xl max-h-[94vh] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-200" />
            <div>
              <h2 className="font-bold text-base text-white leading-tight">
                {initialData ? 'Ubah Data Pasien' : 'Tambah Pasien Baru'}
              </h2>
              <p className="text-[11px] text-blue-100">Formulir Rekam Medis Keperawatan Terpadu</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Tutup formulir"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          onKeyDown={e => {
            if (
              e.key === 'Enter' &&
              (e.target as HTMLElement).tagName === 'INPUT' &&
              (e.target as HTMLInputElement).type !== 'submit'
            ) {
              e.preventDefault();
            }
          }}
          className="flex-1 overflow-y-auto p-4 space-y-4 text-xs"
        >
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Section 1: Identitas Pasien */}
          <div className="space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-100 pb-1">
              1. Identitas & Lokasi Bed
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pasien <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateFormField('name', e.target.value)}
                  placeholder="Contoh: Tn. Bambang Sutrisno"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  No. Rekam Medis (RM) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.rmNumber}
                  onChange={e => updateFormField('rmNumber', e.target.value)}
                  placeholder="RM-XXXXXX"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={formData.gender}
                  onChange={e => updateFormField('gender', e.target.value as 'L' | 'P')}
                  className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={e => handleBirthDateChange(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Usia (Otomatis)
                </label>
                <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-800 text-center">
                  {formData.age} Tahun
                </div>
              </div>
            </div>

            {/* Bangsal & Bed */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bangsal / Ruangan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.room}
                  onChange={e => updateFormField('room', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white font-medium"
                  required
                >
                  {wards.map(w => (
                    <option key={w.id} value={w.name}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Bed <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bed}
                  onChange={e => updateFormField('bed', e.target.value)}
                  placeholder="Bed 01A"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white font-medium"
                  required
                />
              </div>
            </div>

            {/* Tanggal & Jam Masuk */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Masuk
                </label>
                <input
                  type="date"
                  value={formData.admissionDate}
                  onChange={e => updateFormField('admissionDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jam Masuk
                </label>
                <input
                  type="time"
                  value={formData.admissionTime}
                  onChange={e => updateFormField('admissionTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Diagnosis & Kondisi Klinis */}
          <div className="space-y-3 pt-1">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-100 pb-1">
              2. Diagnosis Medis & Status Klinis
            </span>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Diagnosis Medis <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.medicalDiagnosis}
                onChange={e => updateFormField('medicalDiagnosis', e.target.value)}
                placeholder="Contoh: Post Op Laparatomi e.c Perforasi Gaster H+2"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Keluhan Pasien Terkini / Keluhan Utama
              </label>
              <input
                type="text"
                value={formData.complaint}
                onChange={e => updateFormField('complaint', e.target.value)}
                placeholder="Contoh: Nyeri perut kanan bawah skala 5, mual, lemas..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kondisi / Status Pasien <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => updateFormField('status', 'stabil')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.status === 'stabil'
                      ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Stabil
                </button>
                <button
                  type="button"
                  onClick={() => updateFormField('status', 'perhatian')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.status === 'perhatian'
                      ? 'bg-amber-500 text-white font-bold border-amber-500 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Perhatian
                </button>
                <button
                  type="button"
                  onClick={() => updateFormField('status', 'kritis')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.status === 'kritis'
                      ? 'bg-rose-600 text-white font-bold border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Kritis
                </button>
              </div>
            </div>

            {/* Tanda Tanda Vital Snapshot */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                <span>TTV Awal Masuk</span>
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">TD Sistol</label>
                  <input
                    type="number"
                    value={formData.bpSystolic}
                    onChange={e => updateFormField('bpSystolic', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">TD Diastol</label>
                  <input
                    type="number"
                    value={formData.bpDiastolic}
                    onChange={e => updateFormField('bpDiastolic', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Nadi (x/m)</label>
                  <input
                    type="number"
                    value={formData.heartRate}
                    onChange={e => updateFormField('heartRate', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">RR (x/m)</label>
                  <input
                    type="number"
                    value={formData.respiratoryRate}
                    onChange={e => updateFormField('respiratoryRate', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Suhu (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={e => updateFormField('temperature', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">SpO₂ (%)</label>
                  <input
                    type="number"
                    value={formData.spo2}
                    onChange={e => updateFormField('spo2', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-center font-bold text-xs bg-white"
                  />
                </div>
              </div>

              {/* GDS - Opsional (Boleh Dikosongkan) */}
              <div className="pt-1.5 border-t border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-700">
                    Gula Darah Sewaktu (GDS) - mg/dL
                  </label>
                  <span className="text-[9px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                    Opsional / Boleh Dikosongkan
                  </span>
                </div>
                <input
                  type="number"
                  value={formData.gds}
                  onChange={e => updateFormField('gds', e.target.value)}
                  placeholder="Contoh: 110 (mg/dL) - kosongkan jika tidak dicek"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rencana Tindakan / Intervensi Utama
              </label>
              <textarea
                rows={2}
                value={formData.plannedActions}
                onChange={e => updateFormField('plannedActions', e.target.value)}
                placeholder="Contoh: Ganti balut steril, antibiotik injeksi per 12 jam, monitoring balans cairan..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Section 3: Dokter DPJP (Multi-select) & Jaminan Kesehatan */}
          <div className="space-y-3 pt-1">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-100 pb-1">
              3. Dokter DPJP & Jaminan Kesehatan
            </span>

            {/* Multi-DPJP selector with Doctor Search */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700">
                  Dokter DPJP (Bisa Pilih Lebih dari 1 Dokter) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-blue-600 font-bold">
                  {formData.dpjps.length} dokter dipilih
                </span>
              </div>

              {/* Tag / Badge dokter terpilih */}
              {formData.dpjps.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-blue-50/80 rounded-xl border border-blue-100">
                  {formData.dpjps.map((docName: string) => (
                    <span
                      key={docName}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-blue-900 border border-blue-200 shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[200px]">{docName}</span>
                      <button
                        type="button"
                        onClick={() => toggleDoctorSelection(docName)}
                        className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                        title={`Hapus ${docName}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input pencarian nama dokter */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={doctorSearchQuery}
                  onChange={e => setDoctorSearchQuery(e.target.value)}
                  placeholder="Cari nama dokter DPJP atau spesialisasi..."
                  className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium focus:bg-white"
                />
                {doctorSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDoctorSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Daftar checkbox dokter terfilter */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200 custom-scrollbar">
                {(() => {
                  const filteredDocs = doctors.filter(doc => {
                    const q = doctorSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      doc.name.toLowerCase().includes(q) ||
                      (doc.specialization && doc.specialization.toLowerCase().includes(q))
                    );
                  });

                  if (filteredDocs.length === 0) {
                    return (
                      <div className="py-4 text-center text-slate-400 text-xs italic">
                        Tidak ditemukan dokter dengan nama "{doctorSearchQuery}"
                      </div>
                    );
                  }

                  return filteredDocs.map(doc => {
                    const isChecked = formData.dpjps.includes(doc.name);
                    return (
                      <label
                        key={doc.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDoctorSelection(doc.name)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{doc.specialization}</div>
                        </div>
                      </label>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Jaminan Kesehatan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jaminan Kesehatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.insurance}
                onChange={e => updateFormField('insurance', e.target.value as InsuranceType)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white font-medium"
                required
              >
                <option value="BPJS - Kelas 1">BPJS - Kelas 1</option>
                <option value="BPJS - Kelas 2">BPJS - Kelas 2</option>
                <option value="BPJS - Kelas 3">BPJS - Kelas 3</option>
                <option value="Mandiri / Umum">Mandiri / Umum</option>
                <option value="Asuransi Swasta">Asuransi Swasta</option>
              </select>
            </div>

            {/* Alergi & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Riwayat Alergi</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={e => updateFormField('allergies', e.target.value)}
                  placeholder="Contoh: Penisilin, Telur..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => updateFormField('notes', e.target.value)}
                  placeholder="Keterangan infus / NGT / drain..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan Data Pasien' : 'Simpan Pasien Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
