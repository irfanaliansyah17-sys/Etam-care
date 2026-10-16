import React, { useState, useEffect } from 'react';
import {
  X,
  HeartPulse,
  Save,
  AlertCircle,
  Clock,
  History,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { Patient, VitalSign, Nurse } from '../types';

interface VitalSignModalProps {
  isOpen: boolean;
  patient: Patient | null;
  patients?: Patient[];
  vitals?: VitalSign[];
  nurses: Nurse[];
  currentNurseName: string;
  initialVital?: VitalSign | null;
  onClose: () => void;
  onSave: (vitalData: Omit<VitalSign, 'id'>, patientId: string, existingVitalId?: string) => void;
  onDeleteVital?: (vitalId: string, patientId: string) => void;
}

export const VitalSignModal: React.FC<VitalSignModalProps> = ({
  isOpen,
  patient,
  patients = [],
  vitals = [],
  nurses,
  currentNurseName,
  initialVital = null,
  onClose,
  onSave,
  onDeleteVital,
}) => {
  const activePatients = patients.filter(p => p.lifeStatus === 'aktif');

  // Sub-tab: 'input' (default) or 'riwayat' (view previous history)
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'riwayat'>('input');

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    patient?.id || activePatients[0]?.id || ''
  );

  // Edit mode state
  const [editingVitalId, setEditingVitalId] = useState<string | null>(null);

  // Simplified Vitals Form: TD disatukan jadi 1 input (contoh: 120/80)
  const [tdInput, setTdInput] = useState('120/80');
  const [heartRate, setHeartRate] = useState('80');
  const [respiratoryRate, setRespiratoryRate] = useState('20');
  const [temperature, setTemperature] = useState('36.5');
  const [spo2, setSpo2] = useState('98');
  const [gds, setGds] = useState('');
  const [gcs, setGcs] = useState('Compos Mentis (E4M6V5)');
  const [complaint, setComplaint] = useState('');
  const [notes, setNotes] = useState('');

  // Tanggal & Jam
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [nurseName, setNurseName] = useState(currentNurseName);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setNurseName(currentNurseName);

      if (initialVital) {
        setEditingVitalId(initialVital.id);
        setSelectedPatientId(initialVital.patientId);
        setTdInput(`${initialVital.bpSystolic}/${initialVital.bpDiastolic}`);
        setHeartRate(String(initialVital.heartRate));
        setRespiratoryRate(String(initialVital.respiratoryRate));
        setTemperature(String(initialVital.temperature));
        setSpo2(String(initialVital.spo2));
        setGds(initialVital.gds !== undefined ? String(initialVital.gds) : '');
        setGcs(initialVital.gcs || 'Compos Mentis (E4M6V5)');
        setComplaint(initialVital.complaint || '');
        setNotes(initialVital.notes || '');
        if (initialVital.timestamp) {
          const parts = initialVital.timestamp.split(' ');
          if (parts[0]) setDate(parts[0]);
          if (parts[1]) setTime(parts[1]);
        }
        setActiveSubTab('input');
      } else {
        setEditingVitalId(null);
        const current = new Date();
        setDate(current.toISOString().split('T')[0]);
        setTime(
          `${String(current.getHours()).padStart(2, '0')}:${String(
            current.getMinutes()
          ).padStart(2, '0')}`
        );

        const targetPt = patient || activePatients.find(p => p.id === selectedPatientId) || activePatients[0];
        if (targetPt) {
          setSelectedPatientId(targetPt.id);
          setComplaint(targetPt.complaint || '');
          if (targetPt.bpSystolic && targetPt.bpDiastolic) {
            setTdInput(`${targetPt.bpSystolic}/${targetPt.bpDiastolic}`);
          } else {
            setTdInput('120/80');
          }
          if (targetPt.heartRate) setHeartRate(String(targetPt.heartRate));
          if (targetPt.respiratoryRate) setRespiratoryRate(String(targetPt.respiratoryRate));
          if (targetPt.temperature) setTemperature(String(targetPt.temperature));
          if (targetPt.spo2) setSpo2(String(targetPt.spo2));
          if (targetPt.gds !== undefined && targetPt.gds !== null) setGds(String(targetPt.gds));
          else setGds('');
        }
        setActiveSubTab('input');
      }
    }
  }, [isOpen, patient, initialVital, currentNurseName]);

  if (!isOpen) return null;

  const currentPatient =
    patient || activePatients.find(p => p.id === selectedPatientId) || activePatients[0];

  // All previous vitals of current patient
  const patientVitals = vitals
    .filter(v => v.patientId === currentPatient?.id)
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

  // Handler to start editing a specific historical record
  const handleStartEdit = (vital: VitalSign) => {
    setEditingVitalId(vital.id);
    setSelectedPatientId(vital.patientId);
    setTdInput(`${vital.bpSystolic}/${vital.bpDiastolic}`);
    setHeartRate(String(vital.heartRate));
    setRespiratoryRate(String(vital.respiratoryRate));
    setTemperature(String(vital.temperature));
    setSpo2(String(vital.spo2));
    setGds(vital.gds !== undefined ? String(vital.gds) : '');
    setGcs(vital.gcs || 'Compos Mentis (E4M6V5)');
    setComplaint(vital.complaint || '');
    setNotes(vital.notes || '');
    if (vital.timestamp) {
      const parts = vital.timestamp.split(' ');
      if (parts[0]) setDate(parts[0]);
      if (parts[1]) setTime(parts[1]);
    }
    setActiveSubTab('input');
  };

  const handleCancelEdit = () => {
    setEditingVitalId(null);
    const current = new Date();
    setDate(current.toISOString().split('T')[0]);
    setTime(
      `${String(current.getHours()).padStart(2, '0')}:${String(
        current.getMinutes()
      ).padStart(2, '0')}`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPatient) {
      setError('Pilih pasien terlebih dahulu.');
      return;
    }

    // Parse single TD input (contoh: "120/80", "130 / 85", "120")
    let sys = 120;
    let dia = 80;
    const cleanTd = tdInput.replace(/\s+/g, '');
    const parts = cleanTd.split('/');
    if (parts.length >= 2) {
      sys = parseInt(parts[0], 10) || 120;
      dia = parseInt(parts[1], 10) || 80;
    } else if (parts.length === 1 && !isNaN(parseInt(parts[0], 10))) {
      sys = parseInt(parts[0], 10);
      dia = 80;
    } else {
      setError('Format Tekanan Darah tidak valid. Contoh: 120/80');
      return;
    }

    const hr = Number(heartRate);
    const rr = Number(respiratoryRate);
    const temp = Number(temperature);
    const sp = Number(spo2);

    if (isNaN(hr) || isNaN(rr) || isNaN(temp) || isNaN(sp)) {
      setError('Lengkapi data tanda-tanda vital (Nadi, RR, Suhu, SpO2).');
      return;
    }

    const timestamp = `${date} ${time}`;
    const parsedGds = gds.trim() !== '' && !isNaN(Number(gds)) ? Number(gds) : undefined;

    onSave(
      {
        patientId: currentPatient.id,
        timestamp,
        bpSystolic: sys,
        bpDiastolic: dia,
        heartRate: hr,
        respiratoryRate: rr,
        temperature: temp,
        spo2: sp,
        gds: parsedGds,
        gcs: gcs.trim() || undefined,
        nurseName: nurseName || currentNurseName,
        complaint: complaint.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      currentPatient.id,
      editingVitalId || undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white leading-tight">
                {editingVitalId ? 'Edit Catatan TTV' : 'Pencatatan TTV Sederhana'}
              </h2>
              <p className="text-[11px] text-rose-100">
                1 kolom praktis TD, Nadi, Pernapasan, Suhu &amp; SpO₂
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
          {patient ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-slate-900 text-sm block">
                  {patient.name} ({patient.gender}, {patient.age} th)
                </span>
                <span className="text-slate-500 text-[11px] block mt-0.5">
                  Bed: <strong className="text-blue-700">{patient.bed}</strong> · No. RM: <strong className="font-mono text-slate-700">{patient.rmNumber}</strong> · {patient.room}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                patient.status === 'kritis'
                  ? 'bg-rose-100 text-rose-800'
                  : patient.status === 'perhatian'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {patient.status}
              </span>
            </div>
          ) : (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pilih Pasien:
              </label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-900 text-xs focus:outline-none focus:border-rose-500 shadow-2xs"
              >
                {activePatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.bed} - {p.name} ({p.rmNumber}) · {p.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sub-Tabs: Input vs Riwayat */}
        <div className="bg-slate-100 p-1 flex items-center border-b border-slate-200 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('input')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'input'
                ? 'bg-white text-rose-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingVitalId ? 'Form Edit TTV' : 'Input TTV Sederhana'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('riwayat')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'riwayat'
                ? 'bg-white text-rose-700 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat TTV ({patientVitals.length})</span>
          </button>
        </div>

        {/* TAB 1: FORM INPUT TTV SEDERHANA */}
        {activeSubTab === 'input' && (
          <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs overflow-y-auto patient-modal-scrollbar">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Editing Notice Banner */}
            {editingVitalId && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-semibold">
                    Sedang mengedit riwayat TTV ({date} {time})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-amber-800 font-bold underline hover:text-amber-950 cursor-pointer"
                >
                  Batal Edit
                </button>
              </div>
            )}

            {/* 1 Kolom Utama: Tekanan Darah (TD) Disatukan */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <label className="block font-bold text-slate-800 text-xs">
                Tekanan Darah (TD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tdInput}
                  onChange={e => setTdInput(e.target.value)}
                  placeholder="Contoh: 120/80"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-black text-slate-900 text-sm focus:outline-none focus:border-rose-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                  mmHg
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Cukup ketik sistolik dan diastolik jadi satu (misal: 120/80, 110/70, 130/85).
              </p>
            </div>

            {/* Metrik TTV Lainnya: Grid 2 Kolom Ringkas */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Nadi */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="block font-bold text-slate-800 text-[11px]">
                  Nadi (HR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={heartRate}
                    onChange={e => setHeartRate(e.target.value)}
                    placeholder="80"
                    min="30"
                    max="220"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-rose-500"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                    x/m
                  </span>
                </div>
              </div>

              {/* Pernapasan */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="block font-bold text-slate-800 text-[11px]">
                  Pernapasan (RR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={respiratoryRate}
                    onChange={e => setRespiratoryRate(e.target.value)}
                    placeholder="20"
                    min="8"
                    max="60"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-rose-500"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                    x/m
                  </span>
                </div>
              </div>

              {/* Suhu */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="block font-bold text-slate-800 text-[11px]">
                  Suhu (°C) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    placeholder="36.5"
                    min="32"
                    max="43"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-rose-500"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                    °C
                  </span>
                </div>
              </div>

              {/* SpO2 */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <label className="block font-bold text-slate-800 text-[11px]">
                  SpO₂ (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={spo2}
                    onChange={e => setSpo2(e.target.value)}
                    placeholder="98"
                    min="50"
                    max="100"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs focus:outline-none focus:border-rose-500"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium">
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* GDS Opsional */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800 text-[11px]">
                  Gula Darah Sewaktu (GDS) <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={gds}
                  onChange={e => setGds(e.target.value)}
                  placeholder="Boleh dikosongkan jika tidak diperiksa..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:outline-none focus:border-rose-500"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                  mg/dL
                </span>
              </div>
            </div>

            {/* Keluhan & Catatan Singkat */}
            <div className="space-y-2">
              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-0.5">
                  Keluhan Pasien Terkini <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={complaint}
                  onChange={e => setComplaint(e.target.value)}
                  placeholder="Contoh: Nyeri berkurang, mual ringan, pusing..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 text-[11px] mb-0.5">
                  Catatan Tambahan <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Kondisi umum pasien..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs"
                />
              </div>
            </div>

            {/* Tanggal & Waktu Pemeriksaan (1 baris simpel) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-600 block">
                Waktu Pengukuran:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium"
                  required
                />
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium font-mono"
                  required
                />
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="pt-1">
              <button
                type="submit"
                className="w-full min-h-[44px] bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{editingVitalId ? 'Simpan Perubahan TTV' : 'Simpan Pengukuran TTV'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: RIWAYAT TTV (BISA DI-EDIT & DIHAPUS) */}
        {activeSubTab === 'riwayat' && (
          <div className="p-4 space-y-3 overflow-y-auto patient-modal-scrollbar">
            {patientVitals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <HeartPulse className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">Belum ada riwayat TTV untuk pasien ini.</p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('input')}
                  className="px-3.5 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Catat TTV Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {patientVitals.map((vital, idx) => (
                  <div
                    key={vital.id}
                    className={`p-3.5 rounded-2xl border shadow-2xs space-y-2 ${
                      idx === 0 ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Top Row: Timestamp, Pemeriksa, Action Edit & Hapus */}
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-black text-slate-900">{vital.timestamp}</span>
                        {idx === 0 && (
                          <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.2 rounded-full uppercase">
                            Terbaru
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          · {vital.nurseName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Tombol Edit Riwayat TTV */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(vital)}
                          className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit catatan TTV ini"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>

                        {/* Tombol Hapus */}
                        {onDeleteVital && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus catatan TTV waktu ${vital.timestamp}?`)) {
                                onDeleteVital(vital.id, currentPatient.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus rekaman TTV ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ringkasan Metrik TTV */}
                    <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-bold">TD</span>
                        <strong className="text-slate-900 text-xs font-black">
                          {vital.bpSystolic}/{vital.bpDiastolic}
                        </strong>
                        <span className="text-[9px] text-slate-400 block">mmHg</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-bold">Nadi</span>
                        <strong className="text-slate-900 text-xs font-black">{vital.heartRate}</strong>
                        <span className="text-[9px] text-slate-400 block">x/m</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-bold">RR</span>
                        <strong className="text-slate-900 text-xs font-black">{vital.respiratoryRate}</strong>
                        <span className="text-[9px] text-slate-400 block">x/m</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                        <span className="text-[10px] text-slate-400 block font-bold">Suhu / SpO₂</span>
                        <strong className="text-slate-900 text-xs font-black">
                          {vital.temperature}° / {vital.spo2}%
                        </strong>
                      </div>
                    </div>

                    {/* GDS / Keluhan */}
                    {(vital.gds !== undefined || vital.complaint || vital.notes) && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-0.5">
                        {vital.gds !== undefined && (
                          <div>
                            <strong className="text-amber-800">GDS:</strong> {vital.gds} mg/dL
                          </div>
                        )}
                        {vital.complaint && (
                          <div>
                            <strong className="text-slate-700">Keluhan:</strong> {vital.complaint}
                          </div>
                        )}
                        {vital.notes && (
                          <div className="text-slate-500 italic">
                            Catatan: {vital.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
