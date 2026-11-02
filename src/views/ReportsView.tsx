import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Users,
  Building2,
  Stethoscope,
  Clock,
  ArrowRightLeft,
  Home,
  Skull,
  FileCheck,
  Droplet,
  CheckCircle2,
} from 'lucide-react';
import {
  Patient,
  SBARHandover,
  NursingAction,
  SOAPNote,
  VitalSign,
  Ward,
  DoctorDPJP,
  PatientLifeStatus,
  GdsRecord,
} from '../types';
import { UserSession } from '../services/storageService';
import { exportToCSV, triggerPrintReport } from '../utils/exportUtils';

interface ReportsViewProps {
  patients: Patient[];
  handovers: SBARHandover[];
  actions: NursingAction[];
  soaps: SOAPNote[];
  vitals: VitalSign[];
  gdsRecords?: GdsRecord[];
  wards: Ward[];
  doctors: DoctorDPJP[];
  userSession: UserSession;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  patients,
  handovers,
  actions,
  soaps,
  vitals,
  gdsRecords = [],
  wards,
  doctors,
  userSession,
  onShowToast,
}) => {
  const [reportType, setReportType] = useState<'harian' | 'bulanan'>('harian');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedLifeStatus, setSelectedLifeStatus] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');

  // Filter patients based on criteria
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      // Date filter based on admissionDate or dischargeDate
      const dateTarget = p.dischargeDate || p.admissionDate;
      const matchesPeriod =
        reportType === 'harian'
          ? !selectedDate || dateTarget <= selectedDate
          : !selectedMonth || dateTarget.startsWith(selectedMonth);

      const matchesWard = selectedWard === 'all' || p.room === selectedWard;
      const matchesDoctor =
        selectedDoctor === 'all' ||
        (p.dpjps && p.dpjps.includes(selectedDoctor)) ||
        p.dpjp === selectedDoctor;
      const matchesStatus =
        selectedLifeStatus === 'all' || p.lifeStatus === selectedLifeStatus;

      return matchesPeriod && matchesWard && matchesDoctor && matchesStatus;
    });
  }, [patients, reportType, selectedDate, selectedMonth, selectedWard, selectedDoctor, selectedLifeStatus]);

  // Census counts
  const totalAktif = filteredPatients.filter(p => p.lifeStatus === 'aktif').length;
  const totalPulang = filteredPatients.filter(p => p.lifeStatus === 'pulang').length;
  const totalPindah = filteredPatients.filter(p => p.lifeStatus === 'pindah').length;
  const totalMeninggal = filteredPatients.filter(p => p.lifeStatus === 'meninggal').length;
  const totalMasukPeriode = filteredPatients.filter(p =>
    reportType === 'harian'
      ? p.admissionDate === selectedDate
      : p.admissionDate.startsWith(selectedMonth)
  ).length;

  // Breakdown by Ward
  const wardBreakdown = useMemo(() => {
    return wards.map(w => {
      const pts = filteredPatients.filter(p => p.room === w.name);
      return {
        name: w.name,
        total: pts.length,
        aktif: pts.filter(p => p.lifeStatus === 'aktif').length,
      };
    });
  }, [wards, filteredPatients]);

  // Breakdown by DPJP
  const doctorBreakdown = useMemo(() => {
    return doctors.map(d => {
      const pts = filteredPatients.filter(
        p => (p.dpjps && p.dpjps.includes(d.name)) || p.dpjp === d.name
      );
      return {
        name: d.name,
        specialization: d.specialization,
        total: pts.length,
        aktif: pts.filter(p => p.lifeStatus === 'aktif').length,
      };
    });
  }, [doctors, filteredPatients]);

  // Synthesize complete sugar records matching filtered patients
  const filteredPatientIds = useMemo(
    () => new Set(filteredPatients.map(p => p.id)),
    [filteredPatients]
  );

  const sugarReportList = useMemo(() => {
    const list: Array<{
      id: string;
      patientId: string;
      patientName: string;
      rmNumber: string;
      bed: string;
      room: string;
      timestamp: string;
      gds: number;
      sugarType: string;
      nurseName: string;
      notes?: string;
    }> = [];

    const seen = new Set<string>();

    for (const r of (gdsRecords || []).filter(r => filteredPatientIds.has(r.patientId))) {
      const pt = patients.find(p => p.id === r.patientId);
      const key = `${r.patientId}-${r.timestamp}-${r.gds}`;
      seen.add(key);
      list.push({
        id: r.id,
        patientId: r.patientId,
        patientName: pt?.name || 'Pasien',
        rmNumber: pt?.rmNumber || '-',
        bed: pt?.bed || '-',
        room: pt?.room || '-',
        timestamp: r.timestamp,
        gds: r.gds,
        sugarType: r.sugarType || r.condition || 'GDS (Sewaktu)',
        nurseName: r.nurseName,
        notes: r.notes,
      });
    }

    // Also include vitals with gds for filtered patients
    for (const v of vitals.filter(v => filteredPatientIds.has(v.patientId) && v.gds !== undefined && v.gds !== null && v.gds > 0)) {
      const key = `${v.patientId}-${v.timestamp}-${v.gds}`;
      if (!seen.has(key)) {
        seen.add(key);
        const pt = patients.find(p => p.id === v.patientId);
        list.push({
          id: `vital-${v.id}`,
          patientId: v.patientId,
          patientName: pt?.name || 'Pasien',
          rmNumber: pt?.rmNumber || '-',
          bed: pt?.bed || '-',
          room: pt?.room || '-',
          timestamp: v.timestamp,
          gds: v.gds!,
          sugarType: 'GDS (Sewaktu)',
          nurseName: v.nurseName,
          notes: v.notes ? `Pemeriksaan TTV: ${v.notes}` : 'Input TTV',
        });
      }
    }

    return list.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
  }, [gdsRecords, vitals, filteredPatientIds, patients]);

  const handleExportSugarCSV = () => {
    try {
      const filename = `ETAM_CARE_Rekapan_Gula_Darah_${
        reportType === 'harian' ? selectedDate : selectedMonth
      }`;

      const headers = [
        'Waktu Pemeriksaan',
        'No. RM',
        'Nama Pasien',
        'Bangsal',
        'Bed',
        'Jenis Pemeriksaan',
        'Kadar Gula Darah (mg/dL)',
        'Interpretasi Klinis',
        'Perawat Pemeriksa',
        'Catatan Klinis',
      ];

      const rows = sugarReportList.map(s => {
        let interp = 'Normal';
        if (s.gds < 70) interp = 'Hipoglikemia (<70)';
        else if (s.sugarType.toLowerCase().includes('puasa')) {
          if (s.gds <= 99) interp = 'Normal Puasa (70-99)';
          else if (s.gds <= 125) interp = 'Pra-Diabetes (100-125)';
          else interp = 'Hiperglikemia Puasa (≥126)';
        } else {
          if (s.gds <= 140) interp = 'Normal (70-140)';
          else if (s.gds < 200) interp = 'Meningkat (141-199)';
          else interp = 'Hiperglikemia (≥200)';
        }

        return [
          s.timestamp,
          s.rmNumber,
          s.patientName,
          s.room,
          s.bed,
          s.sugarType,
          s.gds,
          interp,
          s.nurseName,
          s.notes || '-',
        ];
      });

      exportToCSV(filename, headers, rows);
      onShowToast('Rekapan gula darah Excel (CSV) berhasil diunduh.', 'success');
    } catch {
      onShowToast('Gagal mengekspor rekapan gula darah ke CSV.', 'error');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const filename = `ETAM_CARE_Sensus_Laporan_${
        reportType === 'harian' ? selectedDate : selectedMonth
      }`;

      const headers = [
        'No. RM',
        'Nama Pasien',
        'Gender',
        'Usia',
        'Bangsal',
        'Bed',
        'Tanggal Masuk',
        'Diagnosis Medis',
        'Dokter DPJP',
        'Kondisi Klinis',
        'Status Rawat',
        'Jaminan Kesehatan',
        'Keterangan Status',
      ];

      const rows = filteredPatients.map(p => {
        const dpjpNames = p.dpjps && p.dpjps.length > 0 ? p.dpjps.join('; ') : p.dpjp || '-';
        const statusNote =
          p.lifeStatus === 'pulang'
            ? `Pulang: ${p.dischargeDate || ''} - ${p.dischargeNotes || ''}`
            : p.lifeStatus === 'pindah'
            ? `Pindah ke ${p.transferWard || ''}: ${p.transferDate || ''} - ${p.transferNotes || ''}`
            : p.lifeStatus === 'meninggal'
            ? `Meninggal: ${p.deceasedDate || ''} - ${p.deceasedNotes || ''}`
            : 'Dalam Perawatan Aktif';

        return [
          p.rmNumber,
          p.name,
          p.gender,
          p.age,
          p.room,
          p.bed,
          p.admissionDate,
          p.medicalDiagnosis,
          dpjpNames,
          p.status.toUpperCase(),
          p.lifeStatus.toUpperCase(),
          p.insurance,
          statusNote,
        ];
      });

      exportToCSV(filename, headers, rows);
      onShowToast('Laporan sensus Excel (CSV) berhasil diunduh.', 'success');
    } catch {
      onShowToast('Gagal mengekspor laporan ke Excel.', 'error');
    }
  };

  // Print PDF
  const handlePrintPDF = () => {
    try {
      const periodLabel =
        reportType === 'harian'
          ? `Tanggal: ${selectedDate}`
          : `Bulan: ${selectedMonth}`;

      const shiftLabel =
        selectedShift === 'all'
          ? 'Semua Shift'
          : `Shift ${selectedShift.toUpperCase()}`;

      triggerPrintReport(
        `Laporan Sensus & Pelayanan Keperawatan (${periodLabel})`,
        {
          period: periodLabel,
          shift: shiftLabel,
          ward: selectedWard === 'all' ? userSession.ward : selectedWard,
          nurse: userSession.nurseName,
        },
        filteredPatients,
        handovers,
        actions,
        vitals,
        soaps
      );
      onShowToast('Membuka pratinjau cetak PDF...', 'success');
    } catch {
      onShowToast('Gagal memproses cetak PDF.', 'error');
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 animate-in fade-in duration-200">
      
      {/* 1. Filter Panel */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-bold text-slate-800 text-sm">Parameter Laporan & Sensus</h3>

          {/* Toggle Harian / Bulanan */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setReportType('harian')}
              className={`px-3 py-1 rounded-md font-bold text-[11px] transition-colors ${
                reportType === 'harian'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setReportType('bulanan')}
              className={`px-3 py-1 rounded-md font-bold text-[11px] transition-colors ${
                reportType === 'bulanan'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Periode Picker */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {reportType === 'harian' ? 'Pilih Tanggal' : 'Pilih Bulan'}
            </label>
            {reportType === 'harian' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium"
              />
            )}
          </div>

          {/* Filter Bangsal */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Bangsal</label>
            <select
              value={selectedWard}
              onChange={e => setSelectedWard(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium"
            >
              <option value="all">Semua Bangsal</option>
              {wards.map(w => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Status Rawat */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Rawat</label>
            <select
              value={selectedLifeStatus}
              onChange={e => setSelectedLifeStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Pasien Aktif</option>
              <option value="pulang">Pasien Pulang</option>
              <option value="pindah">Pasien Pindah</option>
              <option value="meninggal">Pasien Meninggal</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Jumlah Pasien Berdasarkan Kategori Sensus (5 Metric Cards Ringkas) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-0.5">
            <span className="text-[11px] font-bold">Pasien Aktif</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black text-blue-600 tabular-nums">{totalAktif}</div>
          <span className="text-[10px] text-slate-400">Dirawat di ruangan</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-indigo-100 shadow-xs">
          <div className="flex items-center justify-between text-indigo-700 mb-0.5">
            <span className="text-[11px] font-bold">Pasien Masuk</span>
            <FileCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black text-indigo-600 tabular-nums">{totalMasukPeriode}</div>
          <span className="text-[10px] text-slate-400">Penerimaan baru</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-0.5">
            <span className="text-[11px] font-bold">Pasien Pulang</span>
            <Home className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black text-emerald-600 tabular-nums">{totalPulang}</div>
          <span className="text-[10px] text-slate-400">KRS sembuh/rawat jalan</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-0.5">
            <span className="text-[11px] font-bold">Pasien Pindah</span>
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black text-amber-600 tabular-nums">{totalPindah}</div>
          <span className="text-[10px] text-slate-400">Alih bangsal / ICU</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-700 mb-0.5">
            <span className="text-[11px] font-bold">Pasien Meninggal</span>
            <Skull className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-black text-slate-800 tabular-nums">{totalMeninggal}</div>
          <span className="text-[10px] text-slate-400">Dokumentasi mortalitas</span>
        </div>
      </div>

      {/* 3. Export Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExportExcel}
          className="min-h-[46px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Unduh Sensus Excel (CSV)</span>
        </button>

        <button
          onClick={handlePrintPDF}
          className="min-h-[46px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Unduh PDF</span>
        </button>
      </div>

      {/* 4. Rekap Pasien Berdasarkan Bangsal & DPJP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Distribusi Bangsal */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Sensus Berdasarkan Bangsal</span>
            </h4>
          </div>
          <div className="space-y-1.5">
            {wardBreakdown.map(wb => (
              <div key={wb.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">{wb.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-[11px]">Total: {wb.total}</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    {wb.aktif} Aktif
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Riwayat Pasien Pulang, Pindah & Meninggal */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Pasien Pulang, Pindah &amp; Meninggal</span>
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {patients.filter(p => p.lifeStatus !== 'aktif').length} Pasien
            </span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {patients.filter(p => p.lifeStatus !== 'aktif').length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-xs">
                Belum ada riwayat pasien pulang, pindah, atau meninggal.
              </div>
            ) : (
              patients
                .filter(p => p.lifeStatus !== 'aktif')
                .map(p => {
                  const statusColor =
                    p.lifeStatus === 'pulang'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : p.lifeStatus === 'pindah'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-800 text-white border-slate-700';

                  const dateInfo =
                    p.lifeStatus === 'pulang'
                      ? `${p.dischargeDate || '-'} ${p.dischargeTime || ''}`
                      : p.lifeStatus === 'pindah'
                      ? `${p.transferDate || '-'} ${p.transferTime || ''} (Ke: ${p.transferWard || '-'})`
                      : `${p.deceasedDate || '-'} ${p.deceasedTime || ''}`;

                  const notesInfo =
                    p.dischargeNotes || p.transferNotes || p.deceasedNotes;

                  return (
                    <div
                      key={p.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-bold text-slate-900 truncate">
                          {p.name} <span className="font-mono text-slate-500 font-normal">({p.rmNumber})</span>
                        </div>
                        <span
                          className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 border ${statusColor}`}
                        >
                          {p.lifeStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                        <span>{p.room} · {p.bed}</span>
                        <span>{dateInfo}</span>
                      </div>
                      {notesInfo && (
                        <div className="text-[10px] text-slate-600 bg-white p-1 rounded border border-slate-200 truncate">
                          Catatan: {notesInfo}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* 5. Daftar Pasien Pada Laporan Ini */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
            Daftar Pasien Hasil Filter ({filteredPatients.length})
          </h4>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            Tidak ada data pasien yang sesuai dengan filter laporan saat ini.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPatients.map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">({p.rmNumber})</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    p.lifeStatus === 'aktif' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {p.lifeStatus}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span>{p.room} · {p.bed} · Masuk: {p.admissionDate}</span>
                  <span className="truncate max-w-[150px]">DPJP: {p.dpjps?.[0]?.split(',')[0] || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Rekapan Pemeriksaan Gula Darah Pasien */}
      <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                Rekapan Hasil Pemeriksaan Gula Darah Pasien ({sugarReportList.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Data pemantauan glukosa darah (GDP, GDS, GD2PP, dll.) untuk pasien dalam periode ini
              </p>
            </div>
          </div>

          {sugarReportList.length > 0 && (
            <button
              onClick={handleExportSugarCSV}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer self-start sm:self-center shrink-0 active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Unduh Rekapan Gula (CSV)</span>
            </button>
          )}
        </div>

        {sugarReportList.length === 0 ? (
          <div className="p-6 text-center text-slate-400 space-y-1">
            <Droplet className="w-8 h-8 text-amber-200 mx-auto" />
            <p className="font-medium text-slate-600">Tidak ada riwayat pemeriksaan gula darah untuk pasien pada filter ini.</p>
            <p className="text-[11px] text-slate-400">Hasil pemeriksaan gula darah yang dicatat perawat akan terangkum otomatis di sini.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10.5px] font-bold text-amber-900 block">Total Pemeriksaan</span>
                <span className="text-xl font-black text-amber-950 mt-0.5 block">{sugarReportList.length}</span>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[10.5px] font-bold text-emerald-800 block">Normal (70-140)</span>
                <span className="text-xl font-black text-emerald-900 mt-0.5 block">
                  {sugarReportList.filter(s => s.gds >= 70 && s.gds <= 140).length}
                </span>
              </div>
              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[10.5px] font-bold text-rose-800 block">Hiperglikemia (≥200)</span>
                <span className="text-xl font-black text-rose-900 mt-0.5 block">
                  {sugarReportList.filter(s => s.gds >= 200).length}
                </span>
              </div>
              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[10.5px] font-bold text-rose-800 block">Hipoglikemia (&lt;70)</span>
                <span className="text-xl font-black text-rose-900 mt-0.5 block">
                  {sugarReportList.filter(s => s.gds < 70).length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Waktu</th>
                    <th className="p-2">Pasien</th>
                    <th className="p-2">Ruang/Bed</th>
                    <th className="p-2">Jenis Pemeriksaan</th>
                    <th className="p-2 text-right">Hasil (mg/dL)</th>
                    <th className="p-2">Status Klinis</th>
                    <th className="p-2">Pemeriksa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sugarReportList.map(s => {
                    let interpBadge = {
                      text: 'Normal',
                      bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    };
                    if (s.gds < 70) {
                      interpBadge = { text: 'Hipoglikemia (<70)', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
                    } else if (s.sugarType.toLowerCase().includes('puasa')) {
                      if (s.gds <= 99) interpBadge = { text: 'Normal Puasa (70-99)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                      else if (s.gds <= 125) interpBadge = { text: 'Pra-Diabetes (100-125)', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
                      else interpBadge = { text: 'Tinggi Puasa (≥126)', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
                    } else {
                      if (s.gds <= 140) interpBadge = { text: 'Normal (70-140)', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                      else if (s.gds < 200) interpBadge = { text: 'Meningkat (141-199)', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
                      else interpBadge = { text: 'Hiperglikemia (≥200)', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
                    }

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2 font-mono whitespace-nowrap text-slate-600">{s.timestamp}</td>
                        <td className="p-2 font-bold text-slate-900">
                          {s.patientName} <span className="font-mono font-normal text-slate-400">({s.rmNumber})</span>
                        </td>
                        <td className="p-2 text-slate-600">{s.room} · {s.bed}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            {s.sugarType}
                          </span>
                        </td>
                        <td className="p-2 text-right font-black text-sm text-slate-900 tabular-nums">
                          {s.gds}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${interpBadge.bg}`}>
                            {interpBadge.text}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600 text-[11px]">{s.nurseName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
