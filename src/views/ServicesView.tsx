import React, { useState } from 'react';
import {
  Activity,
  ArrowRightLeft,
  CheckSquare,
  FileEdit,
  HeartPulse,
  GraduationCap,
  Save,
  CheckCircle2,
  Plus,
  Clock,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import {
  Patient,
  SBARHandover,
  NursingAction,
  SOAPNote,
  VitalSign,
  PatientEducation,
  ShiftType,
} from '../types';
import { UserSession } from '../services/storageService';

export type ServiceSubTab = 'timbang-terima' | 'tindakan' | 'soap' | 'ttv' | 'edukasi';

interface ServicesViewProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatientId: (id: string) => void;
  subTab: ServiceSubTab;
  onChangeSubTab: (tab: ServiceSubTab) => void;
  handovers: SBARHandover[];
  actions: NursingAction[];
  soaps: SOAPNote[];
  vitals: VitalSign[];
  educations: PatientEducation[];
  userSession: UserSession;
  onSaveHandover: (handover: Omit<SBARHandover, 'id'>) => void;
  onToggleAction: (actionId: string) => void;
  onAddAction: (action: Omit<NursingAction, 'id'>) => void;
  onSaveSOAP: (soap: Omit<SOAPNote, 'id'>) => void;
  onSaveVital: (vital: Omit<VitalSign, 'id'>) => void;
  onSaveEducation: (edu: Omit<PatientEducation, 'id'>) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  patients,
  selectedPatientId,
  onSelectPatientId,
  subTab,
  onChangeSubTab,
  handovers,
  actions,
  soaps,
  vitals,
  educations,
  userSession,
  onSaveHandover,
  onToggleAction,
  onAddAction,
  onSaveSOAP,
  onSaveVital,
  onSaveEducation,
}) => {
  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Forms states
  // 1. SBAR
  const [sbarForm, setSbarForm] = useState({
    situation: '',
    background: '',
    assessment: '',
    recommendation: '',
    handoverTo: 'Ns. Budi Santoso',
  });

  // 2. Action Form
  const [newActionForm, setNewActionForm] = useState({
    title: '',
    category: 'Medikasi' as NursingAction['category'],
    notes: '',
  });
  const [showAddActionForm, setShowAddActionForm] = useState(false);

  // 3. SOAP Form
  const [soapForm, setSoapForm] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  // 4. Vitals Form
  const [vitalForm, setVitalForm] = useState({
    bpSystolic: '120',
    bpDiastolic: '80',
    heartRate: '80',
    respiratoryRate: '20',
    temperature: '36.8',
    spo2: '98',
    gcs: 'E4V5M6 (15)',
    notes: '',
  });

  // 5. Education Form
  const [eduForm, setEduForm] = useState({
    topic: '',
    recipient: 'Pasien' as PatientEducation['recipient'],
    method: 'Lisan' as PatientEducation['method'],
    evaluation: 'Paham & Mampu Menjelaskan' as PatientEducation['evaluation'],
  });

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
        Belum ada data pasien. Tambahkan pasien terlebih dahulu di menu Pasien.
      </div>
    );
  }

  // Filter records strictly for selected patient
  const patientHandovers = handovers.filter(h => h.patientId === currentPatient.id);
  const patientActions = actions.filter(a => a.patientId === currentPatient.id);
  const patientSoaps = soaps.filter(s => s.patientId === currentPatient.id);
  const patientVitals = vitals.filter(v => v.patientId === currentPatient.id);
  const patientEdu = educations.filter(e => e.patientId === currentPatient.id);

  // Form submit handlers
  const handleSbarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbarForm.situation || !sbarForm.assessment) return;

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onSaveHandover({
      patientId: currentPatient.id,
      timestamp,
      shift: userSession.shift,
      situation: sbarForm.situation.trim(),
      background: sbarForm.background.trim() || `Pasien ${currentPatient.name}, Dx: ${currentPatient.medicalDiagnosis}`,
      assessment: sbarForm.assessment.trim(),
      recommendation: sbarForm.recommendation.trim() || 'Lanjutkan intervensi sesuai advis dokter.',
      handoverFrom: userSession.nurseName,
      handoverTo: sbarForm.handoverTo.trim(),
    });

    setSbarForm({
      situation: '',
      background: '',
      assessment: '',
      recommendation: '',
      handoverTo: 'Ns. Budi Santoso',
    });
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionForm.title) return;

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onAddAction({
      patientId: currentPatient.id,
      timestamp,
      category: newActionForm.category,
      title: newActionForm.title.trim(),
      notes: newActionForm.notes.trim(),
      completed: false,
      nurseName: userSession.nurseName,
      shift: userSession.shift,
    });

    setNewActionForm({
      title: '',
      category: 'Medikasi',
      notes: '',
    });
    setShowAddActionForm(false);
  };

  const handleSoapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!soapForm.subjective || !soapForm.assessment) return;

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onSaveSOAP({
      patientId: currentPatient.id,
      timestamp,
      shift: userSession.shift,
      subjective: soapForm.subjective.trim(),
      objective: soapForm.objective.trim() || `TTV stabil, kondisi umum sedang`,
      assessment: soapForm.assessment.trim(),
      plan: soapForm.plan.trim() || 'Lanjutkan program terapi dan observasi rutin.',
      nurseName: userSession.nurseName,
      status: 'Final',
    });

    setSoapForm({
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    });
  };

  const handleVitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onSaveVital({
      patientId: currentPatient.id,
      timestamp,
      bpSystolic: Number(vitalForm.bpSystolic) || 120,
      bpDiastolic: Number(vitalForm.bpDiastolic) || 80,
      heartRate: Number(vitalForm.heartRate) || 80,
      respiratoryRate: Number(vitalForm.respiratoryRate) || 20,
      temperature: Number(vitalForm.temperature) || 36.5,
      spo2: Number(vitalForm.spo2) || 98,
      gcs: vitalForm.gcs,
      nurseName: userSession.nurseName,
      notes: vitalForm.notes.trim(),
    });

    setVitalForm({
      bpSystolic: '120',
      bpDiastolic: '80',
      heartRate: '80',
      respiratoryRate: '20',
      temperature: '36.8',
      spo2: '98',
      gcs: 'E4V5M6 (15)',
      notes: '',
    });
  };

  const handleEduSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.topic) return;

    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onSaveEducation({
      patientId: currentPatient.id,
      timestamp,
      topic: eduForm.topic.trim(),
      recipient: eduForm.recipient,
      method: eduForm.method,
      evaluation: eduForm.evaluation,
      nurseName: userSession.nurseName,
    });

    setEduForm({
      topic: '',
      recipient: 'Pasien',
      method: 'Lisan',
      evaluation: 'Paham & Mampu Menjelaskan',
    });
  };

  return (
    <div className="space-y-3 pb-20 animate-in fade-in duration-200">
      
      {/* 1. Integrated Patient Selector Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider">
            Pasien Terpilih
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                currentPatient.status === 'kritis'
                  ? 'bg-rose-600 animate-pulse'
                  : currentPatient.status === 'perhatian'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="capitalize font-semibold text-[11px] text-slate-700">
              {currentPatient.status}
            </span>
          </div>
        </div>

        {/* Dropdown selector */}
        <div className="relative">
          <select
            value={currentPatient.id}
            onChange={e => onSelectPatientId(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 pr-8"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.bed} - {p.name} ({p.rmNumber})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Quick diagnosis hint */}
        <div className="text-[11px] text-slate-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex items-center justify-between">
          <span className="truncate">
            <strong>Dx:</strong> {currentPatient.medicalDiagnosis}
          </span>
          <span className="shrink-0 text-slate-500 ml-2">
            DPJP: {currentPatient.dpjps?.[0]?.split(',')[0] || currentPatient.dpjp?.split(',')[0] || '-'}
          </span>
        </div>
      </div>

      {/* 2. Sub-Tabs Navigation (Timbang Terima, Tindakan, SOAP, Monitoring TTV, Edukasi) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => onChangeSubTab('timbang-terima')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[38px] ${
            subTab === 'timbang-terima'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Timbang Terima (SBAR)</span>
        </button>

        <button
          onClick={() => onChangeSubTab('tindakan')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[38px] ${
            subTab === 'tindakan'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Tindakan ({patientActions.filter(a => !a.completed).length})</span>
        </button>

        <button
          onClick={() => onChangeSubTab('soap')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[38px] ${
            subTab === 'soap'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Evaluasi SOAP</span>
        </button>

        <button
          onClick={() => onChangeSubTab('ttv')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[38px] ${
            subTab === 'ttv'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Monitoring TTV</span>
        </button>

        <button
          onClick={() => onChangeSubTab('edukasi')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[38px] ${
            subTab === 'edukasi'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Edukasi Pasien</span>
        </button>
      </div>

      {/* 3. Sub-Tab Contents */}

      {/* SUB-TAB 1: TIMBANG TERIMA SBAR */}
      {subTab === 'timbang-terima' && (
        <div className="space-y-3">
          <form
            onSubmit={handleSbarSubmit}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Form Timbang Terima SBAR</h3>
              <span className="text-[11px] text-slate-500 font-medium">{userSession.shift}</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                S - Situation (Kondisi Terkini & Keluhan Utama) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={sbarForm.situation}
                onChange={e => setSbarForm({ ...sbarForm, situation: e.target.value })}
                placeholder="Contoh: Keluhan nyeri luka operasi skala 4, bising usus sudah terdengar, mobilisasi miring aktif..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                B - Background (Riwayat & Terapi Relevan)
              </label>
              <textarea
                rows={2}
                value={sbarForm.background}
                onChange={e => setSbarForm({ ...sbarForm, background: e.target.value })}
                placeholder={`Default: Pasien ${currentPatient.name}, Dx: ${currentPatient.medicalDiagnosis}, Alergi: ${currentPatient.allergies}`}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                A - Assessment (Hasil Pengkajian & TTV) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={sbarForm.assessment}
                onChange={e => setSbarForm({ ...sbarForm, assessment: e.target.value })}
                placeholder="Contoh: TTV stabil, luka bersih tanpa rembesan berlebih, intake toleransi baik..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                R - Recommendation (Rencana Shift Berikutnya)
              </label>
              <textarea
                rows={2}
                value={sbarForm.recommendation}
                onChange={e => setSbarForm({ ...sbarForm, recommendation: e.target.value })}
                placeholder="Contoh: Jadwalkan ganti balut jam 10.00, lanjutkan antibiotik, cek albumin konfirmasi DPJP..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Perawat Penerima Timbang Terima
              </label>
              <input
                type="text"
                value={sbarForm.handoverTo}
                onChange={e => setSbarForm({ ...sbarForm, handoverTo: e.target.value })}
                placeholder="Nama perawat shift penerima"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Timbang Terima SBAR</span>
            </button>
          </form>

          {/* SBAR History */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Riwayat Timbang Terima ({patientHandovers.length})
            </h4>

            {patientHandovers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center text-slate-400 text-xs">
                Belum ada catatan timbang terima untuk pasien ini.
              </div>
            ) : (
              patientHandovers.map(h => (
                <div
                  key={h.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-1.5">
                    <span className="font-semibold text-blue-700">{h.shift}</span>
                    <span>{h.timestamp}</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <p><strong className="text-slate-900">S:</strong> {h.situation}</p>
                    <p><strong className="text-slate-900">B:</strong> {h.background}</p>
                    <p><strong className="text-slate-900">A:</strong> {h.assessment}</p>
                    <p><strong className="text-slate-900">R:</strong> {h.recommendation}</p>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex justify-between">
                    <span>Dari: <strong>{h.handoverFrom}</strong></span>
                    <span>Ke: <strong>{h.handoverTo}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CHECKLIST TINDAKAN KEPERAWATAN */}
      {subTab === 'tindakan' && (
        <div className="space-y-3">
          {/* Quick Add Button or Form */}
          {!showAddActionForm ? (
            <button
              onClick={() => setShowAddActionForm(true)}
              className="w-full min-h-[44px] bg-white border border-dashed border-blue-400 text-blue-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-50 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal Tindakan Baru</span>
            </button>
          ) : (
            <form
              onSubmit={handleActionSubmit}
              className="bg-white rounded-2xl p-4 border border-blue-200 shadow-sm space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-bold text-slate-800">Tambah Tindakan Keperawatan</h4>
                <button
                  type="button"
                  onClick={() => setShowAddActionForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Tindakan / Terapi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newActionForm.title}
                  onChange={e => setNewActionForm({ ...newActionForm, title: e.target.value })}
                  placeholder="Contoh: Injeksi Ondansetron 4mg IV, Pasang NGT..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newActionForm.category}
                    onChange={e =>
                      setNewActionForm({
                        ...newActionForm,
                        category: e.target.value as NursingAction['category'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                  >
                    <option value="Medikasi">Medikasi (Obat/Injeksi)</option>
                    <option value="Perawatan Luka">Perawatan Luka</option>
                    <option value="Oksigenasi">Oksigenasi</option>
                    <option value="Nutrisi/Cairan">Nutrisi / Infus</option>
                    <option value="Observasi">Observasi / TTV</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={newActionForm.notes}
                    onChange={e => setNewActionForm({ ...newActionForm, notes: e.target.value })}
                    placeholder="Instruksi khusus atau rute"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Tindakan</span>
              </button>
            </form>
          )}

          {/* Interactive Actions Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Checklist Tindakan ({patientActions.filter(a => a.completed).length} dari {patientActions.length} Selesai)
            </h4>

            {patientActions.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
                Belum ada rencana tindakan untuk shift ini.
              </div>
            ) : (
              <div className="space-y-2">
                {patientActions.map(action => (
                  <div
                    key={action.id}
                    onClick={() => onToggleAction(action.id)}
                    className={`bg-white rounded-2xl p-3.5 border transition-all cursor-pointer select-none flex items-start gap-3 active:scale-[0.99] ${
                      action.completed
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <button
                      type="button"
                      className={`min-h-[44px] min-w-[44px] -m-2 flex items-center justify-center rounded-full shrink-0 ${
                        action.completed
                          ? 'text-emerald-600'
                          : 'text-slate-400 hover:text-blue-600'
                      }`}
                      aria-label="Centang tindakan"
                    >
                      {action.completed ? (
                        <CheckCircle2 className="w-6 h-6 fill-emerald-600 text-white" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-slate-300" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold ${
                            action.completed ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {action.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 shrink-0">
                          {action.category}
                        </span>
                      </div>

                      {action.notes && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{action.notes}</p>
                      )}

                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Oleh: {action.nurseName}</span>
                        {action.completed && action.completedAt && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium">
                              Selesai jam {action.completedAt.split(' ')[1] || action.completedAt}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EVALUASI SOAP */}
      {subTab === 'soap' && (
        <div className="space-y-3">
          <form
            onSubmit={handleSoapSubmit}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Dokumentasi Evaluasi SOAP</h3>
              <span className="text-[11px] text-slate-500 font-medium">{userSession.shift}</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                S - Subjektif (Keluhan Langsung Pasien) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={soapForm.subjective}
                onChange={e => setSoapForm({ ...soapForm, subjective: e.target.value })}
                placeholder="Pasien mengatakan nyeri ulu hati berkurang setelah minum obat, tidak ada mual..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                O - Objektif (Hasil Observasi & TTV Fisik)
              </label>
              <textarea
                rows={2}
                value={soapForm.objective}
                onChange={e => setSoapForm({ ...soapForm, objective: e.target.value })}
                placeholder="TD 120/80, Nadi 82x/m, bising usus normal, peristaltik usus aktif..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                A - Analisis / Assessment (Diagnosis & Masalah Teratasi Sebagian / Teratasi) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={soapForm.assessment}
                onChange={e => setSoapForm({ ...soapForm, assessment: e.target.value })}
                placeholder="Contoh: Masalah nyeri akut teratasi sebagian, risiko infeksi terkontrol..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                P - Planning (Rencana Tindak Lanjut Perawat)
              </label>
              <textarea
                rows={2}
                value={soapForm.plan}
                onChange={e => setSoapForm({ ...soapForm, plan: e.target.value })}
                placeholder="1. Lanjutkan observasi TTV per 4 jam. 2. Berikan edukasi diet..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Catatan SOAP</span>
            </button>
          </form>

          {/* SOAP Notes History */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Riwayat Evaluasi SOAP ({patientSoaps.length})
            </h4>

            {patientSoaps.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center text-slate-400 text-xs">
                Belum ada evaluasi SOAP tercatat untuk pasien ini.
              </div>
            ) : (
              patientSoaps.map(s => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-1.5">
                    <span className="font-semibold text-blue-700">{s.shift}</span>
                    <span>{s.timestamp} · {s.nurseName}</span>
                  </div>
                  <div className="space-y-1.5 text-slate-700">
                    <div>
                      <strong className="text-slate-900 block">S (Subjektif):</strong>
                      <p>{s.subjective}</p>
                    </div>
                    <div>
                      <strong className="text-slate-900 block">O (Objektif):</strong>
                      <p>{s.objective}</p>
                    </div>
                    <div>
                      <strong className="text-slate-900 block">A (Analisis):</strong>
                      <p>{s.assessment}</p>
                    </div>
                    <div>
                      <strong className="text-slate-900 block">P (Planning):</strong>
                      <p className="whitespace-pre-line">{s.plan}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MONITORING TTV */}
      {subTab === 'ttv' && (
        <div className="space-y-3">
          <form
            onSubmit={handleVitalSubmit}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Input Tanda-Tanda Vital (TTV)</h3>
              <span className="text-[11px] text-slate-500 font-medium">{userSession.shift}</span>
            </div>

            {/* TD & HR */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  TD Sistol
                </label>
                <input
                  type="number"
                  value={vitalForm.bpSystolic}
                  onChange={e => setVitalForm({ ...vitalForm, bpSystolic: e.target.value })}
                  placeholder="120"
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white text-center font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  TD Diastol
                </label>
                <input
                  type="number"
                  value={vitalForm.bpDiastolic}
                  onChange={e => setVitalForm({ ...vitalForm, bpDiastolic: e.target.value })}
                  placeholder="80"
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white text-center font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nadi (x/m)
                </label>
                <input
                  type="number"
                  value={vitalForm.heartRate}
                  onChange={e => setVitalForm({ ...vitalForm, heartRate: e.target.value })}
                  placeholder="80"
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white text-center font-bold"
                  required
                />
              </div>
            </div>

            {/* RR, Suhu, SpO2 */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  RR (x/m)
                </label>
                <input
                  type="number"
                  value={vitalForm.respiratoryRate}
                  onChange={e => setVitalForm({ ...vitalForm, respiratoryRate: e.target.value })}
                  placeholder="20"
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white text-center font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Suhu (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalForm.temperature}
                  onChange={e => setVitalForm({ ...vitalForm, temperature: e.target.value })}
                  placeholder="36.8"
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white text-center font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  value={vitalForm.spo2}
                  onChange={e => setVitalForm({ ...vitalForm, spo2: e.target.value })}
                  placeholder="98"
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white text-center font-bold"
                  required
                />
              </div>
            </div>

            {/* GCS & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GCS</label>
                <input
                  type="text"
                  value={vitalForm.gcs}
                  onChange={e => setVitalForm({ ...vitalForm, gcs: e.target.value })}
                  placeholder="E4V5M6 (15)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={vitalForm.notes}
                  onChange={e => setVitalForm({ ...vitalForm, notes: e.target.value })}
                  placeholder="Akral hangat, keluhan pusing..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data TTV</span>
            </button>
          </form>

          {/* Vitals History */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Catatan TTV Terakhir ({patientVitals.length})
            </h4>

            {patientVitals.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center text-slate-400 text-xs">
                Belum ada data TTV tersimpan untuk pasien ini.
              </div>
            ) : (
              patientVitals.map(v => (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-1">
                    <span className="font-semibold text-slate-800">{v.timestamp}</span>
                    <span>Oleh: {v.nurseName}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">TD</span>
                      <strong className="text-slate-800">{v.bpSystolic}/{v.bpDiastolic}</strong>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">HR / RR</span>
                      <strong className="text-slate-800">{v.heartRate} / {v.respiratoryRate}</strong>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Suhu</span>
                      <strong className="text-slate-800">{v.temperature}°C</strong>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">SpO2</span>
                      <strong className="text-slate-800">{v.spo2}%</strong>
                    </div>
                  </div>
                  {v.notes && (
                    <p className="text-[11px] text-slate-600 italic">{v.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: EDUKASI PASIEN */}
      {subTab === 'edukasi' && (
        <div className="space-y-3">
          <form
            onSubmit={handleEduSubmit}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Catatan Edukasi Pasien / Keluarga</h3>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Topik Materi Edukasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={eduForm.topic}
                onChange={e => setEduForm({ ...eduForm, topic: e.target.value })}
                placeholder="Contoh: Teknik Batuk Efektif, Manajemen Diet Rendah Garam..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Penerima Edukasi</label>
                <select
                  value={eduForm.recipient}
                  onChange={e =>
                    setEduForm({
                      ...eduForm,
                      recipient: e.target.value as PatientEducation['recipient'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="Pasien">Pasien Langsung</option>
                  <option value="Keluarga">Keluarga Pasien</option>
                  <option value="Keduanya">Pasien & Keluarga</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Edukasi</label>
                <select
                  value={eduForm.method}
                  onChange={e =>
                    setEduForm({
                      ...eduForm,
                      method: e.target.value as PatientEducation['method'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
                >
                  <option value="Lisan">Penjelasan Lisan</option>
                  <option value="Brosur/Leaflet">Brosur / Leaflet</option>
                  <option value="Demonstrasi">Demonstrasi Praktik</option>
                  <option value="Kombinasi">Kombinasi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hasil Evaluasi Pemahaman</label>
              <select
                value={eduForm.evaluation}
                onChange={e =>
                  setEduForm({
                    ...eduForm,
                    evaluation: e.target.value as PatientEducation['evaluation'],
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 text-xs bg-slate-50 focus:bg-white"
              >
                <option value="Paham & Mampu Menjelaskan">Paham & Mampu Menjelaskan Kembali</option>
                <option value="Butuh Pendampingan">Paham Sebagian / Butuh Pendampingan</option>
                <option value="Belum Paham">Belum Paham / Perlu Diulang</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Catatan Edukasi</span>
            </button>
          </form>

          {/* Education History */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Riwayat Edukasi Pasien ({patientEdu.length})
            </h4>

            {patientEdu.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center text-slate-400 text-xs">
                Belum ada catatan edukasi untuk pasien ini.
              </div>
            ) : (
              patientEdu.map(e => (
                <div
                  key={e.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-1">
                    <span className="font-semibold text-slate-800">{e.topic}</span>
                    <span>{e.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">Sasaran: {e.recipient}</span>
                    <span>·</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">Metode: {e.method}</span>
                  </div>
                  <p className="text-emerald-700 font-semibold text-[11px]">
                    Evaluasi: {e.evaluation}
                  </p>
                  <div className="text-[10px] text-slate-400">Pemberi Edukasi: {e.nurseName}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
