import {
  Patient,
  VitalSign,
  NursingAction,
  SBARHandover,
  SOAPNote,
  AuditLog,
  DoctorDPJP,
  Nurse,
  Ward,
  PatientMedication,
  NursingSOP,
  calculateHospitalDay,
  UserRole,
  ShiftType,
} from '../types';

const STORAGE_KEYS = {
  PATIENTS: 'etamcare_patients',
  DOCTORS: 'etamcare_doctors',
  NURSES: 'etamcare_nurses',
  WARDS: 'etamcare_wards',
  VITALS: 'etamcare_vitals',
  MEDICATIONS: 'etamcare_medications',
  ACTIONS: 'etamcare_actions',
  HANDOVERS: 'etamcare_handovers',
  SOAP: 'etamcare_soap',
  AUDIT: 'etamcare_audit',
  USER_SESSION: 'etamcare_user_session',
  TIMESTAMPS: 'etamcare_timestamps',
  NURSES_INITIALIZED: 'etamcare_nurses_initialized',
  NURSES_CUSTOMIZED: 'etamcare_nurses_customized',
};

// Known demo nurse names for detection and safe roster management
export const DEMO_NURSE_NAMES = [
  'Ns. Ratna Dewi, S.Kep',
  'Ns. Budi Santoso, S.Kep',
  'Ns. Siti Rahmah, S.Kep',
  'Ns. Dimas Pratama, S.Kep',
  'Ns. Hj. Mariana, S.Kep., M.Kep',
];

export function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

// Initial Doctors / DPJPs (No SIP or phone shown)
export const INITIAL_DOCTORS: DoctorDPJP[] = [
  {
    id: 'doc-1',
    name: 'dr. Hendra Kurniawan, Sp.B',
    specialization: 'Spesialis Bedah Umum',
    status: 'Aktif',
  },
  {
    id: 'doc-2',
    name: 'dr. Rina Puspita, Sp.PD',
    specialization: 'Spesialis Penyakit Dalam',
    status: 'Aktif',
  },
  {
    id: 'doc-3',
    name: 'dr. Anton Wijaya, Sp.PD-KEMD',
    specialization: 'Spesialis Penyakit Dalam - Konsultan Endokrin',
    status: 'Aktif',
  },
  {
    id: 'doc-4',
    name: 'dr. Farhan, Sp.P',
    specialization: 'Spesialis Paru & Pernapasan',
    status: 'Aktif',
  },
  {
    id: 'doc-5',
    name: 'dr. Maya Kartika, Sp.A',
    specialization: 'Spesialis Anak',
    status: 'On-Call',
  },
  {
    id: 'doc-6',
    name: 'dr. Bambang Irawan, Sp.JP',
    specialization: 'Spesialis Jantung & Pembuluh Darah',
    status: 'Aktif',
  },
];

// Initial Wards (Bangsal)
export const INITIAL_WARDS: Ward[] = [
  {
    id: 'ward-1',
    name: 'Ruang Teratai',
    totalBeds: 16,
    description: 'Rawat Inap Bedah & Penyakit Dalam Dewasa',
  },
  {
    id: 'ward-2',
    name: 'Ruang Melati',
    totalBeds: 20,
    description: 'Rawat Inap Penyakit Dalam Umum',
  },
  {
    id: 'ward-3',
    name: 'Ruang Mawar',
    totalBeds: 12,
    description: 'Rawat Inap Kebidanan, Kandungan & Post Partum',
  },
  {
    id: 'ward-4',
    name: 'Ruang ICU',
    totalBeds: 8,
    description: 'Intensive Care Unit & Pemantauan Kritis',
  },
];

// Initial Nurse Roster (No NIP required)
export const INITIAL_NURSES: Nurse[] = [
  {
    id: 'nurse-1',
    name: 'Ns. Ratna Dewi, S.Kep',
    role: 'Perawat Pelaksana',
    currentShift: 'Pagi (07.00 - 14.00)',
    ward: 'Ruang Teratai',
    isActive: true,
    isOnDuty: true,
  },
  {
    id: 'nurse-2',
    name: 'Ns. Budi Santoso, S.Kep',
    role: 'Ketua Tim (Katim)',
    currentShift: 'Pagi (07.00 - 14.00)',
    ward: 'Ruang Teratai',
    isActive: true,
    isOnDuty: true,
  },
  {
    id: 'nurse-3',
    name: 'Ns. Siti Rahmah, S.Kep',
    role: 'Perawat Pelaksana',
    currentShift: 'Sore (14.00 - 21.00)',
    ward: 'Ruang Teratai',
    isActive: true,
    isOnDuty: false,
  },
  {
    id: 'nurse-4',
    name: 'Ns. Dimas Pratama, S.Kep',
    role: 'Perawat Pelaksana',
    currentShift: 'Malam (21.00 - 07.00)',
    ward: 'Ruang Teratai',
    isActive: true,
    isOnDuty: false,
  },
  {
    id: 'nurse-5',
    name: 'Ns. Hj. Mariana, S.Kep., M.Kep',
    role: 'Kepala Ruangan (Karu)',
    currentShift: 'Pagi (07.00 - 14.00)',
    ward: 'Ruang Teratai',
    isActive: true,
    isOnDuty: true,
  },
];

