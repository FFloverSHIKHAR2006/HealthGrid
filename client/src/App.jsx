import React, { useState, useEffect } from 'react';
import SecurityTicker from './components/SecurityTicker';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import GatewayPortal from './components/GatewayPortal';
import PatientVault from './components/PatientVault';
import ProviderWorkspace from './components/ProviderWorkspace';
import SecurityLedger from './components/SecurityLedger';

import EditProfileModal from './components/modals/EditProfileModal';
import AddRoutineModal from './components/modals/AddRoutineModal';
import AddRecordModal from './components/modals/AddRecordModal';
import ScannerModal from './components/modals/ScannerModal';
import EmergencyModal from './components/modals/EmergencyModal';
import AddReminderModal from './components/modals/AddReminderModal';

import { api, setToken, removeToken, getToken, getStoredUser, setStoredUser } from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [currentView, setCurrentView] = useState('gateway'); // 'gateway' | 'patient' | 'provider' | 'ledger'
  const [toasts, setToasts] = useState([]);

  // Data states
  const [patientVault, setPatientVault] = useState(null);
  const [doctorCaseload, setDoctorCaseload] = useState([]);
  const [selectedDoctorPatientId, setSelectedDoctorPatientId] = useState(null);
  const [selectedDoctorVault, setSelectedDoctorVault] = useState(null);

  // Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [reminderModalType, setReminderModalType] = useState('medication');

  // Toast dispatcher
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Restore session
  const restoreSession = async () => {
    const token = getToken();
    if (!token) {
      setCurrentView('gateway');
      return;
    }
    try {
      const me = await api.getMe();
      setUser(me);
      setStoredUser(me);
      if (me.role === 'provider') {
        await setupDoctorSession(me);
      } else {
        await setupPatientSession(me);
      }
    } catch {
      handleLogout();
    }
  };

  const setupPatientSession = async (userObj) => {
    try {
      if (userObj.patient) {
        const vault = await api.getPatientVault(userObj.patient);
        setPatientVault(vault);
      }
      setCurrentView('patient');
    } catch (err) {
      showToast('Error loading patient vault: ' + err.message, 'error');
    }
  };

  const setupDoctorSession = async (userObj) => {
    try {
      const patients = await api.getPatients();
      setDoctorCaseload(patients);
      if (patients.length > 0) {
        const firstId = patients[0]._id;
        setSelectedDoctorPatientId(firstId);
        const vault = await api.getPatientVault(firstId);
        setSelectedDoctorVault(vault);
      }
      setCurrentView('provider');
    } catch (err) {
      showToast('Error loading provider caseload: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    restoreSession();

    const handleExpired = () => {
      showToast('Session expired. Please sign in again.', 'error');
      setUser(null);
      setCurrentView('gateway');
    };

    window.addEventListener('hg_auth_expired', handleExpired);
    return () => window.removeEventListener('hg_auth_expired', handleExpired);
  }, []);

  // Login handler
  const handleLogin = async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    setStoredUser(res.user);
    showToast(`Signed in successfully as ${res.user.name}`, 'success');

    if (res.user.role === 'provider') {
      await setupDoctorSession(res.user);
    } else {
      await setupPatientSession(res.user);
    }
  };

  // Register handler (create new patient or provider in MongoDB)
  const handleRegister = async (registerData) => {
    const res = await api.register(registerData);
    setToken(res.token);
    setUser(res.user);
    setStoredUser(res.user);
    showToast(res.message || 'Account created successfully in MongoDB!', 'success');

    if (res.user.role === 'provider') {
      await setupDoctorSession(res.user);
    } else {
      await setupPatientSession(res.user);
    }
  };

  // Logout handler
  const handleLogout = () => {
    removeToken();
    setUser(null);
    setPatientVault(null);
    setDoctorCaseload([]);
    setSelectedDoctorVault(null);
    setCurrentView('gateway');
    showToast('Signed out of secure node session.', 'info');
  };

  // Select patient in doctor view
  const handleSelectPatientInDoctor = async (patientId) => {
    setSelectedDoctorPatientId(patientId);
    try {
      const vault = await api.getPatientVault(patientId);
      setSelectedDoctorVault(vault);
    } catch (err) {
      showToast('Failed to load patient dossier: ' + err.message, 'error');
    }
  };

  // Routine toggle (FR-06)
  const handleToggleRoutine = async (routine) => {
    const newStatus = routine.status === 'completed' ? 'active' : 'completed';
    try {
      const updated = await api.updateRoutine(routine._id, { status: newStatus });
      setPatientVault((prev) => ({
        ...prev,
        routines: prev.routines.map((r) => (r._id === routine._id ? updated : r)),
      }));
      showToast(`Routine marked as ${newStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update routine: ' + err.message, 'error');
    }
  };

  // Delete routine (FR-07)
  const handleDeleteRoutine = async (routineId) => {
    try {
      await api.deleteRoutine(routineId);
      setPatientVault((prev) => ({
        ...prev,
        routines: prev.routines.filter((r) => r._id !== routineId),
      }));
      showToast('Health routine deleted.', 'success');
    } catch (err) {
      showToast('Failed to delete routine: ' + err.message, 'error');
    }
  };

  // Add routine (FR-05)
  const handleAddRoutine = async (data) => {
    const res = await api.createRoutine(data);
    setPatientVault((prev) => ({
      ...prev,
      routines: [res, ...(prev.routines || [])],
    }));
    showToast('Health routine scheduled (FR-05)', 'success');
  };

  // Add reminder (Medication & Appointment)
  const handleAddReminder = async (data) => {
    const res = await api.createReminder(data);
    if (patientVault) {
      setPatientVault((prev) => ({
        ...prev,
        reminders: [res, ...(prev.reminders || [])],
      }));
    }
    if (selectedDoctorVault) {
      setSelectedDoctorVault((prev) => ({
        ...prev,
        reminders: [res, ...(prev.reminders || [])],
      }));
    }
    showToast(
      res.type === 'medication'
        ? 'Medication reminder scheduled'
        : 'Doctor appointment reminder saved',
      'success'
    );
  };

  // Record medication adherence
  const handleRecordAdherence = async (reminderId, status, note = '') => {
    try {
      const res = await api.recordAdherence(reminderId, status, note);
      if (patientVault) {
        setPatientVault((prev) => ({
          ...prev,
          reminders: (prev.reminders || []).map((r) =>
            r._id === reminderId ? res.reminder : r
          ),
        }));
      }
      showToast(
        status === 'taken'
          ? 'Medication dose marked as taken'
          : 'Medication dose marked as skipped',
        'info'
      );
    } catch (err) {
      showToast('Failed to record adherence: ' + err.message, 'error');
    }
  };

  // Delete reminder
  const handleDeleteReminder = async (reminderId) => {
    try {
      await api.deleteReminder(reminderId);
      if (patientVault) {
        setPatientVault((prev) => ({
          ...prev,
          reminders: (prev.reminders || []).filter((r) => r._id !== reminderId),
        }));
      }
      if (selectedDoctorVault) {
        setSelectedDoctorVault((prev) => ({
          ...prev,
          reminders: (prev.reminders || []).filter((r) => r._id !== reminderId),
        }));
      }
      showToast('Reminder deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete reminder: ' + err.message, 'error');
    }
  };

  // Auto-schedule reminders from prescription
  const handleAutoSchedulePrescription = async (prescriptionId) => {
    try {
      const res = await api.createFromPrescription(prescriptionId);
      if (patientVault) {
        setPatientVault((prev) => ({
          ...prev,
          reminders: [...(res.reminders || []), ...(prev.reminders || [])],
        }));
      }
      showToast(
        res.message || 'Prescription reminders auto-scheduled successfully',
        'success'
      );
    } catch (err) {
      showToast('Failed to auto-schedule reminders: ' + err.message, 'error');
    }
  };

  // Add record (FR-03)
  const handleAddRecord = async (data) => {
    const res = await api.createRecord(data);
    if (patientVault && (!data.patient || data.patient === patientVault.patient?._id)) {
      setPatientVault((prev) => ({
        ...prev,
        records: [res, ...(prev.records || [])],
      }));
    }
    if (selectedDoctorVault && (!data.patient || data.patient === selectedDoctorPatientId)) {
      setSelectedDoctorVault((prev) => ({
        ...prev,
        records: [res, ...(prev.records || [])],
      }));
    }
    showToast('Medical record stored live in MongoDB', 'success');
    return res;
  };

  // Delete record (FR-07, doctor view)
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this clinical record? (Audit log will be recorded)')) {
      return;
    }
    try {
      await api.deleteRecord(recordId);
      if (selectedDoctorVault) {
        setSelectedDoctorVault((prev) => ({
          ...prev,
          records: prev.records.filter((r) => r._id !== recordId),
        }));
      }
      showToast('Clinical record deleted (FR-07)', 'success');
    } catch (err) {
      showToast('Failed to delete record: ' + err.message, 'error');
    }
  };

  // Update emergency contact & allergies (FR-06)
  const handleUpdateProfile = async (payload) => {
    if (!patientVault?.patient?._id) return;
    const updated = await api.updatePatient(patientVault.patient._id, payload);
    setPatientVault((prev) => ({
      ...prev,
      patient: updated,
    }));
    showToast('Emergency profile & allergies updated (FR-06)', 'success');
  };

  // Create prescription (FR-04)
  const handleCreatePrescription = async (data) => {
    const res = await api.createPrescription(data);
    if (selectedDoctorVault) {
      setSelectedDoctorVault((prev) => ({
        ...prev,
        prescriptions: [res, ...(prev.prescriptions || [])],
      }));
    }
    showToast('Digital E-Prescription signed and issued (FR-04)', 'success');
  };

  // ABDM Simulation
  const handleSimulateABDM = async (patientId) => {
    const payload = {
      patient: patientId,
      category: 'lab',
      title: 'Retrieved via ABDM: High-Resolution Cardiac Angiography',
      date: new Date().toISOString(),
      facility: 'AIIMS New Delhi Health Exchange',
      details: 'Cross-provider automated retrieval payload: Clear coronary vessels without hemodynamically significant stenosis. Verified ABDM token.',
      source: 'manual',
    };
    const newRec = await api.createRecord(payload);
    if (selectedDoctorVault) {
      setSelectedDoctorVault((prev) => ({
        ...prev,
        records: [newRec, ...(prev.records || [])],
      }));
    }
    showToast('Cross-provider record retrieved & saved to MongoDB!', 'success');
  };

  return (
    <div className="stitch-app-root">
      <SecurityTicker />
      <Header
        user={user}
        onLogout={handleLogout}
        onTriggerEmergency={() => setShowEmergencyModal(true)}
        onReturnHome={() => setCurrentView('gateway')}
      />

      <div className="stitch-layout-wrapper">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          user={user}
        />

        <main className="stitch-main-viewport">
          {currentView === 'gateway' && (
            <GatewayPortal
              onLoginSuccess={handleLogin}
              onRegisterSuccess={handleRegister}
              onSelectLedgerView={() => setCurrentView('ledger')}
            />
          )}

          {currentView === 'patient' && (
            patientVault ? (
              <PatientVault
                vault={patientVault}
                onOpenAddRoutine={() => setShowAddRoutineModal(true)}
                onOpenAddRecord={() => setShowAddRecordModal(true)}
                onOpenScanner={() => setShowScannerModal(true)}
                onOpenEditProfile={() => setShowEditProfileModal(true)}
                onToggleRoutine={handleToggleRoutine}
                onDeleteRoutine={handleDeleteRoutine}
                onTriggerEmergency={() => setShowEmergencyModal(true)}
                onOpenAddReminder={(type) => {
                  setReminderModalType(type || 'medication');
                  setShowAddReminderModal(true);
                }}
                onRecordAdherence={handleRecordAdherence}
                onDeleteReminder={handleDeleteReminder}
                onAutoSchedulePrescription={handleAutoSchedulePrescription}
              />
            ) : (
              <div className="vault-loading-container">
                <Loader2 size={36} className="spin text-emerald" />
                <p>Loading Patient Health Records from MongoDB...</p>
              </div>
            )
          )}

          {currentView === 'provider' && (
            <ProviderWorkspace
              doctor={user}
              caseload={doctorCaseload}
              selectedPatientId={selectedDoctorPatientId}
              selectedVault={selectedDoctorVault}
              onSelectPatient={handleSelectPatientInDoctor}
              onDeleteRecord={handleDeleteRecord}
              onCreatePrescription={handleCreatePrescription}
              onSimulateABDMRetrieval={handleSimulateABDM}
              onOpenScanner={() => setShowScannerModal(true)}
              onOpenAddRecord={() => setShowAddRecordModal(true)}
              onOpenAddReminder={(type) => {
                setReminderModalType(type || 'appointment');
                setShowAddReminderModal(true);
              }}
              onDeleteReminder={handleDeleteReminder}
            />
          )}

          {currentView === 'ledger' && (
            <SecurityLedger
              onReturnToPortal={() => setCurrentView('gateway')}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showEditProfileModal && (
        <EditProfileModal
          patient={patientVault?.patient}
          onClose={() => setShowEditProfileModal(false)}
          onSave={handleUpdateProfile}
        />
      )}

      {showAddRoutineModal && (
        <AddRoutineModal
          onClose={() => setShowAddRoutineModal(false)}
          onSave={handleAddRoutine}
        />
      )}

      {showAddRecordModal && (
        <AddRecordModal
          patientId={user?.role === 'provider' ? selectedDoctorPatientId : patientVault?.patient?._id}
          onClose={() => setShowAddRecordModal(false)}
          onSave={handleAddRecord}
        />
      )}

      {showScannerModal && (
        <ScannerModal
          patientId={user?.role === 'provider' ? selectedDoctorPatientId : patientVault?.patient?._id}
          onClose={() => setShowScannerModal(false)}
          onSave={handleAddRecord}
        />
      )}

      {showEmergencyModal && (
        <EmergencyModal
          patient={patientVault?.patient || selectedDoctorVault?.patient}
          onClose={() => setShowEmergencyModal(false)}
        />
      )}

      {showAddReminderModal && (
        <AddReminderModal
          defaultType={reminderModalType}
          patientId={user?.role === 'provider' ? selectedDoctorPatientId : patientVault?.patient?._id}
          onClose={() => setShowAddReminderModal(false)}
          onSave={handleAddReminder}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
