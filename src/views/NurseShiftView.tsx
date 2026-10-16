import React, { useState } from 'react';
import {
  UserCheck2,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  X,
  Users,
  CheckCircle2,
  Check,
  ChevronRight,
  Bed,
  Plus,
  HeartPulse,
  UserMinus,
  ShieldCheck,
} from 'lucide-react';
import { Nurse, ShiftType, UserRole, Patient, Ward } from '../types';
import { UserSession } from '../services/storageService';

export interface NurseShiftViewProps {
  nurses: Nurse[];
  patients?: Patient[];
  wards?: Ward[];
  userSession: UserSession;
  onUpdateNurseShift?: (nurseId: string, newShift: ShiftType) => void;
  onToggleNurseActive?: (nurseId: string) => void;
  onAssignPatientsToNurse?: (nurseName: string, patientIds: string[]) => void;
  onUnassignPatientFromNurse?: (patientId: string, nurseName?: string) => void;
  onSelectPatientDetail?: (patient: Patient) => void;
  onOpenAddNurse: (defaultShift?: ShiftType, defaultWard?: string) => void;
  onEditNurse: (nurse: Nurse) => void;
  onDeleteNurse: (nurse: Nurse) => void;
  onDeleteMultipleNurses?: (nurseIds: string[]) => void;
  onClearDemoNurses?: () => void;
  onSelectNurseAndShift?: (nurse: Nurse, shift: ShiftType) => void;
  onToggleNurseDuty?: (nurse: Nurse) => void;
  onSetPrimaryNurse?: (nurse: Nurse) => void;
  onSetAllShiftDuty?: (shift: ShiftType, dutyState: boolean) => void;
}