// Initial Patients
export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'p-1',
    rmNumber: 'RM-092811',
    name: 'Tn. Bambang Sutrisno',
    gender: 'L',
    birthDate: '1968-04-12',
    age: calculateAge('1968-04-12'),
    room: 'Ruang Teratai',
    bed: 'Bed 01A',
    admissionDate: '2026-09-29',
    admissionTime: '09:30',
    medicalDiagnosis: 'Post Op Laparatomi Explorasi H+2 e.c Perforasi Gaster',
    nursingDiagnosis: 'Nyeri akut b.d agen pencedera fisik, Risiko infeksi luka operasi',
    status: 'perhatian',
    lifeStatus: 'aktif',
    nurseInCharge: 'Ns. Ratna Dewi, S.Kep',
    dpjps: ['dr. Hendra Kurniawan, Sp.B', 'dr. Anton Wijaya, Sp.PD-KEMD'],
    dpjp: 'dr. Hendra Kurniawan, Sp.B',
    insurance: 'BPJS - Kelas 1',
    plannedActions: 'Ganti balutan steril, injeksi Ceftriaxone 1gr/12 jam, aff NGT evaluasi bising usus',
    bpSystolic: 125,
    bpDiastolic: 80,
    heartRate: 84,
    respiratoryRate: 20,
    temperature: 37.1,
    spo2: 98,
    gds: 118,
    allergies: 'Penisilin',
    notes: 'Drain luka rembesan minimal serohemoragis 30cc. NGT terpasang.',
  },
  {
    id: 'p-2',
    rmNumber: 'RM-093144',
    name: 'Ny. Siti Aminah',
    gender: 'P',
    birthDate: '1962-09-18',
    age: calculateAge('1962-09-18'),
    room: 'Ruang Teratai',
    bed: 'Bed 02B',
    admissionDate: '2026-09-30',
    admissionTime: '14:15',
    medicalDiagnosis: 'DHF Grade II + Trombositopenia (45.000) + Dehidrasi Sedang',
    nursingDiagnosis: 'Risiko perdarahan b.d trombositopenia, Hipovolemia b.d peningkatan permeabilitas kapiler',
    status: 'kritis',
    lifeStatus: 'aktif',
    nurseInCharge: 'Ns. Ratna Dewi, S.Kep',
    dpjps: ['dr. Rina Puspita, Sp.PD'],
    dpjp: 'dr. Rina Puspita, Sp.PD',
    insurance: 'BPJS - Kelas 2',
    plannedActions: 'Rehidrasi RL 20 tpm, awasi tanda syok DSS, cek ulang Darah Rutin jam 11.00',
    bpSystolic: 95,
    bpDiastolic: 65,
    heartRate: 108,
    respiratoryRate: 22,
    temperature: 38.6,
    spo2: 97,
    gds: 104,
    allergies: 'Tidak ada',
    notes: 'Awasi presyok (akral dingin, tensi turun, nadi filiformis).',
  },
  {
    id: 'p-3',
    rmNumber: 'RM-091055',
    name: 'Tn. Agus Priyanto',
    gender: 'L',
    birthDate: '1977-11-23',
    age: calculateAge('1977-11-23'),
    room: 'Ruang Teratai',
    bed: 'Bed 03A',
    admissionDate: '2026-09-28',
    admissionTime: '10:00',
    medicalDiagnosis: 'DM Tipe 2 Tidak Terkontrol + Ulkus Diabetikum Pedis Dextra Gr III',
    nursingDiagnosis: 'Ketidakstabilan kadar glukosa darah, Kerusakan integritas jaringan',
    status: 'perhatian',
    lifeStatus: 'aktif',
    nurseInCharge: 'Ns. Budi Santoso, S.Kep',
    dpjps: ['dr. Anton Wijaya, Sp.PD-KEMD', 'dr. Hendra Kurniawan, Sp.B'],
    dpjp: 'dr. Anton Wijaya, Sp.PD-KEMD',
    insurance: 'BPJS - Kelas 1',
    plannedActions: 'Rawat luka modern dressing, sliding scale insulin Novorapid, diet DM 1700 kkal',
    bpSystolic: 130,
    bpDiastolic: 85,
    heartRate: 78,
    respiratoryRate: 18,
    temperature: 36.7,
    spo2: 99,
    gds: 245,
    allergies: 'Sulfa',
    notes: 'Perawatan luka modern dressing pagi ini. Eksudat minimal.',
  },
  {
    id: 'p-4',
    rmNumber: 'RM-094012',
    name: 'Ny. Sri Wahyuni',
    gender: 'P',
    birthDate: '1988-02-14',
    age: calculateAge('1988-02-14'),
    room: 'Ruang Teratai',
    bed: 'Bed 04B',
    admissionDate: '2026-10-01',
    admissionTime: '08:00',
    medicalDiagnosis: 'Dyspepsia Sindrom Akut + GERD',
    nursingDiagnosis: 'Nyeri epigastrium b.d iritasi lambung, Nausea',
    status: 'stabil',
    lifeStatus: 'aktif',
    nurseInCharge: 'Ns. Budi Santoso, S.Kep',
    dpjps: ['dr. Rina Puspita, Sp.PD'],
    dpjp: 'dr. Rina Puspita, Sp.PD',
    insurance: 'Mandiri / Umum',
    plannedActions: 'Injeksi Omeprazole 40mg/12 jam, diet lunak rendah asam, edukasi pola makan',
    bpSystolic: 118,
    bpDiastolic: 75,
    heartRate: 76,
    respiratoryRate: 18,
    temperature: 36.6,
    spo2: 99,
    gds: 98,
    allergies: 'Tidak ada',
    notes: 'Mual berkurang, toleransi bubur hangat baik.',
  },
  {
    id: 'p-5',
    rmNumber: 'RM-089941',
    name: 'Tn. Dedi Suryadi',
    gender: 'L',
    birthDate: '1964-07-30',
    age: calculateAge('1964-07-30'),
    room: 'Ruang Teratai',
    bed: 'Bed 05A',
    admissionDate: '2026-09-27',
    admissionTime: '11:45',
    medicalDiagnosis: 'PPOK Eksaserbasi Akut + CAP (Community Acquired Pneumonia)',
    nursingDiagnosis: 'Pola napas tidak efektif b.d bronkospasme, Bersihan jalan napas tidak efektif',
    status: 'perhatian',
    lifeStatus: 'aktif',
    nurseInCharge: 'Ns. Siti Rahmah, S.Kep',
    dpjps: ['dr. Farhan, Sp.P', 'dr. Bambang Irawan, Sp.JP'],
    dpjp: 'dr. Farhan, Sp.P',
    insurance: 'BPJS - Kelas 3',
    plannedActions: 'Oksigen nasal 3 lpm, nebulisasi Combivent per 8 jam, fisioterapi dada',
    bpSystolic: 135,
    bpDiastolic: 88,
    heartRate: 92,
    respiratoryRate: 24,
    temperature: 37.0,
    spo2: 95,
    gds: 112,
    allergies: 'Aspirin',
    notes: 'Posisi semi fowler tinggi, batuk berdahak kental.',
  },
  {
    id: 'p-6',
    rmNumber: 'RM-088190',
    name: 'Tn. Hendro Pratomo',
    gender: 'L',
    birthDate: '1974-03-10',
    age: calculateAge('1974-03-10'),
    room: 'Ruang Teratai',
    bed: 'Bed 06B',
    admissionDate: '2026-09-25',
    admissionTime: '08:30',
    medicalDiagnosis: 'Gastroenteritis Akut Dehidrasi Ringan (Terkoreksi)',
    nursingDiagnosis: 'Diare teratasi',
    status: 'stabil',
    lifeStatus: 'pulang',
    nurseInCharge: 'Ns. Dimas Pratama, S.Kep',
    dpjps: ['dr. Rina Puspita, Sp.PD'],
    dpjp: 'dr. Rina Puspita, Sp.PD',
    insurance: 'BPJS - Kelas 2',
    plannedActions: 'Kontrol poli penyakit dalam 5 hari kemudian',
    dischargeDate: '2026-09-30',
    dischargeTime: '13:00',
    dischargeNotes: 'Kondisi umum baik, toleransi oral penuh, obat pulang diserahkan.',
  },
];

