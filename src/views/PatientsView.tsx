import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  X,
  ChevronRight,
  Stethoscope,
  HeartPulse,
  Clock,
  Calendar,
} from 'lucide-react';
import { Patient, PatientCondition, PatientLifeStatus, Ward, DoctorDPJP, VitalSign, calculateHospitalDay } from '../types';

interface PatientsViewProps {
  patients: Patient[];
  wards: Ward[];
  doctors: DoctorDPJP[];
  vitals: VitalSign[];
  onOpenAddModal: () => void;
  onOpenAddVital?: (patient: Patient) => void;
  onSelectPatientDetail: (patient: Patient) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  wards,
  doctors,
  vitals,
  onOpenAddModal,
  onOpenAddVital,
  onSelectPatientDetail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterWard, setFilterWard] = useState<string>('all');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterLifeStatus, setFilterLifeStatus] = useState<string>('aktif'); // Default to active patients

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // 1. Search Query: name, RM, or bed
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        patient.name.toLowerCase().includes(query) ||
        patient.rmNumber.toLowerCase().includes(query) ||
        patient.bed.toLowerCase().includes(query) ||
        patient.medicalDiagnosis.toLowerCase().includes(query);

      // 2. Filter Life Status (Aktif, Pulang, Pindah, Meninggal, or Semua)
      const matchesLifeStatus =
        filterLifeStatus === 'all' || patient.lifeStatus === filterLifeStatus;

      // 3. Filter Condition (Stabil, Perhatian, Kritis)
      const matchesCondition =
        filterCondition === 'all' ||
        (filterCondition === 'prioritas'
          ? patient.status === 'kritis' || patient.status === 'perhatian'
          : patient.status === filterCondition);

      // 4. Filter Ward
      const matchesWard =
        filterWard === 'all' || patient.room === filterWard;

      // 5. Filter Doctor DPJP
      const matchesDoctor =
        filterDoctor === 'all' ||
        (patient.dpjps && patient.dpjps.includes(filterDoctor)) ||
        patient.dpjp === filterDoctor;

      return (
        matchesSearch &&
        matchesLifeStatus &&
        matchesCondition &&
        matchesWard &&
        matchesDoctor
      );
    }).sort((a, b) => {
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
  }, [patients, searchQuery, filterLifeStatus, filterCondition, filterWard, filterDoctor]);

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
          <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Kritis
          </span>
        );
      case 'perhatian':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Perhatian
          </span>
        );
      case 'stabil':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Stabil
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 pb-20 md:pb-6 animate-in fade-in duration-200">
      
      {/* Search Bar + Tambah Pasien Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, No. RM, atau nomor bed..."
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onOpenAddModal}
          className="min-h-[44px] px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pasien</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-xs">
        {/* Row 1: Status Tab Switches */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setFilterLifeStatus('aktif')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors min-h-[36px] ${
              filterLifeStatus === 'aktif'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pasien Aktif ({patients.filter(p => p.lifeStatus === 'aktif').length})
          </button>
          <button
            onClick={() => setFilterCondition(filterCondition === 'prioritas' ? 'all' : 'prioritas')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors min-h-[36px] ${
              filterCondition === 'prioritas'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Prioritas
          </button>
          <button
            onClick={() => setFilterLifeStatus('pulang')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors min-h-[36px] ${
              filterLifeStatus === 'pulang'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pulang ({patients.filter(p => p.lifeStatus === 'pulang').length})
          </button>
          <button
            onClick={() => setFilterLifeStatus('pindah')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors min-h-[36px] ${
              filterLifeStatus === 'pindah'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pindah ({patients.filter(p => p.lifeStatus === 'pindah').length})
          </button>
          <button
            onClick={() => setFilterLifeStatus('meninggal')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors min-h-[36px] ${
              filterLifeStatus === 'meninggal'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Meninggal ({patients.filter(p => p.lifeStatus === 'meninggal').length})
          </button>
          <button
            onClick={() => setFilterLifeStatus('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors min-h-[36px] ${
              filterLifeStatus === 'all'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({patients.length})
          </button>
        </div>

        {/* Row 2: Select Bangsal & DPJP */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">
              Filter Bangsal
            </label>
            <select
              value={filterWard}
              onChange={e => setFilterWard(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="all">Semua Bangsal</option>
              {wards.map(w => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">
              Filter Dokter DPJP
            </label>
            <select
              value={filterDoctor}
              onChange={e => setFilterDoctor(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="all">Semua Dokter DPJP</option>
              {doctors.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name.split(',')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Patient Cards List */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
          <p className="text-slate-800 font-bold text-sm">Tidak ada pasien yang sesuai filter</p>
          <p className="text-slate-500 text-xs">
            Coba sesuaikan pencarian atau ganti filter bangsal / dokter / status di atas.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCondition('all');
              setFilterWard('all');
              setFilterDoctor('all');
              setFilterLifeStatus('aktif');
            }}
            className="text-xs font-bold text-blue-600 hover:underline pt-2"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPatients.map(patient => {
            const doctorsText =
              patient.dpjps && patient.dpjps.length > 0
                ? patient.dpjps.length === 1
                  ? patient.dpjps[0]
                  : `${patient.dpjps[0].split(',')[0]} (+${patient.dpjps.length - 1} dr)`
                : patient.dpjp || '-';

            const hospitalDay = calculateHospitalDay(patient.admissionDate);

            // Latest vital
            const ptVitals = vitals
              .filter(v => v.patientId === patient.id)
              .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
            const latestV = ptVitals[0];

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatientDetail(patient)}
                role="button"
                tabIndex={0}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-blue-400 active:scale-[0.99] transition-all cursor-pointer space-y-2.5"
              >
                {/* Card Header: Name + RM + Bed + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {patient.name}
                      </h3>
                      <span className="text-xs text-slate-500 shrink-0 font-medium">
                        ({patient.gender}, {patient.age} th)
                      </span>
                      {/* Hari Perawatan */}
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.2 rounded-full font-mono">
                        {hospitalDay.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">
                        {patient.bed}
                      </span>
                      <span className="font-mono font-medium">{patient.rmNumber}</span>
                      <span>·</span>
                      <span className="truncate">{patient.room}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {getStatusBadge(patient.status, patient.lifeStatus)}
                  </div>
                </div>

                {/* Medical Diagnosis & DPJP */}
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs space-y-1">
                  <div className="text-slate-800 line-clamp-2">
                    <strong className="text-slate-900">Dx:</strong> {patient.medicalDiagnosis}
                  </div>
                  <div className="text-slate-600 text-[11px] truncate flex items-center gap-1.5 pt-0.5">
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>DPJP:</strong> {doctorsText}</span>
                  </div>
                </div>

                {/* TTV Snapshot and View Detail Link */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <div className="flex items-center gap-1 text-slate-600 truncate max-w-[190px] sm:max-w-xs">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">
                      {latestV
                        ? `TD: ${latestV.bpSystolic}/${latestV.bpDiastolic} · N: ${latestV.heartRate} · S: ${latestV.temperature}°C${latestV.gds ? ` · GDS: ${latestV.gds}` : ''}`
                        : patient.bpSystolic
                        ? `TD: ${patient.bpSystolic}/${patient.bpDiastolic} · N: ${patient.heartRate}${patient.gds ? ` · GDS: ${patient.gds}` : ''}`
                        : 'TTV belum dicatat'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
                        <HeartPulse className="w-3 h-3 text-rose-600" />
                        <span>+ TTV</span>
                      </button>
                    )}

                    <div className="text-blue-600 font-bold flex items-center gap-0.5">
                      <span>Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
