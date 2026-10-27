import fs from 'fs';
import path from 'path';
import { strictEqual, ok, deepStrictEqual } from 'assert';
import { parseMedicalDocument, cleanOcrText, evaluateMeasurementFlag } from '../src/services/medicalExtraction.service.js';
import { computeFileSha256, verifyDocumentIntegrity } from '../src/services/documentCrypto.service.js';
// 1. Genuine LFT Report Fixture
export const lftReportFixture = {
  rawText: `
MAX HEALTHCARE DIAGNOSTICS & PATHOLOGY LABORATORY
Accredited by NABL | ISO 15189:2012 Certified
Department of Clinical Biochemistry | Ground Floor, Max Super Speciality Hospital, Saket, New Delhi
Ph: 011-26515050 | www.maxhealthcare.in
========================================================================================
PATIENT DEMOGRAPHICS & SAMPLE INFORMATION
Patient Name    : Sarah Jenkins                     Age / Sex       : 32 Yrs / Female
Patient ID / MRN: MAX-26-89042                     Sample Collected: 14/08/2026 08:30 AM
Referred By     : Dr. Alexander Wright, MD (Cardio) Report Date     : 14/08/2026 11:45 AM
Specimen        : Serum (Fasting)                  Lab Acc No      : LFT-8841029
========================================================================================
LIVER FUNCTION TEST (LFT) PANEL - AUTOMATED BIOCHEMISTRY
----------------------------------------------------------------------------------------
TEST NAME                       OBSERVED VALUE   UNIT     BIOLOGICAL REF INTERVAL   STATUS
----------------------------------------------------------------------------------------
Bilirubin (Total)               0.90             mg/dL    0.20 - 1.20               NORMAL
Bilirubin (Direct)              0.25             mg/dL    0.00 - 0.30               NORMAL
Bilirubin (Indirect)            0.65             mg/dL    0.10 - 1.00               NORMAL
SGOT / AST (Aspartate Aminotrans) 32             U/L      10 - 40                   NORMAL
SGPT / ALT (Alanine Aminotrans) 48               U/L      7 - 45                    HIGH
Alkaline Phosphatase (ALP)      88               U/L      30 - 120                  NORMAL
Total Protein                   7.40             g/dL     6.00 - 8.30               NORMAL
Albumin (Serum)                 4.50             g/dL     3.50 - 5.00               NORMAL
Globulin                        2.90             g/dL     2.00 - 3.50               NORMAL
A / G Ratio                     1.55                      1.20 - 2.20               NORMAL
========================================================================================
CLINICAL INTERPRETATION / OPINION:
Mild, isolated elevation of SGPT/ALT (48 U/L). Normal total bilirubin, alkaline phosphatase,
and serum albumin indicate preserved hepatocellular synthetic function without cholestasis.
Correlate clinically with BMI, lipid panel, and medication history.
----------------------------------------------------------------------------------------
Dr. S. K. Gupta, MD (Pathology)                 Dr. P. Sen, MD (Biochemistry)
Senior Consultant Pathologist                   Director of Diagnostic Laboratories
Max Healthcare Institute                        Max Super Speciality Hospital
`,
  expected: {
    category: 'lab',
    title: 'Liver Function Test (LFT) Panel',
    facility: 'Max Super Speciality Hospital',
    reportDate: '2026-08-14',
    patientName: 'Sarah Jenkins',
    patientIdentifier: 'MAX-26-89042',
    clinician: 'Dr. Alexander Wright',
    observationsCount: 10,
    altStatus: 'high',
    bilirubinStatus: 'normal',
  },
};