// Initial Realistic Patient Medications
export const INITIAL_MEDICATIONS: PatientMedication[] = [
  // Tn. Bambang Sutrisno
  {
    id: 'med-1',
    patientId: 'p-1',
    name: 'Ceftriaxone',
    dosage: '1 gram',
    route: 'IV',
    frequency: 'Tiap 12 jam (2x1)',
    scheduleTimes: '08:00, 20:00',
    startDate: '2026-09-29',
    status: 'Aktif',
    notes: 'Skin test negatif. Profilaksis infeksi luka operasi.',
    prescribedBy: 'dr. Hendra Kurniawan, Sp.B',
  },
  {
    id: 'med-2',
    patientId: 'p-1',
    name: 'Ketorolac',
    dosage: '30 mg',
    route: 'IV',
    frequency: 'Tiap 8 jam (3x1)',
    scheduleTimes: '06:00, 14:00, 22:00',
    startDate: '2026-09-29',
    status: 'Aktif',
    notes: 'Analgetik paska bedah laparatomi.',
    prescribedBy: 'dr. Hendra Kurniawan, Sp.B',
  },
  {
    id: 'med-3',
    patientId: 'p-1',
    name: 'Infus Ringer Laktat',
    dosage: '500 ml',
    route: 'IV',
    frequency: '20 tetes/menit',
    startDate: '2026-09-29',
    status: 'Aktif',
    notes: 'Pemeliharaan cairan parenteral dan elektrolit.',
    prescribedBy: 'dr. Hendra Kurniawan, Sp.B',
  },

  // Ny. Siti Aminah
  {
    id: 'med-4',
    patientId: 'p-2',
    name: 'Infus Ringer Laktat',
    dosage: '500 ml',
    route: 'IV',
    frequency: '20 tetes/menit',
    startDate: '2026-09-30',
    status: 'Aktif',
    notes: 'Rehidrasi fase kritis DHF. Pantau tanda hemokonsentrasi.',
    prescribedBy: 'dr. Rina Puspita, Sp.PD',
  },
  {
    id: 'med-5',
    patientId: 'p-2',
    name: 'Paracetamol',
    dosage: '500 mg',
    route: 'Oral',
    frequency: '3 x 1 tablet',
    scheduleTimes: '08:00, 14:00, 20:00',
    startDate: '2026-09-30',
    status: 'Aktif',
    notes: 'Antipiretik saat suhu > 38°C.',
    prescribedBy: 'dr. Rina Puspita, Sp.PD',
  },

  // Tn. Agus Priyanto
  {
    id: 'med-6',
    patientId: 'p-3',
    name: 'Novorapid (Insulin Aspart)',
    dosage: '8 IU',
    route: 'SC',
    frequency: '3 x sehari (sebelum makan)',
    scheduleTimes: '07:00, 12:00, 18:00',
    startDate: '2026-09-28',
    status: 'Aktif',
    notes: 'Injeksi subkutan 15 menit sebelum makan. Sliding scale.',
    prescribedBy: 'dr. Anton Wijaya, Sp.PD-KEMD',
  },
  {
    id: 'med-7',
    patientId: 'p-3',
    name: 'Ceftriaxone',
    dosage: '1 gram',
    route: 'IV',
    frequency: 'Tiap 12 jam (2x1)',
    scheduleTimes: '08:00, 20:00',
    startDate: '2026-09-28',
    status: 'Aktif',
    notes: 'Terapi antibiotik ulkus diabetikum pedis.',
    prescribedBy: 'dr. Hendra Kurniawan, Sp.B',
  },

  // Ny. Sri Wahyuni
  {
    id: 'med-8',
    patientId: 'p-4',
    name: 'Omeprazole',
    dosage: '40 mg',
    route: 'IV',
    frequency: 'Tiap 12 jam (2x1)',
    scheduleTimes: '08:00, 20:00',
    startDate: '2026-10-01',
    status: 'Aktif',
    notes: 'Penekan asam lambung untuk GERD/Dispepsia akut.',
    prescribedBy: 'dr. Rina Puspita, Sp.PD',
  },
  {
    id: 'med-9',
    patientId: 'p-4',
    name: 'Sukralfat Sirup',
    dosage: '10 ml (1 sendok makan)',
    route: 'Oral',
    frequency: '3 x 1 sebelum makan',
    scheduleTimes: '07:00, 12:00, 18:00',
    startDate: '2026-10-01',
    status: 'Aktif',
    notes: 'Pelindung mukosa lambung.',
    prescribedBy: 'dr. Rina Puspita, Sp.PD',
  },

  // Tn. Dedi Suryadi
  {
    id: 'med-10',
    patientId: 'p-5',
    name: 'Combivent Nebulizer (Ipratropium + Salbutamol)',
    dosage: '1 respule (2.5 ml)',
    route: 'Inhalasi',
    frequency: 'Tiap 8 jam (3x1)',
    scheduleTimes: '08:00, 16:00, 24:00',
    startDate: '2026-09-27',
    status: 'Aktif',
    notes: 'Bronkodilator inhalasi PPOK eksaserbasi.',
    prescribedBy: 'dr. Farhan, Sp.P',
  },
  {
    id: 'med-11',
    patientId: 'p-5',
    name: 'Pulmicort Nebulizer (Budesonide)',
    dosage: '1 respule (0.5 mg)',
    route: 'Inhalasi',
    frequency: 'Tiap 12 jam (2x1)',
    scheduleTimes: '08:00, 20:00',
    startDate: '2026-09-27',
    status: 'Aktif',
    notes: 'Kortikosteroid inhalasi anti-inflamasi jalan napas.',
    prescribedBy: 'dr. Farhan, Sp.P',
  },
];

// Initial Vitals
export const INITIAL_VITALS: VitalSign[] = [
  {
    id: 'v-1',
    patientId: 'p-1',
    timestamp: '2026-10-01 07:30',
    bpSystolic: 125,
    bpDiastolic: 80,
    heartRate: 84,
    respiratoryRate: 20,
    temperature: 37.1,
    spo2: 98,
    gds: 118,
    gcs: 'E4V5M6 (15)',
    nurseName: 'Ns. Ratna Dewi',
    notes: 'Skala nyeri 4/10 saat bergerak. Luka kering terbalut.',
  },
  {
    id: 'v-2',
    patientId: 'p-2',
    timestamp: '2026-10-01 07:45',
    bpSystolic: 95,
    bpDiastolic: 65,
    heartRate: 108,
    respiratoryRate: 22,
    temperature: 38.6,
    spo2: 97,
    gds: 104,
    gcs: 'E4V5M6 (15)',
    nurseName: 'Ns. Ratna Dewi',
    notes: 'Tekanan darah turun dibanding malam (110/70). Akral hangat.',
  },
  {
    id: 'v-3',
    patientId: 'p-3',
    timestamp: '2026-10-01 08:00',
    bpSystolic: 130,
    bpDiastolic: 85,
    heartRate: 78,
    respiratoryRate: 18,
    temperature: 36.7,
    spo2: 99,
    gds: 245,
    gcs: 'E4V5M6 (15)',
    nurseName: 'Ns. Ratna Dewi',
    notes: 'GDS stick pagi 245 mg/dL. Eksudat minimal.',
  },
  {
    id: 'v-4',
    patientId: 'p-4',
    timestamp: '2026-10-01 08:00',
    bpSystolic: 118,
    bpDiastolic: 75,
    heartRate: 76,
    respiratoryRate: 18,
    temperature: 36.6,
    spo2: 99,
    gds: 98,
    nurseName: 'Ns. Ratna Dewi',
    notes: 'Mual berkurang, nyeri ulu hati skala 2.',
  },
  {
    id: 'v-5',
    patientId: 'p-5',
    timestamp: '2026-10-01 08:15',
    bpSystolic: 135,
    bpDiastolic: 88,
    heartRate: 92,
    respiratoryRate: 24,
    temperature: 37.0,
    spo2: 95,
    gds: 112,
    gcs: 'E4V5M6 (15)',
    nurseName: 'Ns. Ratna Dewi',
    notes: 'Ronkhi basah halus di kedua lapang paru.',
  },
];

