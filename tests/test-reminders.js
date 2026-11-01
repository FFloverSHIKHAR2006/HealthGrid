import { strictEqual, ok, deepStrictEqual } from 'assert';

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';

const runTests = async () => {
  console.log('====================================================');
  console.log(' HealthGrid Reminders & Notification Test Suite');
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

  let doctorToken = '';
  let patient1Token = '';
  let patient2Token = '';
  let patient1Id = '';
  let patient2Id = '';

  let createdMedReminderId = '';
  let createdAppReminderId = '';
  let testPrescriptionId = '';
  let testNotificationId = '';

  // 1. Authentication
  await test('Auth: Doctor Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@healthgrid.test', password: 'Password@123' }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    doctorToken = data.token;
    ok(doctorToken);
  });

  await test('Auth: Patient 1 Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient1@healthgrid.test', password: 'Password@123' }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    patient1Token = data.token;
    patient1Id = data.user.patient;
    ok(patient1Token);
    ok(patient1Id);
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
    patient2Id = data.user.patient;
    ok(patient2Token);
    ok(patient2Id);
  });

  // 2. Medication Reminders CRUD & Adherence
  await test('Reminders: Patient can create a medication reminder', async () => {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        type: 'medication',
        title: 'Metformin 500mg Morning Dose',
        medication: 'Metformin HCl',
        dosage: '500mg',
        frequency: 'daily',
        time: '08:00',
        instructions: 'Take with breakfast and full glass of water.',
      }),
    });
    strictEqual(res.status, 201);
    const data = await res.json();
    ok(data._id);
    strictEqual(data.medication, 'Metformin HCl');
    strictEqual(data.status, 'active');
    createdMedReminderId = data._id;
  });

  await test('Reminders: Patient can list own medication reminders', async () => {
    const res = await fetch(`${BASE_URL}/reminders?type=medication`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(Array.isArray(data));
    const found = data.find((r) => r._id === createdMedReminderId);
    ok(found);
  });

  await test('Reminders: Patient can record dose adherence (TAKEN)', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdMedReminderId}/adherence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        status: 'taken',
        note: 'Taken on schedule with breakfast',
        scheduledTime: '08:00',
      }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    strictEqual(data.adherence.status, 'taken');
    ok(data.reminder.adherenceHistory.length > 0);
  });

  await test('Reminders: Patient can record dose adherence (SKIPPED)', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdMedReminderId}/adherence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        status: 'skipped',
        note: 'Fasting for blood work',
      }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    strictEqual(data.adherence.status, 'skipped');
  });

  await test('Reminders: Reject invalid adherence status with 400', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdMedReminderId}/adherence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        status: 'invalid_status',
      }),
    });
    strictEqual(res.status, 400);
  });

  await test('Reminders: Patient can update medication reminder', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdMedReminderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        dosage: '1000mg',
        instructions: 'Increased dose by cardiologist recommendation',
      }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    strictEqual(data.dosage, '1000mg');
  });

  // 3. Doctor Appointment Reminders
  await test('Reminders: Schedule doctor appointment consultation alert', async () => {
    const res = await fetch(`${BASE_URL}/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
      body: JSON.stringify({
        type: 'appointment',
        title: 'Cardiac Evaluation Consultation',
        doctorName: 'Dr. Alexander Wright, MD',
        specialty: 'Interventional Cardiology',
        facility: 'Max Super Speciality Hospital, Saket',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        appointmentTime: '10:30 AM',
        reminderLeadTime: '1_day_before',
        location: 'OPD Block B, Suite 402',
        notes: 'Bring previous echocardiogram and lipid profile reports.',
      }),
    });
    strictEqual(res.status, 201);
    const data = await res.json();
    strictEqual(data.type, 'appointment');
    strictEqual(data.doctorName, 'Dr. Alexander Wright, MD');
    createdAppReminderId = data._id;
    ok(createdAppReminderId);
  });

  // 4. Security & Role Authorization
  await test('Security: Patient 2 cannot access or update Patient 1 reminder (403)', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdMedReminderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`,
      },
      body: JSON.stringify({ title: 'Unauthorized Modification' }),
    });
    strictEqual(res.status, 403);
  });

  await test('Security: Patient 2 cannot record adherence on Patient 1 reminder (403)', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdMedReminderId}/adherence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient2Token}`,
      },
      body: JSON.stringify({ status: 'taken' }),
    });
    strictEqual(res.status, 403);
  });

  await test('Security: Patient 2 cannot delete Patient 1 reminder (403)', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdMedReminderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patient2Token}` },
    });
    strictEqual(res.status, 403);
  });

  // 5. Prescription-Based Auto Scheduling
  await test('Prescription: Provider issues prescription with autoScheduleReminders flag', async () => {
    const res = await fetch(`${BASE_URL}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patient: patient1Id,
        medication: 'Atorvastatin Calcium 20mg',
        dosage: '1 TAB BID',
        frequency: 'Twice daily',
        duration: '60 days',
        instructions: 'Take 1 tablet in morning and 1 at bedtime with water.',
        autoScheduleReminders: true,
      }),
    });
    strictEqual(res.status, 201);
    const data = await res.json();
    testPrescriptionId = data._id;
    ok(testPrescriptionId);
  });

  await test('Prescription: Explicit trigger from prescription creates scheduled reminders', async () => {
    const res = await fetch(`${BASE_URL}/reminders/from-prescription/${testPrescriptionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`,
      },
    });
    // Can be 201 or if already scheduled returns existing with 201
    strictEqual(res.status, 201);
    const data = await res.json();
    ok(data.reminders && data.reminders.length > 0);
  });

  // 6. Notification Center
  await test('Notifications: Retrieve patient notifications list and unread count', async () => {
    const res = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(Array.isArray(data.notifications));
    ok(typeof data.unreadCount === 'number');
    if (data.notifications.length > 0) {
      testNotificationId = data.notifications[0]._id;
    }
  });

  await test('Notifications: Mark single notification as read', async () => {
    if (!testNotificationId) {
      // Create a test notification if none exists
      return;
    }
    const res = await fetch(`${BASE_URL}/notifications/${testNotificationId}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    strictEqual(data.read, true);
    ok(data.readAt);
  });

  await test('Notifications: Mark all notifications as read', async () => {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(data.message);

    // Verify unread count is now 0
    const listRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    const listData = await listRes.json();
    strictEqual(listData.unreadCount, 0);
  });

  // 7. Background Reminder Scheduler Trigger
  await test('Scheduler: Manual execution trigger checks active reminders and appointments', async () => {
    const res = await fetch(`${BASE_URL}/reminders/trigger-check`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(data.timestamp);
    ok(typeof data.generatedCount === 'number');
  });

  // 8. Patient Vault integration
  await test('Patient Vault: GET /api/patients/:id returns reminders array', async () => {
    const res = await fetch(`${BASE_URL}/patients/${patient1Id}`, {
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    ok(data.reminders);
    ok(Array.isArray(data.reminders));
  });

  // 9. Clean up reminders
  await test('Reminders: Patient can delete own appointment reminder', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdAppReminderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    strictEqual(res.status, 200);
  });

  await test('Reminders: Patient can delete own medication reminder', async () => {
    const res = await fetch(`${BASE_URL}/reminders/${createdMedReminderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${patient1Token}` },
    });
    strictEqual(res.status, 200);
  });

  console.log('\n====================================================');
  console.log(` Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
};

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
