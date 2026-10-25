/**
 * ETAM CARE – Integrated Nursing Management System
 * Single-Page Dashboard Architecture
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header, MainMenuTab } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast, ToastMessage } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';

// Views
import { HomeView } from './views/HomeView';
import { DpjpView } from './views/DpjpView';
import { NurseShiftView } from './views/NurseShiftView';
import { HandoverView } from './views/HandoverView';
import { ReportsView } from './views/ReportsView';

// Modals
import { PatientDetailModal } from './views/PatientDetailModal';
import { PatientFormModal } from './views/PatientFormModal';
import { PatientStatusModal, StatusChangeType } from './views/PatientStatusModal';
import { VitalSignModal } from './views/VitalSignModal';
import { MedicationModal } from './views/MedicationModal';
import { NursingActionModal } from './views/NursingActionModal';
import { GdsModal } from './views/GdsModal';
import { DpjpFormModal } from './views/DpjpFormModal';
import { NurseFormModal } from './views/NurseFormModal';
import { WardFormModal } from './views/WardFormModal';
import { SopModal } from './views/SopModal';
import { SettingsModal } from './views/SettingsModal';
import { SwitchNurseModal } from './views/SwitchNurseModal';
import { DeviceAccessQrModal } from './components/DeviceAccessQrModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { SplashScreen } from './components/SplashScreen';

import {
  storage,
  UserSession,
  DEFAULT_USER_SESSION,
  subscribeRealtimeUpdates,
} from './services/storageService';
import {
  Patient,
  VitalSign,
  GdsRecord,
  NursingAction,
  SBARHandover,
  SOAPNote,
  DoctorDPJP,
  Nurse,
  Ward,
  ShiftType,
  PatientMedication,
} from './types';

export default function App() {
  // Navigation State (Single Page Dashboard - No Sidebar)
  const [currentTab, setCurrentTab] = useState<MainMenuTab>('beranda');

  // Master Data States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<DoctorDPJP[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [gdsRecords, setGdsRecords] = useState<GdsRecord[]>([]);
  const [medications, setMedications] = useState<PatientMedication[]>([]);
  const [actions, setActions] = useState<NursingAction[]>([]);
  const [handovers, setHandovers] = useState<SBARHandover[]>([]);
  const [soaps, setSoaps] = useState<SOAPNote[]>([]);
  const [userSession, setUserSession] = useState<UserSession>(DEFAULT_USER_SESSION);

  // Modals & Dialogs States
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);

  // Status Change Modal (Pindah, Pulang, Meninggal)
  const [statusModalTarget, setStatusModalTarget] = useState<{
    patient: Patient;
    type: StatusChangeType;
  } | null>(null);

  // Vital Sign Modal (Input TTV Terbaru & Edit Riwayat)
  const [isVitalModalOpen, setIsVitalModalOpen] = useState(false);
  const [vitalModalPatient, setVitalModalPatient] = useState<Patient | null>(null);
  const [vitalModalInitial, setVitalModalInitial] = useState<VitalSign | null>(null);

  // GDS Khusus Modal
  const [isGdsModalOpen, setIsGdsModalOpen] = useState(false);
  const [gdsModalPatient, setGdsModalPatient] = useState<Patient | null>(null);

  // Medication Modals & Delete States
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<PatientMedication | null>(null);
  const [medicationTargetPatient, setMedicationTargetPatient] = useState<Patient | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<PatientMedication | null>(null);

  // Nursing Action Modal States (Aksi Cepat & Catat Tindakan)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionModalPatient, setActionModalPatient] = useState<Patient | null>(null);

  // Handover selected patient shortcut
  const [handoverTargetPatientId, setHandoverTargetPatientId] = useState<string>('');
  const [handoverPrefilledVital, setHandoverPrefilledVital] = useState<VitalSign | null>(null);

  // Doctor Modals
  const [isDoctorFormOpen, setIsDoctorFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorDPJP | null>(null);
  const [doctorToDelete, setDoctorToDelete] = useState<DoctorDPJP | null>(null);

  // Nurse Modals
  const [isNurseFormOpen, setIsNurseFormOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [nurseToDelete, setNurseToDelete] = useState<Nurse | null>(null);
  const [nurseDefaultShift, setNurseDefaultShift] = useState<ShiftType | undefined>(undefined);
  const [nurseDefaultWard, setNurseDefaultWard] = useState<string | undefined>(undefined);

  // Ward Modals
  const [isWardFormOpen, setIsWardFormOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [wardToDelete, setWardToDelete] = useState<Ward | null>(null);

  // Other Modals
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [isSopOpen, setIsSopOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSwitchNurseModalOpen, setIsSwitchNurseModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load persistent data
  const loadData = useCallback(() => {
    setPatients(storage.getPatients());
    setDoctors(storage.getDoctors());
    setNurses(storage.getNurses());
    setWards(storage.getWards());
    setVitals(storage.getVitals());
    setGdsRecords(storage.getGdsRecords());
    setMedications(storage.getMedications());
    setActions(storage.getActions());
    setHandovers(storage.getHandovers());
    setSoaps(storage.getSOAP());
    setUserSession(storage.getUserSession());
  }, []);

  useEffect(() => {
    // Initial sync with backend server
    const initSync = async () => {
      await storage.syncWithBackend();
      loadData();
    };
    initSync();

    // Instant real-time multi-user synchronization (SSE & BroadcastChannel)
    const unsubscribeRealtime = subscribeRealtimeUpdates(() => {
      loadData();
    });

    // Multi-device fallback background sync (periodic check)
    const interval = setInterval(async () => {
      const updated = await storage.syncWithBackend();
      if (updated) {
        loadData();
      }
    }, 20000);

    // Sync on tab visibility change (nurse resumes active app on phone/PC)
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        const updated = await storage.syncWithBackend();
        if (updated) {
          loadData();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      unsubscribeRealtime();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  // Keep detail modal updated if the current patient is updated
  useEffect(() => {
    if (detailPatient) {
      const refreshed = patients.find(p => p.id === detailPatient.id);
      if (refreshed) {
        setDetailPatient(refreshed);
      }
    }
  }, [patients, detailPatient?.id]);

  // Keep userSession synchronized with existing nurses (remove any deleted nurses)
  useEffect(() => {
    if (nurses.length > 0) {
      const nurseNames = new Set(nurses.map(n => n.name));
      const filteredActive = (userSession.activeNurseNames || []).filter(name => nurseNames.has(name));
      let currentPrimary = userSession.nurseName;
      let currentRole = userSession.role;
      let currentWard = userSession.ward;

      let hasChanged = false;
      if (!nurseNames.has(currentPrimary)) {
        currentPrimary = nurses[0].name;
        currentRole = nurses[0].role;
        currentWard = nurses[0].ward || currentWard;
        hasChanged = true;
      }
      const newActive = filteredActive.length > 0 ? filteredActive : [currentPrimary];
      if (newActive.length !== (userSession.activeNurseNames || []).length) {
        hasChanged = true;
      }

      if (hasChanged) {
        const syncedSession: UserSession = {
          ...userSession,
          nurseName: currentPrimary,
          role: currentRole,
          ward: currentWard,
          activeNurseNames: newActive,
        };
        setUserSession(syncedSession);
        storage.saveUserSession(syncedSession);
      }
    }
  }, [nurses]);

  // ==========================================
  // PATIENT CRUD & STATUS CHANGES
  // ==========================================
  const handleUpdatePlannedActions = (patientId: string, newPlannedActions: string) => {
    const updated = patients.map(p =>
      p.id === patientId ? { ...p, plannedActions: newPlannedActions } : p
    );
    setPatients(updated);
    storage.savePatients(updated);

    if (detailPatient && detailPatient.id === patientId) {
      setDetailPatient(prev => (prev ? { ...prev, plannedActions: newPlannedActions } : null));
    }

    const target = patients.find(p => p.id === patientId);
    showToast(`Rencana tindakan untuk ${target?.name || 'pasien'} berhasil disimpan.`);
  };

  const handleSavePatient = (patientData: Omit<Patient, 'id'>, existingId?: string) => {
    if (existingId) {
      // Update existing patient
      const existing = patients.find(p => p.id === existingId);

      // Check duplicate name or duplicate RM against other patients
      const isDuplicateName = patients.some(
        p => p.id !== existingId && p.name.trim().toLowerCase() === patientData.name.trim().toLowerCase()
      );
      if (isDuplicateName) {
        showToast(`Pasien dengan nama "${patientData.name}" sudah terdaftar pada data lain!`, 'error');
        return;
      }
      const isDuplicateRM = patients.some(
        p => p.id !== existingId && p.rmNumber.trim().toLowerCase() === patientData.rmNumber.trim().toLowerCase()
      );
      if (isDuplicateRM) {
        showToast(`Nomor RM "${patientData.rmNumber}" sudah digunakan oleh pasien lain!`, 'error');
        return;
      }

      const updatedPatient: Patient = {
        ...(existing || {}),
        ...patientData,
        id: existingId,
      };
      const updated = patients.map(p =>
        p.id === existingId ? updatedPatient : p
      );
      setPatients(updated);
      storage.savePatients(updated);
      showToast(`Data pasien ${patientData.name} berhasil diperbarui.`);

      // Keep detailPatient synchronized and open with updated data
      if (detailPatient && detailPatient.id === existingId) {
        setDetailPatient(updatedPatient);
      }
    } else {
      // Create new patient - strictly reject duplicate patient name and duplicate RM
      const isDuplicateName = patients.some(
        p => p.name.trim().toLowerCase() === patientData.name.trim().toLowerCase()
      );
      if (isDuplicateName) {
        showToast(`Pasien dengan nama "${patientData.name}" sudah terdaftar dalam sistem!`, 'error');
        return;
      }
      const existingRM = patients.find(
        p => p.rmNumber.trim().toLowerCase() === patientData.rmNumber.trim().toLowerCase()
      );
      if (existingRM) {
        showToast(`Nomor RM "${patientData.rmNumber}" sudah digunakan oleh pasien lain!`, 'error');
        return;
      }

      const newPatient: Patient = {
        ...patientData,
        id: `p-${Date.now()}`,
      };
      const updated = [newPatient, ...patients];
      setPatients(updated);
      storage.savePatients(updated);
      showToast(`Pasien ${newPatient.name} berhasil didaftarkan.`);
    }

    setIsPatientFormOpen(false);
    setEditingPatient(null);
  };

  const handleUpdatePatientDpjp = (patientId: string, primaryDpjp: string, dpjps: string[]) => {
    const cleanDpjps = Array.from(new Set(dpjps.filter(Boolean)));
    const cleanPrimary = primaryDpjp || cleanDpjps[0] || '';
    const finalDpjps = cleanDpjps.length > 0 ? cleanDpjps : cleanPrimary ? [cleanPrimary] : [];

    const updatedPatients = patients.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        dpjp: cleanPrimary,
        dpjps: finalDpjps,
      };
    });
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    if (detailPatient && detailPatient.id === patientId) {
      setDetailPatient(prev =>
        prev
          ? {
              ...prev,
              dpjp: cleanPrimary,
              dpjps: finalDpjps,
            }
          : null
      );
    }
    showToast(`Dokter DPJP pasien berhasil diperbarui.`);
  };

  const handleUpdatePatientLabResults = (patientId: string, labResults: string) => {
    const updatedPatients = patients.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        labResults,
      };
    });
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    if (detailPatient && detailPatient.id === patientId) {
      setDetailPatient(prev => (prev ? { ...prev, labResults } : null));
    }
    const pt = patients.find(p => p.id === patientId);
    showToast(`Hasil laboratorium untuk ${pt?.name || 'pasien'} berhasil disimpan.`);
  };

  const handleConfirmDeletePatient = () => {
    if (!patientToDelete) return;
    const ptId = patientToDelete.id;

    const updated = patients.filter(p => p.id !== ptId);
    setPatients(updated);
    storage.savePatients(updated);

    // Also clean up patient's associated vitals, medications, actions, and handovers
    const remainingVitals = vitals.filter(v => v.patientId !== ptId);
    if (remainingVitals.length !== vitals.length) {
      setVitals(remainingVitals);
      storage.saveVitals(remainingVitals);
    }

    const remainingMeds = medications.filter(m => m.patientId !== ptId);
    if (remainingMeds.length !== medications.length) {
      setMedications(remainingMeds);
      storage.saveMedications(remainingMeds);
    }

    const remainingActions = actions.filter(a => a.patientId !== ptId);
    if (remainingActions.length !== actions.length) {
      setActions(remainingActions);
      storage.saveActions(remainingActions);
    }

    const remainingHandovers = handovers.filter(h => h.patientId !== ptId);
    if (remainingHandovers.length !== handovers.length) {
      setHandovers(remainingHandovers);
      storage.saveHandovers(remainingHandovers);
    }

    showToast(`Data pasien ${patientToDelete.name} telah dihapus.`, 'info');
    setPatientToDelete(null);
    setDetailPatient(null);
  };

  const handleConfirmStatusChange = (
    patientId: string,
    statusType: StatusChangeType,
    details: {
      date: string;
      time: string;
      targetWard?: string;
      targetBed?: string;
      keepActive?: boolean;
      notes: string;
    }
  ) => {
    const target = patients.find(p => p.id === patientId);
    if (!target) return;

    let updatedPatient: Patient;
    let logDescription = '';

    if (statusType === 'pulang') {
      updatedPatient = {
        ...target,
        lifeStatus: 'pulang',
        dischargeDate: details.date,
        dischargeTime: details.time,
        dischargeNotes: details.notes,
      };
      logDescription = `Pasien ${target.name} dinyatakan Pulang (KRS). Keterangan: ${details.notes}`;
    } else if (statusType === 'pindah') {
      const isKeepActive = details.keepActive !== false;
      const newRoom = details.targetWard || target.room;
      const newBed = details.targetBed || target.bed;
      updatedPatient = {
        ...target,
        room: newRoom,
        bed: newBed,
        lifeStatus: isKeepActive ? 'aktif' : 'pindah',
        transferWard: details.targetWard,
        transferDate: details.date,
        transferTime: details.time,
        transferNotes: details.notes,
      };
      logDescription = `Pasien ${target.name} dipindahkan ke ${newRoom} (${newBed}). Keterangan: ${details.notes}`;
    } else {
      updatedPatient = {
        ...target,
        lifeStatus: 'meninggal',
        deceasedDate: details.date,
        deceasedTime: details.time,
        deceasedNotes: details.notes,
      };
      logDescription = `Pencatatan klinis pasien meninggal dunia: ${target.name}. Keterangan: ${details.notes}`;
    }

    const updatedList = patients.map(p => (p.id === patientId ? updatedPatient : p));
    setPatients(updatedList);
    storage.savePatients(updatedList);

    if (detailPatient && detailPatient.id === patientId) {
      if (updatedPatient.lifeStatus === 'aktif') {
        setDetailPatient(updatedPatient);
      } else {
        setDetailPatient(null);
      }
    }

    storage.addAuditLog('STATUS_CHANGE', logDescription, target.rmNumber, userSession);
    showToast(
      statusType === 'pindah'
        ? `Pasien ${target.name} berhasil dipindahkan ke ${updatedPatient.room} (${updatedPatient.bed}).`
        : `Status pasien ${target.name} diubah menjadi ${statusType.toUpperCase()}.`
    );
    setStatusModalTarget(null);
  };

  // ==========================================
  // VITAL SIGNS (TTV TERBARU) HANDLER
  // ==========================================
  const handleSaveVital = (
    vitalData: Omit<VitalSign, 'id'>,
    patientId: string,
    existingVitalId?: string
  ) => {
    let updatedVitals: VitalSign[];
    if (existingVitalId) {
      updatedVitals = vitals.map(v =>
        v.id === existingVitalId ? { ...vitalData, id: existingVitalId, patientId } : v
      );
    } else {
      const newVital: VitalSign = {
        ...vitalData,
        id: `v-${Date.now()}`,
        patientId,
      };
      updatedVitals = [newVital, ...vitals];
    }
    setVitals(updatedVitals);
    storage.saveVitals(updatedVitals);

    // Update patient's active TTV and complaint values
    const updatedPatients = patients.map(p =>
      p.id === patientId
        ? {
            ...p,
            bpSystolic: vitalData.bpSystolic,
            bpDiastolic: vitalData.bpDiastolic,
            heartRate: vitalData.heartRate,
            respiratoryRate: vitalData.respiratoryRate,
            temperature: vitalData.temperature,
            spo2: vitalData.spo2,
            gds: vitalData.gds !== undefined ? vitalData.gds : p.gds,
            complaint: vitalData.complaint !== undefined ? vitalData.complaint : p.complaint,
          }
        : p
    );
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    if (detailPatient && detailPatient.id === patientId) {
      setDetailPatient(prev =>
        prev
          ? {
              ...prev,
              bpSystolic: vitalData.bpSystolic,
              bpDiastolic: vitalData.bpDiastolic,
              heartRate: vitalData.heartRate,
              respiratoryRate: vitalData.respiratoryRate,
              temperature: vitalData.temperature,
              spo2: vitalData.spo2,
              gds: vitalData.gds !== undefined ? vitalData.gds : prev.gds,
              complaint: vitalData.complaint !== undefined ? vitalData.complaint : prev.complaint,
            }
          : null
      );
    }

    const pt = patients.find(p => p.id === patientId);
    showToast(
      existingVitalId
        ? `Riwayat TTV pasien ${pt?.name || ''} berhasil diperbarui.`
        : `TTV terbaru pasien ${pt?.name || ''} berhasil disimpan.`
    );
  };

  const handleSaveGds = (
    patientId: string,
    gdsValue: number,
    timestamp: string,
    conditionOrNotes?: string
  ) => {
    const pt = patients.find(p => p.id === patientId);

    // 1. Update patient's current GDS value
    const updatedPatients = patients.map(p =>
      p.id === patientId ? { ...p, gds: gdsValue } : p
    );
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    if (detailPatient && detailPatient.id === patientId) {
      setDetailPatient(prev => (prev ? { ...prev, gds: gdsValue } : null));
    }

    // 2. Save to dedicated GdsRecord (Rekapan Khusus GDS - Terpisah dari TTV)
    storage.addGdsRecord({
      patientId,
      timestamp,
      gds: gdsValue,
      condition: conditionOrNotes || 'GDS Sewaktu',
      nurseName: userSession.nurseName,
      notes: conditionOrNotes || undefined,
    });
    setGdsRecords(storage.getGdsRecords());

    showToast(`GDS ${gdsValue} mg/dL untuk pasien ${pt?.name || ''} berhasil dicatat.`);
    setIsGdsModalOpen(false);
    setGdsModalPatient(null);
  };

  const handleDeleteGdsRecord = (recordId: string, patientId: string) => {
    storage.deleteGdsRecord(recordId);
    const updatedRecords = storage.getGdsRecords();
    setGdsRecords(updatedRecords);

    // Refresh patient's latest GDS if needed
    const remainingForPt = updatedRecords
      .filter(r => r.patientId === patientId)
      .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    const latestGds = remainingForPt[0]?.gds;

    const updatedPatients = patients.map(p =>
      p.id === patientId ? { ...p, gds: latestGds } : p
    );
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    if (detailPatient && detailPatient.id === patientId) {
      setDetailPatient(prev => (prev ? { ...prev, gds: latestGds } : null));
    }
    showToast('Catatan hasil GDS berhasil dihapus.');
  };

  const handleDeleteVital = (vitalId: string, patientId: string) => {
    const updatedVitals = vitals.filter(v => v.id !== vitalId);
    setVitals(updatedVitals);
    storage.saveVitals(updatedVitals);

    // Refresh patient's latest TTV if the deleted entry was the latest
    const remainingForPatient = updatedVitals
      .filter(v => v.patientId === patientId)
      .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    const latest = remainingForPatient[0];

    if (latest) {
      const updatedPatients = patients.map(p =>
        p.id === patientId
          ? {
              ...p,
              bpSystolic: latest.bpSystolic,
              bpDiastolic: latest.bpDiastolic,
              heartRate: latest.heartRate,
              respiratoryRate: latest.respiratoryRate,
              temperature: latest.temperature,
              spo2: latest.spo2,
              gds: latest.gds,
            }
          : p
      );
      setPatients(updatedPatients);
      storage.savePatients(updatedPatients);
    }
    showToast('Rekaman TTV berhasil dihapus.', 'info');
  };

  // ==========================================
  // PATIENT MEDICATION CRUD (TAMBAH & HAPUS OBAT)
  // ==========================================
  const handleOpenAddMedication = (patient: Patient) => {
    setMedicationTargetPatient(patient);
    setEditingMedication(null);
    setIsMedicationModalOpen(true);
  };

  const handleOpenEditMedication = (med: PatientMedication) => {
    const target = patients.find(p => p.id === med.patientId) || detailPatient;
    setMedicationTargetPatient(target || null);
    setEditingMedication(med);
    setIsMedicationModalOpen(true);
  };

  const handleSaveMedication = (
    medData: Omit<PatientMedication, 'id'>,
    existingId?: string
  ) => {
    const targetPatient =
      patients.find(p => p.id === medData.patientId) || detailPatient;

    if (existingId) {
      const updated = medications.map(m =>
        m.id === existingId ? { ...medData, id: existingId } : m
      );
      setMedications(updated);
      storage.saveMedications(updated);
      showToast(`Terapi obat ${medData.name} berhasil diperbarui.`);
    } else {
      const newMed: PatientMedication = {
        ...medData,
        id: `med-${Date.now()}`,
      };
      const updated = [newMed, ...medications];
      setMedications(updated);
      storage.saveMedications(updated);
      showToast(`Terapi obat ${newMed.name} berhasil ditambahkan.`);
    }

    setIsMedicationModalOpen(false);
    setEditingMedication(null);
  };

  const handleRequestDeleteMedication = (med: PatientMedication) => {
    setMedicationToDelete(med);
  };

  const handleConfirmDeleteMedication = () => {
    if (!medicationToDelete) return;
    const targetPatient =
      patients.find(p => p.id === medicationToDelete.patientId) || detailPatient;
    const updated = medications.filter(m => m.id !== medicationToDelete.id);
    setMedications(updated);
    storage.saveMedications(updated);

    showToast(
      `Obat ${medicationToDelete.name} telah dihapus dari daftar terapi.`,
      'info'
    );
    setMedicationToDelete(null);
  };

  // ==========================================
  // NURSING ACTION CRUD (TAMBAH, TOGGLE, HAPUS TINDAKAN KEPERAWATAN)
  // ==========================================
  const handleSaveAction = (
    actionData: Omit<NursingAction, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updated = actions.map(a =>
        a.id === existingId ? { ...actionData, id: existingId } : a
      );
      setActions(updated);
      storage.saveActions(updated);
      showToast(`Tindakan "${actionData.title}" berhasil diperbarui.`);
    } else {
      const newAction: NursingAction = {
        ...actionData,
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      };
      const updated = [newAction, ...actions];
      setActions(updated);
      storage.saveActions(updated);
      const targetPt = patients.find(p => p.id === actionData.patientId);
      showToast(
        `Tindakan "${newAction.title}" untuk ${targetPt?.name || 'pasien'} berhasil dicatat.`
      );
    }
  };

  const handleToggleActionComplete = (actionId: string) => {
    const target = actions.find(a => a.id === actionId);
    if (!target) return;
    const nowTimestamp = `${new Date().toISOString().split('T')[0]} ${String(
      new Date().getHours()
    ).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    const newCompleted = !target.completed;
    const updated = actions.map(a =>
      a.id === actionId
        ? {
            ...a,
            completed: newCompleted,
            completedAt: newCompleted ? nowTimestamp : undefined,
          }
        : a
    );
    setActions(updated);
    storage.saveActions(updated);

    showToast(
      newCompleted
        ? `Tindakan "${target.title}" ditandai sudah dilakukan.`
        : `Status tindakan "${target.title}" diubah ke pending.`,
      newCompleted ? 'success' : 'info'
    );
  };

  const handleDeleteAction = (actionId: string) => {
    const target = actions.find(a => a.id === actionId);
    const updated = actions.filter(a => a.id !== actionId);
    setActions(updated);
    storage.saveActions(updated);
    showToast(`Tindakan "${target?.title || ''}" berhasil dihapus.`, 'info');
  };

  // ==========================================
  // NURSE SHIFT ARRANGEMENT HANDLERS (ATUR SHIFT PERAWAT)
  // ==========================================
  const handleUpdateNurseShift = (nurseId: string, newShift: ShiftType) => {
    const updated = nurses.map(n =>
      n.id === nurseId ? { ...n, currentShift: newShift } : n
    );
    setNurses(updated);
    storage.saveNurses(updated);
    const targetNurse = nurses.find(n => n.id === nurseId);
    showToast(
      `Shift ${targetNurse?.name || 'Perawat'} berhasil diatur ke ${newShift.split(' ')[0]}.`
    );
  };

  const handleToggleNurseActive = (nurseId: string) => {
    const updated = nurses.map(n =>
      n.id === nurseId ? { ...n, isActive: !n.isActive } : n
    );
    setNurses(updated);
    storage.saveNurses(updated);
    const targetNurse = updated.find(n => n.id === nurseId);
    showToast(
      `Status dinas ${targetNurse?.name || 'Perawat'}: ${targetNurse?.isActive ? 'Aktif Dinas' : 'Libur / Off'}.`
    );
  };

  const handleAssignPatientsToNurse = (nurseName: string, patientIds: string[]) => {
    const updated = patients.map(p => {
      if (patientIds.includes(p.id)) {
        return { ...p, nurseInCharge: nurseName };
      } else if (p.nurseInCharge === nurseName) {
        return { ...p, nurseInCharge: undefined };
      }
      return p;
    });
    setPatients(updated);
    storage.savePatients(updated);
    showToast(`Daftar pasien yang dipegang ${nurseName} berhasil diperbarui.`);
  };

  const handleUnassignPatientFromNurse = (patientId: string, nurseName?: string) => {
    const targetPt = patients.find(p => p.id === patientId);
    const updated = patients.map(p =>
      p.id === patientId ? { ...p, nurseInCharge: undefined } : p
    );
    setPatients(updated);
    storage.savePatients(updated);
    showToast(
      `Pasien ${targetPt?.name || ''} telah dilepas dari asuhan ${nurseName || 'perawat'}. Data rekam medis tetap tersimpan aman.`,
      'info'
    );
    if (detailPatient && detailPatient.id === patientId) {
      setDetailPatient({ ...detailPatient, nurseInCharge: undefined });
    }
  };

  // ==========================================
  // DOCTOR DPJP CRUD
  // ==========================================
  const handleSaveDoctor = (doctorData: Omit<DoctorDPJP, 'id'>, existingId?: string) => {
    const trimmedName = doctorData.name.trim();

    // Tolak nama dokter yang terdouble
    const isDuplicate = doctors.some(
      d => d.name.trim().toLowerCase() === trimmedName.toLowerCase() && d.id !== existingId
    );
    if (isDuplicate) {
      showToast(`Dokter dengan nama "${trimmedName}" sudah terdaftar dalam sistem!`, 'error');
      return;
    }

    if (existingId) {
      const oldDoc = doctors.find(d => d.id === existingId);
      const oldName = oldDoc?.name;
      const updated = doctors.map(d =>
        d.id === existingId ? { ...doctorData, id: existingId } : d
      );
      setDoctors(updated);
      storage.saveDoctors(updated);

      // If doctor name was edited, also update patient records
      if (oldName && oldName !== doctorData.name) {
        const updatedPatients = patients.map(p => {
          const hasDpjp = p.dpjp === oldName;
          const hasDpjps = p.dpjps?.includes(oldName);
          if (!hasDpjp && !hasDpjps) return p;
          return {
            ...p,
            dpjp: p.dpjp === oldName ? doctorData.name : p.dpjp,
            dpjps: (p.dpjps || []).map(d => (d === oldName ? doctorData.name : d)),
          };
        });
        setPatients(updatedPatients);
        storage.savePatients(updatedPatients);
      }

      showToast(`Data dokter ${doctorData.name} berhasil diperbarui.`);
    } else {
      const newDoc: DoctorDPJP = {
        ...doctorData,
        id: `doc-${Date.now()}`,
      };
      const updated = [...doctors, newDoc];
      setDoctors(updated);
      storage.saveDoctors(updated);
      showToast(`Dokter ${newDoc.name} berhasil ditambahkan.`);
    }
    setIsDoctorFormOpen(false);
    setEditingDoctor(null);
  };

  const handleConfirmDeleteDoctor = () => {
    if (!doctorToDelete) return;
    const docName = doctorToDelete.name;
    const updated = doctors.filter(d => d.id !== doctorToDelete.id);
    setDoctors(updated);
    storage.saveDoctors(updated);

    // Also remove deleted doctor from patients dpjps and dpjp
    const updatedPatients = patients.map(p => {
      const hasDpjp = p.dpjp === docName;
      const hasDpjps = p.dpjps?.includes(docName);
      if (!hasDpjp && !hasDpjps) return p;
      const newDpjps = (p.dpjps || []).filter(d => d !== docName);
      return {
        ...p,
        dpjp: p.dpjp === docName ? (newDpjps[0] || '') : p.dpjp,
        dpjps: newDpjps,
      };
    });
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    showToast(`Dokter ${doctorToDelete.name} telah dihapus.`, 'info');
    setDoctorToDelete(null);
  };

  // ==========================================
  // NURSE CRUD & DUTY SELECTION (MULTI-PERAWAT DINAS)
  // ==========================================
  const handleSelectNurseAndShift = (nurse: Nurse, shift: ShiftType) => {
    let activeNames = userSession.activeNurseNames || [userSession.nurseName];
    if (!activeNames.includes(nurse.name)) {
      activeNames = [...activeNames, nurse.name];
    }
    const updatedNurses = nurses.map(n =>
      n.id === nurse.id ? { ...n, isOnDuty: true } : n
    );
    setNurses(updatedNurses);
    storage.saveNurses(updatedNurses);

    const newSession: UserSession = {
      nurseName: nurse.name,
      role: nurse.role,
      shift,
      ward: nurse.ward || userSession.ward,
      activeNurseNames: activeNames,
    };
    setUserSession(newSession);
    storage.saveUserSession(newSession);
    showToast(`${nurse.name} aktif bertugas pada shift ${shift.split(' ')[0]}.`);
  };

  const handleToggleNurseDuty = (nurse: Nurse) => {
    const isCurrentlyOnDuty =
      Boolean(nurse.isOnDuty) ||
      Boolean(userSession.activeNurseNames?.includes(nurse.name));
    const newDutyStatus = !isCurrentlyOnDuty;

    // 1. Update nurse record
    const updatedNurses = nurses.map(n =>
      n.id === nurse.id ? { ...n, isOnDuty: newDutyStatus } : n
    );
    setNurses(updatedNurses);
    storage.saveNurses(updatedNurses);

    // 2. Update userSession activeNurseNames
    let activeNames = userSession.activeNurseNames || [userSession.nurseName];
    if (newDutyStatus) {
      if (!activeNames.includes(nurse.name)) {
        activeNames = [...activeNames, nurse.name];
      }
    } else {
      activeNames = activeNames.filter(name => name !== nurse.name);
    }

    // Ensure at least one primary nurse remains
    let primaryName = userSession.nurseName;
    let primaryRole = userSession.role;
    if (!newDutyStatus && primaryName === nurse.name) {
      const remainingNurse = updatedNurses.find(
        n => n.currentShift === nurse.currentShift && n.isOnDuty
      );
      if (remainingNurse) {
        primaryName = remainingNurse.name;
        primaryRole = remainingNurse.role;
      }
    } else if (newDutyStatus && activeNames.length === 1) {
      primaryName = nurse.name;
      primaryRole = nurse.role;
    }

    const newSession: UserSession = {
      ...userSession,
      nurseName: primaryName,
      role: primaryRole,
      activeNurseNames: activeNames,
    };
    setUserSession(newSession);
    storage.saveUserSession(newSession);

    showToast(
      newDutyStatus
        ? `${nurse.name} ditambahkan ke tim perawat yang bertugas.`
        : `${nurse.name} dilepas dari dinas aktif.`,
      newDutyStatus ? 'success' : 'info'
    );
  };

  const handleSetPrimaryDutyNurse = (nurse: Nurse) => {
    let activeNames = userSession.activeNurseNames || [userSession.nurseName];
    if (!activeNames.includes(nurse.name)) {
      activeNames = [...activeNames, nurse.name];
    }
    const updatedNurses = nurses.map(n =>
      n.id === nurse.id ? { ...n, isOnDuty: true } : n
    );
    setNurses(updatedNurses);
    storage.saveNurses(updatedNurses);

    const newSession: UserSession = {
      ...userSession,
      nurseName: nurse.name,
      role: nurse.role,
      shift: nurse.currentShift,
      ward: nurse.ward || userSession.ward,
      activeNurseNames: activeNames,
    };
    setUserSession(newSession);
    storage.saveUserSession(newSession);
    showToast(`${nurse.name} ditetapkan sebagai operator utama sesi.`);
  };

  const handleSetAllShiftDuty = (shift: ShiftType, dutyState: boolean) => {
    const shiftNurses = nurses.filter(n => n.currentShift === shift);
    const shiftNurseNames = shiftNurses.map(n => n.name);

    const updatedNurses = nurses.map(n => {
      if (n.currentShift === shift) {
        return { ...n, isOnDuty: dutyState };
      }
      return n;
    });
    setNurses(updatedNurses);
    storage.saveNurses(updatedNurses);

    let activeNames = userSession.activeNurseNames || [userSession.nurseName];
    if (dutyState) {
      activeNames = Array.from(new Set([...activeNames, ...shiftNurseNames]));
    } else {
      activeNames = activeNames.filter(name => !shiftNurseNames.includes(name));
    }

    const firstActiveInShift = updatedNurses.find(
      n => n.currentShift === shift && n.isOnDuty
    );
    const newSession: UserSession = {
      ...userSession,
      shift,
      nurseName: firstActiveInShift ? firstActiveInShift.name : userSession.nurseName,
      role: firstActiveInShift ? firstActiveInShift.role : userSession.role,
      activeNurseNames: activeNames,
    };
    setUserSession(newSession);
    storage.saveUserSession(newSession);

    showToast(
      dutyState
        ? `Semua perawat ${shift.split(' ')[0]} (${shiftNurses.length} orang) aktif bertugas.`
        : `Pilihan dinas perawat ${shift.split(' ')[0]} telah direset.`
    );
  };

  const handleSaveNurse = (nurseData: Omit<Nurse, 'id'>, existingId?: string) => {
    try {
      const trimmedName = nurseData.name.trim();

      // Tolak nama perawat yang terdouble
      const isDuplicate = nurses.some(
        n => n.name.trim().toLowerCase() === trimmedName.toLowerCase() && n.id !== existingId
      );
      if (isDuplicate) {
        showToast(`Perawat dengan nama "${trimmedName}" sudah terdaftar dalam sistem!`, 'error');
        return;
      }

      if (existingId) {
        const updated = nurses.map(n =>
          n.id === existingId
            ? {
                ...n,
                ...nurseData,
                id: existingId,
                name: nurseData.name.trim(),
                isOnDuty: nurseData.isOnDuty !== undefined ? nurseData.isOnDuty : n.isOnDuty,
              }
            : n
        );
        setNurses(updated);
        storage.saveNurses(updated);

        // If the edited nurse is the active session user, update session details too
        if (userSession.nurseName === nurseData.name || existingId === editingNurse?.id) {
          const newSession: UserSession = {
            ...userSession,
            nurseName: nurseData.name.trim(),
            role: nurseData.role,
            ward: nurseData.ward || userSession.ward,
          };
          setUserSession(newSession);
          storage.saveUserSession(newSession);
        }

        showToast(`Data perawat ${nurseData.name} berhasil diperbarui.`);
      } else {
        const newNurse: Nurse = {
          ...nurseData,
          id: `nurse-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: nurseData.name.trim(),
          isOnDuty: Boolean(nurseData.isOnDuty),
        };
        const updated = [...nurses, newNurse];
        setNurses(updated);
        storage.saveNurses(updated);

        // If newly registered nurse was marked on-duty, append to active duty session
        if (newNurse.isOnDuty) {
          const currentActive = userSession.activeNurseNames || [userSession.nurseName];
          if (!currentActive.includes(newNurse.name)) {
            const updatedActive = [...currentActive, newNurse.name];
            const newSession: UserSession = {
              ...userSession,
              activeNurseNames: updatedActive,
            };
            setUserSession(newSession);
            storage.saveUserSession(newSession);
          }
        }

        showToast(`Perawat ${newNurse.name} berhasil didaftarkan ke sistem.`);
      }
      setIsNurseFormOpen(false);
      setEditingNurse(null);
    } catch (err) {
      console.error('Error saving nurse:', err);
      showToast('Terjadi kesalahan saat menyimpan data perawat.', 'error');
    }
  };

  const handleConfirmDeleteNurse = () => {
    if (!nurseToDelete) return;
    const deletedId = nurseToDelete.id;
    const deletedName = nurseToDelete.name;

    const updated = nurses.filter(n => n.id !== deletedId);
    setNurses(updated);
    storage.saveNurses(updated);

    // Clear deleted nurse from any patients currently assigned
    const updatedPatients = patients.map(p =>
      p.nurseInCharge === deletedName ? { ...p, nurseInCharge: undefined } : p
    );
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    if (detailPatient && detailPatient.nurseInCharge === deletedName) {
      setDetailPatient({ ...detailPatient, nurseInCharge: undefined });
    }

    // Safely update userSession if deleted nurse was primary or in active duty list
    let nextNurseName = userSession.nurseName;
    let nextRole = userSession.role;
    let nextActiveNurseNames = (userSession.activeNurseNames || []).filter(
      name => name !== deletedName
    );

    if (userSession.nurseName === deletedName) {
      if (updated.length > 0) {
        nextNurseName = updated[0].name;
        nextRole = updated[0].role;
        if (!nextActiveNurseNames.includes(nextNurseName)) {
          nextActiveNurseNames = [nextNurseName, ...nextActiveNurseNames];
        }
      } else {
        nextNurseName = 'Perawat Bertugas';
        nextActiveNurseNames = ['Perawat Bertugas'];
      }
    }

    const newSession: UserSession = {
      ...userSession,
      nurseName: nextNurseName,
      role: nextRole,
      activeNurseNames: nextActiveNurseNames.length > 0 ? nextActiveNurseNames : [nextNurseName],
    };
    setUserSession(newSession);
    storage.saveUserSession(newSession);

    showToast(`Data perawat ${deletedName} berhasil dihapus.`, 'info');
    setNurseToDelete(null);
  };

  const handleDeleteMultipleNurses = (nurseIds: string[]) => {
    if (nurseIds.length === 0) return;

    const targetNurses = nurses.filter(n => nurseIds.includes(n.id));
    const targetNames = targetNurses.map(n => n.name);

    const updated = nurses.filter(n => !nurseIds.includes(n.id));
    setNurses(updated);
    storage.saveNurses(updated);

    // Clear deleted nurses from patients
    const updatedPatients = patients.map(p =>
      p.nurseInCharge && targetNames.includes(p.nurseInCharge)
        ? { ...p, nurseInCharge: undefined }
        : p
    );
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    if (detailPatient && detailPatient.nurseInCharge && targetNames.includes(detailPatient.nurseInCharge)) {
      setDetailPatient({ ...detailPatient, nurseInCharge: undefined });
    }

    // Safely update userSession if any deleted nurse was active
    let nextNurseName = userSession.nurseName;
    let nextRole = userSession.role;
    let nextActiveNurseNames = (userSession.activeNurseNames || []).filter(
      name => !targetNames.includes(name)
    );

    if (targetNames.includes(userSession.nurseName)) {
      if (updated.length > 0) {
        nextNurseName = updated[0].name;
        nextRole = updated[0].role;
        if (!nextActiveNurseNames.includes(nextNurseName)) {
          nextActiveNurseNames = [nextNurseName, ...nextActiveNurseNames];
        }
      } else {
        nextNurseName = 'Perawat Bertugas';
        nextActiveNurseNames = ['Perawat Bertugas'];
      }
    }

    const newSession: UserSession = {
      ...userSession,
      nurseName: nextNurseName,
      role: nextRole,
      activeNurseNames: nextActiveNurseNames.length > 0 ? nextActiveNurseNames : [nextNurseName],
    };
    setUserSession(newSession);
    storage.saveUserSession(newSession);

    showToast(`${nurseIds.length} perawat yang ditandai berhasil dihapus.`, 'info');
  };

  const handleClearDemoNurses = () => {
    const remaining = storage.clearDemoNurses();
    setNurses(remaining);

    // Unassign demo nurses from active patients
    const demoNames = new Set(
      [
        'Ns. Ratna Dewi, S.Kep',
        'Ns. Budi Santoso, S.Kep',
        'Ns. Siti Rahmah, S.Kep',
        'Ns. Dimas Pratama, S.Kep',
        'Ns. Hj. Mariana, S.Kep., M.Kep',
      ].map(s => s.trim().toLowerCase())
    );

    const updatedPatients = patients.map(p =>
      p.nurseInCharge && demoNames.has(p.nurseInCharge.trim().toLowerCase())
        ? { ...p, nurseInCharge: undefined }
        : p
    );
    setPatients(updatedPatients);
    storage.savePatients(updatedPatients);

    if (detailPatient && detailPatient.nurseInCharge && demoNames.has(detailPatient.nurseInCharge.trim().toLowerCase())) {
      setDetailPatient({ ...detailPatient, nurseInCharge: undefined });
    }

    // Safely update userSession
    let nextNurseName = userSession.nurseName;
    let nextRole = userSession.role;
    if (demoNames.has(userSession.nurseName.trim().toLowerCase())) {
      if (remaining.length > 0) {
        nextNurseName = remaining[0].name;
        nextRole = remaining[0].role;
      } else {
        nextNurseName = 'Perawat Bertugas';
        nextRole = 'Perawat Pelaksana';
      }
    }

    const filteredActive = (userSession.activeNurseNames || []).filter(
      n => !demoNames.has(n.trim().toLowerCase())
    );

    const newSession: UserSession = {
      ...userSession,
      nurseName: nextNurseName,
      role: nextRole,
      activeNurseNames: filteredActive.length > 0 ? filteredActive : [nextNurseName],
    };
    setUserSession(newSession);
    storage.saveUserSession(newSession);

    showToast('Perawat bawaan / contoh berhasil dibersihkan. Roster hanya menampilkan perawat ruangan Anda.');
  };

  // ==========================================
  // WARD (BANGSAL) CRUD
  // ==========================================
  const handleSaveWard = (wardData: Omit<Ward, 'id'>, existingId?: string) => {
    if (existingId) {
      const updated = wards.map(w =>
        w.id === existingId ? { ...wardData, id: existingId } : w
      );
      setWards(updated);
      storage.saveWards(updated);
      showToast(`Bangsal ${wardData.name} diperbarui.`);
    } else {
      const newWard: Ward = {
        ...wardData,
        id: `ward-${Date.now()}`,
      };
      const updated = [...wards, newWard];
      setWards(updated);
      storage.saveWards(updated);
      showToast(`Bangsal ${newWard.name} berhasil ditambahkan.`);
    }
    setIsWardFormOpen(false);
    setEditingWard(null);
  };

  const handleDeleteWardRequest = (ward: Ward) => {
    // Check if any active patient is currently assigned to this ward
    const activePatientsInWard = patients.filter(
      p => p.lifeStatus === 'aktif' && p.room === ward.name
    );

    if (activePatientsInWard.length > 0) {
      showToast(
        `Tidak dapat menghapus ${ward.name}! Masih terdapat ${activePatientsInWard.length} pasien aktif. Pindahkan pasien terlebih dahulu.`,
        'error'
      );
      return;
    }

    setWardToDelete(ward);
  };

  const handleConfirmDeleteWard = () => {
    if (!wardToDelete) return;
    const updated = wards.filter(w => w.id !== wardToDelete.id);
    setWards(updated);
    storage.saveWards(updated);
    showToast(`Bangsal ${wardToDelete.name} telah dihapus.`, 'info');
    setWardToDelete(null);
  };

  // ==========================================
  // HANDOVER SAVING
  // ==========================================
  const handleSaveHandover = (handoverData: Omit<SBARHandover, 'id'>) => {
    const newHandover: SBARHandover = {
      ...handoverData,
      id: `h-${Date.now()}`,
      verifiedByKaru: true,
    };
    const updated = [newHandover, ...handovers];
    setHandovers(updated);
    storage.saveHandovers(updated);

    showToast('Timbang terima handover berhasil disimpan.');
  };

  const handleToggleVerifyHandover = (handoverId: string) => {
    const updated = handovers.map(h =>
      h.id === handoverId ? { ...h, verifiedByKaru: !h.verifiedByKaru } : h
    );
    setHandovers(updated);
    storage.saveHandovers(updated);
    const target = updated.find(h => h.id === handoverId);
    showToast(
      target?.verifiedByKaru
        ? 'Timbang terima SBAR berhasil diverifikasi.'
        : 'Status verifikasi timbang terima dibatalkan.'
    );
  };

  const pendingActionsCount = actions.filter(a => !a.completed).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center text-slate-800">
      {/* Toast Alert Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Main Container: Responsive Single-Page Dashboard (max-w-6xl for desktop, max-w-md on mobile) */}
      <div className="w-full max-w-6xl min-h-screen bg-slate-50 flex flex-col shadow-sm relative">
        
        {/* Top Header Bar (Includes live date/time, active nurse/shift, and desktop horizontal menu) */}
        <Header
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          userSession={userSession}
          onOpenSOP={() => setIsSopOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSwitchNurse={() => setIsSwitchNurseModalOpen(true)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          onOpenSplashScreen={() => setShowSplashScreen(true)}
          pendingActionsCount={pendingActionsCount}
        />

        {/* Dynamic Screen Content: Single Page Dashboard (No Left Sidebar!) */}
        <main className="flex-1 p-3.5 sm:p-5 max-w-6xl mx-auto w-full">
          {currentTab === 'beranda' && (
            <HomeView
              patients={patients}
              actions={actions}
              soaps={soaps}
              handovers={handovers}
              userSession={userSession}
              onNavigate={setCurrentTab}
              onOpenAddPatient={() => {
                setEditingPatient(null);
                setIsPatientFormOpen(true);
              }}
              onOpenAddVital={(pt?: Patient, existingVital?: VitalSign) => {
                setVitalModalPatient(pt || null);
                setVitalModalInitial(existingVital || null);
                setIsVitalModalOpen(true);
              }}
              onOpenAddGds={pt => {
                setGdsModalPatient(pt || null);
                setIsGdsModalOpen(true);
              }}
              onOpenAddMedication={pt => {
                setMedicationTargetPatient(pt || null);
                setEditingMedication(null);
                setIsMedicationModalOpen(true);
              }}
              onOpenAddAction={pt => {
                setActionModalPatient(pt || null);
                setIsActionModalOpen(true);
              }}
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
              onOpenSplashScreen={() => setShowSplashScreen(true)}
              onSelectPatientDetail={pt => setDetailPatient(pt)}
            />
          )}

          {currentTab === 'dpjp' && (
            <DpjpView
              doctors={doctors}
              patients={patients}
              wards={wards}
              vitals={vitals}
              medications={medications}
              actions={actions}
              onOpenAddDoctor={() => {
                setEditingDoctor(null);
                setIsDoctorFormOpen(true);
              }}
              onEditDoctor={doc => {
                setEditingDoctor(doc);
                setIsDoctorFormOpen(true);
              }}
              onDeleteDoctor={doc => setDoctorToDelete(doc)}
              onOpenAddPatient={() => {
                setEditingPatient(null);
                setIsPatientFormOpen(true);
              }}
              onOpenAddVital={pt => {
                setVitalModalPatient(pt || null);
                setIsVitalModalOpen(true);
              }}
              onOpenAddMedication={pt => {
                setMedicationTargetPatient(pt || null);
                setEditingMedication(null);
                setIsMedicationModalOpen(true);
              }}
              onOpenAddAction={pt => {
                setActionModalPatient(pt || null);
                setIsActionModalOpen(true);
              }}
              onUpdatePlannedActions={handleUpdatePlannedActions}
              onUpdatePatientDpjp={handleUpdatePatientDpjp}
              onSaveAction={handleSaveAction}
              onSelectPatientDetail={pt => setDetailPatient(pt)}
            />
          )}

          {currentTab === 'perawat' && (
            <NurseShiftView
              nurses={nurses}
              patients={patients}
              wards={wards}
              userSession={userSession}
              onUpdateNurseShift={handleUpdateNurseShift}
              onToggleNurseActive={handleToggleNurseActive}
              onAssignPatientsToNurse={handleAssignPatientsToNurse}
              onUnassignPatientFromNurse={handleUnassignPatientFromNurse}
              onSelectPatientDetail={pt => setDetailPatient(pt)}
              onOpenAddNurse={(defaultShift, defaultWard) => {
                setNurseDefaultShift(defaultShift);
                setNurseDefaultWard(defaultWard);
                setEditingNurse(null);
                setIsNurseFormOpen(true);
              }}
              onEditNurse={nurse => {
                setEditingNurse(nurse);
                setNurseDefaultShift(nurse.currentShift);
                setNurseDefaultWard(nurse.ward);
                setIsNurseFormOpen(true);
              }}
              onDeleteNurse={nurse => setNurseToDelete(nurse)}
              onDeleteMultipleNurses={handleDeleteMultipleNurses}
              onClearDemoNurses={handleClearDemoNurses}
            />
          )}

          {currentTab === 'handover' && (
            <HandoverView
              patients={patients}
              nurses={nurses}
              handovers={handovers}
              actions={actions}
              vitals={vitals}
              medications={medications}
              userSession={userSession}
              initialSelectedPatientId={handoverTargetPatientId}
              initialSelectedVital={handoverPrefilledVital}
              onSaveHandover={handleSaveHandover}
              onSelectPatientDetail={pt => setDetailPatient(pt)}
              onToggleVerify={handleToggleVerifyHandover}
            />
          )}

          {currentTab === 'laporan' && (
            <ReportsView
              patients={patients}
              handovers={handovers}
              actions={actions}
              soaps={soaps}
              vitals={vitals}
              wards={wards}
              doctors={doctors}
              userSession={userSession}
              onShowToast={showToast}
            />
          )}
        </main>

        {/* Footer Attribution */}
        <footer className="w-full py-3.5 px-4 text-center text-xs text-slate-500 border-t border-slate-200 mt-auto bg-slate-50/50">
          <p className="font-bold text-slate-700">
            ETAM CARE – Integrated Nursing Management System · <span className="text-emerald-700">RSUD AM Parikesit</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            RSUD Aji Muhammad Parikesit Kutai Kartanegara &amp; Universitas Muhammadiyah Kalimantan Timur
          </p>
        </footer>

        {/* 6-Item Mobile Bottom Navigation Bar */}
        <BottomNav
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          pendingActionsCount={pendingActionsCount}
        />

        {/* ========================================== */}
        {/* MODALS & POP-UPS (Clean Single-Page Flow) */}
        {/* ========================================== */}

        {/* 1. Patient Detail Modal */}
        <PatientDetailModal
          isOpen={!!detailPatient}
          patient={detailPatient}
          doctors={doctors}
          vitals={vitals}
          medications={medications}
          actions={actions}
          soaps={soaps}
          handovers={handovers}
          onClose={() => setDetailPatient(null)}
          onEdit={pt => {
            // Keep detailPatient open so after edit saves or cancels, user stays on the patient detail view
            setEditingPatient(pt);
            setIsPatientFormOpen(true);
          }}
          onOpenStatusModal={(pt, type) => {
            setStatusModalTarget({ patient: pt, type });
          }}
          onDelete={pt => {
            setPatientToDelete(pt);
          }}
          onUnassignNurse={ptId => handleUnassignPatientFromNurse(ptId, detailPatient?.nurseInCharge)}
          onOpenAddVital={(pt, existingVital) => {
            setVitalModalPatient(pt);
            setVitalModalInitial(existingVital || null);
            setIsVitalModalOpen(true);
          }}
          onOpenAddMedication={handleOpenAddMedication}
          onEditMedication={handleOpenEditMedication}
          onDeleteMedication={handleRequestDeleteMedication}
          onUpdatePlannedActions={handleUpdatePlannedActions}
          onUpdatePatientDpjp={handleUpdatePatientDpjp}
          onOpenHandoverWithPatient={(patientId, prefilledVital) => {
            setDetailPatient(null);
            setHandoverTargetPatientId(patientId);
            setHandoverPrefilledVital(prefilledVital || null);
            setCurrentTab('handover');
          }}
          onSaveAction={handleSaveAction}
          onToggleActionComplete={handleToggleActionComplete}
          onDeleteAction={handleDeleteAction}
          currentNurseName={userSession.nurseName}
          currentShift={userSession.shift}
        />

        {/* 1b. Medication Form Modal (Tambah & Edit Obat) */}
        <MedicationModal
          isOpen={isMedicationModalOpen}
          patient={medicationTargetPatient || detailPatient}
          patients={patients}
          doctors={doctors}
          initialData={editingMedication}
          onClose={() => {
            setIsMedicationModalOpen(false);
            setEditingMedication(null);
            setMedicationTargetPatient(null);
          }}
          onSave={handleSaveMedication}
        />

        {/* 1c. Delete Medication Confirmation Modal */}
        <ConfirmModal
          isOpen={!!medicationToDelete}
          title="Hapus Terapi Obat"
          message={`Apakah Anda yakin ingin menghapus obat ${medicationToDelete?.name} (${medicationToDelete?.dosage}) dari daftar terapi pasien?`}
          confirmLabel="Ya, Hapus Obat"
          cancelLabel="Batal"
          isDestructive={true}
          onConfirm={handleConfirmDeleteMedication}
          onCancel={() => setMedicationToDelete(null)}
        />

        {/* 1d. Nursing Action Modal (Catat Tindakan Pasien Terpilih / Aksi Cepat) */}
        <NursingActionModal
          isOpen={isActionModalOpen}
          patient={actionModalPatient}
          patients={patients}
          actions={actions}
          currentNurseName={userSession.nurseName}
          currentShift={userSession.shift}
          onClose={() => {
            setIsActionModalOpen(false);
            setActionModalPatient(null);
          }}
          onSaveAction={handleSaveAction}
          onToggleComplete={handleToggleActionComplete}
          onDeleteAction={handleDeleteAction}
          onOpenHandoverWithPatient={patientId => {
            setIsActionModalOpen(false);
            setHandoverTargetPatientId(patientId);
            setCurrentTab('handover');
          }}
        />

        {/* 2. Vital Sign Modal (Input TTV Terbaru & Riwayat TTV Pasien) */}
        <VitalSignModal
          isOpen={isVitalModalOpen}
          patient={vitalModalPatient}
          patients={patients}
          vitals={vitals}
          nurses={nurses}
          currentNurseName={userSession.nurseName}
          initialVital={vitalModalInitial}
          onClose={() => {
            setIsVitalModalOpen(false);
            setVitalModalPatient(null);
            setVitalModalInitial(null);
          }}
          onSave={handleSaveVital}
          onDeleteVital={handleDeleteVital}
        />

        {/* 2b. GDS Modal (Catat Khusus GDS Pasien Fleksibel) */}
        <GdsModal
          isOpen={isGdsModalOpen}
          patient={gdsModalPatient}
          patients={patients}
          currentNurseName={userSession.nurseName}
          onClose={() => {
            setIsGdsModalOpen(false);
            setGdsModalPatient(null);
          }}
          onSaveGds={handleSaveGds}
        />

        {/* 2. Patient Form Modal (Add / Edit) */}
        {isPatientFormOpen && (
          <PatientFormModal
            key={editingPatient ? `edit-patient-${editingPatient.id}` : 'new-patient-form'}
            isOpen={true}
            initialData={editingPatient}
            wards={wards}
            doctors={doctors}
            existingPatients={patients}
            onClose={() => {
              setIsPatientFormOpen(false);
              setEditingPatient(null);
            }}
            onSave={handleSavePatient}
          />
        )}

        {/* 3. Patient Status Change Modal (Pindah, Pulang, Meninggal) */}
        <PatientStatusModal
          isOpen={!!statusModalTarget}
          type={statusModalTarget?.type || 'pulang'}
          patient={statusModalTarget?.patient || null}
          wards={wards}
          onClose={() => setStatusModalTarget(null)}
          onConfirm={handleConfirmStatusChange}
        />

        {/* 4. Doctor DPJP Form Modal */}
        {isDoctorFormOpen && (
          <DpjpFormModal
            key={editingDoctor ? `edit-doc-${editingDoctor.id}` : 'new-doc-form'}
            isOpen={true}
            initialData={editingDoctor}
            existingDoctors={doctors}
            onClose={() => {
              setIsDoctorFormOpen(false);
              setEditingDoctor(null);
            }}
            onSave={handleSaveDoctor}
          />
        )}

        {/* 5. Nurse Form Modal */}
        {isNurseFormOpen && (
          <NurseFormModal
            key={editingNurse ? `edit-nurse-${editingNurse.id}` : 'new-nurse-form'}
            isOpen={true}
            initialData={editingNurse}
            defaultShift={nurseDefaultShift}
            defaultWard={nurseDefaultWard}
            wards={wards}
            nurses={nurses}
            onClose={() => {
              setIsNurseFormOpen(false);
              setEditingNurse(null);
              setNurseDefaultShift(undefined);
              setNurseDefaultWard(undefined);
            }}
            onSave={handleSaveNurse}
          />
        )}

        {/* 7. SOP Modal */}
        <SopModal
          isOpen={isSopOpen}
          onClose={() => setIsSopOpen(false)}
        />

        {/* 8. Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          userSession={userSession}
          onSaveSession={newSession => {
            setUserSession(newSession);
            storage.saveUserSession(newSession);
            showToast('Profil pengguna perawat berhasil disimpan.');
          }}
          wards={wards}
          onOpenAddWard={() => {
            setEditingWard(null);
            setIsWardFormOpen(true);
          }}
          onEditWard={w => {
            setEditingWard(w);
            setIsWardFormOpen(true);
          }}
          onDeleteWard={handleDeleteWardRequest}
          patients={patients}
          doctors={doctors}
          nurses={nurses}
          onNavigateToTab={tab => {
            setIsSettingsOpen(false);
            setCurrentTab(tab);
          }}
          onOpenSplashScreen={() => setShowSplashScreen(true)}
        />

        {/* 8a. Ward Form Modal - Renders in front (z-[80]) of Settings Modal */}
        {isWardFormOpen && (
          <WardFormModal
            key={editingWard ? `edit-ward-${editingWard.id}` : 'new-ward-form'}
            isOpen={true}
            initialData={editingWard}
            onClose={() => {
              setIsWardFormOpen(false);
              setEditingWard(null);
            }}
            onSave={handleSaveWard}
          />
        )}

        {/* 8b. Device Access QR Code Modal */}
        <DeviceAccessQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          wardName={userSession.ward}
        />

        {/* 8c. Switch Active Nurse Account Modal */}
        <SwitchNurseModal
          isOpen={isSwitchNurseModalOpen}
          onClose={() => setIsSwitchNurseModalOpen(false)}
          nurses={nurses}
          userSession={userSession}
          onSelectNurse={nurse => {
            handleSetPrimaryDutyNurse(nurse);
            setIsSwitchNurseModalOpen(false);
          }}
          onOpenAddNurse={() => {
            setNurseDefaultShift(userSession.shift);
            setEditingNurse(null);
            setIsNurseFormOpen(true);
          }}
        />

        {/* 9. Delete Confirmations */}
        {/* Delete Patient Confirm */}
        <ConfirmModal
          isOpen={!!patientToDelete}
          title="Konfirmasi Hapus Pasien"
          message={`Apakah Anda yakin ingin menghapus data pasien ${patientToDelete?.name} (${patientToDelete?.rmNumber})? Seluruh data rekam medis pasien ini akan dihapus secara permanen.`}
          confirmLabel="Ya, Hapus Pasien"
          cancelLabel="Batal"
          isDestructive={true}
          onConfirm={handleConfirmDeletePatient}
          onCancel={() => setPatientToDelete(null)}
        />

        {/* Delete Doctor Confirm */}
        <ConfirmModal
          isOpen={!!doctorToDelete}
          title="Hapus Dokter DPJP"
          message={`Apakah Anda yakin ingin menghapus ${doctorToDelete?.name} dari daftar dokter DPJP?`}
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          isDestructive={true}
          onConfirm={handleConfirmDeleteDoctor}
          onCancel={() => setDoctorToDelete(null)}
        />

        {/* Delete Nurse Confirm */}
        <ConfirmModal
          isOpen={!!nurseToDelete}
          title="Hapus Data Perawat"
          message={`Apakah Anda yakin ingin menghapus ${nurseToDelete?.name} dari daftar tenaga perawat?`}
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          isDestructive={true}
          onConfirm={handleConfirmDeleteNurse}
          onCancel={() => setNurseToDelete(null)}
        />

        {/* Delete Ward Confirm */}
        <ConfirmModal
          isOpen={!!wardToDelete}
          title="Hapus Bangsal / Ruangan"
          message={`Apakah Anda yakin ingin menghapus ${wardToDelete?.name}?`}
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          isDestructive={true}
          onConfirm={handleConfirmDeleteWard}
          onCancel={() => setWardToDelete(null)}
        />

        {/* Download & Install PWA Modal */}
        <DownloadAppModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
        />

        {/* 10. Opening Splash Screen displaying Kelompok 2 Emblem */}
        {showSplashScreen && (
          <SplashScreen
            appName="ETAM CARE"
            duration={2500}
            onFinish={() => setShowSplashScreen(false)}
          />
        )}
      </div>
    </div>
  );
}