export const INITIAL_ACTIONS: NursingAction[] = [
  {
    id: 'a-1',
    patientId: 'p-1',
    timestamp: '2026-10-01 08:00',
    category: 'Medikasi',
    title: 'Injeksi Ceftriaxone 1 gr IV & Ketorolac 30 mg IV',
    completed: true,
    completedAt: '2026-10-01 08:05',
    nurseName: 'Ns. Ratna Dewi',
    shift: 'Pagi (07.00 - 14.00)',
    notes: 'Skin test negatif, toleransi obat baik tanpa reaksi alergi.',
  },
  {
    id: 'a-2',
    patientId: 'p-1',
    timestamp: '2026-10-01 10:00',
    category: 'Perawatan Luka',
    title: 'Ganti balutan luka operasi laparatomi & observasi produksi drain',
    completed: false,
    nurseName: 'Ns. Ratna Dewi',
    shift: 'Pagi (07.00 - 14.00)',
    notes: 'Siapkan set ganti balut steril dan kassa transparan.',
  },
];

export const INITIAL_HANDOVERS: SBARHandover[] = [
  {
    id: 'h-1',
    patientId: 'p-1',
    timestamp: '2026-10-01 07:00',
    shift: 'Pagi (07.00 - 14.00)',
    shiftFrom: 'Malam (21.00 - 07.00)',
    shiftTo: 'Pagi (07.00 - 14.00)',
    handoverFrom: 'Ns. Dimas Pratama',
    handoverTo: 'Ns. Ratna Dewi',
    situation: 'Tn. Bambang Post-Op Laparatomi H+2, mengeluh nyeri luka berkurang (VAS 4/10), flatus (+).',
    background: 'Riwayat perforasi gaster. Tanggal Masuk: 2026-09-29 (Hari Perawatan ke-3). Terapi aktif: Ceftriaxone 1gr IV, Ketorolac 30mg IV, Infus RL 20 tpm.',
    assessment: 'TTV Terkini (01/10 07:30): TD 125/80 mmHg, Nadi 84x/m, RR 20x/m, Suhu 37.1 C, SpO2 98%. Luka operasi kering, bising usus 8x/menit.',
    recommendation: 'Lanjutkan antibiotik Ceftriaxone 2x1gr, rencana lepas NGT siang ini jika bising usus aktif, ganti balut luka steril.',
    patientCondition: 'perhatian',
    vitalSignsSummary: 'TD 125/80 mmHg, Nadi 84x/m, RR 20x/m, Suhu 37.1 C, SpO2 98%',
    vitalsMeasuredAt: '2026-10-01 07:30',
    actionsCompleted: 'Injeksi analgetik subuh jam 05.00, TTV rutin',
    actionsPending: 'Ganti balutan laparatomi jam 10.00, konfirmasi aff NGT dr. Hendra',
    activeMedicationsSummary: 'Ceftriaxone 1gr IV, Ketorolac 30mg IV, Infus RL 20 tpm',
    followUpPlan: 'Edukasi mobilisasi duduk bertahap',
    importantNotes: 'Alergi penisilin terkonfirmasi',
    verifiedByKaru: true,
  },
  {
    id: 'h-2',
    patientId: 'p-2',
    timestamp: '2026-10-01 07:00',
    shift: 'Pagi (07.00 - 14.00)',
    shiftFrom: 'Malam (21.00 - 07.00)',
    shiftTo: 'Pagi (07.00 - 14.00)',
    handoverFrom: 'Ns. Dimas Pratama',
    handoverTo: 'Ns. Ratna Dewi',
    situation: 'Ny. Siti Aminah DHF hari ke-5, demam turun mendadak tadi subuh (fase kritis).',
    background: 'Diagnosis DHF Gr II + Trombositopenia (45.000). Tanggal Masuk: 2026-09-30 (Hari Perawatan ke-2). Terapi aktif: Infus RL 20 tpm, Paracetamol 500mg prn.',
    assessment: 'TTV Terkini (01/10 07:45): TD 95/65 mmHg, Nadi 108x/m, RR 22x/m, Suhu 38.6 C, SpO2 97%. Tensi agak rendah, nadi cepat, keluhan lemas berat.',
    recommendation: 'Pantau ketat tanda presyok, awasi produksi urine > 0.5cc/kgBB/jam, ulangi cek DR pukul 11:00.',
    patientCondition: 'kritis',
    vitalSignsSummary: 'TD 95/65 mmHg, Nadi 108x/m, RR 22x/m, Suhu 38.6 C, SpO2 97%',
    vitalsMeasuredAt: '2026-10-01 07:45',
    actionsCompleted: 'Rehidrasi RL grojok 500cc semalam',
    actionsPending: 'Ambil sampel darah rutin pukul 11.00, pantau tensi per 2 jam',
    activeMedicationsSummary: 'Infus RL 20 tpm, Paracetamol 500mg',
    followUpPlan: 'Siapkan transfusi TC jika DPJP instruksi',
    importantNotes: 'Fase kritis dengue hari ke-5, waspadai DSS',
    verifiedByKaru: true,
  },
];

export const INITIAL_SOAP: SOAPNote[] = [
  {
    id: 'soap-1',
    patientId: 'p-1',
    timestamp: '2026-10-01 07:30',
    shift: 'Pagi (07.00 - 14.00)',
    subjective: 'Pasien menyatakan sudah bisa miring kanan-kiri, nyeri perut bawah masih terasa tetapi sudah jauh lebih nyaman, sudah buang angin tadi pagi.',
    objective: 'TD: 125/80 mmHg, Nadi: 84x/m, Suhu: 37.1 C, RR: 20x/m, SpO2: 98%. Perban perut rembesan minimal, drain 10cc keruh merah kekuningan.',
    assessment: 'Nyeri akut post-op teratasi sebagian, risiko infeksi luka operasi terkontrol.',
    plan: '1. Edukasi mobilisasi duduk bertahap.\n2. Injeksi analgesik dan antibiotik tepat waktu.\n3. Rencana aff NGT konfirmasi DPJP dr. Hendra, Sp.B.',
    nurseName: 'Ns. Ratna Dewi',
    status: 'Final',
  },
];

export const INITIAL_AUDIT: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-01 07:00',
    userName: 'Ns. Ratna Dewi',
    role: 'Perawat Pelaksana',
    action: 'TIMBANG_TERIMA',
    description: 'Menerima timbang terima SBAR shift pagi dari Ns. Dimas Pratama untuk Ruang Teratai.',
  },
];

