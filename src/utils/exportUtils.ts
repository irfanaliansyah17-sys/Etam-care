import { Patient, SBARHandover, NursingAction, SOAPNote, VitalSign } from '../types';

/**
 * Generates and triggers download of a CSV file (readable directly by Excel)
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  // UTF-8 BOM for proper excel encoding support
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row =>
        row
          .map(cell => {
            const str = cell !== undefined && cell !== null ? String(cell) : '';
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers standard browser print dialog styled for A4 clinical handover / summary
 */
export function triggerPrintReport(
  title: string,
  metaInfo: { period: string; shift: string; ward: string; nurse: string },
  patients: Patient[],
  handovers: SBARHandover[],
  actions: NursingAction[],
  vitals: VitalSign[],
  soaps: SOAPNote[]
) {
  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 12px; color: #1e293b; margin: 20px; line-height: 1.4; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
        .hospital-title { font-size: 16px; font-weight: bold; color: #1e3a8a; text-transform: uppercase; margin: 0; }
        .sub-title { font-size: 13px; font-weight: 600; color: #334155; margin: 4px 0 0; }
        .meta-box { display: grid; grid-template-columns: repeat(4, 1fr); background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; margin-bottom: 16px; border-radius: 6px; font-size: 11px; }
        .section-title { font-size: 13px; font-weight: bold; background: #eff6ff; border-left: 4px solid #2563eb; padding: 6px 10px; margin-top: 20px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background-color: #f1f5f9; font-weight: 600; }
        .status-stabil { color: #15803d; font-weight: 600; }
        .status-perhatian { color: #b45309; font-weight: 600; }
        .status-kritis { color: #b91c1c; font-weight: 600; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
        .badge-done { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
        .signature-box { text-align: center; width: 220px; }
        .sign-space { height: 60px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="hospital-title">ETAM CARE - INTEGRATED NURSING MANAGEMENT SYSTEM</h1>
        <div class="sub-title">${title}</div>
      </div>

      <div class="meta-box">
        <div><strong>Ruangan:</strong> ${metaInfo.ward}</div>
        <div><strong>Shift Kerja:</strong> ${metaInfo.shift}</div>
        <div><strong>Periode:</strong> ${metaInfo.period}</div>
        <div><strong>Penanggung Jawab:</strong> ${metaInfo.nurse}</div>
      </div>

      <div class="section-title">1. DAFTAR PASIEN KELOLAAN RUANGAN</div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th style="width: 80px;">No RM</th>
            <th style="width: 130px;">Nama Pasien</th>
            <th style="width: 60px;">Bed</th>
            <th>Diagnosis Medis</th>
            <th style="width: 110px;">DPJP</th>
            <th style="width: 75px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${patients
            .map(
              (p, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${p.rmNumber}</strong></td>
              <td>${p.name} (${p.gender}, ${p.age} th)</td>
              <td>${p.bed}</td>
              <td>${p.medicalDiagnosis}</td>
              <td>${p.dpjp}</td>
              <td class="status-${p.status}">${p.status.toUpperCase()}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <div class="section-title">2. REKAPITULASI TINDAKAN KEPERAWATAN</div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px;">No</th>
            <th style="width: 100px;">Pasien</th>
            <th style="width: 90px;">Kategori</th>
            <th>Uraian Tindakan Keperawatan</th>
            <th style="width: 80px;">Status</th>
            <th style="width: 90px;">Pelaksana</th>
          </tr>
        </thead>
        <tbody>
          ${actions
            .map(
              (a, idx) => {
                const pt = patients.find(p => p.id === a.patientId);
                return `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${pt ? pt.name.split(' ')[0] + ' ' + (pt.name.split(' ')[1] || '') : '-'} (${pt?.bed || '-'})</td>
                  <td>${a.category}</td>
                  <td>${a.title}</td>
                  <td><span class="badge ${a.completed ? 'badge-done' : 'badge-pending'}">${a.completed ? 'SELESAI' : 'TERTUNDA'}</span></td>
                  <td>${a.nurseName}</td>
                </tr>
              `;
              }
            )
            .join('')}
        </tbody>
      </table>

      <div class="section-title">3. RINGKASAN TIMBANG TERIMA (SBAR) TERBARU</div>
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">Pasien / Bed</th>
            <th>Situation (S) & Background (B)</th>
            <th>Assessment (A) & Recommendation (R)</th>
            <th style="width: 90px;">Serah Terima</th>
          </tr>
        </thead>
        <tbody>
          ${handovers
            .map(h => {
              const pt = patients.find(p => p.id === h.patientId);
              return `
              <tr>
                <td><strong>${pt?.name || '-'}</strong><br><small>${pt?.bed} (${pt?.rmNumber})</small></td>
                <td><strong>S:</strong> ${h.situation}<br><strong>B:</strong> ${h.background}</td>
                <td><strong>A:</strong> ${h.assessment}<br><strong>R:</strong> ${h.recommendation}</td>
                <td><small>Dari: ${h.handoverFrom}<br>Ke: ${h.handoverTo}</small></td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>

      <div class="no-print" style="margin-top: 24px; text-align: center;">
        <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:10px 24px; border-radius:6px; font-weight:bold; cursor:pointer;">
          Cetak / Simpan ke PDF Sekarang
        </button>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }
  } catch {}

  // Safe fallback via hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  iframe.contentDocument?.write(html);
  iframe.contentDocument?.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 400);
}

/**
 * Triggers standard clinical print sheet for a single SBAR Handover
 * Compliant with RSUD AM Parikesit & UMKT nursing standards
 */
export function triggerPrintSBARHandover(
  handover: SBARHandover,
  patient: Patient,
  wardName: string
) {
  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Formulir Timbang Terima SBAR - ${patient.name} (${patient.rmNumber})</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 12px; color: #0f172a; margin: 24px; line-height: 1.5; }
        .kop-table { width: 100%; border-bottom: 3px double #1e3a8a; padding-bottom: 10px; margin-bottom: 14px; }
        .kop-table td { border: none; padding: 2px 6px; vertical-align: middle; }
        .kop-title { font-size: 15px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin: 0; line-height: 1.2; }
        .kop-sub { font-size: 12px; font-weight: 700; color: #047857; margin: 2px 0 0; }
        .kop-address { font-size: 10px; color: #64748b; margin: 2px 0 0; }
        .doc-title { text-align: center; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 12px 0 10px; letter-spacing: 0.5px; text-decoration: underline; }
        .patient-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 14px; }
        .patient-card table { width: 100%; border: none; border-collapse: collapse; font-size: 11px; }
        .patient-card td { border: none; padding: 3px 6px; }
        .sbar-section { margin-bottom: 12px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
        .sbar-header { font-weight: 800; font-size: 11px; padding: 6px 10px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px; }
        .sbar-header.s { background-color: #2563eb; }
        .sbar-header.b { background-color: #4f46e5; }
        .sbar-header.a { background-color: #d97706; }
        .sbar-header.r { background-color: #059669; }
        .sbar-content { padding: 10px; font-size: 11.5px; color: #1e293b; background: #ffffff; white-space: pre-wrap; line-height: 1.5; }
        .sign-table { width: 100%; margin-top: 24px; border-collapse: collapse; }
        .sign-table td { border: 1px solid #e2e8f0; width: 33.33%; text-align: center; padding: 8px; font-size: 11px; vertical-align: top; }
        .sign-role { font-weight: 700; color: #334155; margin-bottom: 45px; }
        .sign-name { font-weight: 700; color: #0f172a; text-decoration: underline; }
        @media print {
          body { margin: 10mm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <table class="kop-table">
        <tr>
          <td style="width: 65px; text-align: center;">
            <img src="/logo-umkt.png" alt="UMKT" style="width: 50px; height: 50px; object-fit: contain;">
          </td>
          <td style="text-align: center;">
            <div class="kop-title">RSUD AJI MUHAMMAD PARIKESIT</div>
            <div class="kop-sub">ETAM CARE - SISTEM MANAJEMEN ASUHAN KEPERAWATAN TERPADU</div>
            <div class="kop-address">Ruang Rawat: ${wardName} · Jl. Ratu Agung No. 1 Tenggarong Seberang, Kutai Kartanegara</div>
          </td>
          <td style="width: 65px; text-align: center;">
            <img src="/logo-parikesit.svg" alt="RSUD Parikesit" style="width: 50px; height: 50px; object-fit: contain;">
          </td>
        </tr>
      </table>

      <div class="doc-title">LEMBAR TIMBANG TERIMA PASIEN (HANDOVER SBAR)</div>

      <div class="patient-card">
        <table>
          <tr>
            <td style="width: 15%;"><strong>Nama Pasien:</strong></td>
            <td style="width: 35%;">${patient.name} (${patient.gender}, ${patient.age} th)</td>
            <td style="width: 15%;"><strong>No. Rekam Medis:</strong></td>
            <td style="width: 35%; font-family: monospace; font-weight: bold;">${patient.rmNumber}</td>
          </tr>
          <tr>
            <td><strong>Bed / Ruangan:</strong></td>
            <td><strong>${patient.bed}</strong> (${patient.room})</td>
            <td><strong>DPJP:</strong></td>
            <td>${patient.dpjp || (patient.dpjps ? patient.dpjps.join(', ') : '-')}</td>
          </tr>
          <tr>
            <td><strong>Diagnosis Medis:</strong></td>
            <td>${patient.medicalDiagnosis}</td>
            <td><strong>Waktu Handover:</strong></td>
            <td>${handover.timestamp} (${handover.shiftFrom || handover.shift} → ${handover.shiftTo || 'Shift Berikutnya'})</td>
          </tr>
        </table>
      </div>

      <!-- S: Situation -->
      <div class="sbar-section">
        <div class="sbar-header s">S - SITUATION (Situasi & Kondisi Klinis Terkini)</div>
        <div class="sbar-content">${handover.situation}</div>
      </div>

      <!-- B: Background -->
      <div class="sbar-section">
        <div class="sbar-header b">B - BACKGROUND (Latar Belakang Klinis, Terapi & Alergi)</div>
        <div class="sbar-content">${handover.background}</div>
      </div>

      <!-- A: Assessment -->
      <div class="sbar-section">
        <div class="sbar-header a">A - ASSESSMENT (Penilaian & Evaluasi Tindakan Keperawatan)</div>
        <div class="sbar-content">${handover.assessment}</div>
      </div>

      <!-- R: Recommendation -->
      <div class="sbar-section">
        <div class="sbar-header r">R - RECOMMENDATION (Rekomendasi Asuhan & Tindak Lanjut)</div>
        <div class="sbar-content">${handover.recommendation}</div>
      </div>

      <div class="no-print" style="margin-top: 24px; text-align: center;">
        <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:10px 24px; border-radius:6px; font-weight:bold; cursor:pointer;">
          Cetak / Simpan Lembar SBAR Sekarang
        </button>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  // Safely open or use hidden iframe
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }
  } catch {}

  // Fallback if window.open is blocked by iframe/sandbox:
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  iframe.contentDocument?.write(html);
  iframe.contentDocument?.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 400);
}

/**
 * Triggers standard browser print for the DPJP Patient Roster / Aplusan Lembar DPJP
 * exactly formatted like the hospital handover spreadsheet (Kamar, Nama/RM, DPJP, Diagnosa, Hari, Kondisi/Tindakan, Terapi Obat)
 */
export function triggerPrintDpjpSheet(
  doctorName: string,
  patients: Patient[],
  vitals: VitalSign[],
  medications: { patientId: string; name: string; dosage: string; route?: string; frequency?: string; status: string }[]
) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Lembar Pasien DPJP - ${doctorName || 'Semua Dokter'}</title>
      <style>
        @page { size: landscape; margin: 10mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #0f172a; margin: 10px; line-height: 1.35; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; }
        .hospital-title { font-size: 15px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin: 0; }
        .sheet-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }
        .meta-info { font-size: 11px; text-align: right; color: #475569; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10.5px; }
        th { background-color: #fef08a; border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; font-weight: 800; color: #1e293b; text-transform: uppercase; font-size: 10px; }
        td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .kamar-cell { font-weight: 800; color: #1d4ed8; text-align: center; }
        .badge-rm { font-family: monospace; font-weight: 700; color: #0f172a; }
        .badge-ins { display: inline-block; font-size: 9px; padding: 1px 4px; background: #e0e7ff; color: #3730a3; border-radius: 3px; margin-top: 2px; }
        .ttv-tag { font-weight: 700; color: #0284c7; }
        .med-item { margin-bottom: 3px; }
        .med-name { font-weight: 700; color: #0f172a; }
        .notes-text { font-size: 10px; color: #475569; margin-top: 4px; }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="hospital-title">ETAM CARE - DAFTAR PASIEN & APLUSAN DPJP</h1>
          <div class="sheet-title">Dokter Penanggung Jawab Pelayanan: <strong>${doctorName || 'Semua Dokter'}</strong></div>
        </div>
        <div class="meta-info">
          <div>Tanggal: <strong>${currentDate}</strong></div>
          <div>Total Pasien: <strong>${patients.length} Pasien</strong></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 55px; text-align: center;">KAMAR</th>
            <th style="width: 140px;">NAMA / RM</th>
            <th style="width: 120px;">DPJP</th>
            <th style="width: 150px;">DIAGNOSA</th>
            <th style="width: 50px; text-align: center;">HARI</th>
            <th>KONDISI PASIEN / RENCANA TINDAKAN / PERMASALAHAN</th>
            <th style="width: 220px;">TERAPI OBAT</th>
          </tr>
        </thead>
        <tbody>
          ${patients.map(p => {
            const ptVitals = vitals
              .filter(v => v.patientId === p.id)
              .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1))[0];
            const ptMeds = medications.filter(m => m.patientId === p.id && m.status === 'Aktif');

            // Calculate hospital day
            let dayText = 'H-1';
            if (p.admissionDate) {
              const adm = new Date(p.admissionDate);
              const today = new Date();
              const diff = Math.round((today.getTime() - adm.getTime()) / (1000 * 60 * 60 * 24));
              dayText = `H${Math.max(1, diff + 1)}`;
            }

            const bpText = ptVitals ? `${ptVitals.bpSystolic}/${ptVitals.bpDiastolic}` : (p.bpSystolic ? `${p.bpSystolic}/${p.bpDiastolic}` : '-');
            const hrText = ptVitals ? ptVitals.heartRate : (p.heartRate || '-');
            const tempText = ptVitals ? ptVitals.temperature : (p.temperature || '-');
            const spo2Text = ptVitals ? ptVitals.spo2 : (p.spo2 || '-');

            return `
              <tr>
                <td class="kamar-cell">${p.bed}</td>
                <td>
                  <div style="font-weight: 800; font-size: 11px;">${p.name}</div>
                  <div class="badge-rm">${p.rmNumber}</div>
                  <div style="font-size: 10px; color: #64748b;">${p.age} th · ${p.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                  <div class="badge-ins">${p.insurance}</div>
                </td>
                <td>
                  <div style="font-weight: 700; color: #1e3a8a;">${p.dpjp || '-'}</div>
                  ${p.dpjps && p.dpjps.length > 1 ? `<div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Konsul: ${p.dpjps.filter(d => d !== p.dpjp).join(', ')}</div>` : ''}
                </td>
                <td>
                  <div style="font-weight: 700;">${p.medicalDiagnosis}</div>
                  ${p.nursingDiagnosis ? `<div style="font-size: 9.5px; color: #475569; margin-top: 3px;">Masalah Kep: ${p.nursingDiagnosis}</div>` : ''}
                  ${p.allergies ? `<div style="font-size: 9.5px; color: #b91c1c; font-weight: 700; margin-top: 2px;">Alergi: ${p.allergies}</div>` : ''}
                </td>
                <td style="text-align: center; font-weight: 700; color: #2563eb;">${dayText}</td>
                <td>
                  <div>
                    <span class="ttv-tag">TD:</span> ${bpText} mmHg &nbsp;|&nbsp;
                    <span class="ttv-tag">HR:</span> ${hrText} x/m &nbsp;|&nbsp;
                    <span class="ttv-tag">Suhu:</span> ${tempText}°C &nbsp;|&nbsp;
                    <span class="ttv-tag">SpO2:</span> ${spo2Text}%
                  </div>
                  ${p.complaint ? `<div style="margin-top: 3px; font-weight: 600; color: #c2410c;">Keluhan: ${p.complaint}</div>` : ''}
                  ${p.plannedActions ? `<div style="margin-top: 4px; font-weight: 600; color: #0f172a;">• Rencana Tindakan: ${p.plannedActions}</div>` : ''}
                  ${p.notes ? `<div class="notes-text">• Catatan: ${p.notes}</div>` : ''}
                </td>
                <td>
                  ${ptMeds.length > 0 ? ptMeds.map(m => `
                    <div class="med-item">
                      <span class="med-name">${m.name}</span>
                      <span style="color: #475569; font-size: 9.5px;">(${m.dosage}${m.route ? ` - ${m.route}` : ''}${m.frequency ? `, ${m.frequency}` : ''})</span>
                    </div>
                  `).join('') : '<div style="color: #94a3b8; font-style: italic;">Tidak ada terapi aktif</div>'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  // Safely open or use hidden iframe
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    }
  } catch {}

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  iframe.contentDocument?.write(html);
  iframe.contentDocument?.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 400);
}

