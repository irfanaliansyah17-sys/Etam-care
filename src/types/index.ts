export type PatientCondition = 'stabil' | 'perhatian' | 'kritis';
export type PatientLifeStatus = 'aktif' | 'pulang' | 'pindah' | 'meninggal';

export type ShiftType = 'Pagi (07.00 - 14.00)' | 'Sore (14.00 - 21.00)' | 'Malam (21.00 - 07.00)';

export type UserRole =
  | 'Perawat Pelaksana'
  | 'PJ Shift'
  | 'Ketua Tim (Katim)'
  | 'Kepala Ruangan (Karu)';

export type InsuranceType =
  | 'BPJS - Kelas 1'
  | 'BPJS - Kelas 2'
  | 'BPJS - Kelas 3'
  | 'Mandiri / Umum'
  | 'Asuransi Swasta';

export interface DoctorDPJP {
  id: string;
  name: string;
  specialization: string;
  sipNumber?: string;
  phone?: string;
  status: 'Aktif' | 'On-Call' | 'Cuti';
}

export interface Nurse {
  id: string;
  name: string;
  role: UserRole;
  currentShift: ShiftType;
  ward: string;
  isActive: boolean;
  isOnDuty?: boolean;
}

export interface Ward {
  id: string;
  name: string;
  totalBeds: number;
  description?: string;
}

export interface PatientMedication {
  id: string;
  patientId: string;
  name: string;
  dosage: string; // e.g. "1 gram", "500 mg", "10 IU"
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  route?: 'Oral' | 'IV' | 'IM' | 'SC' | 'Inhalasi' | 'Topikal' | 'Lainnya';
  frequency?: string; // e.g. "3 x 1 sehari", "Tiap 12 jam", "1 x malam"
  scheduleTimes?: string; // e.g. "08:00, 16:00, 24:00"
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  notes?: string;
  status: 'Aktif' | 'Dihentikan' | 'Selesai';
  prescribedBy?: string;
}

export interface Patient {
  id: string;
  rmNumber: string;
  name: string;
  gender: 'L' | 'P';
  birthDate: string; // YYYY-MM-DD
  age: number; // Auto-calculated from birthDate
  room: string; // Ward name
  bed: string;
  admissionDate: string; // YYYY-MM-DD
  admissionTime: string; // HH:mm
  medicalDiagnosis: string;
  nursingDiagnosis?: string;
  status: PatientCondition; // stabil | perhatian | kritis
  lifeStatus: PatientLifeStatus; // aktif | pulang | pindah | meninggal
  
  // Keluhan Utama / Keluhan Terkini Pasien
  complaint?: string;

  // Perawat Penanggung Jawab Pasien (PPJP) / Perawat yang memegang pasien
  nurseInCharge?: string;

  // DPJP: Supports multiple doctors
  dpjps: string[]; // List of doctor names
  dpjp?: string; // fallback single doctor

  // Health Insurance
  insurance: InsuranceType;

  // Planned clinical actions
  plannedActions: string;

  // Clinical Vitals snapshot
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  spo2?: number;
  gds?: number; // Gula Darah Sewaktu (mg/dL) - opsional / boleh dikosongkan

  allergies?: string;
  notes?: string;

  // Discharge / Transfer / Deceased records
  dischargeDate?: string;
  dischargeTime?: string;
  dischargeNotes?: string;

  transferWard?: string;
  transferDate?: string;
  transferTime?: string;
  transferNotes?: string;

  deceasedDate?: string;
  deceasedTime?: string;
  deceasedNotes?: string;
}

export interface VitalSign {
  id: string;
  patientId: string;
  timestamp: string; // YYYY-MM-DD HH:mm
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  spo2: number;
  gds?: number; // Gula Darah Sewaktu (mg/dL) - opsional / boleh dikosongkan
  gcs?: string;
  nurseName: string;
  notes?: string;
  complaint?: string; // Keluhan pasien saat dilakukan pemeriksaan TTV
}

export interface NursingAction {
  id: string;
  patientId: string;
  timestamp: string;
  category: 'Medikasi' | 'Perawatan Luka' | 'Oksigenasi' | 'Nutrisi/Cairan' | 'Observasi' | 'Lainnya';
  title: string;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  nurseName: string;
  shift: ShiftType;
}

export interface SBARHandover {
  id: string;
  patientId: string;
  timestamp: string; // YYYY-MM-DD HH:mm
  shift: ShiftType;
  shiftFrom?: ShiftType;
  shiftTo?: ShiftType;
  handoverFrom: string;
  handoverTo: string;
  verifiedByKaru?: boolean;

  // Core SBAR
  situation: string; // S
  background: string; // B: diagnosis, admission, hospital day, active meds
  assessment: string; // A: latest vitals with date/time, condition, observations
  recommendation: string; // R: action plan, continued meds, exams

  // Structured Metadata
  patientCondition?: PatientCondition;
  complaintSummary?: string;
  vitalSignsSummary?: string;
  vitalsMeasuredAt?: string;
  actionsCompleted?: string;
  actionsPending?: string;
  activeMedicationsSummary?: string;
  followUpPlan?: string;
  importantNotes?: string;
}

export interface SOAPNote {
  id: string;
  patientId: string;
  timestamp: string;
  shift: ShiftType;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  nurseName: string;
  status: 'Draft' | 'Final';
}

export interface NursingSOP {
  id: string;
  code: string;
  title: string;
  category: string;
  purpose: string;
  steps: string[];
}

export interface PatientEducation {
  id: string;
  patientId: string;
  timestamp: string;
  topic: string;
  recipient: 'Pasien' | 'Keluarga' | 'Keduanya';
  method: 'Lisan' | 'Brosur/Leaflet' | 'Demonstrasi' | 'Kombinasi';
  evaluation: 'Paham & Mampu Menjelaskan' | 'Butuh Pendampingan' | 'Belum Paham';
  nurseName: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  role: UserRole;
  action: 'TAMBAH' | 'UBAH' | 'HAPUS' | 'TIMBANG_TERIMA' | 'STATUS_CHANGE' | 'EKSPOR';
  description: string;
  patientRM?: string;
}

/**
 * Calculates hospital day (Hari Perawatan) automatically from admissionDate
 * Example:
 * Admission: 2026-10-01, Today: 2026-10-02 -> Hari Perawatan ke-2
 */
export function calculateHospitalDay(admissionDate?: string): { dayNumber: number; text: string } {
  if (!admissionDate) {
    return { dayNumber: 0, text: 'Hari Perawatan: Belum ada data' };
  }
  try {
    const adm = new Date(admissionDate);
    if (isNaN(adm.getTime())) {
      return { dayNumber: 0, text: 'Hari Perawatan: Data tidak valid' };
    }
    const today = new Date();
    // Normalize to date boundaries without time
    const startAdm = new Date(adm.getFullYear(), adm.getMonth(), adm.getDate()).getTime();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const diffDays = Math.round((startToday - startAdm) / (1000 * 60 * 60 * 24));
    const day = Math.max(1, diffDays + 1);
    return { dayNumber: day, text: `Hari Perawatan ke-${day}` };
  } catch {
    return { dayNumber: 0, text: 'Hari Perawatan: Belum ada data' };
  }
}