export const NURSING_SOPS: NursingSOP[] = [
  {
    id: 'sop-1',
    code: 'SOP-KEP-001',
    title: 'Timbang Terima Pasien (Handover SBAR)',
    category: 'Komunikasi Efektif',
    purpose: 'Menyampaikan informasi klinis pasien secara akurat, terstruktur (Situation, Background, Assessment, Recommendation), dan terpadu antar pergantian shift perawat.',
    steps: [
      'Ucapkan salam dan identifikasi pasien menggunakan minimal dua identitas (nama lengkap dan nomor rekam medis).',
      'S (Situation): Jelaskan kondisi umum terkini pasien, keluhan utama saat ini, bed/ruangan, dan diagnosis medis.',
      'B (Background): Sampaikan riwayat rawat, hari perawatan, riwayat alergi obat/makanan, dan terapi yang sedang berjalan.',
      'A (Assessment): Laporkan tanda-tanda vital terbaru, hasil laboratorium/radiologi penting, dan tindakan keperawatan yang telah diselesaikan maupun yang masih pending.',
      'R (Recommendation): Instruksikan rencana tindak lanjut shift berikutnya, target monitoring, instruksi khusus DPJP, dan persiapan tindakan/operasi.',
      'Lakukan konfirmasi timbal balik (read-back) dengan perawat penerima dan lakukan validasi tanda tangan timbang terima.'
    ]
  },
  {
    id: 'sop-2',
    code: 'SOP-KEP-002',
    title: 'Pemasangan & Pemeliharaan Terapi Infus (IV Line)',
    category: 'Tindakan Invasif',
    purpose: 'Menjamin akses parenteral yang aman, steril, mencegah flebitis, dan memonitor kelancaran terapi cairan/elektrolit.',
    steps: [
      'Verifikasi order medis dan identitas pasien.',
      'Lakukan kebersihan tangan 6 langkah sesuai standar WHO.',
      'Pilih vena perifer yang lurus dan pasang torniket 10-15 cm di atas area penusukan.',
      'Disinfeksi area insersi dengan alkohol swab 70% secara sirkuler dan biarkan mengering.',
      'Tusukkan IV kateter dengan sudut 15-30 derajat dengan lubang jarum menghadap ke atas sampai darah terlihat pada flashback chamber.',
      'Tarik mandrin sedikit dan dorong kateter masuk sepenuhnya, fiksasi dengan transparan dressing.',
      'Beri label tanggal dan waktu pemasangan, rapikan alat, dan dokumentasikan pada lembar tindakan keperawatan.'
    ]
  },
  {
    id: 'sop-3',
    code: 'SOP-KEP-003',
    title: 'Pemberian Obat High Alert & Double Check',
    category: 'Keselamatan Pasien',
    purpose: 'Mencegah terjadinya medication error pada obat-obatan berisiko tinggi seperti insulin, elektrolit konsentrat, dan obat sitostatika.',
    steps: [
      'Siapkan obat sesuai prinsip 7 Benar (Benar Pasien, Obat, Dosis, Waktu, Rute, Informasi, Dokumentasi).',
      'Lakukan proses double check independen oleh dua perawat yang berbeda sebelum pemberian.',
      'Verifikasi konsentrasi, pengenceran, kecepatan infus, dan tanggal kadaluwarsa obat.',
      'Gunakan label merah berstempel HIGH ALERT pada spuit atau kolf infus.',
      'Dokumentasikan nama obat, dosis, waktu pemberian, dan tanda tangan kedua perawat pemeriksa.'
    ]
  },
  {
    id: 'sop-4',
    code: 'SOP-KEP-004',
    title: 'Pencegahan Pasien Jatuh (Skala Morse & Humpty Dumpty)',
    category: 'Keselamatan Pasien',
    purpose: 'Mengidentifikasi risiko jatuh pasien dan melakukan intervensi preventif untuk mencegah cedera fisik.',
    steps: [
      'Lakukan asesmen risiko jatuh awal saat pasien masuk ruangan menggunakan instrumen Morse Fall Scale (dewasa) atau Humpty Dumpty (anak).',
      'Pasang gelang kuning penanda risiko jatuh pada pergelangan tangan pasien.',
      'Pasang tanda segitiga risiko jatuh pada bed pasien atau pintu kamar.',
      'Pastikan pengaman tempat tidur (side rail) selalu terpasang dengan baik dan rem roda tempat tidur terkunci.',
      'Posisikan bel pemanggil perawat dalam jangkauan mudah pasien atau keluarga.',
      'Edukasi pasien dan keluarga agar selalu memanggil perawat saat hendak berpindah atau ke kamar mandi.'
    ]
  },
  {
    id: 'sop-5',
    code: 'SOP-KEP-005',
    title: 'Bantuan Hidup Dasar (Resusitasi Jantung Paru)',
    category: 'Gawat Darurat',
    purpose: 'Mengembalikan fungsi sirkulasi dan ventilasi spontan pada pasien yang mengalami henti jantung dan/atau henti napas.',
    steps: [
      'Pastikan 3A (Aman diri, Aman pasien, Aman lingkungan).',
      'Cek respon pasien dengan menepuk bahu dan memanggil nama pasien.',
      'Jika tidak ada respon, segera aktifkan Code Blue / panggil bantuan tim medis.',
      'Cek nadi karotis dan pernapasan simultan dalam waktu tidak lebih dari 10 detik.',
      'Bila tidak teraba nadi, segera mulai kompresi dada: letakkan telapak tangan di pertengahan dada, tekan sedalam 5-6 cm dengan kecepatan 100-120 kali/menit.',
      'Kombinasikan dengan 2 ventilasi setiap 30 kompresi dada (30:2) dengan interupsi seminimal mungkin.',
      'Pasang defibrilator/AED segera setelah alat tersedia dan ikuti instruksi ritme.'
    ]
  }
];

export interface UserSession {
  nurseName: string;
  role: UserRole;
  shift: ShiftType;
  ward: string;
  activeNurseNames?: string[];
}

export const DEFAULT_USER_SESSION: UserSession = {
  nurseName: 'Ns. Ratna Dewi, S.Kep',
  role: 'Perawat Pelaksana',
  shift: 'Pagi (07.00 - 14.00)',
  ward: 'Ruang Teratai',
  activeNurseNames: [
    'Ns. Ratna Dewi, S.Kep',
  ],
};

// Client ID to prevent echo loops
const CLIENT_ID =
  typeof window !== 'undefined'
    ? 'c_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36)
    : 'server';

let lastKnownServerUpdated = '';

