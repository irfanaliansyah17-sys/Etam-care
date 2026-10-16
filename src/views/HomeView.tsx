import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  CheckSquare,
  FileEdit,
  UserPlus,
  ArrowRightLeft,
  ClipboardList,
  ChevronRight,
  Clock,
  Building2,
  Stethoscope,
  HeartPulse,
  QrCode,
  Sparkles,
  Pill,
  Search,
  X,
  Droplet,
  ShieldCheck,
} from 'lucide-react';
import { Patient, VitalSign, NursingAction, SOAPNote, SBARHandover } from '../types';
import { UserSession } from '../services/storageService';
import { MainMenuTab } from '../components/Header';

interface HomeViewProps {
  patients: Patient[];
  actions: NursingAction[];
  soaps: SOAPNote[];
  handovers: SBARHandover[];
  userSession: UserSession;
  onNavigate: (tab: MainMenuTab) => void;
  onOpenAddPatient: () => void;
  onOpenAddVital?: (patient?: Patient, initialVital?: VitalSign) => void;
  onOpenAddGds?: (patient?: Patient) => void;
  onOpenAddMedication?: (patient?: Patient) => void;
  onOpenAddAction?: (patient?: Patient) => void;
  onOpenQrModal?: () => void;
  onOpenDownloadModal?: () => void;
  onOpenSplashScreen?: () => void;
  onSelectPatientDetail: (patient: Patient) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  patients,
  actions,
  soaps,
  handovers,
  userSession,
  onNavigate,
  onOpenAddPatient,
  onOpenAddVital,
  onOpenAddGds,
  onOpenAddMedication,
  onOpenAddAction,
  onOpenQrModal,
  onOpenDownloadModal,
  onOpenSplashScreen,
  onSelectPatientDetail,
}) => {
  const [liveClock, setLiveClock] = useState('');
  const [liveDate, setLiveDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveClock(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setLiveDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter only active patients (not discharged, transferred, or deceased)
  const activePatients = useMemo(
    () => patients.filter(p => p.lifeStatus === 'aktif'),
    [patients]
  );
  const totalActivePatients = activePatients.length;

  const priorityPatients = useMemo(
    () => activePatients.filter(p => p.status === 'kritis' || p.status === 'perhatian'),
    [activePatients]
  );
  const stablePatients = useMemo(
    () => activePatients.filter(p => p.status === 'stabil'),
    [activePatients]
  );

  // Active filter state for patient list on Beranda ('semua' | 'prioritas' | 'stabil')
  const [patientFilter, setPatientFilter] = useState<'semua' | 'prioritas' | 'stabil'>('semua');
  // Fitur pencarian pasien di beranda
  const [searchQuery, setSearchQuery] = useState('');

  // Base filtered patients by category tab
  const categoryFilteredPatients = useMemo(() => {
    if (patientFilter === 'prioritas') {
      return priorityPatients;
    }
    if (patientFilter === 'stabil') {
      return stablePatients;
    }
    return activePatients;
  }, [patientFilter, priorityPatients, stablePatients, activePatients]);

  // Final filtered patients to display on Beranda (sorted by lowest ward & bed number ascending)
  const displayedPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = q
      ? categoryFilteredPatients.filter(patient => {
          const matchName = patient.name.toLowerCase().includes(q);
          const matchRm = patient.rmNumber.toLowerCase().includes(q);
          const matchBed = patient.bed.toLowerCase().includes(q);
          const matchDiag = patient.medicalDiagnosis.toLowerCase().includes(q);
          const matchDpjp =
            (patient.dpjp && patient.dpjp.toLowerCase().includes(q)) ||
            (patient.dpjps && patient.dpjps.some(d => d.toLowerCase().includes(q)));
          const matchRoom = patient.room && patient.room.toLowerCase().includes(q);

          return matchName || matchRm || matchBed || matchDiag || matchDpjp || matchRoom;
        })
      : [...categoryFilteredPatients];

    // Urutkan berdasarkan nomor bangsal dan nomor bed terendah / terurut
    return list.sort((a, b) => {
      const roomComp = (a.room || '').localeCompare(b.room || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      if (roomComp !== 0) return roomComp;
      return (a.bed || '').localeCompare(b.bed || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }, [categoryFilteredPatients, searchQuery]);

  const scrollToPatientSection = () => {
    const el = document.getElementById('daftar-pasien-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 animate-in fade-in duration-200">
      
      {/* 1. Header Information Card: Ward, Date/Time, Active Nurse & Shift */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-100 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-blue-200" />
              <span>{userSession.ward}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tight">
              Selamat Bertugas, {userSession.nurseName}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-blue-100">
              <span className="font-semibold bg-white/20 px-2.5 py-0.5 rounded-full text-white">
                {userSession.role}
              </span>
              <span>·</span>
              <span className="text-blue-100">{userSession.ward}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-xl p-2.5 sm:text-right shrink-0">
            <div className="text-[11px] text-blue-100">{liveDate}</div>
            <div className="text-base sm:text-lg font-mono font-bold text-white tracking-wider">
              {liveClock || '08:00:00'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Ringkasan Angka Utama (4 KPI Cards Ringkas - Klik Langsung Saring Daftar Pasien) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Pasien Aktif */}
        <button
          onClick={() => {
            setPatientFilter('semua');
            scrollToPatientSection();
          }}
          className={`p-3.5 rounded-2xl border shadow-xs active:scale-[0.98] text-left transition-all group cursor-pointer ${
            patientFilter === 'semua'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/20'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
              Total Pasien Aktif
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {totalActivePatients}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Dirawat di bangsal {userSession.ward}</span>
        </button>

        {/* Pasien Prioritas (Kritis & Perhatian) */}
        <button
          onClick={() => {
            setPatientFilter('prioritas');
            scrollToPatientSection();
          }}
          className={`p-3.5 rounded-2xl border shadow-xs active:scale-[0.98] text-left transition-all group cursor-pointer ${
            patientFilter === 'prioritas'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-white border-rose-100 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-rose-700">Pasien Prioritas</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tabular-nums">
            {priorityPatients.length}
          </div>
          <span className="text-[11px] text-rose-600/80 mt-0.5 block">Kritis & perhatian khusus</span>
        </button>

        {/* Pasien Kondisi Stabil */}
        <button
          onClick={() => {
            setPatientFilter('stabil');
            scrollToPatientSection();
          }}
          className={`p-3.5 rounded-2xl border shadow-xs active:scale-[0.98] text-left transition-all group cursor-pointer ${
            patientFilter === 'stabil'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-white border-emerald-100 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-emerald-800">Pasien Stabil</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tabular-nums">
            {stablePatients.length}
          </div>
          <span className="text-[11px] text-emerald-700/80 mt-0.5 block">Keadaan umum baik/terkontrol</span>
        </button>
      </div>

      {/* 3. Tombol Cepat: Tambah Pasien, Catat TTV, Catat GDS, Catat Obat, Catat Tindakan, Akses QR */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Aksi Cepat Perawat
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Tambah Pasien */}
          <button
            onClick={onOpenAddPatient}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-600 text-white min-h-[58px] shadow-sm hover:bg-blue-700 active:scale-95 transition-all text-center cursor-pointer"
          >
            <UserPlus className="w-5 h-5 mb-1" />
            <span className="text-xs font-bold leading-tight">Tambah Pasien</span>
          </button>

          {/* 2. Catat TTV Baru */}
          <button
            onClick={() => onOpenAddVital && onOpenAddVital()}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 min-h-[58px] shadow-xs hover:bg-rose-100 active:scale-95 transition-all text-center cursor-pointer"
          >
            <HeartPulse className="w-5 h-5 mb-1 text-rose-600" />
            <span className="text-xs font-bold leading-tight">Catat TTV Baru</span>
          </button>

          {/* 3. Catat GDS Khusus */}
          <button
            onClick={() => (onOpenAddGds ? onOpenAddGds() : onOpenAddVital && onOpenAddVital())}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 min-h-[58px] shadow-xs hover:bg-amber-100 active:scale-95 transition-all text-center cursor-pointer"
            title="Catat Gula Darah Sewaktu pasien tanpa harus input seluruh TTV"
          >
            <Droplet className="w-5 h-5 mb-1 text-amber-600" />
            <span className="text-xs font-bold leading-tight">Catat GDS</span>
          </button>

          {/* 4. Catat Obat (Terapi Farmakologi) */}
          <button
            onClick={() => onOpenAddMedication && onOpenAddMedication()}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 min-h-[58px] shadow-xs hover:bg-purple-100 active:scale-95 transition-all text-center cursor-pointer"
            title="Catat pemberian terapi obat pasien"
          >
            <Pill className="w-5 h-5 mb-1 text-purple-600" />
            <span className="text-xs font-bold leading-tight">Catat Obat</span>
          </button>

          {/* 5. Catat Tindakan */}
          <button
            onClick={() => (onOpenAddAction ? onOpenAddAction() : onNavigate('handover'))}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 min-h-[58px] shadow-xs hover:bg-slate-50 active:scale-95 transition-all text-center cursor-pointer"
          >
            <ClipboardList className="w-5 h-5 mb-1 text-slate-700" />
            <span className="text-xs font-bold leading-tight">Catat Tindakan</span>
          </button>

          {/* 6. Akses QR Code (Semua Perangkat) */}
          {onOpenQrModal && (
            <button
              onClick={onOpenQrModal}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 min-h-[58px] shadow-xs hover:bg-emerald-100 active:scale-95 transition-all text-center cursor-pointer"
            >
              <QrCode className="w-5 h-5 mb-1 text-emerald-600" />
              <span className="text-xs font-bold leading-tight">Akses QR Code</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Ringkasan Daftar Pasien Aktif (Dengan Filter Cepat Prioritas & Dokumentasi) */}
      <div id="daftar-pasien-section" className="space-y-2.5 pt-1 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              {patientFilter === 'prioritas' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-700">Pasien Prioritas ({displayedPatients.length})</span>
                </>
              ) : patientFilter === 'stabil' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800">Pasien Stabil ({displayedPatients.length})</span>
                </>
              ) : (
                <span>Daftar Pasien Aktif ({totalActivePatients})</span>
              )}
            </h3>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setPatientFilter('semua')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                patientFilter === 'semua'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Semua ({totalActivePatients})
            </button>
            <button
              onClick={() => setPatientFilter('prioritas')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                patientFilter === 'prioritas'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Prioritas ({priorityPatients.length})</span>
            </button>
            <button
              onClick={() => setPatientFilter('stabil')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                patientFilter === 'stabil'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Stabil ({stablePatients.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Search Bar Pasien di Beranda */}
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari pasien di beranda (nama, No. RM, bed, diagnosa, DPJP)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian pasien"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span>
                Hasil pencarian "{searchQuery}": ditemukan <strong className="text-blue-600 font-bold">{displayedPatients.length}</strong> pasien
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>

        {patientFilter !== 'semua' && (
          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
            patientFilter === 'prioritas'
              ? 'bg-rose-50/80 border-rose-200 text-rose-800'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
          }`}>
            <span className="font-medium">
              Menampilkan {displayedPatients.length} pasien {patientFilter === 'prioritas' ? 'prioritas (kritis & perhatian khusus)' : 'dalam kondisi stabil'}.
            </span>
            <button
              onClick={() => setPatientFilter('semua')}
              className="text-blue-700 hover:text-blue-900 font-bold underline text-[11px] shrink-0 cursor-pointer"
            >
              Reset ke Semua Pasien
            </button>
          </div>
        )}

        {displayedPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            {searchQuery ? (
              <div className="space-y-1">
                <p className="font-bold text-slate-700">Tidak ada pasien yang cocok dengan pencarian "{searchQuery}"</p>
                <p className="text-slate-400">Coba periksa ejaan nama, nomor rekam medis, nomor bed, atau bersihkan pencarian.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl inline-block cursor-pointer"
                >
                  Bersihkan Pencarian
                </button>
              </div>
            ) : patientFilter === 'prioritas'
              ? 'Tidak ada pasien dalam kondisi kritis atau perhatian khusus saat ini. Semua pasien stabil.'
              : patientFilter === 'stabil'
              ? 'Belum ada data pasien dengan status stabil.'
              : `Belum ada pasien aktif di bangsal ${userSession.ward}.`}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedPatients.map(patient => {
              const isKritis = patient.status === 'kritis';
              const isPerhatian = patient.status === 'perhatian';

              return (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatientDetail(patient)}
                  role="button"
                  tabIndex={0}
                  className={`bg-white rounded-2xl p-3.5 border shadow-xs hover:border-blue-400 active:scale-[0.99] transition-all cursor-pointer space-y-2 ${
                    isKritis
                      ? 'border-rose-300 ring-1 ring-rose-200/60'
                      : isPerhatian
                      ? 'border-amber-300 ring-1 ring-amber-200/60'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isKritis
                              ? 'bg-rose-500 animate-pulse'
                              : isPerhatian
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {patient.name}
                        </h4>
                        <span className="text-xs text-slate-500 shrink-0">
                          ({patient.gender}, {patient.age} th)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                          {patient.bed}
                        </span>
                        <span className="font-mono">{patient.rmNumber}</span>
                        <span>·</span>
                        <span className="truncate">{patient.room}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isKritis
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : isPerhatian
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {patient.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                    <div className="truncate">
                      <strong>Dx:</strong> {patient.medicalDiagnosis}
                    </div>
                    <div className="text-[11px] text-slate-500 shrink-0">
                      DPJP: {patient.dpjps?.[0]?.split(',')[0] || patient.dpjp?.split(',')[0] || '-'}
                    </div>
                  </div>

                  {/* TTV Snapshot & Quick Input Button */}
                  <div className="flex items-center justify-between pt-0.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-600 truncate">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">
                        {patient.bpSystolic ? `${patient.bpSystolic}/${patient.bpDiastolic} mmHg · ${patient.heartRate}x/m · ${patient.temperature}°C · ${patient.spo2}%` : 'Belum ada TTV hari ini'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onOpenAddVital && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onOpenAddVital(patient);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 flex items-center gap-1 active:scale-95 transition-all"
                          title="Catat TTV terbaru untuk pasien ini"
                        >
                          <span>+ TTV</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onSelectPatientDetail(patient);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 flex items-center gap-0.5 active:scale-95 transition-all"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Hospital Identity Banner & Splash Reopen */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-14 h-14 rounded-full bg-white p-1 shadow-lg ring-2 ring-emerald-400/40 shrink-0 flex items-center justify-center">
            <img
              src="/logo-parikesit.svg"
              alt="Logo RSUD AM Parikesit"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-black text-white tracking-tight text-sm sm:text-base">
                ETAM CARE · RSUD AM PARIKESIT
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold uppercase">
                {userSession.ward}
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Sistem Manajemen Asuhan Keperawatan Terpadu · RSUD AM Parikesit &amp; UMKT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenSplashScreen && (
            <button
              onClick={onOpenSplashScreen}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-cyan-200 border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="Buka kembali layar pembuka"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Buka Layar Pembuka</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