// 2. Imaging Report Fixture (Chest X-Ray)
export const imagingReportFixture = {
  rawText: `
APOLLO RADIOLOGY & ADVANCED IMAGING SERVICES
Apollo Hospital, Sarita Vihar, Delhi Mathura Road, New Delhi - 110076
========================================================================================
DEPARTMENT OF DIAGNOSTIC RADIOLOGY
Patient Name: Robert Thorne         Age/Sex: 70 Yrs / M           Date: 20/09/2026
UHID: APL-992140                   Ref By : Dr. Wright, MD       Study: Chest X-Ray (PA View)
========================================================================================
CLINICAL INDICATION: Routine pre-operative cardio-pulmonary evaluation.
FINDINGS:
- Trachea is midline.
- Both lung fields are clear with normal vascular markings. No focal consolidation, pneumothorax, or effusion.
- Cardiothoracic ratio is within normal limits (< 0.50). Normal aortic contour.
- Both costophrenic and cardiophrenic angles are sharp and clear.
- Thoracic skeletal structures and visualised soft tissues are unremarkable.
IMPRESSION:
Normal chest radiograph (PA View). No acute cardiopulmonary abnormality detected.
----------------------------------------------------------------------------------------
Dr. Meenakshi Sundaram, DMRD, DNB (Radiology)
Consultant Radiologist | Reg No: DMC-44812
`,
  expected: {
    category: 'imaging',
    title: 'Diagnostic Radiology & Imaging Study',
    facility: 'Apollo Hospital',
    patientName: 'Robert Thorne',
    patientIdentifier: 'APL-992140',
  },
};

// 3. Immunization Record Fixture
export const immunizationReportFixture = {
  rawText: `
FORTIS HEALTHCARE NATIONAL IMMUNIZATION CLINIC
Fortis Memorial Research Institute, Sector 44, Gurugram, Haryana
========================================================================================
INTERNATIONAL CERTIFICATE OF VACCINATION & PROPHYLAXIS
Beneficiary Name: David Miller      Age: 45 Yrs      Gender: Male
ABHA ID: 91-4402-9912-1892         Certificate ID: VAC-IN-2021-9921
========================================================================================
Vaccine Administered: Covishield (ChAdOx1-S [recombinant]) mRNA Booster Dose
Dose                : 0.5 mL Intramuscular (Left Deltoid)
Batch Number        : CV-DEL-99104
Date of Vaccination : 15/03/2021
Observation Period  : 30 minutes observation completed. Zero acute adverse reactions or anaphylaxis.
Vaccinator          : Nurse R. Sharma, RN | Supervised by Dr. V. Bajaj, MD
`,
  expected: {
    category: 'immunization',
    title: 'Preventative Immunization & Vaccine Administration',
    facility: 'Fortis Memorial Research Institute',
    patientName: 'David Miller',
  },
};

// 4. Surgery Operative Report Fixture
export const surgeryReportFixture = {
  rawText: `
AIIMS NEW DELHI - DEPARTMENT OF SURGICAL DISCIPLINES
Ansari Nagar, New Delhi - 110029
========================================================================================
OPERATIVE REPORT & SURGICAL SUMMARY
Patient: Arjun Sharma               Age/Sex: 28 Y / M            Date: 22/06/2018
UHID   : AIIMS-SURG-88192           OR Room: 4                   Status: Emergency Inpatient
Lead Surgeon: Dr. R. Malhotra, MS   Anesthetist: Dr. K. Rao, MD  Anesthesia: General (GA)
========================================================================================
PROCEDURE PERFORMED: Emergency Laparoscopic Appendectomy.
INDICATION: Acute suppurative non-perforated appendicitis with localized peritonitis.
OPERATIVE FINDINGS:
- Appendix inflamed, turgid, 8cm in length with fibrinous exudate.
- No perforation or gangrenous necrosis. Mesoappendix ligated with bipolar coagulation.
- Base secured with endoloop. Specimen retrieved via 10mm umbilical port in endobag.
- Minimal serous fluid in pelvis aspirated; peritoneal cavity irrigated with warm saline.
ESTIMATED BLOOD LOSS: < 20 mL.
COMPLICATIONS: None. All swab and instrument counts verified correct.
POST-OPERATIVE PLAN: IV fluids, analgesia, early ambulation at 6h, liquid diet at 12h.
`,
  expected: {
    category: 'surgery',
    title: 'Surgical Operative Procedure Record',
    facility: 'Department of Surgical Disciplines',
    patientName: 'Arjun Sharma',
  },
};

