import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Prescription from '../models/Prescription.js';
import Routine from '../models/Routine.js';
import AuditLog from '../models/AuditLog.js';
import { computeAuditHash } from '../services/audit.service.js';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Clearing old demo collections...');
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    MedicalRecord.deleteMany({}),
    Prescription.deleteMany({}),
    Routine.deleteMany({}),
    mongoose.connection.collection('auditlogs').deleteMany({}),
  ]);

  const password = process.env.SEED_PASSWORD || 'Password@123';
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Seed Patients (Exact clinical roster from HealthGrid Enterprise Frontend)
  const patients = await Patient.insertMany([
    {
      healthGridId: 'HG-8904-2026',
      name: 'Sarah Jenkins',
      dateOfBirth: new Date('1994-11-14'),
      gender: 'Female',
      bloodGroup: 'O+',
      allergies: ['Penicillin (Anaphylactic)', 'Latex Sensitivity'],
      emergencyContact: { name: 'Mark Jenkins', relation: 'Spouse', phone: '+91 98765 43210' },
      telemetry: { heartRate: 72, bloodPressure: { systolic: 118, diastolic: 78 }, glucose: 92, hrv: 62 },
    },
    {
      healthGridId: 'HG-4019-2026',
      name: 'David Miller',
      dateOfBirth: new Date('1968-04-22'),
      gender: 'Male',
      bloodGroup: 'A+',
      allergies: ['Sulfa Drugs', 'Codeine'],
      emergencyContact: { name: 'Rachel Miller', relation: 'Daughter', phone: '+91 94123 45678' },
      telemetry: { heartRate: 84, bloodPressure: { systolic: 142, diastolic: 90 }, glucose: 135, hrv: 42 },
    },
    {
      healthGridId: 'HG-9108-2026',
      name: 'Arjun Sharma',
      dateOfBirth: new Date('1990-08-19'),
      gender: 'Male',
      bloodGroup: 'B+',
      allergies: ['Dust Mites', 'Shellfish'],
      emergencyContact: { name: 'Priya Sharma', relation: 'Wife', phone: '+91 98112 34567' },
      telemetry: { heartRate: 68, bloodPressure: { systolic: 120, diastolic: 80 }, glucose: 95, hrv: 68 },
    },
    {
      healthGridId: 'HG-1102-2026',
      name: 'Maya Lin',
      dateOfBirth: new Date('2002-02-11'),
      gender: 'Female',
      bloodGroup: 'B+',
      allergies: ['Environmental Pollen'],
      emergencyContact: { name: 'Rajesh Lin', relation: 'Father', phone: '+91 97110 88234' },
      telemetry: { heartRate: 65, bloodPressure: { systolic: 112, diastolic: 72 }, glucose: 88, hrv: 74 },
    },
    {
      healthGridId: 'HG-7729-2026',
      name: 'Robert Thorne',
      dateOfBirth: new Date('1955-09-30'),
      gender: 'Male',
      bloodGroup: 'AB+',
      allergies: ['Contrast Dye'],
      emergencyContact: { name: 'Sunita Thorne', relation: 'Wife', phone: '+91 99543 21098' },
      telemetry: { heartRate: 68, bloodPressure: { systolic: 128, diastolic: 82 }, glucose: 104, hrv: 38 },
    },
  ]);

  // 2. Seed Provider User (Dr. Alexander Wright, MD)
  const provider = await User.create({
    name: 'Dr. Alexander Wright, MD',
    email: 'doctor@healthgrid.test',
    passwordHash,
    role: 'provider',
  });

  // 3. Seed Patient Users
  const patientUsers = await User.insertMany([
    {
      name: patients[0].name,
      email: 'patient1@healthgrid.test',
      passwordHash,
      role: 'patient',
      patient: patients[0]._id,
    },
    {
      name: patients[1].name,
      email: 'patient2@healthgrid.test',
      passwordHash,
      role: 'patient',
      patient: patients[1]._id,
    },
    {
      name: patients[2].name,
      email: 'patient3@healthgrid.test',
      passwordHash,
      role: 'patient',
      patient: patients[2]._id,
    },
    {
      name: patients[3].name,
      email: 'patient4@healthgrid.test',
      passwordHash,
      role: 'patient',
      patient: patients[3]._id,
    },
    {
      name: patients[4].name,
      email: 'patient5@healthgrid.test',
      passwordHash,
      role: 'patient',
      patient: patients[4]._id,
    },
  ]);

  // 4. Seed Medical Records (Unified Lifetime History)
  const records = await MedicalRecord.insertMany([
    // Sarah Jenkins (HG-8904)
    {
      patient: patients[0]._id,
      category: 'lab',
      title: 'Comprehensive Cardiovascular Risk & Lipid Panel',
      date: new Date('2026-08-14'),
      reportDate: new Date('2026-08-14'),
      encounterDate: new Date('2026-08-14'),
      facility: 'Fortis Heart Institute, New Delhi',
      clinicalSummary:
        'Total Cholesterol: 185 mg/dL, HDL: 58 mg/dL, LDL: 104 mg/dL. ECG shows normal sinus rhythm without ischemia.',
      details:
        'Total Cholesterol: 185 mg/dL, HDL: 58 mg/dL, LDL: 104 mg/dL. ECG shows normal sinus rhythm without ischemia.',
      observations: [
        {
          name: 'Total Chol.',
          value: '185',
          unit: 'mg/dL',
          referenceRange: '< 200 mg/dL',
          flag: 'normal',
          interpretation: 'Desirable',
        },
        {
          name: 'HDL / LDL',
          value: '58 / 104',
          unit: 'mg/dL',
          referenceRange: '> 40 / < 100',
          flag: 'normal',
          interpretation: 'Optimal Risk Profile',
        },
        {
          name: 'ECG Wave',
          value: 'Sinus Normal',
          unit: '',
          referenceRange: '60-100 bpm',
          flag: 'normal',
          interpretation: 'Normal Sinus Rhythm',
        },
      ],
      documentHash: '0x6ad5e821fa940e7cb28189c472910fae19b48c34791024bd81829e248b11f4e1',
      verificationStatus: 'VERIFIED',
      source: 'manual',
      createdBy: provider._id,
    },
    {
      patient: patients[0]._id,
      category: 'immunization',
      title: 'Covishield mRNA Booster & Seasonal Influenza Vaccination',
      date: new Date('2021-03-15'),
      reportDate: new Date('2021-03-15'),
      encounterDate: new Date('2021-03-15'),
      facility: 'Max Healthcare Immunization Center',
      clinicalSummary:
        'Administered in left deltoid. No acute adverse reactions observed.',
      details:
        'Administered in left deltoid. No acute adverse reactions observed.',
      structuredData: {
        immunization: {
          vaccine: 'Covishield mRNA Booster & Seasonal Influenza',
          batchNumber: 'CV-99201-DEL',
          site: 'Left deltoid',
          route: 'Intramuscular',
          adverseReactions: 'None observed',
        },
      },
      documentHash: '0x6ad59b421a940e7cb28189c472910fae19b48c34791024bd81829e248b11f4e1',
      verificationStatus: 'VERIFIED',
      source: 'manual',
      createdBy: provider._id,
    },
    {
      patient: patients[0]._id,
      category: 'surgery',
      title: 'Laparoscopic Appendectomy Procedure',
      date: new Date('2018-06-22'),
      reportDate: new Date('2018-06-22'),
      encounterDate: new Date('2018-06-22'),
      facility: 'Fortis Hospital, Gurgaon',
      clinicalSummary:
        'Uncomplicated laparoscopic removal of acute non-perforated appendicitis.',
      details:
        'Uncomplicated laparoscopic removal of acute non-perforated appendicitis.',
      structuredData: {
        surgery: {
          procedure: 'Laparoscopic Appendectomy',
          surgeon: 'Dr. R. Malhotra, MS',
          anesthesia: 'General Anesthesia',
          findings: 'Benign Luminal Obstruction',
        },
      },
      documentHash: '0x6ad5a3120a940e7cb28189c472910fae19b48c34791024bd81829e248b11f4e1',
      verificationStatus: 'VERIFIED',
      source: 'manual',
      createdBy: provider._id,
    },
    {
      patient: patients[0]._id,
      category: 'diagnosis',
      title: 'Full Term Birth Record & Neonatal Screening',
      date: new Date('1994-11-14'),
      reportDate: new Date('1994-11-14'),
      encounterDate: new Date('1994-11-14'),
      facility: 'AIIMS Maternity Wing, New Delhi',
      clinicalSummary:
        'Spontaneous vaginal delivery at 39 weeks gestation. Birth weight: 3.4kg, APGAR Scores: 9 (1 min), 10 (5 min). Neonatal metabolic screening passed negative.',
      details:
        'Spontaneous vaginal delivery. Birth weight: 3.4kg, APGAR Scores: 9 (1 min), 10 (5 min).',
      documentHash: '0x6ad54911ba940e7cb28189c472910fae19b48c34791024bd81829e248b11f4e1',
      verificationStatus: 'VERIFIED',
      source: 'manual',
      createdBy: provider._id,
    },
    // Seed genuine scanned consultation document on Sarah's timeline
    {
      patient: patients[0]._id,
      category: 'diagnosis',
      title: 'Outpatient Clinical Consultation & Prescription',
      date: new Date('2026-10-12'),
      reportDate: new Date('2026-10-12'),
      encounterDate: new Date('2026-10-12'),
      facility: 'CityCare Hospitals, Lucknow',
      department: 'General Medicine',
      clinician: 'Dr. R. Sharma, MBBS, MD (General Medicine)',
      patientMetadata: {
        name: 'Amit Kumar',
        identifier: 'CHL/26/89123',
        age: 24,
        gender: 'Male',
      },
      clinicalSummary:
        'Acute Viral Fever with Upper Respiratory Tract Infection (URTI). Vitals: Temp 100.8°F (pyrexia), Pulse 96 bpm, BP 118/76 mmHg, SpO2 98%. Systemic exam normal. Prescribed 5-day therapy including Paracetamol 650mg, Azithromycin, Levocetirizine, Montelukast, Vitamin C, and Cough Syrup.',
      details:
        'Acute Viral Fever with Upper Respiratory Tract Infection (URTI). Vitals: Temp 100.8°F (pyrexia), Pulse 96 bpm, BP 118/76 mmHg, SpO2 98%. Prescribed Paracetamol 650mg, Azithromycin 500mg, Levocetirizine 5mg, Montelukast 10mg, Vitamin C 500mg, and Cough syrup.',
      observations: [
        {
          name: 'Temperature',
          value: '100.8',
          unit: '°F',
          referenceRange: '97.0 - 99.0 °F',
          flag: 'high',
          interpretation: 'Low-Grade Pyrexia',
        },
        {
          name: 'Pulse',
          value: '96',
          unit: '/min',
          referenceRange: '60 - 100 /min',
          flag: 'normal',
          interpretation: 'Normal Sinus',
        },
        {
          name: 'Blood Pressure',
          value: '118/76',
          unit: 'mmHg',
          referenceRange: '< 120/80 mmHg',
          flag: 'normal',
          interpretation: 'Normotensive',
        },
        {
          name: 'SpO2',
          value: '98',
          unit: '% (RA)',
          referenceRange: '95 - 100 %',
          flag: 'normal',
          interpretation: 'Normal Room Air',
        },
      ],
      structuredData: {
        diagnosis: {
          provisionalDiagnosis: 'Acute Viral Fever, URTI',
          chiefComplaints: 'Fever, cough, body ache since 3 days',
          historyOfPresentIllness:
            'Fever (intermittent), dry cough, sore throat, body ache. No breathlessness.',
          advice: [
            'Adequate hydration',
            'Rest',
            'Steam inhalation',
            'Follow up if fever persists > 5 days or symptoms worsen',
          ],
        },
        medications: [
          {
            drug: 'Paracetamol',
            strength: '650 mg',
            dosage: '1 tab',
            frequency: 'TDS',
            timing: 'after food',
            duration: '5 days',
          },
          {
            drug: 'Azithromycin',
            strength: '500 mg',
            dosage: '1 tab',
            frequency: 'OD',
            timing: 'after food',
            duration: '3 days',
          },
          {
            drug: 'Levocetirizine',
            strength: '5 mg',
            dosage: '1 tab',
            frequency: 'HS',
            timing: 'at bedtime',
            duration: '5 days',
          },
          {
            drug: 'Montelukast',
            strength: '10 mg',
            dosage: '1 tab',
            frequency: 'HS',
            timing: 'at bedtime',
            duration: '5 days',
          },
          {
            drug: 'Vitamin C',
            strength: '500 mg',
            dosage: '1 tab',
            frequency: 'OD',
            timing: 'after food',
            duration: '10 days',
          },
          {
            drug: 'Cough syrup (Dextromethorphan + Chlorpheniramine)',
            strength: '',
            dosage: '10 ml',
            frequency: 'TDS',
            timing: '',
            duration: '5 days',
          },
        ],
      },
      documentHash: '0x8f2a41c9b3e1470da58914c6298104be92a3481024bd81829e248b11c9e2',
      verificationStatus: 'VERIFIED',
      source: 'scanner',
      createdBy: provider._id,
    },
    // David Miller (HG-4019)
    {
      patient: patients[1]._id,
      category: 'lab',
      title: 'HbA1c & Fasting Metabolic Panel',
      date: new Date('2026-06-18'),
      facility: 'SRL Diagnostics Center',
      details: 'HbA1c: 7.4%, Fasting Glucose: 135 mg/dL, eGFR: 88 mL/min.',
      source: 'manual',
      createdBy: provider._id,
    },
    {
      patient: patients[1]._id,
      category: 'surgery',
      title: 'Colonoscopy Screening - Benign Polyps Removed',
      date: new Date('2022-04-10'),
      facility: 'Apollo Hospital',
      details: 'Preventative colonoscopy. Two benign adenomatous polyps resected with clean margins.',
      source: 'manual',
      createdBy: provider._id,
    },
    // Arjun Sharma (HG-9108)
    {
      patient: patients[2]._id,
      category: 'lab',
      title: 'Executive Health Screening & Vitamin Profile',
      date: new Date('2026-05-12'),
      facility: 'Apollo Health Check Center, Bengaluru',
      details: 'Vitamin D3: 38 ng/mL, Vitamin B12: 450 pg/mL, Triglycerides: 110 mg/dL. Baseline healthy.',
      source: 'manual',
      createdBy: provider._id,
    },
    {
      patient: patients[2]._id,
      category: 'immunization',
      title: 'Covaxin Dose 1 & Dose 2 Certified',
      date: new Date('2021-07-20'),
      facility: 'Sir Ganga Ram Hospital, Delhi',
      details: 'Two-dose primary immunization course verified by CoWIN national gateway.',
      source: 'manual',
      createdBy: provider._id,
    },
    // Maya Lin (HG-1102)
    {
      patient: patients[3]._id,
      category: 'immunization',
      title: 'HPV Vaccination Series Completed',
      date: new Date('2020-09-15'),
      facility: 'Max Healthcare',
      details: 'Full 3-dose human papillomavirus recombinant vaccine series completed.',
      source: 'manual',
      createdBy: provider._id,
    },
    // Robert Thorne (HG-7729)
    {
      patient: patients[4]._id,
      category: 'surgery',
      title: 'Coronary Angioplasty & Drug-Eluting Stent',
      date: new Date('2024-03-11'),
      facility: 'Fortis Escorts Heart Institute',
      details: 'Successful deployment of 1 drug-eluting stent in proximal LAD artery.',
      source: 'manual',
      createdBy: provider._id,
    },
  ]);

  // 5. Seed Prescriptions
  const prescriptions = await Prescription.insertMany([
    {
      patient: patients[0]._id,
      provider: provider._id,
      medication: 'Atorvastatin 20mg Oral Tablet',
      dosage: '1 Tablet Daily at bedtime',
      frequency: 'Once daily',
      duration: '90 days',
      instructions: 'Take in the evening with or without food. Refills: 3 left at Apollo Pharmacy.',
    },
    {
      patient: patients[1]._id,
      provider: provider._id,
      medication: 'Lisinopril 20mg Oral Tablet',
      dosage: '1 Tablet Daily in morning',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take in the morning. Monitor blood pressure weekly.',
    },
    {
      patient: patients[1]._id,
      provider: provider._id,
      medication: 'Metformin 850mg Oral Tablet',
      dosage: '1 Tablet twice daily with meals',
      frequency: 'Twice daily',
      duration: '60 days',
      instructions: 'Take with breakfast and dinner to reduce GI upset.',
    },
  ]);

  // 6. Seed Health Routines
  const routines = await Routine.insertMany([
    {
      patient: patients[0]._id,
      title: 'Atorvastatin 20mg - Evening Dose',
      schedule: '20:00 Daily',
      status: 'active',
    },
    {
      patient: patients[0]._id,
      title: 'Hydration Target (2.5 Liters)',
      schedule: '14:00 Daily',
      status: 'completed',
    },
    {
      patient: patients[1]._id,
      title: 'Metformin 850mg with Breakfast',
      schedule: '08:00 Daily',
      status: 'completed',
    },
    {
      patient: patients[1]._id,
      title: 'Blood Pressure Log in Morning',
      schedule: '08:30 Daily',
      status: 'active',
    },
    {
      patient: patients[2]._id,
      title: 'Morning Omega-3 & Vitamin D3',
      schedule: '08:30 Daily',
      status: 'active',
    },
    {
      patient: patients[2]._id,
      title: '30-minute Brisk Walk / Cardio',
      schedule: '07:00 Daily',
      status: 'active',
    },
  ]);

  // 7. Seed Initial Cryptographic Audit Ledger
  let prevHash = 'GENESIS';
  const rawAuditEntries = [
    {
      seq: 1,
      action: 'CREATE',
      entity: 'MedicalRecord',
      entityId: records[0]._id,
      actor: provider._id,
      actorRole: 'provider',
      details: 'Cardiovascular Risk & Lipid Panel initialized',
      timestamp: new Date('2026-08-14T10:00:00Z'),
    },
    {
      seq: 2,
      action: 'CREATE',
      entity: 'Prescription',
      entityId: prescriptions[0]._id,
      actor: provider._id,
      actorRole: 'provider',
      details: 'E-Prescription signed for Atorvastatin 20mg',
      timestamp: new Date('2026-08-14T10:15:00Z'),
    },
    {
      seq: 3,
      action: 'CREATE',
      entity: 'Routine',
      entityId: routines[0]._id,
      actor: patientUsers[0]._id,
      actorRole: 'patient',
      details: 'Personal health routine scheduled',
      timestamp: new Date('2026-08-14T10:30:00Z'),
    },
    {
      seq: 4,
      action: 'CREATE',
      entity: 'MedicalRecord',
      entityId: records[4]._id,
      actor: provider._id,
      actorRole: 'provider',
      details: 'HbA1c & Metabolic Panel logged for David Miller',
      timestamp: new Date('2026-08-14T11:00:00Z'),
    },
  ];

  for (const entry of rawAuditEntries) {
    entry.prevHash = prevHash;
    entry.hash = computeAuditHash(entry);
    prevHash = entry.hash;
    await AuditLog.create(entry);
  }

  console.log('Seed complete successfully!');
  console.log('--- DEMO LOGINS ---');
  console.log(`Provider: doctor@healthgrid.test / ${password}`);
  console.log(`Patients: patient1@healthgrid.test ... patient5@healthgrid.test / ${password}`);
  console.log('1: Sarah Jenkins (HG-8904-2026)');
  console.log('2: David Miller (HG-4019-2026)');
  console.log('3: Arjun Sharma (HG-9108-2026)');
  console.log('4: Maya Lin (HG-1102-2026)');
  console.log('5: Robert Thorne (HG-7729-2026)');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