export const NurseShiftView: React.FC<NurseShiftViewProps> = ({
  nurses,
  patients = [],
  wards = [],
  userSession,
  onUpdateNurseShift,
  onToggleNurseActive,
  onAssignPatientsToNurse,
  onUnassignPatientFromNurse,
  onSelectPatientDetail,
  onOpenAddNurse,
  onEditNurse,
  onDeleteNurse,
  onDeleteMultipleNurses,
  onClearDemoNurses,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('semua');

  // State for Managing Assigned Patients Modal
  const [assigningNurse, setAssigningNurse] = useState<Nurse | null>(null);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);

  // State for Confirming Unassigning Patient from Nurse
  const [unassignTarget, setUnassignTarget] = useState<{
    patient: Patient;
    nurse: Nurse;
  } | null>(null);

  const handleConfirmUnassign = () => {
    if (!unassignTarget) return;
    if (onUnassignPatientFromNurse) {
      onUnassignPatientFromNurse(unassignTarget.patient.id, unassignTarget.nurse.name);
    } else if (onAssignPatientsToNurse) {
      const remainingIds = activePatients
        .filter(p => p.nurseInCharge === unassignTarget.nurse.name && p.id !== unassignTarget.patient.id)
        .map(p => p.id);
      onAssignPatientsToNurse(unassignTarget.nurse.name, remainingIds);
    }
    setUnassignTarget(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Kepala Ruangan (Karu)':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Ketua Tim (Katim)':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PJ Shift':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Active in-patients
  const activePatients = patients.filter(p => p.lifeStatus === 'aktif');

  // Get patients assigned to a specific nurse
  const getPatientsForNurse = (nurseName: string) => {
    return activePatients.filter(p => p.nurseInCharge === nurseName);
  };

  // Open the assign modal for a specific nurse
  const handleOpenAssignModal = (nurse: Nurse) => {
    setAssigningNurse(nurse);
    const currentAssigned = activePatients
      .filter(p => p.nurseInCharge === nurse.name)
      .map(p => p.id);
    setSelectedPatientIds(currentAssigned);
  };

  // Toggle patient selection in assign modal
  const handleTogglePatientAssignment = (patientId: string) => {
    setSelectedPatientIds(prev =>
      prev.includes(patientId)
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  // Save patient assignment
  const handleSavePatientAssignment = () => {
    if (!assigningNurse || !onAssignPatientsToNurse) {
      setAssigningNurse(null);
      return;
    }
    onAssignPatientsToNurse(assigningNurse.name, selectedPatientIds);
    setAssigningNurse(null);
  };

  // Ward options
  const availableWards = Array.from(
    new Set([
      ...(wards && wards.length > 0 ? wards.map(w => w.name) : ['Ruang Teratai', 'Ruang Melati', 'Ruang Mawar', 'Ruang ICU']),
      ...nurses.map(n => n.ward).filter(Boolean),
    ])
  );

  // Nurse rank hierarchy helper (Kepala Ruangan > Ketua Tim > PJ Shift > Perawat Pelaksana)
  const getRoleRank = (role: string): number => {
    const r = (role || '').toLowerCase();
    if (r.includes('kepala ruangan') || r.includes('karu')) return 1;
    if (r.includes('ketua tim') || r.includes('katim') || r.includes('ppja')) return 2;
    if (r.includes('pj shift') || r.includes('penanggung jawab')) return 3;
    if (r.includes('pelaksana')) return 4;
    return 5;
  };

  // Filter & sort nurses by search, ward, and rank hierarchy (highest position first)
  const filteredNurses = nurses
    .filter(n => {
      const matchesSearch =
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.ward || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedWardFilter !== 'semua' && n.ward !== selectedWardFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const rankA = getRoleRank(a.role);
      const rankB = getRoleRank(b.role);
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

  // Counts
  const onDutyCount = nurses.filter(n => n.isActive !== false).length;

  const demoNames = new Set([
    'ns. ratna dewi, s.kep',
    'ns. budi santoso, s.kep',
    'ns. siti rahmah, s.kep',
    'ns. dimas pratama, s.kep',
    'ns. hj. mariana, s.kep., m.kep',
  ]);
  const hasDemoNurses = nurses.some(n => demoNames.has((n.name || '').trim().toLowerCase()));
  const demoNurseCount = nurses.filter(n => demoNames.has((n.name || '').trim().toLowerCase())).length;

  return (
    <div className="space-y-4 pb-20 md:pb-6 animate-in fade-in duration-200">
      
      {/* 1. HEADER: SIMPEL, FOKUS SIAPA SAJA PERAWAT YANG BERTUGAS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  Daftar Tenaga Perawat
                </h2>
                <span className="text-xs font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {nurses.length} Tenaga Perawat
                </span>
                {!hasDemoNurses && nurses.length > 0 && (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Roster Asli Ruangan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar tenaga perawat, penugasan ruangan, dan pasien yang diasuh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasDemoNurses && onClearDemoNurses && (
              <button
                type="button"
                onClick={onClearDemoNurses}
                className="min-h-[44px] px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                title="Hapus semua perawat contoh bawaan"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Bersihkan Perawat Bawaan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                onOpenAddNurse(
                  undefined,
                  selectedWardFilter !== 'semua' ? selectedWardFilter : undefined
                )
              }
              className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Perawat Baru</span>
            </button>
          </div>
        </div>

        {/* Banner Edukasi / Konfirmasi jika masih ada data contoh */}
        {hasDemoNurses && onClearDemoNurses && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-black text-amber-950">
                  Data Perawat Contoh Aktif ({demoNurseCount} orang):
                </span>{' '}
                <span className="text-amber-800 text-[11px] sm:text-xs">
                  Nama contoh (seperti Ns. Ratna Dewi, dll) dapat dibersihkan permanen agar hanya perawat asli ruangan Anda yang tersimpan.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClearDemoNurses}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 self-end sm:self-auto cursor-pointer active:scale-95 shadow-2xs"
            >
              Hapus Data Contoh
            </button>
          </div>
        )}

        {/* Filter Ruangan / Bangsal Sesuai Permintaan User */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1">Ruangan:</span>
          <button
            type="button"
            onClick={() => setSelectedWardFilter('semua')}
            className={`min-h-[32px] px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
              selectedWardFilter === 'semua'
                ? 'bg-slate-800 text-white font-black shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Ruangan
          </button>
          {availableWards.map(wName => {
            const countInWard = nurses.filter(n => n.ward === wName).length;
            const isSelected = selectedWardFilter === wName;
            return (
              <button
                key={wName}
                type="button"
                onClick={() => setSelectedWardFilter(wName)}
                className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-black shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{wName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {countInWard}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PENCARIAN CEPAT */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari nama perawat..."
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. DAFTAR PERAWAT: FOKUS PADA NAMA, PASIEN YANG DIPEGANG, DAN SEDANG DINAS APA */}
      <div className="space-y-3">
        {filteredNurses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <p className="font-bold text-slate-800 text-sm">Tidak ada perawat ditemukan</p>
              <p className="text-slate-500 mt-0.5">
                Silakan tambah perawat baru atau ganti filter pencarian.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onOpenAddNurse(
                  undefined,
                  selectedWardFilter !== 'semua' ? selectedWardFilter : undefined
                )
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Perawat Sekarang</span>
            </button>
          </div>
        ) : (
          filteredNurses.map(nurse => {
            const heldPatients = getPatientsForNurse(nurse.name);

            return (
              <div
                key={nurse.id}
                className="bg-white rounded-2xl p-4 sm:p-4.5 border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-300 transition-all"
              >
                {/* BARIS 1: NAMA PERAWAT & STATUS DINAS & AKSI EDIT/HAPUS */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      <UserCheck2 className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                          {nurse.name}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(nurse.role)}`}>
                          {nurse.role}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Staff Aktif</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Penugasan: <strong className="text-slate-700">{nurse.ward}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Tombol Edit & Hapus */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditNurse(nurse)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Edit Data Perawat"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNurse(nurse)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Hapus Perawat ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* PASIEN YANG DIPEGANG OLEH PERAWAT INI */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Bed className="w-4 h-4 text-blue-600" />
                      <span>Pasien yang Dipegang:</span>
                      <span className="text-xs font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {heldPatients.length} Pasien
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(nurse)}
                      className="min-h-[34px] px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1 border border-blue-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Atur Pasien yang Dipegang</span>
                    </button>
                  </div>

                  {/* List of Held Patients */}
                  {heldPatients.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs flex items-center justify-between">
                      <span className="italic">
                        Belum ada pasien yang ditugaskan ke {nurse.name.split(' ')[0]}.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(nurse)}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Pilih Pasien Sekarang
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {heldPatients.map(pt => (
                        <div
                          key={pt.id}
                          onClick={() => onSelectPatientDetail && onSelectPatientDetail(pt)}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/50 hover:border-blue-300 transition-all flex items-center justify-between gap-2 cursor-pointer shadow-2xs group"
                          title="Klik untuk melihat rekam medis lengkap pasien"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-1.5 py-0.2 rounded">
                                {pt.bed}
                              </span>
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {pt.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {pt.medicalDiagnosis}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                pt.status === 'kritis'
                                  ? 'bg-rose-100 text-rose-800'
                                  : pt.status === 'perhatian'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {pt.status}
                            </span>

                            {/* Tombol Lepas Pasien dari Asuhan Perawat (Rekam Medis TIDAK Terhapus) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUnassignTarget({ patient: pt, nurse });
                              }}
                              className="min-h-[26px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title="Lepas pasien dari perawat ini (rekam medis pasien tetap aman tersimpan)"
                            >
                              <UserMinus className="w-3 h-3 text-rose-600" />
                              <span>Lepas</span>
                            </button>

                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ATUR PASIEN YANG DIPEGANG OLEH PERAWAT */}
      {assigningNurse && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in slide-in-from-bottom-6 duration-200">
            {/* Header */}
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white leading-tight">
                  Atur Pasien Kelolaan
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Pilih pasien yang dipegang oleh <strong>{assigningNurse.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningNurse(null)}
                className="min-h-[44px] min-w-[44px] -mr-2 -my-2 flex items-center justify-center text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-4 overflow-y-auto space-y-2 text-xs flex-1">
              {/* Informative Safety Banner */}
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Catatan:</strong> Menghapus centang pada pasien akan melepasnya dari daftar yang dipegang perawat ini. <strong>Seluruh data rekam medis pasien tetap aman dan tidak terhapus.</strong>
                </p>
              </div>

              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-700">
                  Daftar Pasien Rawat Inap Aktif ({activePatients.length})
                </span>
                <div className="flex items-center gap-2">
                  {selectedPatientIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPatientIds([])}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                    >
                      Lepas Semua
                    </button>
                  )}
                  <span className="text-blue-600 font-bold">
                    {selectedPatientIds.length} pasien dipilih
                  </span>
                </div>
              </div>

              {activePatients.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  Tidak ada pasien rawat inap yang aktif saat ini.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activePatients.map(pt => {
                    const isSelected = selectedPatientIds.includes(pt.id);
                    const isHeldByOther = pt.nurseInCharge && pt.nurseInCharge !== assigningNurse.name;

                    return (
                      <label
                        key={pt.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTogglePatientAssignment(pt.id)}
                            className="w-4.5 h-4.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-blue-700 text-xs bg-white px-1.5 py-0.2 rounded border border-slate-200">
                                {pt.bed}
                              </span>
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {pt.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({pt.rmNumber})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {pt.medicalDiagnosis}
                            </p>
                            {isHeldByOther && (
                              <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                                * Saat ini dipegang oleh: {pt.nurseInCharge}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize shrink-0 ${
                            pt.status === 'kritis'
                              ? 'bg-rose-100 text-rose-800'
                              : pt.status === 'perhatian'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {pt.status}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedPatientIds([])}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold border border-slate-300 hover:border-rose-300 cursor-pointer flex items-center gap-1.5 transition-all"
                title="Lepas semua pasien dari perawat ini (rekam medis pasien tetap aman tersimpan)"
              >
                <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                <span>Lepas Semua Pasien</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setAssigningNurse(null)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePatientAssignment}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pasien Kelolaan ({selectedPatientIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI: LEPAS PASIEN DARI ASUHAN PERAWAT (REKAM MEDIS PASIEN AMAN TERSIMPAN) */}
      {unassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <UserMinus className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base text-white">
                  Lepas Pasien dari Asuhan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUnassignTarget(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs sm:text-sm">
              <p className="text-slate-700 leading-relaxed">
                Apakah Anda yakin ingin melepas pasien ini dari asuhan perawat <strong>{unassignTarget.nurse.name}</strong>?
              </p>

              {/* Patient Card Preview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">
                    {unassignTarget.patient.bed}
                  </span>
                  <strong className="text-slate-900 text-sm">{unassignTarget.patient.name}</strong>
                  <span className="text-slate-500 text-[11px]">({unassignTarget.patient.rmNumber})</span>
                </div>
                <p className="text-slate-600 text-[11px] truncate">
                  Diagnosis: {unassignTarget.patient.medicalDiagnosis}
                </p>
              </div>

              {/* Informative Safety Guarantee */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block text-emerald-900 font-bold">
                    Rekam Medis Pasien Tetap Aman &amp; Tersimpan
                  </strong>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Tindakan ini <strong>TIDAK MENGHAPUS</strong> data rekam medis pasien. Riwayat tanda vital (TTV), tindakan asuhan, catatan SOAP, dan terapi obat pasien tetap tersimpan lengkap di sistem rumah sakit.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUnassignTarget(null)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnassign}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <UserMinus className="w-4 h-4" />
                <span>Ya, Lepas Pasien</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
