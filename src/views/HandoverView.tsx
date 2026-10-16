import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  Save,
  History,
  Clock,
  User,
  HeartPulse,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Printer,
  FileSpreadsheet,
  Search,
  Check,
  ShieldCheck,
  Pill,
  Activity,
  AlertTriangle,
  Stethoscope,
  ArrowDownToLine,
} from 'lucide-react';
import {
  Patient,
  SBARHandover,
  NursingAction,
  VitalSign,
  Nurse,
  ShiftType,
  PatientCondition,
  PatientMedication,
  calculateHospitalDay,
} from '../types';
import { UserSession } from '../services/storageService';
import { triggerPrintSBARHandover, exportToCSV } from '../utils/exportUtils';

interface HandoverViewProps {
  patients: Patient[];
  nurses: Nurse[];
  handovers: SBARHandover[];
  actions: NursingAction[];
  vitals: VitalSign[];
  medications?: PatientMedication[];
  userSession: UserSession;
  initialSelectedPatientId?: string;
  initialSelectedVital?: VitalSign | null;
  onSaveHandover: (handover: Omit<SBARHandover, 'id'>) => void;
  onSelectPatientDetail: (patient: Patient) => void;
  onToggleVerify?: (handoverId: string) => void;
}

export const HandoverView: React.FC<HandoverViewProps> = ({
  patients,
  nurses,
  handovers,
  actions,
  vitals,
  medications = [],
  userSession,
  initialSelectedPatientId,
  initialSelectedVital,
  onSaveHandover,
  onSelectPatientDetail,
  onToggleVerify,
}) => {
  const activePatients = useMemo(
    () => patients.filter(p => p.lifeStatus === 'aktif'),
    [patients]
  );

  const shiftOptions: ShiftType[] = [
    'Pagi (07.00 - 14.00)',
    'Sore (14.00 - 21.00)',
    'Malam (21.00 - 07.00)',
  ];

  // Derive next shift
  const getNextShift = (current: ShiftType): ShiftType => {
    if (current.startsWith('Pagi')) return 'Sore (14.00 - 21.00)';
    if (current.startsWith('Sore')) return 'Malam (21.00 - 07.00)';
    return 'Pagi (07.00 - 14.00)';
  };

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const [activeSubTab, setActiveSubTab] = useState<'form' | 'riwayat'>('form');

  // Form states
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [shiftFrom, setShiftFrom] = useState<ShiftType>(userSession.shift);
  const [nurseFrom, setNurseFrom] = useState(userSession.nurseName);
  const [shiftTo, setShiftTo] = useState<ShiftType>(getNextShift(userSession.shift));
  const [nurseTo, setNurseTo] = useState(
    nurses.find(n => n.name !== userSession.nurseName)?.name || nurses[0]?.name || ''
  );

  const [selectedPatientId, setSelectedPatientId] = useState(
    initialSelectedPatientId || activePatients[0]?.id || ''
  );

  const selectedPatient = useMemo(
    () => activePatients.find(p => p.id === selectedPatientId) || activePatients[0],
    [activePatients, selectedPatientId]
  );

  const [condition, setCondition] = useState<PatientCondition>('stabil');
  const [situationText, setSituationText] = useState('');
  const [vitalSignsSummary, setVitalSignsSummary] = useState('');
  const [medicalDiagnosis, setMedicalDiagnosis] = useState('');
  const [nursingDiagnosis, setNursingDiagnosis] = useState('');
  const [activeMedsSummary, setActiveMedsSummary] = useState('');
  const [backgroundText, setBackgroundText] = useState('');
  const [actionsCompleted, setActionsCompleted] = useState('');
  const [actionsPending, setActionsPending] = useState('');
  const [assessmentText, setAssessmentText] = useState('');
  const [followUpPlan, setFollowUpPlan] = useState('');
  const [importantNotes, setImportantNotes] = useState('');
  const [recommendationText, setRecommendationText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filter in Riwayat
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('all');

  const ptVitals = useMemo(
    () =>
      vitals
        .filter(v => v.patientId === selectedPatient?.id)
        .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)),
    [vitals, selectedPatient?.id]
  );

  const [selectedVitalIndex, setSelectedVitalIndex] = useState(0);
  const activeVital = ptVitals[selectedVitalIndex] || ptVitals[0];
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [ttvPulledSuccess, setTtvPulledSuccess] = useState(false);

  // Derived patient clinical results
  const latestVitalWithComplaint = ptVitals.find(v => v.complaint);
  const currentComplaint = selectedPatient?.complaint || latestVitalWithComplaint?.complaint || '';

  const activePatientMeds = useMemo(
    () => medications.filter(m => m.patientId === selectedPatient?.id && m.status === 'Aktif'),
    [medications, selectedPatient?.id]
  );

  const patientCompletedActions = useMemo(
    () => actions.filter(a => a.patientId === selectedPatient?.id && a.completed),
    [actions, selectedPatient?.id]
  );

  const patientPendingActions = useMemo(
    () => actions.filter(a => a.patientId === selectedPatient?.id && !a.completed),
    [actions, selectedPatient?.id]
  );

  // Helper string generators with clean clinical formatting and deduplication
  const buildMedsString = () => {
    if (activePatientMeds.length === 0) {
      return 'Tidak ada terapi obat aktif.';
    }
    const uniqueMeds = Array.from(
      new Set(
        activePatientMeds.map(m => {
          const timing = m.time ? `, jam ${m.time}` : m.scheduleTimes ? `, jam ${m.scheduleTimes}` : '';
          const route = m.route ? ` (${m.route})` : '';
          return `${m.name} ${m.dosage}${route}${timing}`.trim();
        })
      )
    );
    return uniqueMeds.join(', ');
  };

  const buildCompletedActionsString = () => {
    if (patientCompletedActions.length === 0) {
      return 'Observasi TTV dan perawatan rutin shift ini telah terlaksana';
    }
    const uniqueActions = Array.from(
      new Set(
        patientCompletedActions.map(a => {
          const time = a.timestamp ? ` [${a.timestamp.split(' ')[1] || a.shift.split(' ')[0]}]` : '';
          return `${a.title}${time}`;
        })
      )
    );
    return uniqueActions.join(', ');
  };

  const buildPendingActionsString = () => {
    if (patientPendingActions.length === 0) {
      return selectedPatient?.plannedActions || 'Observasi TTV lanjutan dan evaluasi respon klinis shift berikutnya';
    }
    const uniquePending = Array.from(new Set(patientPendingActions.map(a => a.title.trim())));
    return uniquePending.join(', ');
  };

  const buildVitalsSummary = (specificVital?: VitalSign) => {
    const v = specificVital || ptVitals[selectedVitalIndex] || ptVitals[0];
    if (v) {
      const gcsPart = v.gcs ? `, GCS: ${v.gcs}` : '';
      const gdsPart = v.gds !== undefined ? `, GDS: ${v.gds} mg/dL` : '';
      return `TD ${v.bpSystolic}/${v.bpDiastolic} mmHg, Nadi ${v.heartRate}x/m, RR ${v.respiratoryRate}x/m, Suhu ${v.temperature}°C, SpO₂ ${v.spo2}%${gcsPart}${gdsPart}`;
    } else if (selectedPatient && selectedPatient.bpSystolic) {
      return `TD ${selectedPatient.bpSystolic}/${selectedPatient.bpDiastolic} mmHg, Nadi ${selectedPatient.heartRate}x/m, RR ${selectedPatient.respiratoryRate}x/m, Suhu ${selectedPatient.temperature}°C, SpO₂ ${selectedPatient.spo2}%`;
    }
    return 'TTV stabil dalam batas normal';
  };

  // Canonical SBAR structured builder (Clean, clinical, standardized, idempotent)
  const buildCanonicalSituation = (customVital?: VitalSign) => {
    if (!selectedPatient) return '';
    const hospitalDayInfo = calculateHospitalDay(selectedPatient.admissionDate);
    const vSummary = buildVitalsSummary(customVital);
    const complaintPart = currentComplaint
      ? `Keluhan utama saat ini: ${currentComplaint}.`
      : 'Keluhan utama saat ini: Tidak ada keluhan khusus (kondisi tenang/stabil).';
    const dpjpName = selectedPatient.dpjp || selectedPatient.dpjps?.[0] || 'dr. DPJP';

    return `Pasien ${selectedPatient.name} (${selectedPatient.gender}, ${selectedPatient.age} th), Bed ${selectedPatient.bed} (${selectedPatient.room}). ${hospitalDayInfo.text}, DPJP: ${dpjpName}. Status klinis: ${condition.toUpperCase()}.\n${complaintPart}\nTTV Terkini: ${vSummary}.`;
  };

  const buildCanonicalBackground = () => {
    if (!selectedPatient) return '';
    const medsStr = buildMedsString();
    const admDate = selectedPatient.admissionDate || '-';
    const allergies = selectedPatient.allergies || 'Tidak ada riwayat alergi';

    return `Diagnosis Medis: ${selectedPatient.medicalDiagnosis}.\nTanggal Masuk: ${admDate} | Riwayat Alergi: ${allergies}.\nTerapi Obat Aktif: ${medsStr}.`;
  };

  const buildCanonicalAssessment = (customVital?: VitalSign) => {
    if (!selectedPatient) return '';
    const actComp = buildCompletedActionsString();
    const vSummary = buildVitalsSummary(customVital);
    const responsePart = currentComplaint
      ? `Respon klinis: Pasien masih merasakan ${currentComplaint}, kondisi umum terpantau.`
      : 'Respon klinis: Keluhan teratasi/terkontrol baik, tidak tampak tanda distres atau kegawatan akut.';

    return `Tindakan yang telah terlaksana shift ini:\n• ${actComp}\n${responsePart}\nEvaluasi TTV: ${vSummary}. Pasien kooperatif dan terpantau aman di tempat tidur.`;
  };

  const buildCanonicalRecommendation = () => {
    if (!selectedPatient) return '';
    const actPend = buildPendingActionsString();
    const plan = selectedPatient.plannedActions || 'Lanjutkan pemantauan berkala tanda-tanda vital, intake cairan, dan laporkan keluhan abnormal ke DPJP.';
    const notes = selectedPatient.notes || `Alergi: ${selectedPatient.allergies || 'Tidak ada'}. Pastikan pengaman tempat tidur terpasang.`;

    return `Tindakan / Advis Lanjutan (Pending):\n• ${actPend}\nRencana Asuhan & Monitoring Shift Berikutnya:\n• ${plan}\nCatatan Khusus / Kewaspadaan:\n• ${notes}`;
  };

  // 1. Pull Complaint into Situation & Assessment (Idempotent, Clean)
  const handlePullComplaintToSBAR = () => {
    if (!currentComplaint) {
      setSyncFeedback('Pasien belum memiliki catatan keluhan.');
      setTimeout(() => setSyncFeedback(null), 2500);
      return;
    }
    // Re-generate pristine situation and assessment with current complaint
    setSituationText(buildCanonicalSituation());
    setAssessmentText(buildCanonicalAssessment());

    setSyncFeedback('Keluhan pasien berhasil disinkronkan ke SBAR!');
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  // 2. Pull Medications into Background (Idempotent, Clean)
  const handlePullMedicationsToSBAR = () => {
    const medsText = buildMedsString();
    setActiveMedsSummary(medsText);
    setBackgroundText(buildCanonicalBackground());

    setSyncFeedback('Data obat pasien berhasil disinkronkan ke SBAR!');
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  // 3. Pull Completed Actions into Assessment & Recommendation (Idempotent, Clean)
  const handlePullActionsToSBAR = () => {
    const actComp = buildCompletedActionsString();
    const actPend = buildPendingActionsString();

    setActionsCompleted(actComp);
    setActionsPending(actPend);

    setAssessmentText(buildCanonicalAssessment());
    setRecommendationText(buildCanonicalRecommendation());

    setSyncFeedback('Data tindakan berhasil disinkronkan ke SBAR!');
    setTimeout(() => setSyncFeedback(null), 2500);
  };

  // 4. Format and pull TTV into SBAR (Idempotent, Clean)
  const handlePullVitalsToSBAR = (specificVital?: VitalSign) => {
    const summary = buildVitalsSummary(specificVital);
    setVitalSignsSummary(summary);

    setSituationText(buildCanonicalSituation(specificVital));
    setAssessmentText(buildCanonicalAssessment(specificVital));

    setTtvPulledSuccess(true);
    setSyncFeedback('Data TTV pasien berhasil disinkronkan ke SBAR!');
    setTimeout(() => {
      setTtvPulledSuccess(false);
      setSyncFeedback(null);
    }, 2500);
  };

  // 5. MASTER SYNC ALL: Keluhan, Obat, Tindakan, dan TTV ke SBAR (Anti-Double / Idempotent)
  const handleSyncAllToSBAR = () => {
    if (!selectedPatient) return;
    const vSummary = buildVitalsSummary();
    const medsStr = buildMedsString();
    const actComp = buildCompletedActionsString();
    const actPend = buildPendingActionsString();
    const plan = selectedPatient.plannedActions || 'Lanjutkan pemantauan berkala tanda-tanda vital, intake cairan, dan laporkan keluhan abnormal ke DPJP.';
    const notes = selectedPatient.notes || `Alergi: ${selectedPatient.allergies || 'Tidak ada riwayat alergi'}. Pasang pengaman tempat tidur.`;

    setVitalSignsSummary(vSummary);
    setActiveMedsSummary(medsStr);
    setActionsCompleted(actComp);
    setActionsPending(actPend);
    setFollowUpPlan(plan);
    setImportantNotes(notes);

    // Apply pristine, structured SBAR texts without duplication
    setSituationText(buildCanonicalSituation());
    setBackgroundText(buildCanonicalBackground());
    setAssessmentText(buildCanonicalAssessment());
    setRecommendationText(buildCanonicalRecommendation());

    setSyncFeedback('Semua data klinis berhasil disinkronkan ke SBAR (format rapi & tanpa data ganda)!');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  // Auto-fill when patient selection changes
  useEffect(() => {
    if (selectedPatient) {
      setCondition(selectedPatient.status);
      setMedicalDiagnosis(selectedPatient.medicalDiagnosis);
      const ndx =
        selectedPatient.nursingDiagnosis ||
        'Risiko ketidakstabilan kondisi klinis b.d patologi penyakit';
      setNursingDiagnosis(ndx);

      const vSummary = buildVitalsSummary();
      setVitalSignsSummary(vSummary);

      const medsStr = buildMedsString();
      setActiveMedsSummary(medsStr);

      const actComp = buildCompletedActionsString();
      setActionsCompleted(actComp);

      const actPend = buildPendingActionsString();
      setActionsPending(actPend);

      const plan =
        selectedPatient.plannedActions ||
        'Lanjutkan monitoring berkala tanda-tanda vital, intake-output cairan, dan laporkan keluhan abnormal ke DPJP.';
      setFollowUpPlan(plan);

      const notes =
        selectedPatient.notes ||
        `Alergi: ${selectedPatient.allergies || 'Tidak ada riwayat alergi'}. Pasang pengaman tempat tidur.`;
      setImportantNotes(notes);

      // Default pristine SBAR structured blocks
      setSituationText(buildCanonicalSituation());
      setBackgroundText(buildCanonicalBackground());
      setAssessmentText(buildCanonicalAssessment());
      setRecommendationText(buildCanonicalRecommendation());
    }
  }, [selectedPatientId, selectedPatient?.id, currentComplaint]);

  useEffect(() => {
    if (initialSelectedPatientId) {
      setSelectedPatientId(initialSelectedPatientId);
    }
  }, [initialSelectedPatientId]);

  useEffect(() => {
    if (initialSelectedVital) {
      handlePullVitalsToSBAR(initialSelectedVital);
    }
  }, [initialSelectedVital]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Pilih pasien yang diserahterimakan');
      return;
    }

    const timestamp = `${date} ${time}`;
    const nextShift = getNextShift(userSession.shift);

    onSaveHandover({
      patientId: selectedPatient.id,
      timestamp,
      shift: userSession.shift,
      shiftFrom: userSession.shift,
      shiftTo: nextShift,
      handoverFrom: nurseFrom || userSession.nurseName || 'Perawat Bertugas',
      handoverTo: nurseTo || 'Perawat Shift Berikutnya',
      situation: situationText,
      background: backgroundText,
      assessment: assessmentText,
      recommendation: recommendationText,
      patientCondition: condition,
      vitalSignsSummary,
      actionsCompleted,
      actionsPending,
      activeMedicationsSummary: activeMedsSummary,
      followUpPlan,
      importantNotes,
      verifiedByKaru: true,
    });

    setActiveSubTab('riwayat');
  };

  // Filtered Riwayat
  const filteredHandovers = useMemo(() => {
    return handovers.filter(h => {
      const pt = patients.find(p => p.id === h.patientId);
      const matchesSearch =
        !searchQuery ||
        (pt?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (pt?.rmNumber.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (pt?.bed.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        h.handoverFrom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.handoverTo.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesShift = filterShift === 'all' || h.shiftFrom?.includes(filterShift) || h.shift?.includes(filterShift);
      return matchesSearch && matchesShift;
    });
  }, [handovers, patients, searchQuery, filterShift]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Waktu Handover',
      'Shift Asal',
      'Perawat Penyerah',
      'Shift Tujuan',
      'Perawat Penerima',
      'No RM Pasien',
      'Nama Pasien',
      'Bed',
      'Kondisi',
      'Situation (S)',
      'Background (B)',
      'Assessment (A)',
      'Recommendation (R)',
      'Status Verifikasi',
    ];

    const rows = filteredHandovers.map(h => {
      const pt = patients.find(p => p.id === h.patientId);
      return [
        h.timestamp,
        h.shiftFrom || h.shift,
        h.handoverFrom,
        h.shiftTo || '-',
        h.handoverTo,
        pt?.rmNumber || '-',
        pt?.name || '-',
        pt?.bed || '-',
        h.patientCondition || pt?.status || 'stabil',
        h.situation,
        h.background,
        h.assessment,
        h.recommendation,
        h.verifiedByKaru ? 'Terverifikasi' : 'Belum Verifikasi',
      ];
    });

    exportToCSV(`rekap_handover_sbar_${date}`, headers, rows);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 animate-in fade-in duration-200">
      
      {/* 1. Sub-Tab Switcher: Formulir vs Riwayat Handover */}
      <div className="flex bg-slate-200 p-1 rounded-2xl shadow-inner">
        <button
          onClick={() => setActiveSubTab('form')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'form'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Formulir Timbang Terima SBAR</span>
        </button>

        <button
          onClick={() => setActiveSubTab('riwayat')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'riwayat'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Handover ({handovers.length})</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: FORMULIR TIMBANG TERIMA SBAR */}
      {/* ========================================== */}
      {activeSubTab === 'form' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4 text-xs"
        >
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section A: Waktu & Perawat Handover */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Waktu &amp; Perawat Handover</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Unit: <strong>{userSession.ward}</strong> · Shift Aktif: <strong>{userSession.shift.split(' ')[0]}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Handover <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jam Handover <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Perawat Memberikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={nurseFrom}
                  onChange={e => setNurseFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-medium"
                  required
                >
                  {nurses.map(n => (
                    <option key={n.id} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                  {!nurses.some(n => n.name === nurseFrom) && nurseFrom && (
                    <option value={nurseFrom}>{nurseFrom}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Perawat Menerima <span className="text-rose-500">*</span>
                </label>
                <select
                  value={nurseTo}
                  onChange={e => setNurseTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-medium"
                  required
                >
                  <option value="">-- Pilih Perawat Penerima --</option>
                  {nurses.map(n => (
                    <option key={n.id} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Pasien yang Diserahterimakan */}
          <div className="space-y-3 pt-1">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block border-b border-slate-100 pb-1">
              2. Pasien yang Diserahterimakan
            </span>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pilih Pasien Aktif <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 font-bold text-slate-900"
              >
                {activePatients.map(p => {
                  const day = calculateHospitalDay(p.admissionDate);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.bed} - {p.name} ({p.rmNumber}) · {day.text} · {p.status.toUpperCase()}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedPatient && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 text-xs">
                    {selectedPatient.name} ({selectedPatient.gender}, {selectedPatient.age} th)
                  </span>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Bed: <strong>{selectedPatient.bed}</strong> · No. RM: <strong className="font-mono">{selectedPatient.rmNumber}</strong> · {calculateHospitalDay(selectedPatient.admissionDate).text}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPatientDetail(selectedPatient)}
                  className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                >
                  Detail Rekam Medis
                </button>
              </div>
            )}

            {/* Condition selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Kondisi Klinis Terkini Pasien
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['stabil', 'perhatian', 'kritis'] as PatientCondition[]).map(cond => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`py-2 px-3 rounded-xl border capitalize font-bold text-xs transition-all ${
                      condition === cond
                        ? cond === 'kritis'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : cond === 'perhatian'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SINKRONISASI CEPAT HASIL PEMERIKSAAN KE SBAR */}
          <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-emerald-50/50 p-4 rounded-3xl border border-blue-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">⚡</span>
                  <span>Sinkronisasi Hasil Pemeriksaan ke Lembar SBAR</span>
                </h4>
                <p className="text-[11px] text-slate-600">
                  Tarik keluhan, terapi obat, tindakan yang sudah dilakukan, dan TTV secara otomatis
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncAllToSBAR}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <span>⚡ Sinkronkan Semua Data ke SBAR</span>
              </button>
            </div>

            {/* Sync Feedback Toast Message */}
            {syncFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{syncFeedback}</span>
              </div>
            )}

            {/* 4 Interactive Quick-Pull Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {/* 1. Keluhan Pasien */}
              <div className="bg-white p-2.5 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-950 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Keluhan Pasien</span>
                    </span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-full font-semibold">
                      Situation
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium mt-1 line-clamp-2">
                    {currentComplaint ? `"${currentComplaint}"` : 'Belum ada keluhan khusus'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePullComplaintToSBAR}
                  className="mt-2 w-full py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <ArrowDownToLine className="w-3 h-3 text-amber-700" />
                  <span>Tarik Keluhan</span>
                </button>
              </div>

              {/* 2. Terapi Obat Pasien */}
              <div className="bg-white p-2.5 rounded-2xl border border-blue-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-950 flex items-center gap-1">
                      <Pill className="w-3.5 h-3.5 text-blue-600" />
                      <span>Obat Pasien ({activePatientMeds.length})</span>
                    </span>
                    <span className="text-[10px] text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded-full font-semibold">
                      Background
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium mt-1 truncate">
                    {activePatientMeds.length > 0
                      ? activePatientMeds.map(m => m.name).join(', ')
                      : 'Belum ada obat aktif'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePullMedicationsToSBAR}
                  className="mt-2 w-full py-1 text-[11px] font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <ArrowDownToLine className="w-3 h-3 text-blue-700" />
                  <span>Tarik Obat</span>
                </button>
              </div>

              {/* 3. Tindakan Sudah Dilakukan */}
              <div className="bg-white p-2.5 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-950 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tindakan Selesai ({patientCompletedActions.length})</span>
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full font-semibold">
                      Assessment
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium mt-1 truncate">
                    {patientCompletedActions.length > 0
                      ? patientCompletedActions.map(a => a.title).join(', ')
                      : 'Belum ada tindakan selesai'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePullActionsToSBAR}
                  className="mt-2 w-full py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <ArrowDownToLine className="w-3 h-3 text-emerald-700" />
                  <span>Tarik Tindakan</span>
                </button>
              </div>

              {/* 4. TTV Terkini */}
              <div className="bg-white p-2.5 rounded-2xl border border-rose-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-rose-950 flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                      <span>TTV Terkini</span>
                    </span>
                    <span className="text-[10px] text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded-full font-semibold">
                      Situation
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium mt-1 font-mono truncate">
                    {ptVitals[0]
                      ? `${ptVitals[0].bpSystolic}/${ptVitals[0].bpDiastolic} · ${ptVitals[0].heartRate}x · ${ptVitals[0].temperature}°C`
                      : 'Belum ada TTV'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePullVitalsToSBAR()}
                  className="mt-2 w-full py-1 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <ArrowDownToLine className="w-3 h-3 text-rose-700" />
                  <span>Tarik TTV</span>
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SBAR STRUCTURED ENTRY (S, B, A, R) */}
          {/* ======================================================== */}
          <div className="space-y-4 pt-1">
            
            {/* S: SITUATION */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-[11px]">S</span>
                  <span>Situation (Situasi & Keluhan Saat Ini)</span>
                </span>
                <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                  Identitas, Bed, TTV Terkini
                </span>
              </div>

              {/* KARTU TTV PASIEN */}
              <div className="bg-white rounded-xl p-3 border border-blue-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                      <HeartPulse className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      Tanda-Tanda Vital (TTV) Pasien
                    </span>
                    {activeVital && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {activeVital.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-mono font-medium pl-6">
                    {activeVital ? (
                      `TD: ${activeVital.bpSystolic}/${activeVital.bpDiastolic} mmHg · Nadi: ${activeVital.heartRate}x/m · RR: ${activeVital.respiratoryRate}x/m · Suhu: ${activeVital.temperature}°C · SpO₂: ${activeVital.spo2}%${activeVital.gcs ? ` · GCS: ${activeVital.gcs}` : ''}`
                    ) : selectedPatient?.bpSystolic ? (
                      `TD: ${selectedPatient.bpSystolic}/${selectedPatient.bpDiastolic} mmHg · Nadi: ${selectedPatient.heartRate}x/m · RR: ${selectedPatient.respiratoryRate}x/m · Suhu: ${selectedPatient.temperature}°C · SpO₂: ${selectedPatient.spo2}%`
                    ) : (
                      <span className="italic font-sans text-slate-400">Belum ada rekaman TTV pasien</span>
                    )}
                  </p>
                </div>

                {ptVitals.length > 1 && (
                  <div className="self-end sm:self-center shrink-0">
                    <select
                      value={selectedVitalIndex}
                      onChange={e => {
                        const idx = Number(e.target.value);
                        setSelectedVitalIndex(idx);
                        if (ptVitals[idx]) {
                          setVitalSignsSummary(buildVitalsSummary(ptVitals[idx]));
                        }
                      }}
                      className="text-[11px] bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-medium text-slate-700"
                      title="Pilih rekaman TTV jam tertentu"
                    >
                      {ptVitals.map((v, i) => (
                        <option key={v.id} value={i}>
                          {i === 0 ? 'TTV Terbaru' : `TTV (${v.timestamp})`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Uraian Situasi Klinis Terkini:
                </label>
                <textarea
                  rows={3}
                  value={situationText}
                  onChange={e => setSituationText(e.target.value)}
                  placeholder="Pasien Tn..., keluhan utama saat ini, kondisi umum, tingkat kesadaran, dan TTV terbaru..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-white font-normal leading-relaxed"
                  required
                />
              </div>

              <div>
                <div className="mb-0.5">
                  <label className="block text-[10px] font-semibold text-slate-600">
                    Ringkasan Tanda-Tanda Vital (TTV):
                  </label>
                </div>
                <input
                  type="text"
                  value={vitalSignsSummary}
                  onChange={e => setVitalSignsSummary(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-white font-medium"
                />
              </div>
            </div>

            {/* B: BACKGROUND */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center font-black text-[11px]">B</span>
                  <span>Background (Latar Belakang Klinis & Terapi)</span>
                </span>
                <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100 px-2 py-0.5 rounded-full">
                  Dx Medis, Terapi, Alergi
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Uraian Latar Belakang & Riwayat:
                </label>
                <textarea
                  rows={3}
                  value={backgroundText}
                  onChange={e => setBackgroundText(e.target.value)}
                  placeholder="Diagnosis medis, diagnosis keperawatan, hari perawatan, riwayat pembedahan, riwayat alergi..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 text-xs bg-white font-normal leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Terapi Infus & Obat Aktif:
                </label>
                <input
                  type="text"
                  value={activeMedsSummary}
                  onChange={e => setActiveMedsSummary(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 text-xs bg-white font-medium"
                />
              </div>
            </div>

            {/* A: ASSESSMENT */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-md bg-amber-600 text-white flex items-center justify-center font-black text-[11px]">A</span>
                  <span>Assessment (Penilaian & Hasil Tindakan)</span>
                </span>
                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                  Evaluasi Tindakan Shift Ini
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Uraian Penilaian & Evaluasi Asuhan Keperawatan:
                </label>
                <textarea
                  rows={3}
                  value={assessmentText}
                  onChange={e => setAssessmentText(e.target.value)}
                  placeholder="Tindakan yang telah berhasil dilaksanakan shift ini, evaluasi respon klinis pasien..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 text-xs bg-white font-normal leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Tindakan yang Sudah Dilakukan:
                </label>
                <input
                  type="text"
                  value={actionsCompleted}
                  onChange={e => setActionsCompleted(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-amber-500 text-xs bg-white font-medium"
                />
              </div>
            </div>

            {/* R: RECOMMENDATION */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-black text-[11px]">R</span>
                  <span>Recommendation (Rekomendasi & Tindak Lanjut)</span>
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Rencana Shift Berikutnya & Advice DPJP
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Uraian Rekomendasi & Rencana Tindak Lanjut:
                </label>
                <textarea
                  rows={3}
                  value={recommendationText}
                  onChange={e => setRecommendationText(e.target.value)}
                  placeholder="Tindakan belum selesai yang harus dilanjutkan, rencana visite dokter, instruksi penunjang, target monitoring..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 text-xs bg-white font-normal leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Tindakan Tertunda (Pending):
                  </label>
                  <input
                    type="text"
                    value={actionsPending}
                    onChange={e => setActionsPending(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 text-xs bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                    Catatan Khusus / Kritis:
                  </label>
                  <input
                    type="text"
                    value={importantNotes}
                    onChange={e => setImportantNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-500 text-xs bg-white font-medium"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Lembar Timbang Terima Handover (SBAR)</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================== */}
      {/* TAB 2: RIWAYAT TIMBANG TERIMA HANDOVER */}
      {/* ========================================== */}
      {activeSubTab === 'riwayat' && (
        <div className="space-y-3">
          
          {/* Search, Filter & Export Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari pasien, bed, RM, atau nama perawat..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterShift}
                  onChange={e => setFilterShift(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <option value="all">Semua Shift</option>
                  <option value="Pagi">Shift Pagi</option>
                  <option value="Sore">Shift Sore</option>
                  <option value="Malam">Shift Malam</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition-all shrink-0"
                  title="Unduh format Excel / CSV"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Unduh Excel</span>
                </button>
              </div>
            </div>
          </div>

          {filteredHandovers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Belum ada riwayat timbang terima yang sesuai pencarian.
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredHandovers.map(h => {
                const pt = patients.find(p => p.id === h.patientId);
                const hospitalDay = calculateHospitalDay(pt?.admissionDate);

                return (
                  <div
                    key={h.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs hover:border-blue-300 transition-all"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-mono text-[11px] border border-blue-200">
                          {h.timestamp}
                        </span>
                        <span className="font-semibold text-slate-700 text-xs">
                          {h.shiftFrom || h.shift} → {h.shiftTo || 'Shift Berikutnya'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (pt) {
                              triggerPrintSBARHandover(h, pt, userSession.ward);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-[11px] flex items-center gap-1 transition-all"
                          title="Cetak Formulir Timbang Terima SBAR Pasien Ini"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          <span>Cetak SBAR (PDF)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onToggleVerify && onToggleVerify(h.id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                            h.verifiedByKaru
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                          title="Klik untuk ubah verifikasi tanda terima"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{h.verifiedByKaru ? 'Terverifikasi' : 'Menunggu Validasi'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Patient identity strip */}
                    <div className="flex items-start justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {pt?.name || 'Pasien Rawat Inap'}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            h.patientCondition === 'kritis' || pt?.status === 'kritis'
                              ? 'bg-rose-100 text-rose-800'
                              : h.patientCondition === 'perhatian' || pt?.status === 'perhatian'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {h.patientCondition || pt?.status || 'stabil'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Bed: <strong className="text-slate-700">{pt?.bed || '-'}</strong> · No. RM: <strong className="font-mono text-slate-700">{pt?.rmNumber || '-'}</strong> · {hospitalDay.text}
                        </div>
                      </div>

                      {pt && (
                        <button
                          type="button"
                          onClick={() => onSelectPatientDetail(pt)}
                          className="text-xs font-bold text-blue-600 hover:underline shrink-0"
                        >
                          Lihat Pasien →
                        </button>
                      )}
                    </div>

                    {/* Structured SBAR display blocks */}
                    <div className="space-y-2">
                      {/* S */}
                      <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-slate-800">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px] mb-1">
                          <span className="w-4 h-4 rounded-sm bg-blue-600 text-white flex items-center justify-center text-[10px]">S</span>
                          <span>SITUATION</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-700">{h.situation}</p>
                      </div>

                      {/* B */}
                      <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-slate-800">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px] mb-1">
                          <span className="w-4 h-4 rounded-sm bg-indigo-600 text-white flex items-center justify-center text-[10px]">B</span>
                          <span>BACKGROUND</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-700">{h.background}</p>
                      </div>

                      {/* A */}
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-slate-800">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px] mb-1">
                          <span className="w-4 h-4 rounded-sm bg-amber-600 text-white flex items-center justify-center text-[10px]">A</span>
                          <span>ASSESSMENT</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-700">{h.assessment}</p>
                      </div>

                      {/* R */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-slate-800">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px] mb-1">
                          <span className="w-4 h-4 rounded-sm bg-emerald-600 text-white flex items-center justify-center text-[10px]">R</span>
                          <span>RECOMMENDATION</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-700">{h.recommendation}</p>
                      </div>
                    </div>

                    {/* Nurse from & to (Sederhana) */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                      <div className="flex items-center gap-2">
                        <span>Shift: <strong className="text-slate-800">{h.shiftFrom || h.shift}</strong></span>
                        {h.shiftTo && <span>→ <strong className="text-slate-800">{h.shiftTo}</strong></span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span>Penyerah: <strong className="text-slate-800">{h.handoverFrom}</strong></span>
                        <span>Penerima: <strong className="text-slate-800">{h.handoverTo}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