// Local collection timestamp helpers to prevent stale server data overwrites
export function getLocalTimestamps(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMESTAMPS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setLocalTimestamp(key: string, ts = Date.now()): void {
  try {
    const cur = getLocalTimestamps();
    cur[key] = ts;
    localStorage.setItem(STORAGE_KEYS.TIMESTAMPS, JSON.stringify(cur));
  } catch {}
}

// Cross-tab broadcast channel
const realtimeChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('etamcare_realtime')
    : null;

function broadcastLocalChange(key: string) {
  if (realtimeChannel) {
    try {
      realtimeChannel.postMessage({ type: 'LOCAL_DATA_CHANGED', key, senderId: CLIENT_ID, time: Date.now() });
    } catch {}
  }
}

// Active WebSocket client connection
let activeWs: WebSocket | null = null;

// Send change to all devices instantly
export function sendRealtimeUpdate(key: string, data: any): void {
  // Update local edit timestamp
  setLocalTimestamp(key);

  // 1. Same-device cross-tab broadcast (0ms)
  broadcastLocalChange(key);

  // 2. High-speed WebSocket push to server and other clients (instant, <50ms)
  if (activeWs && activeWs.readyState === WebSocket.OPEN) {
    try {
      activeWs.send(
        JSON.stringify({
          type: 'SYNC_UPDATE',
          key,
          data,
          clientId: CLIENT_ID,
        })
      );
    } catch (err) {
      console.error('Failed to send WS update:', err);
    }
  }

  // 3. HTTP POST fallback for resilience
  fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, data, clientId: CLIENT_ID }),
  })
    .then((res) => res.json())
    .then((json) => {
      if (json && json.timestamp) {
        lastKnownServerUpdated = json.timestamp;
      }
    })
    .catch(() => {});
}

// Apply incoming data directly to local storage
export function applyIncomingData(key: string, data: any): boolean {
  if (!data) return false;
  try {
    if (key === 'patients' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(data));
      setLocalTimestamp('patients');
      return true;
    }
    if (key === 'doctors' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(data));
      setLocalTimestamp('doctors');
      return true;
    }
    if (key === 'nurses' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(data));
      setLocalTimestamp('nurses');
      return true;
    }
    if (key === 'wards' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(data));
      setLocalTimestamp('wards');
      return true;
    }
    if (key === 'vitals' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(data));
      setLocalTimestamp('vitals');
      return true;
    }
    if (key === 'medications' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(data));
      setLocalTimestamp('medications');
      return true;
    }
    if (key === 'actions' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(data));
      setLocalTimestamp('actions');
      return true;
    }
    if (key === 'handovers' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(data));
      setLocalTimestamp('handovers');
      return true;
    }
    if (key === 'soaps' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.SOAP, JSON.stringify(data));
      setLocalTimestamp('soaps');
      return true;
    }
    if (key === 'auditLogs' && Array.isArray(data)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(data));
      setLocalTimestamp('auditLogs');
      return true;
    }
    if (key === 'userSession' && data && typeof data === 'object') {
      // User session is device-local; do not overwrite current nurse's login from other devices
      return false;
    }
    if (key === 'all' && typeof data === 'object') {
      return storage.applyServerBulk(data);
    }
  } catch (err) {
    console.error('Error applying incoming data:', err);
  }
  return false;
}

// Subscribe to real-time events from WebSocket, SSE, and BroadcastChannel
export function subscribeRealtimeUpdates(onUpdate: () => void): () => void {
  let isCleanedUp = false;

  // 1. Listen to BroadcastChannel for local cross-tab sync (0ms latency)
  const handleBcMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'LOCAL_DATA_CHANGED') {
      if (event.data.senderId === CLIENT_ID) return;
      onUpdate();
    }
  };
  if (realtimeChannel) {
    realtimeChannel.addEventListener('message', handleBcMessage);
  }

  // 2. High-speed bidirectional WebSocket connection
  let wsReconnectTimeout: any = null;

  function connectWs() {
    if (isCleanedUp || typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      activeWs = ws;

      ws.onopen = () => {
        // Connected to real-time WebSocket server
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'INIT') {
            if (payload.data && Object.keys(payload.data).length > 0) {
              const updated = storage.applyServerBulk(payload.data);
              if (updated) onUpdate();
            } else {
              storage.seedServer();
            }
          } else if (payload.type === 'DATA_CHANGED') {
            if (payload.originClientId && payload.originClientId === CLIENT_ID) {
              return; // Ignore own update echo
            }
            if (payload.key && payload.data) {
              applyIncomingData(payload.key, payload.data);
              onUpdate();
            }
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        activeWs = null;
        if (!isCleanedUp) {
          wsReconnectTimeout = setTimeout(connectWs, 2000);
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    } catch {
      if (!isCleanedUp) {
        wsReconnectTimeout = setTimeout(connectWs, 3000);
      }
    }
  }

  connectWs();

  // 3. Fallback SSE (Server-Sent Events)
  let eventSource: EventSource | null = null;
  let sseReconnectTimeout: any = null;

  function connectSSE() {
    if (isCleanedUp || typeof window === 'undefined' || !window.EventSource) return;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.onmessage = async (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'DATA_UPDATED') {
            if (payload.originClientId && payload.originClientId === CLIENT_ID) return;
            const updated = await storage.syncWithBackend();
            if (updated) {
              onUpdate();
            }
          }
        } catch {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isCleanedUp) {
          sseReconnectTimeout = setTimeout(connectSSE, 5000);
        }
      };
    } catch {
      if (!isCleanedUp) {
        sseReconnectTimeout = setTimeout(connectSSE, 7000);
      }
    }
  }

  connectSSE();

  return () => {
    isCleanedUp = true;
    if (realtimeChannel) {
      realtimeChannel.removeEventListener('message', handleBcMessage);
    }
    if (activeWs) {
      try {
        activeWs.close();
      } catch {}
      activeWs = null;
    }
    if (wsReconnectTimeout) {
      clearTimeout(wsReconnectTimeout);
    }
    if (eventSource) {
      eventSource.close();
    }
    if (sseReconnectTimeout) {
      clearTimeout(sseReconnectTimeout);
    }
  };
}

