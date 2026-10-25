import React, { useState, useMemo, useEffect } from 'react';
import {
  Stethoscope,
  Search,
  X,
  ChevronRight,
  Edit2,
  Trash2,
  Users,
  HeartPulse,
  Activity,
  Bed,
  Plus,
  Pill,
  FileSpreadsheet,
  LayoutGrid,
  Eye,
  AlertCircle,
  ClipboardList,
  Save,
  FlaskConical,
} from 'lucide-react';
import {
  DoctorDPJP,
  Patient,
  PatientCondition,
  PatientLifeStatus,
  Ward,
  VitalSign,
  PatientMedication,
  NursingAction,
  calculateHospitalDay,
} from '../types';

interface DpjpViewProps {
  doctors: DoctorDPJP[];
  patients: Patient[];
  wards: Ward[];
  vitals: VitalSign[];
  medications?: PatientMedication[];
  actions?: NursingAction[];
  onOpenAddDoctor?: () => void;
  onEditDoctor?: (doctor: DoctorDPJP) => void;
  onDeleteDoctor?: (doctor: DoctorDPJP) => void;
  onOpenAddPatient: () => void;
  onOpenAddVital?: (patient: Patient) => void;
  onOpenAddMedication?: (patient: Patient) => void;
  onOpenAddAction?: (patient: Patient) => void;
  onUpdatePlannedActions?: (patientId: string, plannedActions: string) => void;
  onUpdatePatientDpjp?: (patientId: string, primaryDpjp: string, dpjps: string[]) => void;
  onUpdatePatientLabResults?: (patientId: string, labResults: string) => void;
  onSaveAction?: (actionData: Omit<NursingAction, 'id'>) => void;
  onSelectPatientDetail: (patient: Patient) => void;
}

// Layout style in Lembar Pasien DPJP:
// 'tabel': Format tabel ala spreadsheet RS seperti foto
// 'kartu': Format kartu klinis yang simpel & mobile-friendly
type DisplayLayout = 'tabel' | 'kartu';