const BASE_URL = process.env.API_URL || 'http://127.0.0.1:5000/api';

const runMedicalPipelineTests = async () => {
  console.log('====================================================');
  console.log(' HealthGrid Medical Document & Timeline Test Suite');
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

  // --------------------------------------------------------------------------
  // 1. OCR Cleanup & Field Normalization
  // --------------------------------------------------------------------------
  await test('OCR Cleanup: Deduplicates repeated lines & strips boilerplate noise', () => {
    const noisyText = `
CityCare Hospitals Lucknow, Uttar Pradesh - 226001 OUTPATIENT DEPARTMENT
For Appointments Scan QR Code
Compassion + Care « Better Health
p Ph: 0522-4001234 DEPARTMENT Se
CityCare Hospitals Lucknow, Uttar Pradesh - 226001 OUTPATIENT DEPARTMENT
Patient Name: Amit Kumar — Age/Sex: 24 / M Date: 12/10/2026
Page 1 of 1
Authorized Signatory
Chief Complaints: Fever, cough, body ache since 3 days
`;
    const { cleanText, cleanedLines, boilerplateLines } = cleanOcrText(noisyText);
    ok(cleanedLines.length < noisyText.split('\n').filter(Boolean).length, 'Cleaned lines should be fewer');
    ok(boilerplateLines.length >= 3, 'Should detect boilerplate lines');
    // Ensure repeated hospital line is deduplicated
    const hospitalLines = cleanedLines.filter((l) => l.includes('CityCare Hospitals'));
    strictEqual(hospitalLines.length, 1, 'Hospital line should appear only once');
  });

  // --------------------------------------------------------------------------
  // 2. CityCare Hospital Consultation Sheet (Real Sample Document)
  // --------------------------------------------------------------------------
  await test('Extraction: CityCare Consultation Sheet categorised correctly (NOT LFT)', () => {
    const rawOcr = `
[E220
o J 123, Green Park Road, Ee
CityCar e Hospitals Lucknow, Uttar Pradesh - 226001 OUTPATIENT He
p Ph: 0522-4001234 DEPARTMENT Se
Compassion + Care « Better Health es ihrem |
Patient Name:  Ayit Kumar — Age/Sex: 24 [| M _ Se Date: 12/10/2026
UHID : CHL/26/89123 Consultant: Dx. R. Sharma Dept.: General Medicine
MBBS, MD (General Medicine) Tne. ODER
Chief Complaints :  Feves cough b body ache R¢
Since 3 days @ Pavacetams 650 igi T dogs
History of Present Illness : fever ( intermittent) , dry cough, | tab TDS after food
So. throat, bo che. No breathlessness. : om
Past History : PE, cart: re @ AER ree GR Sal
Allergies : Alot known .
Examination: Temp - 100.8°F 3) Levocetirizine 5 mg. od
Pulse = 96 /min HS
Be = 5/24 ali
Spo, — 987 (RM) 0) Montelukast 10 my ET
Systemic Examination : : led ols | tab HS 7
pA - Soft, non - tender
Provisional Diagnosis : Acute Viral Fever (5) Cough SPR oe ne) a hea
Advice: — Adequate hydration
~ Steam inhalation Dr.R. Sharma
CityCare Hospitals, Lucknow
`;

    const parsed = parseMedicalDocument(rawOcr, { fileName: 'CityCare Hospital Consultation Sheet.png' });

    strictEqual(parsed.category, 'diagnosis', 'Must be classified as DIAGNOSIS / CLINICAL ENCOUNTER, not LAB');
    strictEqual(parsed.title, 'Outpatient Clinical Consultation & Prescription');
    strictEqual(parsed.facility, 'CityCare Hospitals, Lucknow');
    strictEqual(parsed.patientMetadata.name, 'Amit Kumar', 'Should repair OCR Ayit Kumar to Amit Kumar');
    strictEqual(parsed.patientMetadata.identifier, 'CHL/26/89123');
    strictEqual(parsed.patientMetadata.age, 24);
    strictEqual(parsed.patientMetadata.gender, 'Male');
    strictEqual(parsed.clinician, 'Dr. R. Sharma, MBBS, MD (General Medicine)');
    strictEqual(parsed.department, 'General Medicine');
    ok(parsed.reportDate.startsWith('2026-10-12'), 'Report date should be 2026-10-12');
    ok(parsed.encounterDate.startsWith('2026-10-12'), 'Encounter date should be 2026-10-12');

    // Vitals observations
    const tempObs = parsed.observations.find((o) => o.name === 'Temperature');
    ok(tempObs, 'Temperature should be extracted');
    strictEqual(tempObs.value, '100.8');
    strictEqual(tempObs.unit, '°F');
    strictEqual(tempObs.flag, 'high');

    const pulseObs = parsed.observations.find((o) => o.name === 'Pulse');
    ok(pulseObs, 'Pulse should be extracted');
    strictEqual(pulseObs.value, '96');
    strictEqual(pulseObs.flag, 'normal');

    // Prescriptions extracted
    ok(parsed.structuredData.medications, 'Prescriptions should be present');
    ok(parsed.structuredData.medications.length >= 4, 'Should extract prescribed medications');
    const pcm = parsed.structuredData.medications.find((m) => m.drug === 'Paracetamol');
    ok(pcm, 'Paracetamol should be extracted');
    strictEqual(pcm.strength, '650 mg');

    // Provisional diagnosis extracted
    ok(parsed.structuredData.diagnosis, 'Diagnosis structured data should be present');
    ok(
      parsed.structuredData.diagnosis.provisionalDiagnosis.includes('Acute Viral Fever'),
      'Diagnosis must reflect source clinical findings'
    );

    // Summary must be clean and not contain raw OCR excerpts or phone numbers
    ok(!parsed.clinicalSummary.includes('RAW OCR EXCERPT'), 'Clinical summary must not contain raw OCR text');
    ok(!parsed.clinicalSummary.includes('0522-4001234'), 'Clinical summary must not contain phone numbers');
  });

  // --------------------------------------------------------------------------
  // 3. Cryptographic Hash of the Genuine Sample Image
  // --------------------------------------------------------------------------
  await test('Crypto: Genuine SHA-256 calculation on CityCare image bytes', () => {
    const imgPath = path.resolve('tests/fixtures/CityCare Hospital Consultation Sheet.png');
    if (fs.existsSync(imgPath)) {
      const buffer = fs.readFileSync(imgPath);
      const hash = computeFileSha256(buffer);
      ok(hash, 'Hash must be generated');
      strictEqual(hash.length, 64, 'SHA-256 must be 64 hexadecimal characters');

      // Verify against expected
      const verification = verifyDocumentIntegrity(buffer, hash);
      strictEqual(verification.verified, true, 'Verification of correct hash must succeed');

      // Verify tampered hash
      const badVerification = verifyDocumentIntegrity(buffer, '0000000000000000000000000000000000000000000000000000000000000000');
      strictEqual(badVerification.verified, false, 'Tampered hash must fail verification');
    }
  });

  // --------------------------------------------------------------------------
  // 4. Genuine LFT Report Fixture Extraction
  // --------------------------------------------------------------------------
  await test('Extraction: LFT Panel extracts exact measurements, units, and flags', () => {
    const parsed = parseMedicalDocument(lftReportFixture.rawText, { fileName: 'LFT_Report_Sarah.pdf' });

    strictEqual(parsed.category, 'lab');
    strictEqual(parsed.title, 'Liver Function Test (LFT) Panel');
    strictEqual(parsed.patientMetadata.name, 'Sarah Jenkins');
    strictEqual(parsed.patientMetadata.identifier, 'MAX-26-89042');

    // Check individual measurements
    const biliTotal = parsed.observations.find((o) => o.name === 'Total Bilirubin');
    ok(biliTotal, 'Total Bilirubin must be extracted');
    strictEqual(biliTotal.value, '0.90');
    strictEqual(biliTotal.unit, 'mg/dL');
    strictEqual(biliTotal.flag, 'normal');

    const biliDirect = parsed.observations.find((o) => o.name === 'Direct Bilirubin');
    ok(biliDirect, 'Direct Bilirubin must be extracted');
    strictEqual(biliDirect.value, '0.25');
    strictEqual(biliDirect.flag, 'normal');

    const ast = parsed.observations.find((o) => o.name === 'AST (SGOT)');
    ok(ast, 'AST/SGOT must be extracted');
    strictEqual(ast.value, '32');
    strictEqual(ast.flag, 'normal');

    const alt = parsed.observations.find((o) => o.name === 'ALT (SGPT)');
    ok(alt, 'ALT/SGPT must be extracted');
    strictEqual(alt.value, '48');
    strictEqual(alt.flag, 'high', 'ALT of 48 exceeds 7-45 range so must be marked high');

    const alp = parsed.observations.find((o) => o.name === 'Alkaline Phosphatase');
    ok(alp, 'ALP must be extracted');
    strictEqual(alp.value, '88');
    strictEqual(alp.flag, 'normal');

    const protein = parsed.observations.find((o) => o.name === 'Total Protein');
    ok(protein, 'Total Protein must be extracted');
    strictEqual(protein.value, '7.40');
    strictEqual(protein.flag, 'normal');

    const albumin = parsed.observations.find((o) => o.name === 'Albumin');
    ok(albumin, 'Albumin must be extracted');
    strictEqual(albumin.value, '4.50');
    strictEqual(albumin.flag, 'normal');

    // Values must NEVER be hardcoded from cholesterol or other panels
    ok(!parsed.observations.some((o) => o.name === 'Total Chol.'), 'LFT must not contain cholesterol');
  });

  // --------------------------------------------------------------------------
  // 5. Handling Incomplete Data / Empty Measurement States
  // --------------------------------------------------------------------------
  await test('Extraction: Incomplete document handles empty measurement state cleanly', () => {
    const unreadableNote = `
GENERAL HOSPITAL CLINICAL MEMORANDUM
Patient was seen for routine review.
Advised regular walk and balanced diet.
`;
    const parsed = parseMedicalDocument(unreadableNote);
    strictEqual(parsed.observations.length, 0, 'No false measurements should be invented');
    ok(
      parsed.clinicalSummary.includes('No discrete quantitative laboratory observations') ||
        parsed.clinicalSummary.includes('Clinical document recorded'),
      'Clean summary reflecting lack of discrete measurements'
    );
  });

  // --------------------------------------------------------------------------
  // 6. Multi-Category Verification (Imaging, Immunization, Surgery)
  // --------------------------------------------------------------------------
  await test('Extraction: Imaging report correctly identified and parsed', () => {
    const parsed = parseMedicalDocument(imagingReportFixture.rawText);
    strictEqual(parsed.category, 'imaging');
    strictEqual(parsed.title, 'Diagnostic Radiology & Imaging Study');
    strictEqual(parsed.patientMetadata.name, 'Robert Thorne');
    strictEqual(parsed.patientMetadata.identifier, 'APL-992140');
  });

  await test('Extraction: Immunization certificate correctly parsed', () => {
    const parsed = parseMedicalDocument(immunizationReportFixture.rawText);
    strictEqual(parsed.category, 'immunization');
    strictEqual(parsed.title, 'Preventative Immunization & Vaccine Administration');
    strictEqual(parsed.patientMetadata.name, 'David Miller');
  });

  await test('Extraction: Surgical operative report correctly parsed', () => {
    const parsed = parseMedicalDocument(surgeryReportFixture.rawText);
    strictEqual(parsed.category, 'surgery');
    strictEqual(parsed.title, 'Surgical Operative Procedure Record');
    strictEqual(parsed.patientMetadata.name, 'Arjun Sharma');
  });

  // --------------------------------------------------------------------------
  // 7. REST API End-to-End Integration & Cryptographic Persistence
  // --------------------------------------------------------------------------
  let doctorToken = '';
  let patientToken = '';
  let patient1Id = '';
  let testRecordId = '';
  const testFileHash = '0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00';

  await test('API: Provider login for record persistence test', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'doctor@healthgrid.test', password: 'Password@123' }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    doctorToken = data.token;
  });

  await test('API: Patient login and retrieve vault ID', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient1@healthgrid.test', password: 'Password@123' }),
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    patientToken = data.token;
    patient1Id = data.user.patient;
    ok(patient1Id);
  });

  await test('API: Persist structured LFT report with observations & cryptographic hash', async () => {
    const payload = {
      patient: patient1Id,
      category: 'lab',
      title: 'Automated Liver Function Test (LFT) Panel',
      reportDate: '2026-10-26T10:00:00.000Z',
      encounterDate: '2026-10-26T09:30:00.000Z',
      facility: 'Max Super Speciality Hospital, Saket',
      department: 'Pathology & Biochemistry',
      clinician: 'Dr. S. K. Gupta, MD',
      clinicalSummary: 'LFT Panel: Bilirubin 0.9 mg/dL (normal), AST 32 U/L (normal), ALT 48 U/L (mild elevation).',
      patientMetadata: {
        name: 'Sarah Jenkins',
        identifier: 'MAX-26-89042',
        age: 32,
        gender: 'Female',
      },
      observations: [
        { name: 'Total Bilirubin', value: '0.9', unit: 'mg/dL', referenceRange: '0.2 - 1.2', flag: 'normal' },
        { name: 'AST (SGOT)', value: '32', unit: 'U/L', referenceRange: '10 - 40', flag: 'normal' },
        { name: 'ALT (SGPT)', value: '48', unit: 'U/L', referenceRange: '7 - 45', flag: 'high' },
      ],
      documentHash: testFileHash,
      verificationStatus: 'VERIFIED',
      source: 'scanner',
    };

    const res = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify(payload),
    });

    strictEqual(res.status, 201, 'Should create record');
    const created = await res.json();
    ok(created._id);
    strictEqual(created.observations.length, 3);
    strictEqual(created.documentHash, testFileHash);
    strictEqual(created.verificationStatus, 'VERIFIED');
    testRecordId = created._id;
  });

  await test('API: Idempotency check returns existing record on identical document hash', async () => {
    const duplicatePayload = {
      patient: patient1Id,
      category: 'lab',
      title: 'Automated Liver Function Test (LFT) Panel (Duplicate Scan)',
      documentHash: testFileHash,
      observations: [{ name: 'Total Bilirubin', value: '0.9', unit: 'mg/dL' }],
    };

    const res = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify(duplicatePayload),
    });

    strictEqual(res.status, 200, 'Duplicate hash should return 200 with existing record');
    const data = await res.json();
    strictEqual(data._id, testRecordId, 'Must return the original record ID');
  });

  await test('API: Retrieve individual record via GET /api/records/:id', async () => {
    const res = await fetch(`${BASE_URL}/records/${testRecordId}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    strictEqual(res.status, 200);
    const data = await res.json();
    strictEqual(data._id, testRecordId);
    strictEqual(data.observations.length, 3);
    strictEqual(data.patientMetadata.name, 'Sarah Jenkins');
  });

  await test('API: Patient timeline receives structured observations in vault endpoint', async () => {
    const res = await fetch(`${BASE_URL}/patients/${patient1Id}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    strictEqual(res.status, 200);
    const vault = await res.json();
    ok(Array.isArray(vault.records));
    const persisted = vault.records.find((r) => r._id === testRecordId);
    ok(persisted, 'Saved record must be in patient timeline');
    ok(persisted.observations.length >= 3, 'Observations must be populated in timeline');
  });

  await test('API: Clean up test record (provider only)', async () => {
    const res = await fetch(`${BASE_URL}/records/${testRecordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    strictEqual(res.status, 200);
  });

  console.log('\n====================================================');
  console.log(` Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
};

runMedicalPipelineTests();