// Storage & Sync Engine
export const storage = {
  // Bulk apply server dataset with intelligent timestamp reconciliation
  applyServerBulk(data: any, force = false): boolean {
    if (!data || typeof data !== 'object') return false;
    const localTs = getLocalTimestamps();
    const serverTimestamps = (data.timestamps as Record<string, string>) || {};
    let hasUpdated = false;

    // Helper: check if server data is newer or if client has never modified this key
    const shouldAcceptServer = (key: string, serverItems?: any[]) => {
      if (force) return true;
      const sTsStr = serverTimestamps[key];
      const sTs = sTsStr ? new Date(sTsStr).getTime() : 0;
      const lTs = localTs[key] || 0;

      // If server does not have an explicit timestamp for this key
      if (!sTs) {
        // If client has never modified this key locally and server has items, accept server data
        if (!lTs && Array.isArray(serverItems) && serverItems.length > 0) return true;
        // Otherwise do not overwrite client data
        return false;
      }

      // If client has never modified this key locally, accept server data if it has items
      if (!lTs) {
        return Array.isArray(serverItems) ? serverItems.length > 0 : true;
      }

      // If server is strictly newer than client's last edit, accept server data
      if (sTs > lTs) return true;

      // Otherwise keep client's authoritative data!
      return false;
    };

    const keysToHealServer: Record<string, any> = {};

    // Patients
    if (Array.isArray(data.patients)) {
      if (shouldAcceptServer('patients', data.patients)) {
        localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(data.patients));
        hasUpdated = true;
      } else {
        keysToHealServer['patients'] = storage.getPatients();
      }
    }
    // Doctors
    if (Array.isArray(data.doctors)) {
      if (shouldAcceptServer('doctors', data.doctors)) {
        localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(data.doctors));
        hasUpdated = true;
      } else {
        keysToHealServer['doctors'] = storage.getDoctors();
      }
    }
    // Nurses
    if (Array.isArray(data.nurses)) {
      if (shouldAcceptServer('nurses', data.nurses)) {
        localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(data.nurses));
        localStorage.setItem(STORAGE_KEYS.NURSES_INITIALIZED, 'true');
        hasUpdated = true;
      } else {
        // Only heal server if this device explicitly has a customized local nurse modification
        const isCustomizedLocally = localStorage.getItem(STORAGE_KEYS.NURSES_CUSTOMIZED) === 'true';
        if (isCustomizedLocally && localTs['nurses']) {
          keysToHealServer['nurses'] = storage.getNurses();
        }
      }
    }
    // Wards
    if (Array.isArray(data.wards)) {
      if (shouldAcceptServer('wards', data.wards)) {
        localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(data.wards));
        hasUpdated = true;
      } else {
        keysToHealServer['wards'] = storage.getWards();
      }
    }
    // Vitals
    if (Array.isArray(data.vitals)) {
      if (shouldAcceptServer('vitals', data.vitals)) {
        localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(data.vitals));
        hasUpdated = true;
      } else {
        keysToHealServer['vitals'] = storage.getVitals();
      }
    }
    // Medications
    if (Array.isArray(data.medications)) {
      if (shouldAcceptServer('medications', data.medications)) {
        localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(data.medications));
        hasUpdated = true;
      } else {
        keysToHealServer['medications'] = storage.getMedications();
      }
    }
    // Actions
    if (Array.isArray(data.actions)) {
      if (shouldAcceptServer('actions', data.actions)) {
        localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(data.actions));
        hasUpdated = true;
      } else {
        keysToHealServer['actions'] = storage.getActions();
      }
    }
    // Handovers
    if (Array.isArray(data.handovers)) {
      if (shouldAcceptServer('handovers', data.handovers)) {
        localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(data.handovers));
        hasUpdated = true;
      } else {
        keysToHealServer['handovers'] = storage.getHandovers();
      }
    }
    // SOAP
    if (Array.isArray(data.soaps)) {
      if (shouldAcceptServer('soaps', data.soaps)) {
        localStorage.setItem(STORAGE_KEYS.SOAP, JSON.stringify(data.soaps));
        hasUpdated = true;
      } else {
        keysToHealServer['soaps'] = storage.getSOAP();
      }
    }
    // Audit Logs
    if (Array.isArray(data.auditLogs)) {
      if (shouldAcceptServer('auditLogs', data.auditLogs)) {
        localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(data.auditLogs));
        hasUpdated = true;
      } else {
        keysToHealServer['auditLogs'] = storage.getAuditLogs();
      }
    }
    // User Session: local to this device; do not let server overwrite local user session

    // If client local state has newer edits than server (e.g. server container restarted from 0),
    // immediately heal the server by sending client's current data!
    if (Object.keys(keysToHealServer).length > 0) {
      for (const [k, val] of Object.entries(keysToHealServer)) {
        sendRealtimeUpdate(k, val);
      }
    }

    return hasUpdated;
  },

  // Seed server with initial database
  seedServer(): void {
    fetch('/api/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        patients: storage.getPatients(),
        doctors: storage.getDoctors(),
        nurses: storage.getNurses(),
        wards: storage.getWards(),
        vitals: storage.getVitals(),
        medications: storage.getMedications(),
        actions: storage.getActions(),
        handovers: storage.getHandovers(),
        soaps: storage.getSOAP(),
        auditLogs: storage.getAuditLogs(),
        userSession: storage.getUserSession(),
      }),
    }).catch(() => {});
  },

  // Sync with backend API
  async syncWithBackend(): Promise<boolean> {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        
        // If server DB is totally empty, seed it once
        if (!data || Object.keys(data).length === 0) {
          storage.seedServer();
          return false;
        }

        // Avoid infinite reload if server timestamp hasn't changed
        if (data.lastUpdated && data.lastUpdated === lastKnownServerUpdated) {
          return false;
        }
        if (data.lastUpdated) {
          lastKnownServerUpdated = data.lastUpdated;
        }

        return storage.applyServerBulk(data);
      }
    } catch {
      // offline fallback
    }
    return false;
  },

  // Patients
  getPatients(): Patient[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
      return INITIAL_PATIENTS;
    }
    try {
      const parsed: Patient[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((p) => ({
        ...p,
        nurseInCharge: p.nurseInCharge ? p.nurseInCharge.trim() : undefined,
        lifeStatus: p.lifeStatus || 'aktif',
        dpjps: p.dpjps && p.dpjps.length > 0 ? p.dpjps : p.dpjp ? [p.dpjp] : [],
        birthDate: p.birthDate || '1975-01-01',
        age: p.birthDate ? calculateAge(p.birthDate) : p.age || 45,
        plannedActions: p.plannedActions || 'Observasi TTV dan pemberian terapi rutin.',
        admissionTime: p.admissionTime || '08:00',
      }));
    } catch {
      return [];
    }
  },

  savePatients(patients: Patient[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    setLocalTimestamp('patients');
    if (pushToApi) {
      sendRealtimeUpdate('patients', patients);
    }
  },

  // Doctors / DPJP
  getDoctors(): DoctorDPJP[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
      return INITIAL_DOCTORS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveDoctors(doctors: DoctorDPJP[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    setLocalTimestamp('doctors');
    if (pushToApi) {
      sendRealtimeUpdate('doctors', doctors);
    }
  },

  // Nurses
  getNurses(): Nurse[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NURSES);
    const initialized = localStorage.getItem(STORAGE_KEYS.NURSES_INITIALIZED);

    // If local storage was cleared or this is a brand new device
    if (raw === null) {
      if (initialized === 'true') {
        // User already customized or cleared nurses before - do NOT re-inject INITIAL_NURSES!
        return [];
      }
      localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(INITIAL_NURSES));
      localStorage.setItem(STORAGE_KEYS.NURSES_INITIALIZED, 'true');
      return INITIAL_NURSES;
    }
    try {
      const parsed: Nurse[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map(n => ({
        ...n,
        id: n.id || `nurse-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: (n.name || '').trim(),
        role: n.role || 'Perawat Pelaksana',
        currentShift: n.currentShift || 'Pagi (07.00 - 14.00)',
        ward: n.ward || 'Ruang Teratai',
        isActive: n.isActive !== undefined ? Boolean(n.isActive) : true,
        isOnDuty: n.isOnDuty !== undefined ? Boolean(n.isOnDuty) : false,
      }));
    } catch {
      return [];
    }
  },

  saveNurses(nurses: Nurse[], pushToApi = true): void {
    const sanitized = nurses.map(n => ({
      ...n,
      name: (n.name || '').trim(),
      role: n.role || 'Perawat Pelaksana',
      currentShift: n.currentShift || 'Pagi (07.00 - 14.00)',
      ward: n.ward || 'Ruang Teratai',
      isActive: n.isActive !== undefined ? Boolean(n.isActive) : true,
      isOnDuty: Boolean(n.isOnDuty),
    }));
    localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(sanitized));
    localStorage.setItem(STORAGE_KEYS.NURSES_INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.NURSES_CUSTOMIZED, 'true');
    setLocalTimestamp('nurses');
    if (pushToApi) {
      sendRealtimeUpdate('nurses', sanitized);
    }
  },

  hasDemoNurses(): boolean {
    const demoNames = new Set(DEMO_NURSE_NAMES.map(s => s.trim().toLowerCase()));
    const nurses = storage.getNurses();
    return nurses.some(n => demoNames.has((n.name || '').trim().toLowerCase()));
  },

  clearDemoNurses(): Nurse[] {
    const demoNames = new Set(DEMO_NURSE_NAMES.map(s => s.trim().toLowerCase()));
    const current = storage.getNurses();
    const remaining = current.filter(n => !demoNames.has((n.name || '').trim().toLowerCase()));
    storage.saveNurses(remaining);

    // Call server endpoint as well for guaranteed persistence
    fetch('/api/clear-demo-nurses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: CLIENT_ID }),
    }).catch(() => {});

    return remaining;
  },

  // Wards
  getWards(): Ward[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WARDS);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(INITIAL_WARDS));
      return INITIAL_WARDS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveWards(wards: Ward[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(wards));
    setLocalTimestamp('wards');
    if (pushToApi) {
      sendRealtimeUpdate('wards', wards);
    }
  },

  // Vitals
  getVitals(): VitalSign[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VITALS);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(INITIAL_VITALS));
      return INITIAL_VITALS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveVitals(vitals: VitalSign[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(vitals));
    setLocalTimestamp('vitals');
    if (pushToApi) {
      sendRealtimeUpdate('vitals', vitals);
    }
  },

  getLatestVital(patientId: string): VitalSign | null {
    const all = storage.getVitals().filter(v => v.patientId === patientId);
    if (all.length === 0) return null;
    // Sorted descending by timestamp
    all.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    return all[0];
  },

  addVital(vitalData: Omit<VitalSign, 'id'>): VitalSign {
    const vitals = storage.getVitals();
    const newVital: VitalSign = {
      ...vitalData,
      id: `v-${Date.now()}`,
    };
    vitals.unshift(newVital);
    storage.saveVitals(vitals);
    return newVital;
  },

  // Medications
  getMedications(): PatientMedication[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDICATIONS);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(INITIAL_MEDICATIONS));
      return INITIAL_MEDICATIONS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveMedications(medications: PatientMedication[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    setLocalTimestamp('medications');
    if (pushToApi) {
      sendRealtimeUpdate('medications', medications);
    }
  },

  getPatientMedications(patientId: string): PatientMedication[] {
    return storage.getMedications().filter(m => m.patientId === patientId);
  },

  addMedication(medData: Omit<PatientMedication, 'id'>): PatientMedication {
    const meds = storage.getMedications();
    const newMed: PatientMedication = {
      ...medData,
      id: `med-${Date.now()}`,
    };
    meds.unshift(newMed);
    storage.saveMedications(meds);
    return newMed;
  },

  updateMedication(id: string, updates: Partial<PatientMedication>): void {
    const meds = storage.getMedications();
    const updated = meds.map(m => (m.id === id ? { ...m, ...updates } : m));
    storage.saveMedications(updated);
  },

  deleteMedication(id: string): void {
    const meds = storage.getMedications();
    const updated = meds.filter(m => m.id !== id);
    storage.saveMedications(updated);
  },

  // Actions
  getActions(): NursingAction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIONS);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(INITIAL_ACTIONS));
      return INITIAL_ACTIONS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveActions(actions: NursingAction[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(actions));
    setLocalTimestamp('actions');
    if (pushToApi) {
      sendRealtimeUpdate('actions', actions);
    }
  },

  // Handovers
  getHandovers(): SBARHandover[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HANDOVERS);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(INITIAL_HANDOVERS));
      return INITIAL_HANDOVERS;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveHandovers(handovers: SBARHandover[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(handovers));
    setLocalTimestamp('handovers');
    if (pushToApi) {
      sendRealtimeUpdate('handovers', handovers);
    }
  },

  // SOAP
  getSOAP(): SOAPNote[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SOAP);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.SOAP, JSON.stringify(INITIAL_SOAP));
      return INITIAL_SOAP;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveSOAP(notes: SOAPNote[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.SOAP, JSON.stringify(notes));
    setLocalTimestamp('soaps');
    if (pushToApi) {
      sendRealtimeUpdate('soaps', notes);
    }
  },

  // Audit
  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (raw === null) {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT));
      return INITIAL_AUDIT;
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveAuditLogs(logs: AuditLog[], pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
    setLocalTimestamp('auditLogs');
    if (pushToApi) {
      sendRealtimeUpdate('auditLogs', logs);
    }
  },

  addAuditLog(action: AuditLog['action'], description: string, patientRM?: string, user = DEFAULT_USER_SESSION): void {
    const logs = storage.getAuditLogs();
    const now = new Date();
    const timestamp = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp,
      userName: user.nurseName,
      role: user.role,
      action,
      description,
      patientRM,
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    storage.saveAuditLogs(logs);
  },

  // User session
  getUserSession(): UserSession {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(DEFAULT_USER_SESSION));
      return DEFAULT_USER_SESSION;
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_USER_SESSION,
        ...parsed,
        activeNurseNames:
          parsed.activeNurseNames && parsed.activeNurseNames.length > 0
            ? parsed.activeNurseNames
            : [parsed.nurseName || DEFAULT_USER_SESSION.nurseName],
      };
    } catch {
      return DEFAULT_USER_SESSION;
    }
  },

  saveUserSession(session: UserSession, pushToApi = true): void {
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    setLocalTimestamp('userSession');
    if (pushToApi) {
      sendRealtimeUpdate('userSession', session);
    }
  },

  resetToDemo(): void {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
    localStorage.setItem(STORAGE_KEYS.NURSES, JSON.stringify(INITIAL_NURSES));
    localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(INITIAL_WARDS));
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(INITIAL_VITALS));
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(INITIAL_MEDICATIONS));
    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(INITIAL_ACTIONS));
    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify(INITIAL_HANDOVERS));
    localStorage.setItem(STORAGE_KEYS.SOAP, JSON.stringify(INITIAL_SOAP));
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT));
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(DEFAULT_USER_SESSION));

    // Reset online backend too
    fetch('/api/reset', { method: 'POST' }).catch(() => {});
  },
};
