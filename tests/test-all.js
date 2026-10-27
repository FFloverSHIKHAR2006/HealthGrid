import { deepStrictEqual, strictEqual, ok } from 'assert';

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';

const runTests = async () => {
  console.log('====================================================');
  console.log(' HealthGrid API Automated Verification Suite');
  console.log(` Target: ${BASE_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
      failed++;
    }
  };

  // State
  let doctorToken = '';
  let patientToken = '';
  let patient2Token = '';
  let patient1Id = '';
  let createdRecordId = '';
  let createdRoutineId = '';

  // 1. Authentication
  await test('Auth: Provider Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@healthgrid.test', password: 'Password@123' }),
    });
    strictEqual(res.status, 200, 'Provider login should return 200');
    const data = await res.json();
    ok(data.token, 'Token should be returned');
    strictEqual(data.user.role, 'provider');
    doctorToken = data.token;
  });

  await test('Auth: Patient 1 Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient1@healthgrid.test', password: 'Password@123' }),
    });
    strictEqual(res.status, 200, 'Patient 1 login should return 200');
    const data = await res.json();
    ok(data.token);
    strictEqual(data.user.role, 'patient');
    patientToken = data.token;
    patient1Id = data.user.patient;
    ok(patient1Id, 'Patient profile reference should exist');
  });

  await test('Auth: Patient 2 Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient2@healthgrid.test', password: 'Password@123' }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    patient2Token = data.token;
  });

  await test('Auth: Get Current User (/api/auth/me)', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    strictEqual(data.email, 'doctor@healthgrid.test');
  });

  // 2. FR-01: List Patients
  await test('FR-01: Provider can list all patients', async () => {
    const res = await fetch(`${BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    strictEqual(res.status, 200);
    const patients = await res.json();
    ok(Array.isArray(patients), 'Should return an array');
    ok(patients.length >= 5, 'Caseload should have all demo patients');
  });

  await test('FR-01: Patient only lists self', async () => {
    const res = await fetch(`${BASE_URL}/patients`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    strictEqual(res.status, 200);
    const patients = await res.json();
    strictEqual(patients.length, 1, 'Patient should only see self');
    strictEqual(patients[0]._id, patient1Id);
  });

  // 3. FR-02: Patient Vault Access
  await test('FR-02: Patient can view own vault', async () => {
    const res = await fetch(`${BASE_URL}/patients/${patient1Id}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    strictEqual(res.status, 200);
    const vault = await res.json();
    ok(vault.patient && vault.records && vault.prescriptions && vault.routines);
  });

  await test('FR-02: Patient cannot access another patient vault (403)', async () => {
    const res = await fetch(`${BASE_URL}/patients/${patient1Id}`, {
      headers: { Authorization: `Bearer ${patient2Token}` },
    });
    strictEqual(res.status, 403, 'Cross-patient access must be forbidden');
  });

  await test('FR-02: Provider can access any patient vault', async () => {
    const res = await fetch(`${BASE_URL}/patients/${patient1Id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    strictEqual(res.status, 200);
    const vault = await res.json();
    strictEqual(vault.patient._id, patient1Id);
  });

  // 4. FR-03: Create Record
  await test('FR-03: Patient can add record to own vault', async () => {
    const res = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        category: 'lab',
        title: 'Complete Blood Count & ESR',
        date: new Date().toISOString(),
        facility: 'National Health Diagnostics',
        details: 'Hemoglobin 13.8 g/dL, Platelets normal',
        source: 'manual',
      }),
    });
    strictEqual(res.status, 201);
    const rec = await res.json();
    ok(rec._id);
    strictEqual(rec.patient, patient1Id);
    createdRecordId = rec._id;
  });

  // 5. FR-04: Prescription Access Control
  await test('FR-04: Provider can issue prescription', async () => {
    const res = await fetch(`${BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patient: patient1Id,
        medication: 'Metformin 500mg',
        dosage: '1 tablet bid',
        frequency: 'Twice daily',
        duration: '30 days',
        instructions: 'Take after breakfast and dinner',
      }),
    });
    strictEqual(res.status, 201);
    const rx = await res.json();
    ok(rx._id);
    strictEqual(rx.medication, 'Metformin 500mg');
  });

  await test('FR-04: Patient cannot issue prescription (403)', async () => {
    const res = await fetch(`${BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        patient: patient1Id,
        medication: 'Unauthorized Controlled Substance',
        dosage: '100mg',
        frequency: 'Daily',
        duration: '10 days',
      }),
    });
    strictEqual(res.status, 403, 'Patient cannot self-prescribe');
  });

  // 6. FR-05: Create Health Routine
  await test('FR-05: Patient can schedule health routine', async () => {
    const res = await fetch(`${BASE_URL}/routines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        title: 'Morning Blood Pressure Log',
        schedule: '08:00 Daily (Vitals)',
        status: 'active',
      }),
    });
    strictEqual(res.status, 201);
    const routine = await res.json();
    ok(routine._id);
    createdRoutineId = routine._id;
  });

  // 7. FR-06: Update Patient & Routine
  await test('FR-06: Patient can update emergency contact & allergies', async () => {
    const res = await fetch(`${BASE_URL}/patients/${patient1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({
        emergencyContact: {
          name: 'Mark Jenkins (Updated)',
          relation: 'Spouse',
          phone: '+91 98765 00000',
        },
        allergies: ['Penicillin (Anaphylactic)', 'Latex Sensitivity', 'Peanuts'],
      }),
    });
    strictEqual(res.status, 200);
    const updated = await res.json();
    strictEqual(updated.emergencyContact.name, 'Mark Jenkins (Updated)');
    ok(updated.allergies.includes('Peanuts'));
  });

  await test('FR-06: Update routine status (active -> completed)', async () => {
    const res = await fetch(`${BASE_URL}/routines/${createdRoutineId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({ status: 'completed' }),
    });
    strictEqual(res.status, 200);
    const routine = await res.json();
    strictEqual(routine.status, 'completed');
  });

  // 8. FR-07: Deletion Permissions
  await test('FR-07: Patient cannot delete medical record (403)', async () => {
    const res = await fetch(`${BASE_URL}/records/${createdRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    strictEqual(res.status, 403, 'Patient cannot delete medical record');
  });

  await test('FR-07: Provider can delete medical record', async () => {
    const res = await fetch(`${BASE_URL}/records/${createdRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    strictEqual(res.status, 200);
  });

  await test('FR-07: Patient can delete own routine', async () => {
    const res = await fetch(`${BASE_URL}/routines/${createdRoutineId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    strictEqual(res.status, 200);
  });

  // 9. FR-08: Cryptographic Audit Ledger
  await test('FR-08: Provider can query audit logs', async () => {
    const res = await fetch(`${BASE_URL}/audit-logs?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(data.logs.length > 0);
    ok(data.total >= data.logs.length);
  });

  await test('FR-08: Cryptographic SHA-256 chain verification', async () => {
    const res = await fetch(`${BASE_URL}/audit-logs/verify`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    strictEqual(res.status, 200);
    const report = await res.json();
    strictEqual(report.valid, true, 'Audit chain integrity must be 100% valid');
    ok(report.checked > 0, 'Checked entries must be greater than 0');
    strictEqual(report.brokenAtSeq, null, 'No broken sequence allowed');
  });

  await test('FR-08: Patient cannot access audit logs (403)', async () => {
    const res = await fetch(`${BASE_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    strictEqual(res.status, 403);
  });

  // 10. FR-09: Error Handling & Validation
  await test('FR-09: Invalid input schema returns 400 with details', async () => {
    const res = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({ category: 'invalid_category_xyz' }),
    });
    strictEqual(res.status, 400);
    const body = await res.json();
    strictEqual(body.message, 'Validation failed');
    ok(Array.isArray(body.errors));
  });

  await test('FR-09: Unauthenticated request returns 401', async () => {
    const res = await fetch(`${BASE_URL}/patients`);
    strictEqual(res.status, 401);
  });

  await test('FR-09: Non-existent resource returns 404', async () => {
    const res = await fetch(`${BASE_URL}/patients/000000000000000000000000`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    strictEqual(res.status, 404);
  });

  // 11. Database Health & Connection Diagnostics
  await test('MongoDB: Health endpoint reports database connection & latency', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    strictEqual(res.status, 200, 'Health check should return 200');
    const data = await res.json();
    strictEqual(data.status, 'healthy');
    ok(data.database, 'Database health object must exist');
    strictEqual(data.database.status, 'healthy', 'Database status must be healthy');
    strictEqual(data.database.readyState, 1, 'Mongoose readyState must be 1 (connected)');
    ok(typeof data.database.latencyMs === 'number', 'Database ping latencyMs must be a number');
  });

  // 12. OAuth Discovery & Configuration
  await test('OAuth: Config endpoint returns provider status', async () => {
    const res = await fetch(`${BASE_URL}/auth/oauth/config`);
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(data.providers, 'providers block must be returned');
    ok(typeof data.providers.google?.enabled === 'boolean', 'Google provider enabled flag must be boolean');
    ok(typeof data.providers.microsoft?.enabled === 'boolean', 'Microsoft provider enabled flag must be boolean');
  });

  // 13. Registration with Role Enforcement & Database Persistence
  const testTimestamp = Date.now();
  const newPatientEmail = `audit_patient_${testTimestamp}@healthgrid.test`;
  const newDoctorEmail = `audit_doctor_${testTimestamp}@healthgrid.test`;
  let resetTokenHolder = '';

  await test('Auth: Patient registration creates User and Patient documents in MongoDB', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'patient',
        name: 'Audit Registered Patient',
        email: newPatientEmail,
        password: 'Password@123',
        gender: 'female',
        bloodGroup: 'B+',
        dateOfBirth: '1995-04-12',
        allergies: ['Penicillin', 'Sulfa'],
        emergencyContact: {
          name: 'Guardian Contact',
          relation: 'Spouse',
          phone: '+91 98765 00000',
        },
      }),
    });
    strictEqual(res.status, 201, 'Patient registration should return 201');
    const data = await res.json();
    ok(data.token, 'Token returned');
    strictEqual(data.user.role, 'patient', 'Role must strictly be patient');
    ok(data.user.patient, 'Linked patient profile ID must exist');
  });

  await test('Auth: Doctor registration enforces professional credentials & server-side verification', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'provider',
        name: 'Dr. Audit Specialist',
        email: newDoctorEmail,
        password: 'Password@123',
        specialization: 'Neurology',
        hospital: 'Metro Super Specialty Hospital',
        licenseNumber: `MCI-REG-${testTimestamp}`,
      }),
    });
    strictEqual(res.status, 201, 'Doctor registration should return 201');
    const data = await res.json();
    ok(data.token, 'Token returned');
    strictEqual(data.user.role, 'provider', 'Role must strictly be provider');
  });

  await test('Auth: Doctor registration rejected without mandatory license credentials', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'provider',
        name: 'Dr. Invalid Registration',
        email: `invalid_doc_${testTimestamp}@healthgrid.test`,
        password: 'Password@123',
        // Missing licenseNumber
      }),
    });
    strictEqual(res.status, 400, 'Doctor registration without license must return 400');
  });

  // 14. Password Recovery & Cryptographic Reset Flow
  await test('Auth: Forgot password generates secure reset token', async () => {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newPatientEmail }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(data.message.includes('Password reset instructions'), 'User receives clear feedback');
    ok(data.resetToken, 'Dev mode returns resetToken for verification testing');
    resetTokenHolder = data.resetToken;
  });

  await test('Auth: Reset password executes cryptographic token verification and update', async () => {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetTokenHolder,
        newPassword: 'NewUpdatedPassword@456',
      }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(data.message.includes('Password reset successful'));
  });

  await test('Auth: Login with updated password succeeds', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newPatientEmail,
        password: 'NewUpdatedPassword@456',
      }),
    });
    strictEqual(res.status, 200, 'Login with new password must return 200');
    const data = await res.json();
    ok(data.token, 'New session token generated');
  });

  console.log('\n====================================================');
  console.log(` Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

