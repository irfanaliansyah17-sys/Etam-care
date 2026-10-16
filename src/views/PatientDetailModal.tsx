import React, { useState } from 'react';
import {
  X,
  Bed,
  Stethoscope,
  HeartPulse,
  FileText,
  AlertTriangle,
  Edit2,
  Trash2,
  Calendar,
  Shield,
  ArrowRightLeft,
  Home,
  Skull,
  Clock,
  Pill,
  Plus,
  CheckCircle2,
  User,
  ChevronRight,
  ArrowDownToLine,
  UserMinus,
  Save,
  Check,
  ClipboardList,
} from 'lucide-react';
import {
  Patient,
  VitalSign,
  NursingAction,
  SOAPNote,
  SBARHandover,
  PatientMedication,
  ShiftType,
  DoctorDPJP,
  calculateHospitalDay,
} from '../types';
import { StatusChangeType } from './PatientStatusModal';

interface PatientDetailModalProps {
  patient: Patient | null;
  doctors?: DoctorDPJP[];
  vitals: VitalSign[];
  medications?: PatientMedication[];
  actions: NursingAction[];
  soaps: SOAPNote[];
  handovers: SBARHandover[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onOpenStatusModal: (patient: Patient, type: StatusChangeType) => void;
  onDelete: (patient: Patient) => void;
  onUnassignNurse?: (patientId: string) => void;
  onOpenAddVital?: (patient: Patient, initialVital?: VitalSign) => void;
  onOpenAddMedication?: (patient: Patient) => void;
  onEditMedication?: (med: PatientMedication) => void;
  onDeleteMedication?: (med: PatientMedication) => void;
  onUpdatePlannedActions?: (patientId: string, plannedActions: string) => void;
  onUpdatePatientDpjp?: (patientId: string, primaryDpjp: string, dpjps: string[]) => void;
  onOpenHandoverWithPatient: (patientId: string, prefilledVital?: VitalSign) => void;
  onSaveAction?: (actionData: Omit<NursingAction, 'id'>) => void;
  onToggleActionComplete?: (actionId: string) => void;
  onDeleteAction?: (actionId: string) => void;
  currentNurseName?: string;
  currentShift?: ShiftType;
}

type DetailTabType = 'info' | 'ttv' | 'obat' | 'tindakan' | 'sbar';

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  doctors = [],
  vitals,
  medications = [],
  actions,
  soaps,
  handovers,
  isOpen,
  onClose,
  onEdit,
  onOpenStatusModal,
  onDelete,
  onUnassignNurse,
  onOpenAddVital,
  onOpenAddMedication,
  onEditMedication,
  onDeleteMedication,
  onUpdatePlannedActions,
  onUpdatePatientDpjp,
  onOpenHandoverWithPatient,
  onSaveAction,
  onToggleActionComplete,
  onDeleteAction,
  currentNurseName = 'Perawat Bertugas',
  currentShift = 'Pagi (07.00 - 14.00)',
}) => {
  const [activeTab, setActiveTab] = useState<DetailTabType>('info');

  // Simple Add Action State (Sederhana & Simpel)
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionCategory, setActionCategory] = useState<NursingAction['category']>('Observasi');
  const [actionTime, setActionTime] = useState(
    `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  );
  const [actionCompleted, setActionCompleted] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  // Rencana Tindakan Editing State
  const [isEditingPlannedAction, setIsEditingPlannedAction] = useState(false);
  const [plannedActionInput, setPlannedActionInput] = useState(patient?.plannedActions || '');

  // DPJP & Konsulen Management State (Seamless within Patient Detail)
  const [isEditingDpjp, setIsEditingDpjp] = useState(false);
  const [selectedPrimaryDpjp, setSelectedPrimaryDpjp] = useState(
    patient?.dpjp || (patient?.dpjps && patient?.dpjps[0]) || ''
  );
  const [selectedConsultants, setSelectedConsultants] = useState<string[]>(
    patient?.dpjps ? patient.dpjps.filter(d => d !== (patient.dpjp || patient.dpjps[0])) : []
  );
  const [customDoctorInput, setCustomDoctorInput] = useState('');

  React.useEffect(() => {
    if (patient) {
      setPlannedActionInput(patient.plannedActions || '');
      setIsEditingPlannedAction(false);
      const prim = patient.dpjp || (patient.dpjps && patient.dpjps[0]) || '';
      setSelectedPrimaryDpjp(prim);
      setSelectedConsultants(
        patient.dpjps ? patient.dpjps.filter(d => d !== prim) : []
      );
      setIsEditingDpjp(false);
    }
  }, [patient?.id, patient?.plannedActions, patient?.dpjp, patient?.dpjps]);

  const handleSaveDpjpLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !onUpdatePatientDpjp) return;
    const prim = selectedPrimaryDpjp.trim();
    if (!prim) return;
    const all = Array.from(new Set([prim, ...selectedConsultants].filter(Boolean)));
    onUpdatePatientDpjp(patient.id, prim, all);
    setIsEditingDpjp(false);
  };

  const handleAddCustomDoctorToConsultants = () => {
    const trimmed = customDoctorInput.trim();
    if (!trimmed) return;
    if (!selectedConsultants.includes(trimmed) && trimmed !== selectedPrimaryDpjp) {
      setSelectedConsultants(prev => [...prev, trimmed]);
    }
    setCustomDoctorInput('');
  };

  const handleSavePlannedActionLocal = () => {
    if (onUpdatePlannedActions && patient) {
      onUpdatePlannedActions(patient.id, plannedActionInput.trim());
      setIsEditingPlannedAction(false);
    }
  };

  const plannedActionPresets = [
    'OBS KU, TTV DAN KESADARAN',
    'HEAD UP 30 DERAJAT',
    'SUCTION BERKALA',
    'GANTI ANAK KANUL / SHIFT',
    'ASSESMEN RISIKO JATUH',
    'GV CVC / RAWAT LUMEN CVC',
    'CEK GDS PER 6 JAM',
    'MIKA / MIKI PER 2 JAM',
    'BED ANTI-DEKUBITUS',
    'KOREKSI HIPOKALEMIA (D5%)',
    'CEK ELEKTROLIT CITO',
    'EVALUASI CT SCAN / RONTGEN',
    'AFF NGT & EVALUASI BISING USUS',
    'RAWAT BALUTAN LUKA STERIL',
  ];

  const handleAddPresetLocal = (preset: string) => {
    setPlannedActionInput(prev => {
      const trimmed = prev.trim();
      const bullet = `• ${preset}`;
      if (!trimmed) return bullet;
      if (trimmed.includes(preset)) return trimmed;
      return `${trimmed}\n${bullet}`;
    });
  };

  if (!isOpen || !patient) return null;

  const patientVitals = vitals
    .filter(v => v.patientId === patient.id)
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
  const latestVital = patientVitals[0];

  const patientMeds = medications.filter(m => m.patientId === patient.id);
  const activeMeds = patientMeds.filter(m => m.status === 'Aktif');

  const patientActions = actions.filter(a => a.patientId === patient.id);
  const patientSoaps = soaps.filter(s => s.patientId === patient.id);
  const patientHandovers = handovers.filter(h => h.patientId === patient.id);

  const isKritis = patient.status === 'kritis';
  const isPerhatian = patient.status === 'perhatian';

  const hospitalDayInfo = calculateHospitalDay(patient.admissionDate);

  const doctorList =
    patient.dpjps && patient.dpjps.length > 0
      ? patient.dpjps
      : patient.dpjp
      ? [patient.dpjp]
      : [];

  const tabList = [
    {
      id: 'info' as DetailTabType,
      label: 'Identitas & Info',
      icon: User,
      count: null,
    },
    {
      id: 'ttv' as DetailTabType,
      label: 'Riwayat TTV',
      icon: HeartPulse,
      count: patientVitals.length,
    },
    {
      id: 'obat' as DetailTabType,
      label: 'Obat & Terapi',
      icon: Pill,
      count: patientMeds.length,
    },
    {
      id: 'tindakan' as DetailTabType,
      label: 'Tindakan',
      icon: CheckCircle2,
      count: patientActions.length,
    },
    {
      id: 'sbar' as DetailTabType,
      label: 'SBAR',
      icon: ArrowRightLeft,
      count: patientHandovers.length,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full sm:max-w-4xl h-[94vh] sm:h-[90vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 relative">
        
        {/* Header with patient primary identity (Compact & Clear) */}
        <div className="px-4 py-2.5 sm:py-3 bg-blue-600 text-white relative shrink-0">
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-1.5 sm:hidden" />
          
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 pr-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded font-bold text-white tracking-wider">
                  {patient.rmNumber}
                </span>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded font-bold text-white">
                  {patient.bed}
                </span>
                <span className="text-[11px] text-blue-100 font-medium">
                  {patient.room}
                </span>
                {/* Hari Perawatan Badge */}
                <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full shadow-2xs">
                  {hospitalDayInfo.text}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black text-white mt-0.5 leading-snug truncate">
                {patient.name}
              </h2>

              <p className="text-[11px] text-blue-100">
                {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} · {patient.age} Th · Tgl Lahir: {patient.birthDate || '-'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="min-h-[38px] min-w-[38px] -mr-1.5 -mt-1 flex items-center justify-center text-white/80 hover:text-white active:scale-95 cursor-pointer"
              aria-label="Tutup detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Bar */}
          <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-100 text-[10px]">Kondisi:</span>
              <span
                className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-[9px] ${
                  isKritis
                    ? 'bg-rose-500 text-white animate-pulse'
                    : isPerhatian
                    ? 'bg-amber-400 text-amber-950 font-black'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {patient.status}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-blue-100 text-[10px]">Status Rawat:</span>
              <span className="font-bold uppercase text-[9px] bg-white/20 px-2 py-0.5 rounded-full text-white">
                {patient.lifeStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Edit, Pindah, Pulang, Meninggal, Hapus (Proporsional & Hemat Ruang) */}
        <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Edit Pasien */}
            <button
              onClick={() => onEdit(patient)}
              className="min-h-[32px] px-2.5 py-1 bg-white hover:bg-blue-50/80 active:bg-blue-100 border border-slate-300 hover:border-blue-400 rounded-lg text-xs font-semibold text-slate-800 hover:text-blue-700 active:scale-98 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Edit Pasien</span>
            </button>

            {/* Pindah Bangsal */}
            {patient.lifeStatus === 'aktif' && (
              <button
                onClick={() => onOpenStatusModal(patient, 'pindah')}
                className="min-h-[32px] px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 active:scale-98 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Pindah Bangsal</span>
              </button>
            )}

            {/* Pulang (KRS) */}
            {patient.lifeStatus === 'aktif' && (
              <button
                onClick={() => onOpenStatusModal(patient, 'pulang')}
                className="min-h-[32px] px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-900 active:scale-98 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Pulang (KRS)</span>
              </button>
            )}

            {/* Meninggal */}
            {patient.lifeStatus === 'aktif' && (
              <button
                onClick={() => onOpenStatusModal(patient, 'meninggal')}
                className="min-h-[32px] px-2.5 py-1 bg-slate-200/90 hover:bg-slate-300 active:bg-slate-400 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 active:scale-98 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Skull className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Meninggal</span>
              </button>
            )}

            {/* Hapus Pasien */}
            <button
              onClick={() => onDelete(patient)}
              className="min-h-[32px] px-2.5 py-1 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 active:scale-98 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 whitespace-nowrap ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Hapus Pasien</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Buttons (Kompak, Rapi, & Jelas) */}
        <div className="bg-slate-50 border-b border-slate-200 px-2.5 py-1 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {tabList.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-white' : 'text-blue-600'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Body Content with Custom Dedicated Scrollbar */}
        <div className="flex-1 overflow-y-auto patient-modal-scrollbar p-3.5 sm:p-4 space-y-3.5 text-xs sm:text-sm scroll-smooth">
          
          {/* TAB 1: IDENTITAS & INFO */}
          {activeTab === 'info' && (
            <div className="space-y-3.5">
              {/* Highlight TTV Terkini Banner - Jelas, Tidak Terlalu Besar, Cukup Space */}
              <div className="bg-blue-50/70 p-3 sm:p-3.5 rounded-2xl border border-blue-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-black text-blue-950 flex items-center gap-1.5 text-xs sm:text-sm">
                    <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>TTV Terkini Pasien</span>
                  </span>
                  {onOpenAddVital && (
                    <button
                      onClick={() => onOpenAddVital(patient)}
                      className="min-h-[30px] text-xs font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-50 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Input TTV Baru</span>
                    </button>
                  )}
                </div>

                {latestVital ? (
                  <div className="space-y-2">
                    {/* Measurement Info Banner */}
                    <div className="bg-white/90 p-2 sm:p-2.5 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Waktu: <strong className="text-slate-800 font-bold">{latestVital.timestamp}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Pemeriksa:</span>
                        <strong className="text-blue-800 font-bold">{latestVital.nurseName}</strong>
                      </div>
                    </div>

                    {/* Vitals Grid - 6 Metrik: Jelas, Rapi, & Proporsional */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      {/* Tekanan Darah (TD) */}
                      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-blue-150 shadow-2xs flex flex-col justify-center">
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold block mb-0.5">TD (Tekanan)</span>
                        <strong className="text-slate-900 text-sm sm:text-base font-black tracking-tight">{latestVital.bpSystolic}/{latestVital.bpDiastolic}</strong>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">mmHg</span>
                      </div>

                      {/* Nadi (HR) */}
                      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-blue-150 shadow-2xs flex flex-col justify-center">
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold block mb-0.5">Nadi (HR)</span>
                        <strong className="text-slate-900 text-sm sm:text-base font-black tracking-tight">{latestVital.heartRate}</strong>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">x/mnt</span>
                      </div>

                      {/* Pernapasan (RR) */}
                      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-blue-150 shadow-2xs flex flex-col justify-center">
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold block mb-0.5">Napas (RR)</span>
                        <strong className="text-slate-900 text-sm sm:text-base font-black tracking-tight">{latestVital.respiratoryRate}</strong>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">x/mnt</span>
                      </div>

                      {/* Suhu Tubuh */}
                      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-blue-150 shadow-2xs flex flex-col justify-center">
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold block mb-0.5">Suhu Tubuh</span>
                        <strong className="text-slate-900 text-sm sm:text-base font-black tracking-tight">{latestVital.temperature}°C</strong>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Celcius</span>
                      </div>

                      {/* Saturasi Oksigen */}
                      <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-blue-150 shadow-2xs flex flex-col justify-center">
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold block mb-0.5">SpO₂</span>
                        <strong className="text-blue-700 text-sm sm:text-base font-black tracking-tight">{latestVital.spo2}%</strong>
                        <span className="text-[10px] text-blue-500 font-semibold mt-0.5">Oksigen</span>
                      </div>

                      {/* Gula Darah Sewaktu (GDS) */}
                      <div className={`p-2 sm:p-2.5 rounded-xl border shadow-2xs flex flex-col justify-center ${
                        (latestVital.gds !== undefined || patient.gds !== undefined)
                          ? 'border-amber-200 bg-amber-50/70'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}>
                        <span className="text-[10px] sm:text-[11px] font-bold block mb-0.5 text-amber-900">GDS (Gula)</span>
                        <strong className="text-amber-900 text-sm sm:text-base font-black tracking-tight">
                          {latestVital.gds ?? patient.gds ?? '-'}
                        </strong>
                        <span className="text-[10px] font-semibold mt-0.5 text-amber-700">mg/dL</span>
                      </div>
                    </div>

                    {/* Kesadaran & GCS Banner */}
                    <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs flex flex-wrap items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-500 text-[11px]">Kesadaran / GCS:</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {latestVital.gcs || 'Compos Mentis (E4M6V5)'}
                        </span>
                      </div>
                      {latestVital.notes && (
                        <div className="text-[11px] text-slate-600 italic">
                          Catatan: {latestVital.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 py-2 text-xs">
                    Belum ada data TTV terbaru untuk pasien ini.{' '}
                    {onOpenAddVital && (
                      <button
                        onClick={() => onOpenAddVital(patient)}
                        className="text-blue-600 font-bold underline ml-1 cursor-pointer"
                      >
                        Tambahkan sekarang
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Keluhan Pasien Terkini (Bila Ada) */}
              {(patient.complaint || latestVital?.complaint) && (
                <div className="bg-amber-50/90 p-3 sm:p-3.5 rounded-2xl border border-amber-300 flex items-start gap-2.5 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-black text-sm shrink-0">
                    !
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-xs uppercase tracking-wider">
                        Keluhan Pasien Terkini
                      </span>
                      <span className="text-[10px] text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-full font-bold">
                        Masuk ke SBAR
                      </span>
                    </div>
                    <p className="text-amber-950 font-bold text-xs sm:text-sm mt-1 leading-snug">
                      "{patient.complaint || latestVital?.complaint}"
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Transfer to SBAR CTA */}
              <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-3.5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-blue-200" />
                    <span>Timbang Terima SBAR Pasien Ini</span>
                  </h4>
                  <p className="text-[11px] text-blue-100 mt-0.5">
                    Seluruh data hasil pemeriksaan (Keluhan, Obat, Tindakan, dan TTV) otomatis dibawa ke SBAR.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenHandoverWithPatient(patient.id, latestVital);
                  }}
                  className="px-4 py-2 bg-white text-blue-800 hover:bg-blue-50 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Bawa ke SBAR</span>
                </button>
              </div>

              {/* Diagnosis Medis & Keperawatan - Jelas, Rapi, Tidak Kebesaran */}
              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="font-bold text-slate-500 block mb-0.5 text-[10px] uppercase tracking-wider">
                    Diagnosis Medis
                  </span>
                  <p className="text-slate-900 leading-snug font-bold text-xs sm:text-sm">{patient.medicalDiagnosis}</p>
                </div>
                {patient.nursingDiagnosis && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-500 block mb-0.5 text-[10px] uppercase tracking-wider">
                      Diagnosis Asuhan Keperawatan
                    </span>
                    <p className="text-slate-700 leading-snug text-xs font-medium">{patient.nursingDiagnosis}</p>
                  </div>
                )}
              </div>

              {/* Dokter DPJP & Perawat Penanggung Jawab Pasien */}
              <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-blue-600" />
                        Dokter DPJP
                      </span>
                      {onUpdatePatientDpjp && (
                        <button
                          type="button"
                          onClick={() => setIsEditingDpjp(true)}
                          className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                          title="Kelola Dokter Utama & Konsulen Rawat Bersama"
                        >
                          <Edit2 className="w-2.5 h-2.5 text-blue-600" />
                          <span>Ubah DPJP</span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-900 font-bold text-xs sm:text-sm">
                        {patient.dpjp || (doctorList[0] || 'Belum Ditetapkan')}
                      </p>
                      {doctorList.filter(d => d !== patient.dpjp).length > 0 && (
                        <div className="text-[11px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-200/80">
                          <span className="font-bold text-slate-500 uppercase text-[9px] block">
                            Konsulen / Rawat Bersama:
                          </span>
                          {doctorList
                            .filter(d => d !== patient.dpjp)
                            .map((k, idx) => (
                              <div key={idx} className="font-medium text-blue-900 truncate">
                                • {k}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                        Perawat PPJP
                      </span>
                      {patient.nurseInCharge && onUnassignNurse && (
                        <button
                          type="button"
                          onClick={() => onUnassignNurse(patient.id)}
                          className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                          title="Lepas pasien dari perawat ini (rekam medis pasien tetap aman)"
                        >
                          <UserMinus className="w-3 h-3 text-rose-600" />
                          <span>Lepas Pasien</span>
                        </button>
                      )}
                    </div>
                    <p className="text-blue-700 font-bold text-xs sm:text-sm">
                      {patient.nurseInCharge || 'Belum Ditugaskan'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Medication Summary on Info Tab */}
              <div className="bg-blue-50/40 p-3 sm:p-3.5 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Pill className="w-3.5 h-3.5 text-blue-600" />
                    <span>Terapi Obat Aktif ({activeMeds.length})</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onOpenAddMedication && (
                      <button
                        onClick={() => onOpenAddMedication(patient)}
                        className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('obat')}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Lihat Semua</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeMeds.length === 0 ? (
                  <div className="text-slate-500 py-1 text-xs">
                    Belum ada obat aktif terdaftar.{' '}
                    {onOpenAddMedication && (
                      <button
                        onClick={() => onOpenAddMedication(patient)}
                        className="text-blue-600 font-bold underline ml-1 cursor-pointer"
                      >
                        + Tambah Obat Pasien
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activeMeds.slice(0, 3).map(med => (
                      <div
                        key={med.id}
                        className="bg-white p-2.5 rounded-xl border border-blue-100 flex items-center justify-between shadow-2xs text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-900">{med.name}</span>
                          <span className="text-[11px] text-blue-700 font-semibold ml-2">
                            {med.dosage} · {med.route}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {med.frequency} {med.scheduleTimes ? `· Jam: ${med.scheduleTimes}` : ''}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                          Aktif
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rawat Inap & Hari Perawatan */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Waktu Masuk Rawat</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    {patient.admissionDate} · {patient.admissionTime || '08:00'}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-bold">Lama Rawat Inap</span>
                  <p className="font-bold text-blue-700 text-xs mt-0.5">
                    {hospitalDayInfo.text}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block font-bold">Jaminan Kesehatan</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {patient.insurance}
                </p>
              </div>

              {/* Rencana Tindakan & Observasi Pasien (DPJP) */}
              <div className="bg-blue-50/70 p-3 sm:p-3.5 rounded-2xl border border-blue-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Rencana Tindakan &amp; Instruksi DPJP</span>
                  </span>
                  {onUpdatePlannedActions && (
                    <button
                      type="button"
                      onClick={() => setIsEditingPlannedAction(prev => !prev)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>{isEditingPlannedAction ? 'Batal' : (patient.plannedActions ? 'Ubah Rencana' : '+ Tambah Rencana')}</span>
                    </button>
                  )}
                </div>

                {isEditingPlannedAction ? (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    {/* Quick Presets */}
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar p-1 bg-white/80 rounded-xl border border-blue-100">
                      {plannedActionPresets.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddPresetLocal(preset)}
                          className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-md border border-blue-200 transition-colors text-left flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5 text-blue-600" />
                          <span>{preset}</span>
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={4}
                      value={plannedActionInput}
                      onChange={e => setPlannedActionInput(e.target.value)}
                      placeholder="Contoh:&#10;• OBS KU, TTV DAN KESADARAN&#10;• HEAD UP 30 DERAJAT&#10;• SUCTION BERKALA&#10;• GV CVC per 2 hari"
                      className="w-full p-2.5 rounded-xl border border-blue-300 bg-white text-xs leading-relaxed font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-inner"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPlannedActionInput(patient.plannedActions || '');
                          setIsEditingPlannedAction(false);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePlannedActionLocal}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Rencana</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {patient.plannedActions ? (
                      <p className="text-slate-800 font-medium text-xs leading-relaxed whitespace-pre-line bg-white/80 p-2.5 rounded-xl border border-blue-100">
                        {patient.plannedActions}
                      </p>
                    ) : (
                      <div className="text-slate-400 italic text-xs py-1">
                        Belum ada instruksi atau rencana tindakan tercatat.{' '}
                        {onUpdatePlannedActions && (
                          <button
                            type="button"
                            onClick={() => setIsEditingPlannedAction(true)}
                            className="text-blue-600 font-bold underline ml-1 cursor-pointer not-italic"
                          >
                            + Tambah sekarang
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Alergi & Catatan */}
              <div className="bg-rose-50/70 p-2.5 sm:p-3 rounded-xl border border-rose-200 text-rose-900">
                <span className="font-bold block mb-0.5 flex items-center gap-1 text-rose-800 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Riwayat Alergi
                </span>
                <p className="font-medium text-xs">{patient.allergies || 'Tidak ada riwayat alergi yang dilaporkan'}</p>
              </div>

              {patient.notes && (
                <div className="bg-amber-50/70 p-2.5 sm:p-3 rounded-xl border border-amber-200 text-amber-900">
                  <span className="font-bold block mb-0.5 text-amber-800 text-xs">Catatan Khusus Keperawatan</span>
                  <p className="leading-relaxed text-xs">{patient.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RIWAYAT TTV */}
          {activeTab === 'ttv' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div>
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-xs block">
                    Riwayat Pengukuran TTV Pasien ({patientVitals.length})
                  </span>
                  <p className="text-[11px] text-slate-500">Tanda-tanda vital termonitor berkala</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {patientVitals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenHandoverWithPatient(patient.id, latestVital)}
                      className="min-h-[34px] px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                      title="Bawa TTV terbaru pasien langsung ke lembar Timbang Terima SBAR"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Tarik ke SBAR</span>
                    </button>
                  )}
                  {onOpenAddVital && (
                    <button
                      onClick={() => onOpenAddVital(patient)}
                      className="min-h-[34px] px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah TTV</span>
                    </button>
                  )}
                </div>
              </div>

              {patientVitals.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-6 text-center text-slate-500 space-y-2 border border-slate-200">
                  <HeartPulse className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">Belum ada data TTV tercatat untuk pasien ini.</p>
                  {onOpenAddVital && (
                    <button
                      onClick={() => onOpenAddVital(patient)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Input TTV Pertama
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {patientVitals.map((v, idx) => (
                    <div
                      key={v.id}
                      className={`p-3 rounded-2xl border shadow-2xs space-y-2 ${
                        idx === 0 ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-1.5 gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{v.timestamp}</span>
                          {idx === 0 && (
                            <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Terbaru
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>Oleh: <strong className="text-slate-800 font-bold">{v.nurseName}</strong></span>
                          {onOpenAddVital && (
                            <button
                              type="button"
                              onClick={() => onOpenAddVital(patient, v)}
                              className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit data TTV ini"
                            >
                              <Edit2 className="w-2.5 h-2.5 text-blue-600" />
                              <span>Edit</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenHandoverWithPatient(patient.id, v)}
                            className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Tarik data TTV ini ke lembar Timbang Terima Handover SBAR"
                          >
                            <ArrowDownToLine className="w-3 h-3 text-emerald-600" />
                            <span>Tarik ke SBAR</span>
                          </button>
                        </div>
                      </div>

                      {/* Vital Data Grid - 6 Metrik Rapi & Proporsional */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 text-center">
                        <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] sm:text-[11px] text-slate-500 block font-bold">TD</span>
                          <strong className="text-slate-900 text-xs sm:text-sm font-black">{v.bpSystolic}/{v.bpDiastolic}</strong>
                          <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">mmHg</span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] sm:text-[11px] text-slate-500 block font-bold">Nadi</span>
                          <strong className="text-slate-900 text-xs sm:text-sm font-black">{v.heartRate}</strong>
                          <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">x/mnt</span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] sm:text-[11px] text-slate-500 block font-bold">RR</span>
                          <strong className="text-slate-900 text-xs sm:text-sm font-black">{v.respiratoryRate}</strong>
                          <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">x/mnt</span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] sm:text-[11px] text-slate-500 block font-bold">Suhu</span>
                          <strong className="text-slate-900 text-xs sm:text-sm font-black">{v.temperature}°C</strong>
                          <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">Celcius</span>
                        </div>
                        <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                          <span className="text-[10px] sm:text-[11px] text-slate-500 block font-bold">SpO₂</span>
                          <strong className="text-blue-700 text-xs sm:text-sm font-black">{v.spo2}%</strong>
                          <span className="text-[9px] text-blue-500 block font-semibold mt-0.5">Oksigen</span>
                        </div>
                        <div className={`p-2 rounded-xl border shadow-2xs ${
                          v.gds !== undefined ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50/50 border-slate-200'
                        }`}>
                          <span className="text-[10px] sm:text-[11px] text-amber-900 block font-bold">GDS</span>
                          <strong className="text-amber-900 text-xs sm:text-sm font-black">{v.gds !== undefined ? v.gds : '-'}</strong>
                          <span className="text-[9px] text-amber-700 block font-semibold mt-0.5">mg/dL</span>
                        </div>
                      </div>

                      {v.gcs && (
                        <div className="text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold">Kesadaran / GCS:</span>
                          <strong className="text-slate-900 font-bold">{v.gcs}</strong>
                        </div>
                      )}

                      {v.notes && (
                        <p className="text-[11px] text-slate-600 italic bg-slate-50/60 p-2 rounded-lg border border-slate-200 font-medium">
                          Catatan: {v.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OBAT & TERAPI (MENAMBAHKAN & MENGHAPUS OBAT) */}
          {activeTab === 'obat' && (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/60 p-3 rounded-2xl border border-blue-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <span>Terapi Obat Pasien ({patientMeds.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Nama obat, dosis, tanggal &amp; jam pemberian terapi
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                  {patientMeds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenHandoverWithPatient(patient.id);
                      }}
                      className="min-h-[36px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                      title="Bawa data obat pasien ini ke lembar SBAR"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Tarik Obat ke SBAR</span>
                    </button>
                  )}
                  {onOpenAddMedication && (
                    <button
                      onClick={() => onOpenAddMedication(patient)}
                      className="min-h-[36px] px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Obat</span>
                    </button>
                  )}
                </div>
              </div>

              {patientMeds.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-500 space-y-2.5 border border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Belum Ada Obat Terdaftar</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tambahkan terapi obat yang diresepkan dokter untuk pasien ini.
                    </p>
                  </div>
                  {onOpenAddMedication && (
                    <button
                      onClick={() => onOpenAddMedication(patient)}
                      className="min-h-[36px] px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Obat Sekarang</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {patientMeds.map(med => {
                    const isAktif = med.status === 'Aktif';

                    return (
                      <div
                        key={med.id}
                        className={`p-3 rounded-xl border shadow-2xs space-y-2 transition-all ${
                          isAktif
                            ? 'bg-white border-blue-200'
                            : 'bg-slate-50/80 border-slate-200 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                {med.name}
                              </h4>
                              <span className="bg-blue-600 text-white font-bold px-2 py-0.5 rounded text-[11px] shadow-2xs">
                                Dosis: {med.dosage}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                              <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                <Calendar className="w-3 h-3 text-blue-600" />
                                <span>{med.date || med.startDate || 'Hari ini'}</span>
                              </span>
                              <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 font-mono">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>Pukul {med.time || med.scheduleTimes || '08:00'}</span>
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                              isAktif
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {med.status}
                          </span>
                        </div>

                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                          {onEditMedication && (
                            <button
                              onClick={() => onEditMedication(med)}
                              className="min-h-[28px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                            >
                              <Edit2 className="w-3 h-3 text-slate-600" />
                              <span>Edit</span>
                            </button>
                          )}
                          {onDeleteMedication && (
                            <button
                              onClick={() => onDeleteMedication(med)}
                              className="min-h-[28px] px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                              title="Hapus obat ini"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TINDAKAN KEPERAWATAN (SEDERHANA & SIMPEL) */}
          {activeTab === 'tindakan' && (
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tindakan Asuhan ({patientActions.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Catat dan pantau tindakan yang sudah dilakukan ke pasien
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddingAction(prev => !prev)}
                    className="min-h-[36px] px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingAction ? 'Tutup Formulir' : '+ Tambah Tindakan'}</span>
                  </button>
                </div>
              </div>

              {/* FORM TAMBAH TINDAKAN SECARA SEDERHANA & SIMPEL */}
              {isAddingAction && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                  <h4 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Formulir Tambah Tindakan Sederhana</span>
                  </h4>

                  {/* Nama Tindakan */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                      Nama Tindakan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={actionTitle}
                      onChange={e => setActionTitle(e.target.value)}
                      placeholder="Contoh: Injeksi Ceftriaxone 1 gr IV, Rawat luka operasi..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />

                    {/* Quick Suggestions Chips */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        'Injeksi Obat DPJP',
                        'Perawatan & Balut Luka',
                        'Rawat / Pasang Infus',
                        'Nebulisasi Bronkodilator',
                        'Observasi TTV & Keadaan Umum',
                        'Mobilisasi Pasien',
                        'Ambil Darah Laboratorium',
                      ].map(sug => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setActionTitle(sug)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                            actionTitle === sug
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5 text-[10px]">
                        Jam Tindakan
                      </label>
                      <input
                        type="time"
                        value={actionTime}
                        onChange={e => setActionTime(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                        required
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 flex items-end">
                      <label className={`w-full flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-colors ${
                        actionCompleted
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={actionCompleted}
                          onChange={e => setActionCompleted(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className={`font-bold text-[11px] leading-tight ${
                            actionCompleted ? 'text-emerald-800' : 'text-slate-700'
                          }`}>
                            {actionCompleted ? 'Sudah Dilakukan' : 'Belum Dilakukan'}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {actionCompleted ? 'Selesai' : 'Rencana'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={actionNotes}
                      onChange={e => setActionNotes(e.target.value)}
                      placeholder="Catatan / respon pasien (opsional)..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingAction(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!actionTitle.trim()) return;
                        if (onSaveAction) {
                          const today = new Date().toISOString().split('T')[0];
                          onSaveAction({
                            patientId: patient.id,
                            timestamp: `${today} ${actionTime}`,
                            category: actionCategory,
                            title: actionTitle.trim(),
                            notes: actionNotes.trim() || undefined,
                            completed: actionCompleted,
                            completedAt: actionCompleted ? `${today} ${actionTime}` : undefined,
                            nurseName: currentNurseName,
                            shift: currentShift,
                          });
                        }
                        setActionTitle('');
                        setActionNotes('');
                        setActionCompleted(false);
                        setIsAddingAction(false);
                      }}
                      disabled={!actionTitle.trim()}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Tindakan</span>
                    </button>
                  </div>
                </div>
              )}

              {patientActions.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-6 text-center text-slate-400 border border-slate-200 text-xs space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto" />
                  <p>Belum ada tindakan tercatat untuk pasien ini.</p>
                  <button
                    type="button"
                    onClick={() => setIsAddingAction(true)}
                    className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-xl text-xs"
                  >
                    + Catat Tindakan Pertama
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {patientActions.map(action => (
                    <div
                      key={action.id}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 shadow-2xs transition-all ${
                        action.completed
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Checkbox Toggle Button */}
                      {onToggleActionComplete ? (
                        <button
                          type="button"
                          onClick={() => onToggleActionComplete(action.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                            action.completed
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white text-transparent border border-slate-300 hover:border-emerald-500'
                          }`}
                          title={action.completed ? 'Sudah Dilakukan (Klik untuk ubah)' : 'Belum Selesai (Klik untuk tandai selesai)'}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                            action.completed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-400 border border-slate-300'
                          }`}
                        >
                          {action.completed ? '✓' : '•'}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`font-bold text-xs ${
                              action.completed ? 'text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            {action.title}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                              action.completed
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {action.completed ? 'Sudah Dilakukan' : 'Pending'}
                          </span>
                        </div>

                        {action.notes && (
                          <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            {action.notes}
                          </p>
                        )}

                        <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{action.timestamp}</span>
                            <span>·</span>
                            <span>Pelaksana: <strong className="text-slate-700">{action.nurseName}</strong></span>
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
                              className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
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
          )}

          {/* TAB 5: TIMBANG TERIMA SBAR */}
          {activeTab === 'sbar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block">
                    Riwayat Timbang Terima Handover SBAR ({patientHandovers.length})
                  </span>
                  <p className="text-[11px] text-slate-500">Komunikasi serah terima asuhan keperawatan</p>
                </div>
                {patient.lifeStatus === 'aktif' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenHandoverWithPatient(patient.id);
                    }}
                    className="min-h-[32px] px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat SBAR</span>
                  </button>
                )}
              </div>

              {patientHandovers.length === 0 ? (
                <div className="bg-slate-50 p-6 rounded-xl text-center text-slate-400 border border-slate-200 space-y-2 text-xs">
                  <ArrowRightLeft className="w-6 h-6 text-slate-300 mx-auto" />
                  <p>Belum ada catatan timbang terima untuk pasien ini.</p>
                  {patient.lifeStatus === 'aktif' && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenHandoverWithPatient(patient.id);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                    >
                      Mulai Handover SBAR Pasien Ini
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {patientHandovers.map(h => (
                    <div
                      key={h.id}
                      className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 shadow-2xs"
                    >
                      <div className="flex justify-between items-center text-[11px] text-slate-500 border-b border-slate-100 pb-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{h.timestamp}</span>
                        </div>
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[10px]">
                          Shift {h.shift}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-800">
                        <p className="bg-slate-50 p-2 rounded-lg">
                          <strong className="text-blue-700 mr-1.5">S (Situation):</strong> {h.situation}
                        </p>
                        <p className="bg-slate-50 p-2 rounded-lg">
                          <strong className="text-emerald-700 mr-1.5">B (Background):</strong> {h.background}
                        </p>
                        <p className="bg-slate-50 p-2 rounded-lg">
                          <strong className="text-amber-700 mr-1.5">A (Assessment):</strong> {h.assessment}
                        </p>
                        <p className="bg-slate-50 p-2 rounded-lg">
                          <strong className="text-purple-700 mr-1.5">R (Recommendation):</strong> {h.recommendation}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>
                          Dari: <strong>{h.handoverFrom}</strong> ke <strong>{h.handoverTo}</strong>
                        </span>
                        {h.verifiedByKaru && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            ✓ Diverifikasi Karu
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Quick Action */}
        <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs active:scale-95 cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* MODAL OVERLAY: KELOLA DOKTER DPJP & KONSULEN (PASIEN INI) */}
        {isEditingDpjp && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold shadow-2xs">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base leading-tight">
                      Kelola Dokter DPJP &amp; Konsulen
                    </h3>
                    <p className="text-[11px] text-blue-100 mt-0.5">
                      {patient.name} ({patient.rmNumber}) · {patient.bed}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingDpjp(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveDpjpLocal} className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
                {/* 1. Dokter Utama (Primary DPJP) */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    Dokter DPJP Utama <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Dokter spesialis penanggung jawab utama perawatan pasien ini.
                  </p>
                  <select
                    value={selectedPrimaryDpjp}
                    onChange={e => {
                      const newPrimary = e.target.value;
                      setSelectedPrimaryDpjp(newPrimary);
                      setSelectedConsultants(prev => prev.filter(c => c !== newPrimary));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-bold text-slate-800"
                    required
                  >
                    <option value="" disabled>-- Pilih Dokter Utama --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.specialization}) {d.status !== 'Aktif' ? `[${d.status}]` : ''}
                      </option>
                    ))}
                    {selectedPrimaryDpjp && !doctors.some(d => d.name === selectedPrimaryDpjp) && (
                      <option value={selectedPrimaryDpjp}>{selectedPrimaryDpjp} (Dokter Saat Ini)</option>
                    )}
                  </select>
                </div>

                {/* 2. Dokter Konsulen / Rawat Bersama */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800">
                      Dokter Konsulen / Rawat Bersama (Opsional)
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {selectedConsultants.length} Konsulen Terpilih
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Centang dokter lain yang merawat bersama atau memberikan advice/konsultasi.
                  </p>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {doctors
                      .filter(d => d.name !== selectedPrimaryDpjp)
                      .map(doc => {
                        const isChecked = selectedConsultants.includes(doc.name);
                        return (
                          <label
                            key={doc.id}
                            className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedConsultants(prev =>
                                  isChecked ? prev.filter(c => c !== doc.name) : [...prev, doc.name]
                                );
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs truncate">{doc.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{doc.specialization}</div>
                            </div>
                          </label>
                        );
                      })}

                    {/* Any consultants not in doctor list */}
                    {selectedConsultants
                      .filter(c => !doctors.some(d => d.name === c) && c !== selectedPrimaryDpjp)
                      .map(c => (
                        <div
                          key={c}
                          className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold"
                        >
                          <span className="text-xs truncate">{c}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedConsultants(prev => prev.filter(item => item !== c))}
                            className="text-rose-600 text-xs hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Input Tambah Dokter Khusus / Konsulen Luar */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tambah Nama Dokter Konsulen Lain:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customDoctorInput}
                      onChange={e => setCustomDoctorInput(e.target.value)}
                      placeholder="Contoh: dr. Anestesi, Sp.An"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomDoctorToConsultants}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingDpjp(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan DPJP Pasien</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