export const DpjpView: React.FC<DpjpViewProps> = ({
  doctors,
  patients,
  wards,
  vitals,
  medications = [],
  actions = [],
  onOpenAddDoctor,
  onEditDoctor,
  onDeleteDoctor,
  onOpenAddPatient,
  onOpenAddVital,
  onOpenAddMedication,
  onOpenAddAction,
  onUpdatePlannedActions,
  onUpdatePatientDpjp,
  onUpdatePatientLabResults,
  onSaveAction,
  onSelectPatientDetail,
}) => {
  // Layout mode: 'tabel' (default) or 'kartu'
  const [layoutMode, setLayoutMode] = useState<DisplayLayout>('tabel');

  // Selected Doctor filter: 'all' or doctor name
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>('all');

  // Modal State: Kelola Seluruh Daftar Dokter DPJP
  const [isManageDoctorsOpen, setIsManageDoctorsOpen] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  // Search state to filter/find doctors directly on DPJP main page
  const [doctorSearchFilter, setDoctorSearchFilter] = useState('');

  // Auto-reset selectedDoctorName if doctor was deleted
  useEffect(() => {
    if (selectedDoctorName !== 'all') {
      const exists = doctors.some(
        d => d.name.trim().toLowerCase() === selectedDoctorName.trim().toLowerCase()
      );
      if (!exists) {
        setSelectedDoctorName('all');
      }
    }
  }, [doctors, selectedDoctorName]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWard, setFilterWard] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterLifeStatus, setFilterLifeStatus] = useState<string>('aktif');

  // ==========================================
  // MODAL STATE: TAMBAH / UBAH RENCANA TINDAKAN
  // ==========================================
  const [plannedActionPatient, setPlannedActionPatient] = useState<Patient | null>(null);
  const [plannedActionInput, setPlannedActionInput] = useState('');

  // ==========================================
  // MODAL STATE: CATAT / UBAH HASIL LABORATORIUM
  // ==========================================
  const [labModalPatient, setLabModalPatient] = useState<Patient | null>(null);
  const [labModalInput, setLabModalInput] = useState('');

  // Helper to resolve doctor name from ID or name (prevents numeric bug like "1")
  const resolveDoctorName = (nameOrId: string | undefined): string => {
    if (!nameOrId) return '';
    const trimmed = String(nameOrId).trim();
    if (trimmed === '1' || trimmed === 'doc-1') {
      return doctors[0]?.name || 'dr. Hendra Kurniawan, Sp.B';
    }
    const match = doctors.find(
      d => d.id === trimmed || d.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (match) return match.name;
    return trimmed;
  };

  const handleOpenLabModal = (patient: Patient) => {
    setLabModalPatient(patient);
    setLabModalInput(patient.labResults || '- Hb: \n- Leukosit: \n- Trombosit: \n- Hematokrit: \n- GDS: ');
  };

  const handleAddLabPresetToModal = (testName: string) => {
    setLabModalInput(prev => {
      const trimmed = prev.trim();
      const bullet = `- ${testName}: `;
      return trimmed ? `${trimmed}\n${bullet}` : bullet;
    });
  };

  // ==========================================
  // MODAL STATE: KELOLA DOKTER DPJP & KONSULEN
  // ==========================================
  const [manageDpjpPatient, setManageDpjpPatient] = useState<Patient | null>(null);
  const [managePrimaryDpjp, setManagePrimaryDpjp] = useState('');
  const [manageConsultants, setManageConsultants] = useState<string[]>([]);
  const [customConsultantInput, setCustomConsultantInput] = useState('');

  const handleOpenManageDpjp = (patient: Patient) => {
    setManageDpjpPatient(patient);
    const prim = resolveDoctorName(patient.dpjp || (patient.dpjps && patient.dpjps[0])) || (doctors[0]?.name || '');
    setManagePrimaryDpjp(prim);
    setManageConsultants(patient.dpjps ? patient.dpjps.map(resolveDoctorName).filter(d => d !== prim) : []);
    setCustomConsultantInput('');
  };

  const handleSaveManageDpjp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageDpjpPatient || !onUpdatePatientDpjp) return;
    const prim = managePrimaryDpjp.trim();
    if (!prim) return;
    const all = Array.from(new Set([prim, ...manageConsultants].filter(Boolean)));
    onUpdatePatientDpjp(manageDpjpPatient.id, prim, all);
    setManageDpjpPatient(null);
  };

  const handleAddCustomConsultant = () => {
    const trimmed = customConsultantInput.trim();
    if (!trimmed) return;
    if (!manageConsultants.includes(trimmed) && trimmed !== managePrimaryDpjp) {
      setManageConsultants(prev => [...prev, trimmed]);
    }
    setCustomConsultantInput('');
  };

  // Active rawat inap patients
  const activePatients = useMemo(() => {
    return patients.filter(p => p.lifeStatus === 'aktif');
  }, [patients]);

  // Helper: Resilient matching whether doctor is primary DPJP or ruber / consultant DPJP
  const isDoctorMatch = (doctorName: string, patient: Patient) => {
    if (!doctorName || doctorName === 'all') return true;
    const normalize = (s: string) =>
      s.toLowerCase().replace(/^dr\.?\s*/i, '').replace(/,\s*sp\..*$/i, '').trim();

    const targetNorm = normalize(doctorName);
    const targetRaw = doctorName.trim().toLowerCase();

    const check = (docName: string) => {
      if (!docName) return false;
      const raw = docName.trim().toLowerCase();
      const norm = normalize(docName);
      return (
        raw === targetRaw ||
        norm === targetNorm ||
        raw.includes(targetRaw) ||
        targetRaw.includes(raw) ||
        (targetNorm.length > 3 && norm.includes(targetNorm))
      );
    };

    if (patient.dpjp && check(patient.dpjp)) return true;
    if (patient.dpjps && patient.dpjps.some(d => check(d))) return true;
    return false;
  };

  // Helper: Get patients for a specific doctor (both primary & ruber/consultant)
  const getDoctorPatients = (doctorName: string): Patient[] => {
    return activePatients.filter(p => isDoctorMatch(doctorName, p));
  };

  // Filtered Patients List for the Lembar Pasien DPJP
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const query = searchQuery.toLowerCase().trim();
      const patientMeds = medications.filter(m => m.patientId === patient.id);
      const matchesSearch =
        !query ||
        patient.name.toLowerCase().includes(query) ||
        patient.rmNumber.toLowerCase().includes(query) ||
        patient.bed.toLowerCase().includes(query) ||
        patient.medicalDiagnosis.toLowerCase().includes(query) ||
        (patient.dpjp && patient.dpjp.toLowerCase().includes(query)) ||
        (patient.dpjps &&
          patient.dpjps.some(d => d.toLowerCase().includes(query))) ||
        (patient.complaint &&
          patient.complaint.toLowerCase().includes(query)) ||
        (patient.plannedActions &&
          patient.plannedActions.toLowerCase().includes(query)) ||
        patientMeds.some(m => m.name.toLowerCase().includes(query));

      const matchesLifeStatus =
        filterLifeStatus === 'all' || patient.lifeStatus === filterLifeStatus;

      const matchesCondition =
        filterCondition === 'all' ||
        (filterCondition === 'prioritas'
          ? patient.status === 'kritis' || patient.status === 'perhatian'
          : patient.status === filterCondition);

      const matchesWard =
        filterWard === 'all' || patient.room === filterWard;

      // Filter by selected doctor (matches if primary or ruber / consultant)
      const matchesDoctor = isDoctorMatch(selectedDoctorName, patient);

      return (
        matchesSearch &&
        matchesLifeStatus &&
        matchesCondition &&
        matchesWard &&
        matchesDoctor
      );
    });
  }, [
    patients,
    searchQuery,
    filterLifeStatus,
    filterCondition,
    filterWard,
    selectedDoctorName,
    medications,
  ]);

  // Selected doctor object (if filtered by a specific doctor)
  const currentSelectedDoctor = useMemo(() => {
    if (selectedDoctorName === 'all') return null;
    return doctors.find(
      d => d.name.trim().toLowerCase() === selectedDoctorName.trim().toLowerCase()
    );
  }, [doctors, selectedDoctorName]);

  // Filtered doctors list for the main DPJP doctor selector and search
  const filteredDoctorList = useMemo(() => {
    const query = doctorSearchFilter.trim().toLowerCase();
    if (!query) return doctors;
    return doctors.filter(
      doc =>
        doc.name.toLowerCase().includes(query) ||
        (doc.specialization && doc.specialization.toLowerCase().includes(query)) ||
        (doc.phone && doc.phone.toLowerCase().includes(query))
    );
  }, [doctors, doctorSearchFilter]);

  // Helper: Get latest vital for patient
  const getLatestVital = (patientId: string): VitalSign | undefined => {
    return vitals
      .filter(v => v.patientId === patientId)
      .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))[0];
  };

  // Helper: Get active medications for patient
  const getPatientMedications = (patientId: string): PatientMedication[] => {
    return medications.filter(m => m.patientId === patientId && m.status === 'Aktif');
  };

  // Open modal to add or edit planned actions
  const handleOpenPlannedActionModal = (patient: Patient) => {
    setPlannedActionPatient(patient);
    setPlannedActionInput(patient.plannedActions || '');
  };

  // Save planned action
  const handleSavePlannedAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannedActionPatient) return;

    const trimmed = plannedActionInput.trim();

    if (onUpdatePlannedActions) {
      onUpdatePlannedActions(plannedActionPatient.id, trimmed);
    }

    setPlannedActionPatient(null);
  };

  // Preset clinical recommendations (inspired directly by hospital sheet)
  const plannedActionPresets = [
    'OBS KU, TTV DAN KESADARAN',
    'HEAD UP 30 DERAJAT',
    'SUCTION BERKALA',
    'GANTI ANAK KANUL / SHIFT',
    'ASSESMEN RISIKO JATUH PER HARI',
    'GV CVC / RAWAT LUMEN CVC',
    'CEK GDS PER 6 JAM',
    'MIKA / MIKI PER 2 JAM',
    'BED ANTI-DEKUBITUS',
    'KOREKSI HIPOKALEMIA (D5% / OIKN)',
    'CEK ELEKTROLIT CITO (NA, K, CL)',
    'EVALUASI CT SCAN / FOTO THORAX',
    'AFF NGT & EVALUASI BISING USUS',
    'RAWAT BALUTAN LUKA STERIL',
    'PASANG KATETER URIN & OBS DIURESIS',
    'NEBULISASI BRONKODILATOR',
  ];

  const handleAddPresetToPlan = (preset: string) => {
    setPlannedActionInput(prev => {
      const trimmed = prev.trim();
      const bullet = `• ${preset}`;
      if (!trimmed) return bullet;
      if (trimmed.includes(preset)) return trimmed;
      return `${trimmed}\n${bullet}`;
    });
  };

  // Status Badge Helper
  const getStatusBadge = (status: PatientCondition, lifeStatus: PatientLifeStatus) => {
    if (lifeStatus !== 'aktif') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wider">
          {lifeStatus}
        </span>
      );
    }

    switch (status) {
      case 'kritis':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Kritis
          </span>
        );
      case 'perhatian':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Perhatian
          </span>
        );
      case 'stabil':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Stabil
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 animate-in fade-in duration-200">
      
      {/* 1. Header: DPJP Title, Description & Action Buttons */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Dokter Penanggung Jawab Pelayanan (DPJP)
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Lembar Ronde &amp; Aplusan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar Pasien Rawat Inap, Kondisi Klinis, Rencana Tindakan &amp; Terapi Obat
            </p>
          </div>
        </div>

        {/* Action Button: Kelola Dokter */}
        <div className="w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsManageDoctorsOpen(true)}
            className="w-full sm:w-auto min-h-[40px] px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            title="Kelola &amp; hapus dokter DPJP"
          >
            <Stethoscope className="w-4 h-4 text-blue-200" />
            <span>Kelola Dokter ({doctors.length})</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* LEMBAR PASIEN DPJP (FORMAT APLUSAN / DAFTAR PASIEN DOKTER) */}
      {/* ======================================================== */}
      <div className="space-y-3.5">
        
        {/* A. Selector Dokter: Menampilkan Daftar Dokter & Pasien yang Dipegang */}
        <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Pilih Dokter DPJP Yang Memegang Pasien
              </h3>
            </div>

            {/* Layout Switcher (Tabel Spreadsheet vs Kartu Simpel) & Export Buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[11px] border border-slate-200">
                <button
                  onClick={() => setLayoutMode('tabel')}
                  title="Tampilan Tabel Spreadsheet"
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    layoutMode === 'tabel'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Format Tabel</span>
                </button>
                <button
                  onClick={() => setLayoutMode('kartu')}
                  title="Tampilan Kartu Simpel"
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    layoutMode === 'kartu'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Format Kartu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Fitur Pencarian Nama Dokter DPJP di Laman DPJP */}
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={doctorSearchFilter}
                onChange={e => setDoctorSearchFilter(e.target.value)}
                placeholder="Cari nama dokter DPJP atau spesialisasi (misal: dr. Budi, spesialis penyakit dalam)..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
              />
              {doctorSearchFilter && (
                <button
                  type="button"
                  onClick={() => setDoctorSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Hapus pencarian dokter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Info ringkas hasil pencarian dokter */}
            {doctorSearchFilter && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>
                  Menampilkan <strong className="text-blue-600 font-bold">{filteredDoctorList.length}</strong> dari {doctors.length} dokter DPJP
                </span>
                {filteredDoctorList.length === 0 ? (
                  <span className="text-rose-600 font-semibold">Tidak ditemukan</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDoctorSearchFilter('')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Tampilkan Semua Dokter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Horizontal Doctor Filter Chips (Scrollable & Responsive) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {/* Option: Semua DPJP */}
            <button
              onClick={() => setSelectedDoctorName('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs flex items-center gap-1.5 transition-all min-h-[36px] cursor-pointer ${
                selectedDoctorName === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Semua DPJP</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedDoctorName === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {activePatients.length}
              </span>
            </button>

            {/* Individual Doctor Chips */}
            {filteredDoctorList.map(doc => {
              const docPatientsCount = getDoctorPatients(doc.name).length;
              const isSelected = selectedDoctorName.trim().toLowerCase() === doc.name.trim().toLowerCase();

              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoctorName(doc.name)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs flex items-center gap-2 transition-all min-h-[36px] border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : doc.status === 'Cuti'
                      ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate max-w-[170px]">{doc.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : docPatientsCount > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {docPatientsCount}
                  </span>
                  {doc.status !== 'Aktif' && (
                    <span className={`text-[9px] px-1 rounded uppercase ${isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-200 text-amber-900'}`}>
                      {doc.status}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredDoctorList.length === 0 && doctorSearchFilter && (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Tidak ada dokter DPJP yang cocok dengan kata kunci &ldquo;{doctorSearchFilter}&rdquo;. Silakan periksa ejaan nama dokter.
            </div>
          )}

          {/* Selected Doctor Detail Card (if a doctor is chosen) */}
          {currentSelectedDoctor && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 text-sm">
                      {currentSelectedDoctor.name}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentSelectedDoctor.status === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {currentSelectedDoctor.status}
                    </span>
                  </div>
                  <p className="text-xs text-blue-800 font-medium">
                    {currentSelectedDoctor.specialization}
                    {currentSelectedDoctor.phone && ` • HP/WA: ${currentSelectedDoctor.phone}`}
                    {currentSelectedDoctor.sipNumber && ` • SIP: ${currentSelectedDoctor.sipNumber}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-xs bg-white px-3 py-1.5 rounded-xl border border-blue-200 font-bold text-blue-900 shadow-2xs">
                  Memegang: <strong className="text-blue-700 font-black">{filteredPatients.length} Pasien</strong>
                </div>

                {onEditDoctor && (
                  <button
                    type="button"
                    onClick={() => onEditDoctor(currentSelectedDoctor)}
                    className="min-h-[34px] px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Ubah profil dokter ini"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ubah</span>
                  </button>
                )}

                {onDeleteDoctor && (
                  <button
                    type="button"
                    onClick={() => onDeleteDoctor(currentSelectedDoctor)}
                    className="min-h-[34px] px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Hapus dokter DPJP ini dari sistem"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus DPJP</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedDoctorName('all')}
                  className="text-xs text-blue-700 font-bold hover:underline px-2 py-1 cursor-pointer"
                >
                  Tampilkan Semua Pasien
                </button>
              </div>
            </div>
          )}
        </div>

        {/* B. Filter Dropdowns Bar (Kondisi & Ruangan) */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-500 font-medium text-xs">
            Filter Tampilan Pasien:
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Kondisi */}
            <select
              value={filterCondition}
              onChange={e => setFilterCondition(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="all">Semua Kondisi</option>
              <option value="prioritas">Prioritas (Kritis &amp; Perhatian)</option>
              <option value="kritis">Kritis Saja</option>
              <option value="perhatian">Perhatian Saja</option>
              <option value="stabil">Stabil Saja</option>
            </select>

            {/* Filter Ruangan / Bangsal */}
            <select
              value={filterWard}
              onChange={e => setFilterWard(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="all">Semua Ruangan</option>
              {wards.map(w => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* C. MAIN CONTENT: TABLE VIEW (ALA SPREADSHEET RS SEPERTI DI GAMBAR) */}
        {layoutMode === 'tabel' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-amber-100/90 text-slate-900 border-b border-amber-200 font-black text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 w-20 text-center border-r border-amber-200">
                      KAMAR
                    </th>
                    <th className="py-3 px-3 w-48 border-r border-amber-200">
                      NAMA / RM
                    </th>
                    <th className="py-3 px-3 w-40 border-r border-amber-200">
                      DPJP
                    </th>
                    <th className="py-3 px-3 w-52 border-r border-amber-200">
                      DIAGNOSA
                    </th>
                    <th className="py-3 px-2 w-16 text-center border-r border-amber-200">
                      HARI
                    </th>
                    <th className="py-3 px-3 min-w-[210px] border-r border-amber-200">
                      HASIL LAB &amp; PENUNJANG
                    </th>
                    <th className="py-3 px-3.5 min-w-[280px] border-r border-amber-200">
                      KONDISI PASIEN / RENCANA TINDAKAN / PERMASALAHAN
                    </th>
                    <th className="py-3 px-3.5 min-w-[220px] border-r border-amber-200">
                      TERAPI OBAT
                    </th>
                    <th className="py-3 px-2.5 w-24 text-center">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.map(patient => {
                    const latestVital = getLatestVital(patient.id);
                    const ptMeds = getPatientMedications(patient.id);
                    const hospitalDay = calculateHospitalDay(patient.admissionDate);

                    const bpSystolic = latestVital ? latestVital.bpSystolic : patient.bpSystolic;
                    const bpDiastolic = latestVital ? latestVital.bpDiastolic : patient.bpDiastolic;
                    const heartRate = latestVital ? latestVital.heartRate : patient.heartRate;
                    const temp = latestVital ? latestVital.temperature : patient.temperature;
                    const spo2 = latestVital ? latestVital.spo2 : patient.spo2;
                    const gds = latestVital?.gds || patient.gds;
                    const cleanPrimaryDpjp = resolveDoctorName(patient.dpjp) || resolveDoctorName(patient.dpjps?.[0]) || '-';

                    return (
                      <tr
                        key={patient.id}
                        className="hover:bg-blue-50/40 transition-colors align-top group"
                      >
                        {/* 1. KAMAR / BED */}
                        <td className="py-3 px-2.5 border-r border-slate-200 text-center">
                          <span className="inline-block font-black text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg font-mono">
                            {patient.bed}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1 truncate">
                            {patient.room}
                          </div>
                          <div className="mt-1.5 flex justify-center">
                            {getStatusBadge(patient.status, patient.lifeStatus)}
                          </div>
                        </td>

                        {/* 2. NAMA / RM & PENJAMIN */}
                        <td className="py-3 px-3 border-r border-slate-200">
                          <button
                            type="button"
                            onClick={() => onSelectPatientDetail(patient)}
                            className="text-left font-black text-slate-900 hover:text-blue-600 transition-colors block text-xs leading-tight cursor-pointer"
                          >
                            {patient.name}
                          </button>
                          <div className="font-mono text-[11px] font-bold text-slate-600 mt-0.5">
                            {patient.rmNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {patient.age} th · {patient.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                          </div>
                          <div className="mt-1">
                            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              {patient.insurance}
                            </span>
                          </div>
                        </td>

                        {/* 3. DPJP & KONSULEN */}
                        <td className="py-3 px-3 border-r border-slate-200">
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-bold text-slate-900 text-xs leading-snug">
                              {cleanPrimaryDpjp}
                            </div>
                            {onUpdatePatientDpjp && (
                              <button
                                type="button"
                                onClick={() => handleOpenManageDpjp(patient)}
                                className="text-[9.5px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                                title="Ubah DPJP atau Tambah Dokter Konsulen"
                              >
                                <Edit2 className="w-2.5 h-2.5 text-blue-600" />
                                <span>Ubah</span>
                              </button>
                            )}
                          </div>
                          {patient.dpjps && patient.dpjps.length > 1 && (
                            <div className="mt-1.5 text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200/80">
                              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[9px]">
                                Konsulen / Rawat Bersama:
                              </span>
                              {patient.dpjps
                                .map(resolveDoctorName)
                                .filter(d => d !== cleanPrimaryDpjp)
                                .map((k, idx) => (
                                    <div key={idx} className="font-medium truncate text-blue-900">
                                      • {k}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </td>

                          {/* 4. DIAGNOSA */}
                          <td className="py-3 px-3 border-r border-slate-200">
                            <p className="font-bold text-slate-900 leading-snug text-xs">
                              {patient.medicalDiagnosis}
                            </p>
                            {patient.nursingDiagnosis && (
                              <div className="mt-1 text-[10.5px] text-slate-600 leading-tight">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">
                                  Kep:
                                </span>{' '}
                                {patient.nursingDiagnosis}
                              </div>
                            )}
                            {patient.allergies && (
                              <div className="mt-1 text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block">
                                Alergi: {patient.allergies}
                              </div>
                            )}
                          </td>

                          {/* 5. HARI */}
                          <td className="py-3 px-2 text-center border-r border-slate-200">
                            <span className="font-black text-blue-700 text-xs bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md inline-block">
                              H{hospitalDay.dayNumber}
                            </span>
                            <div className="text-[9px] text-slate-400 mt-1">
                              Hari ke-{hospitalDay.dayNumber}
                            </div>
                          </td>

                          {/* 5b. HASIL LAB & PENUNJANG (POIN TERSUSUN KE BAWAH) */}
                          <td className="py-3 px-3 border-r border-slate-200">
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="font-black uppercase tracking-wider text-[9px] text-emerald-800 flex items-center gap-1">
                                <FlaskConical className="w-3 h-3 text-emerald-600" />
                                Hasil Lab:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenLabModal(patient)}
                                className="text-[9.5px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                                title="Catat atau Ubah Hasil Laboratorium"
                              >
                                <Edit2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{patient.labResults ? 'Ubah' : '+ Lab'}</span>
                              </button>
                            </div>

                            {patient.labResults ? (
                              <div className="space-y-1 bg-white p-2 rounded-xl border border-emerald-200/80 shadow-2xs">
                                {patient.labResults
                                  .split('\n')
                                  .map(l => l.trim())
                                  .filter(Boolean)
                                  .map((line, idx) => (
                                    <div key={idx} className="flex items-start gap-1.5 text-[11px] font-mono leading-tight text-slate-800">
                                      <span className="text-emerald-700 font-bold shrink-0">•</span>
                                      <span className="font-semibold text-slate-900">{line.replace(/^[-•*]\s*/, '')}</span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenLabModal(patient)}
                                className="w-full text-left py-1 text-slate-400 hover:text-emerald-700 italic text-[10.5px] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3 text-slate-400" />
                                <span>Belum ada hasil lab. Klik input...</span>
                              </button>
                            )}
                          </td>

                          {/* 6. KONDISI PASIEN / RENCANA TINDAKAN / PERMASALAHAN */}
                          <td className="py-3 px-3.5 border-r border-slate-200 space-y-2">
                            {/* TTV Bar */}
                            <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/70 text-[11px] leading-tight flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                              <div>
                                <span className="font-bold text-slate-500">TD:</span>{' '}
                                <strong className="text-slate-900">
                                  {bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic}` : '-'}
                                </strong>{' '}
                                <span className="text-[9px] text-slate-400">mmHg</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-500">HR:</span>{' '}
                                <strong className="text-slate-900">{heartRate || '-'}</strong>{' '}
                                <span className="text-[9px] text-slate-400">x/m</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-500">Suhu:</span>{' '}
                                <strong className="text-slate-900">{temp || '-'}</strong>{' '}
                                <span className="text-[9px] text-slate-400">°C</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-500">SpO2:</span>{' '}
                                <strong className="text-slate-900">{spo2 || '-'}</strong>{' '}
                                <span className="text-[9px] text-slate-400">%</span>
                              </div>
                              {gds && (
                                <div>
                                  <span className="font-bold text-slate-500">GDS:</span>{' '}
                                  <strong className="text-slate-900">{gds}</strong>{' '}
                                  <span className="text-[9px] text-slate-400">mg/dL</span>
                                </div>
                              )}
                            </div>

                            {/* Keluhan Utama Pasien */}
                            {patient.complaint && (
                              <div className="text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200 p-1.5 rounded-lg">
                                <span className="font-black uppercase tracking-wider text-[9px] text-amber-700 block">
                                  Keluhan Pasien:
                                </span>
                                <span>{patient.complaint}</span>
                              </div>
                            )}

                            {/* Rencana Tindakan & Observasi (Dapat Ditambah / Diedit) */}
                            <div className="text-[11px] text-slate-800 bg-blue-50/50 border border-blue-200/80 p-2 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-black uppercase tracking-wider text-[9px] text-blue-700 flex items-center gap-1">
                                  <ClipboardList className="w-3 h-3 text-blue-600" />
                                  Rencana Tindakan / Observasi:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenPlannedActionModal(patient)}
                                  className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                  title="Tambah atau Ubah Rencana Tindakan"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                  <span>{patient.plannedActions ? 'Ubah Rencana' : '+ Rencana'}</span>
                                </button>
                              </div>

                              {patient.plannedActions ? (
                                <div className="leading-snug whitespace-pre-line text-slate-800 font-medium pl-1">
                                  {patient.plannedActions}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPlannedActionModal(patient)}
                                  className="w-full text-left py-1 text-slate-400 hover:text-blue-700 italic text-[10.5px] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3 text-slate-400" />
                                  <span>Belum ada rencana tindakan. Klik untuk menambahkan instruksi...</span>
                                </button>
                              )}
                            </div>

                            {/* Catatan Tambahan / Penunjang */}
                            {patient.notes && (
                              <div className="text-[10px] text-slate-600 bg-slate-100/70 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="font-bold text-slate-500">Catatan Khusus:</span> {patient.notes}
                              </div>
                            )}
                          </td>

                          {/* 7. TERAPI OBAT */}
                          <td className="py-3 px-3.5 border-r border-slate-200">
                            {ptMeds.length > 0 ? (
                              <div className="space-y-1.5">
                                {ptMeds.map(m => (
                                  <div
                                    key={m.id}
                                    className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] leading-tight"
                                  >
                                    <div className="font-bold text-slate-900">
                                      {m.name}
                                    </div>
                                    <div className="text-slate-600 text-[10px] flex items-center gap-1.5 mt-0.5">
                                      <span className="font-semibold text-blue-700 bg-blue-50 px-1 rounded">
                                        {m.dosage}
                                      </span>
                                      {m.route && <span>• {m.route}</span>}
                                      {m.frequency && <span>• {m.frequency}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic py-2">
                                Belum ada terapi obat tercatat.
                              </div>
                            )}

                            {onOpenAddMedication && (
                              <button
                                type="button"
                                onClick={() => onOpenAddMedication(patient)}
                                className="mt-2 w-full py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Obat</span>
                              </button>
                            )}
                          </td>

                          {/* 8. AKSI CEPAT */}
                          <td className="py-3 px-2 text-center space-y-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectPatientDetail(patient)}
                              className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10.5px] shadow-2xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail</span>
                            </button>

                            {/* Tombol Cepat: + Rencana Tindakan */}
                            <button
                              type="button"
                              onClick={() => handleOpenPlannedActionModal(patient)}
                              className="w-full py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg font-bold text-[10px] border border-indigo-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Tambah atau Ubah Rencana Tindakan Pasien"
                            >
                              <ClipboardList className="w-3 h-3 text-indigo-600" />
                              <span>+ Rencana</span>
                            </button>

                            {onOpenAddVital && (
                              <button
                                type="button"
                                onClick={() => onOpenAddVital(patient)}
                                className="w-full py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[10px] border border-rose-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <HeartPulse className="w-3 h-3" />
                                <span>+ TTV</span>
                              </button>
                            )}

                            {onOpenAddAction && (
                              <button
                                type="button"
                                onClick={() => onOpenAddAction(patient)}
                                className="w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] border border-slate-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <Activity className="w-3 h-3" />
                                <span>+ Tindakan</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredPatients.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                  <FileSpreadsheet className="w-9 h-9 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">
                    Tidak ada pasien yang sesuai dengan filter.
                  </p>
                  <p className="text-slate-400">
                    Silakan ubah filter dokter atau kata kunci pencarian.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* D. ALTERNATIVE CONTENT: CARD VIEW (SIMPEL & MOBILE-FRIENDLY) */}
          {layoutMode === 'kartu' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPatients.map(patient => {
                const latestVital = getLatestVital(patient.id);
                const ptMeds = getPatientMedications(patient.id);
                const hospitalDay = calculateHospitalDay(patient.admissionDate);

                const bpSystolic = latestVital ? latestVital.bpSystolic : patient.bpSystolic;
                const bpDiastolic = latestVital ? latestVital.bpDiastolic : patient.bpDiastolic;
                const heartRate = latestVital ? latestVital.heartRate : patient.heartRate;
                const temp = latestVital ? latestVital.temperature : patient.temperature;
                const spo2 = latestVital ? latestVital.spo2 : patient.spo2;
                const gds = latestVital?.gds || patient.gds;

                return (
                  <div
                    key={patient.id}
                    className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header Kartu: Bed, Nama, RM, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center text-blue-700 font-bold shrink-0 shadow-2xs">
                            <Bed className="w-4 h-4" />
                            <span className="text-[9px] font-mono leading-none mt-0.5">
                              {patient.bed.replace('Bed ', '')}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4
                                onClick={() => onSelectPatientDetail(patient)}
                                className="font-black text-slate-900 text-sm truncate hover:text-blue-600 cursor-pointer transition-colors"
                              >
                                {patient.name}
                              </h4>
                              <span className="text-xs text-slate-500 font-medium shrink-0">
                                ({patient.age} th · {patient.gender})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-slate-600 font-bold">
                                {patient.rmNumber}
                              </span>
                              <span>·</span>
                              <span className="truncate">{patient.room}</span>
                              <span>·</span>
                              <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                                Hari H{hospitalDay.dayNumber}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {getStatusBadge(patient.status, patient.lifeStatus)}
                        </div>
                      </div>

                      {/* DPJP Line */}
                      <div className="flex items-center justify-between gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">
                            DPJP: <strong>{resolveDoctorName(patient.dpjp) || resolveDoctorName(patient.dpjps?.[0]) || '-'}</strong>
                            {patient.dpjps && patient.dpjps.length > 1 && (
                              <span className="text-slate-500 text-[10px] ml-1">
                                (+Konsul: {patient.dpjps.map(resolveDoctorName).filter(d => d !== (resolveDoctorName(patient.dpjp) || resolveDoctorName(patient.dpjps?.[0]))).join(', ')})
                              </span>
                            )}
                          </span>
                        </div>
                        {onUpdatePatientDpjp && (
                          <button
                            type="button"
                            onClick={() => handleOpenManageDpjp(patient)}
                            className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                            title="Ubah DPJP Pasien"
                          >
                            <Edit2 className="w-2.5 h-2.5 text-blue-600" />
                            <span>Ubah</span>
                          </button>
                        )}
                      </div>

                      {/* Diagnosa Medis & Keluhan */}
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Diagnosa Medis
                          </span>
                          <p className="font-bold text-slate-900 leading-snug">
                            {patient.medicalDiagnosis}
                          </p>
                          {patient.nursingDiagnosis && (
                            <p className="text-[11px] text-slate-600 mt-1">
                              Kep: {patient.nursingDiagnosis}
                            </p>
                          )}
                        </div>

                        {patient.complaint && (
                          <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                            <span className="font-bold text-amber-700 block text-[9px] uppercase">
                              Keluhan Terkini:
                            </span>
                            <span>{patient.complaint}</span>
                          </div>
                        )}
                      </div>

                      {/* Box TTV Lengkap */}
                      <div className="grid grid-cols-4 gap-1.5 text-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <div className="p-1 rounded bg-white shadow-2xs">
                          <span className="text-[9px] text-slate-400 block font-bold">TD</span>
                          <span className="font-bold text-slate-800 text-[11px]">
                            {bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic}` : '-'}
                          </span>
                        </div>
                        <div className="p-1 rounded bg-white shadow-2xs">
                          <span className="text-[9px] text-slate-400 block font-bold">HR</span>
                          <span className="font-bold text-slate-800 text-[11px]">
                            {heartRate ? `${heartRate} x/m` : '-'}
                          </span>
                        </div>
                        <div className="p-1 rounded bg-white shadow-2xs">
                          <span className="text-[9px] text-slate-400 block font-bold">Suhu</span>
                          <span className="font-bold text-slate-800 text-[11px]">
                            {temp ? `${temp}°C` : '-'}
                          </span>
                        </div>
                        <div className="p-1 rounded bg-white shadow-2xs">
                          <span className="text-[9px] text-slate-400 block font-bold">SpO2</span>
                          <span className="font-bold text-slate-800 text-[11px]">
                            {spo2 ? `${spo2}%` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Rencana Tindakan (Dapat Ditambah / Diedit) */}
                      <div className="text-xs text-slate-700 p-2.5 bg-blue-50/40 rounded-2xl border border-blue-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1">
                            <ClipboardList className="w-3 h-3 text-blue-600" />
                            Rencana Tindakan / Observasi:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenPlannedActionModal(patient)}
                            className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>{patient.plannedActions ? 'Ubah Rencana' : '+ Rencana'}</span>
                          </button>
                        </div>

                        {patient.plannedActions ? (
                          <p className="font-medium text-slate-800 leading-snug whitespace-pre-line pl-1">
                            {patient.plannedActions}
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPlannedActionModal(patient)}
                            className="w-full text-left py-1 text-slate-400 hover:text-blue-700 italic text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-slate-400" />
                            <span>Belum ada rencana tindakan. Klik untuk menambahkan instruksi...</span>
                          </button>
                        )}
                      </div>

                      {/* Hasil Laboratorium (Tersusun Poin Ke Bawah) */}
                      <div className="text-xs p-2.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                            <FlaskConical className="w-3 h-3 text-emerald-600" />
                            Hasil Laboratorium &amp; Penunjang:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenLabModal(patient)}
                            className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{patient.labResults ? 'Ubah Lab' : '+ Lab'}</span>
                          </button>
                        </div>

                        {patient.labResults ? (
                          <div className="space-y-1 bg-white/90 p-2 rounded-xl border border-emerald-200/60 shadow-2xs">
                            {patient.labResults
                              .split('\n')
                              .map(l => l.trim())
                              .filter(Boolean)
                              .map((line, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-[11px] font-mono leading-tight text-slate-800">
                                  <span className="text-emerald-700 font-bold shrink-0">•</span>
                                  <span className="font-semibold text-slate-900">{line.replace(/^[-•*]\s*/, '')}</span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenLabModal(patient)}
                            className="w-full text-left py-1 text-slate-400 hover:text-emerald-700 italic text-[11px] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 text-slate-400" />
                            <span>Belum ada hasil lab. Klik untuk menambahkan...</span>
                          </button>
                        )}
                      </div>

                      {/* Terapi Obat Aktif */}
                      <div className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Pill className="w-3 h-3 text-emerald-600" />
                            Terapi Obat Aktif ({ptMeds.length})
                          </span>
                          {onOpenAddMedication && (
                            <button
                              type="button"
                              onClick={() => onOpenAddMedication(patient)}
                              className="text-emerald-700 font-bold text-[10px] hover:underline cursor-pointer"
                            >
                              + Tambah
                            </button>
                          )}
                        </div>

                        {ptMeds.length > 0 ? (
                          <div className="space-y-1">
                            {ptMeds.slice(0, 3).map(m => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200/70"
                              >
                                <span className="font-bold text-slate-900 truncate">
                                  {m.name}
                                </span>
                                <span className="text-slate-600 text-[10px] shrink-0 font-medium">
                                  {m.dosage} {m.route && `(${m.route})`}
                                </span>
                              </div>
                            ))}
                            {ptMeds.length > 3 && (
                              <p className="text-[10px] text-blue-600 font-bold text-center">
                                + {ptMeds.length - 3} obat lainnya
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">
                            Belum ada terapi obat tercatat.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenPlannedActionModal(patient)}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Tambah atau Ubah Rencana Tindakan"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                          <span>+ Rencana</span>
                        </button>

                        {onOpenAddVital && (
                          <button
                            type="button"
                            onClick={() => onOpenAddVital(patient)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                          >
                            + TTV
                          </button>
                        )}
                        {onOpenAddAction && (
                          <button
                            type="button"
                            onClick={() => onOpenAddAction(patient)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
                          >
                            + Tindakan
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectPatientDetail(patient)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
                      >
                        <span>Rekam Medis</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* ======================================================== */}
      {/* MODAL OVERLAY: TAMBAH & EDIT RENCANA TINDAKAN PASIEN     */}
      {/* ======================================================== */}
      {plannedActionPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold shadow-2xs">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    Rencana Tindakan Pasien
                  </h3>
                  <p className="text-[11px] text-blue-100 mt-0.5">
                    Instruksi Medis DPJP &amp; Rencana Asuhan Keperawatan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlannedActionPatient(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Patient Identity Strip */}
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded font-mono text-[11px]">
                  {plannedActionPatient.bed}
                </span>
                <span className="font-black text-slate-900 text-xs">{plannedActionPatient.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">({plannedActionPatient.rmNumber})</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                DPJP: <strong className="text-slate-800">{plannedActionPatient.dpjp || '-'}</strong>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSavePlannedAction} className="p-4 space-y-3.5 overflow-y-auto custom-scrollbar flex-1">
              {/* Diagnosa Pasien */}
              <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-xs">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Diagnosa Medis
                </span>
                <p className="font-bold text-slate-800 mt-0.5 leading-snug">
                  {plannedActionPatient.medicalDiagnosis}
                </p>
              </div>

              {/* Quick Presets (1-Click Append) */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Pilihan Cepat Rencana / Instruksi (Klik untuk Menambahkan):
                </label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                  {plannedActionPresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddPresetToPlan(preset)}
                      className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-all text-left flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                      <span>{preset}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea: Rencana Tindakan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-800">
                    Daftar Rencana Tindakan / Observasi Klinis:
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Bisa diedit atau ditambahkan bebas
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={plannedActionInput}
                  onChange={e => setPlannedActionInput(e.target.value)}
                  placeholder="Contoh:&#10;• OBS KU, TTV DAN KESADARAN&#10;• HEAD UP 30 DERAJAT&#10;• SUCTION BERKALA&#10;• GV CVC per 2 hari&#10;• Cek GDS/6 jam, GDS < 140 stop&#10;• Bed anti-dekubitus&#10;• Saran koreksi hipokalemia dengan D5%"
                  className="w-full p-3 rounded-2xl border border-slate-300 bg-white text-xs leading-relaxed font-medium text-slate-900 focus:outline-none focus:border-blue-500 shadow-inner"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPlannedActionPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Rencana Tindakan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL OVERLAY: KELOLA DOKTER DPJP & KONSULEN PASIEN     */}
      {/* ======================================================== */}
      {manageDpjpPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
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
                    Tentukan Dokter Utama dan Dokter Rawat Bersama
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManageDpjpPatient(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Patient Identity Strip */}
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded font-mono text-[11px]">
                  {manageDpjpPatient.bed}
                </span>
                <span className="font-black text-slate-900 text-xs">{manageDpjpPatient.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">({manageDpjpPatient.rmNumber})</span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Kamar: <strong className="text-slate-800">{manageDpjpPatient.room}</strong>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveManageDpjp} className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {/* 1. Dokter Utama (Primary DPJP) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Dokter DPJP Utama <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Dokter spesialis penanggung jawab utama asuhan pasien rawat inap ini.
                </p>
                <select
                  value={managePrimaryDpjp}
                  onChange={e => {
                    const newPrimary = e.target.value;
                    setManagePrimaryDpjp(newPrimary);
                    setManageConsultants(prev => prev.filter(c => c !== newPrimary));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-bold text-slate-800"
                  required
                >
                  <option value="" disabled>-- Pilih Dokter DPJP Utama --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.specialization}) {d.status !== 'Aktif' ? `[${d.status}]` : ''}
                    </option>
                  ))}
                  {managePrimaryDpjp && !doctors.some(d => d.name === managePrimaryDpjp) && (
                    <option value={managePrimaryDpjp}>{managePrimaryDpjp} (Dokter Saat Ini)</option>
                  )}
                </select>
              </div>

              {/* 2. Dokter Konsulen / Rawat Bersama */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-slate-800">
                    Dokter Konsulen / Rawat Bersama (Bisa Pilih Banyak)
                  </label>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {manageConsultants.length} Konsulen Terpilih
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Centang dokter lain yang merawat bersama atau memberikan advice.
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {doctors
                    .filter(d => d.name !== managePrimaryDpjp)
                    .map(doc => {
                      const isChecked = manageConsultants.includes(doc.name);
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
                              setManageConsultants(prev =>
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

                  {/* Any consultants not in doctor master list */}
                  {manageConsultants
                    .filter(c => !doctors.some(d => d.name === c) && c !== managePrimaryDpjp)
                    .map(c => (
                      <div
                        key={c}
                        className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold"
                      >
                        <span className="text-xs truncate">{c}</span>
                        <button
                          type="button"
                          onClick={() => setManageConsultants(prev => prev.filter(item => item !== c))}
                          className="text-rose-600 text-xs hover:underline cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Tambah Konsulen Lain */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tambah Dokter Konsulen Luar:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customConsultantInput}
                    onChange={e => setCustomConsultantInput(e.target.value)}
                    placeholder="Contoh: dr. Anestesi, Sp.An"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomConsultant}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setManageDpjpPatient(null)}
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

      {/* ======================================================== */}
      {/* MODAL: KELOLA & HAPUS DAFTAR DOKTER DPJP */}
      {/* ======================================================== */}
      {isManageDoctorsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white leading-tight">
                    Kelola Daftar Dokter DPJP
                  </h3>
                  <p className="text-[11px] text-blue-100">
                    Total {doctors.length} dokter DPJP terdaftar dalam sistem
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageDoctorsOpen(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white cursor-pointer active:scale-95"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header Actions & Search */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
              <div className="relative w-full sm:flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={doctorSearchQuery}
                  onChange={e => setDoctorSearchQuery(e.target.value)}
                  placeholder="Cari nama dokter atau spesialisasi..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
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

              {onOpenAddDoctor && (
                <button
                  type="button"
                  onClick={() => {
                    setIsManageDoctorsOpen(false);
                    onOpenAddDoctor();
                  }}
                  className="w-full sm:w-auto min-h-[38px] px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Dokter Baru</span>
                </button>
              )}
            </div>

            {/* List of Doctors */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
              {doctors
                .filter(doc => {
                  const q = doctorSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    doc.name.toLowerCase().includes(q) ||
                    doc.specialization.toLowerCase().includes(q) ||
                    (doc.phone && doc.phone.includes(q))
                  );
                })
                .map(doc => {
                  const patientCount = getDoctorPatients(doc.name).length;

                  return (
                    <div
                      key={doc.id}
                      className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                              {doc.name}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                doc.status === 'Aktif'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.status === 'Cuti'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                          <p className="text-xs text-blue-800 font-medium mt-0.5">
                            {doc.specialization}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span>
                              Memegang: <strong className="text-blue-700 font-bold">{patientCount} Pasien</strong>
                            </span>
                            {doc.phone && <span>• HP/WA: {doc.phone}</span>}
                            {doc.sipNumber && <span>• SIP: {doc.sipNumber}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Ubah & Hapus */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {onEditDoctor && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsManageDoctorsOpen(false);
                              onEditDoctor(doc);
                            }}
                            className="min-h-[36px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            title="Ubah data dokter ini"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Ubah</span>
                          </button>
                        )}

                        {onDeleteDoctor && (
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteDoctor(doc);
                            }}
                            className="min-h-[36px] px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            title="Hapus dokter DPJP ini dari sistem"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageDoctorsOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL OVERLAY: CATAT / PERBARUI HASIL LABORATORIUM      */}
      {/* ======================================================== */}
      {labModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold shadow-2xs">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    Catat / Perbarui Hasil Laboratorium
                  </h3>
                  <p className="text-[11px] text-emerald-100 mt-0.5">
                    {labModalPatient.name} ({labModalPatient.rmNumber}) · {labModalPatient.bed}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLabModalPatient(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-4 space-y-3.5 overflow-y-auto custom-scrollbar flex-1 text-xs">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Pilih Cepat Parameter Lab:
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {[
                    'Hb',
                    'Leukosit',
                    'Trombosit',
                    'Hematokrit',
                    'Eritrosit',
                    'GDS',
                    'Ureum',
                    'Kreatinin',
                    'Kalium',
                    'Natrium',
                    'Klorida',
                    'SGOT',
                    'SGPT',
                    'Albumin',
                    'AGD',
                  ].map(test => (
                    <button
                      key={test}
                      type="button"
                      onClick={() => handleAddLabPresetToModal(test)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      + {test}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-slate-800">
                    Daftar Hasil Lab (Tersusun Poin Ke Bawah)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Poin (-) per baris
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={labModalInput}
                  onChange={e => setLabModalInput(e.target.value)}
                  placeholder={"Contoh:\n- Hb: 12.5 g/dL\n- Leukosit: 8.500 /uL\n- Trombosit: 240.000 /uL\n- Hematokrit: 37%\n- GDS: 110 mg/dL\n- Ureum: 24 mg/dL\n- Kreatinin: 0.9 mg/dL\n- Kalium: 3.9 mmol/L\n- Natrium: 139 mmol/L"}
                  className="w-full p-3 rounded-2xl border border-slate-300 bg-white font-mono text-xs leading-relaxed font-medium text-slate-900 focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 space-y-0.5">
                <span className="font-bold block">💡 Info Format Poin Rapi:</span>
                <p>
                  Setiap baris hasil pemeriksaan lab akan otomatis tersusun dengan poin (-) ke bawah agar mempermudah perawat dan dokter DPJP dalam ronde medis dan lembar aplusan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setLabModalPatient(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdatePatientLabResults && labModalPatient) {
                      const formatted = labModalInput
                        .split('\n')
                        .map(l => l.trim())
                        .filter(Boolean)
                        .map(l => (l.startsWith('-') || l.startsWith('•') || l.startsWith('*') ? l : `- ${l}`))
                        .join('\n');
                      onUpdatePatientLabResults(labModalPatient.id, formatted);
                    }
                    setLabModalPatient(null);
                  }}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Hasil Lab</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
