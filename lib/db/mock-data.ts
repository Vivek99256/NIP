export interface MockUser {
  id: string;
  mobileNumber: string;
  passwordHash?: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  mobileVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockPatientProfile {
  id: string;
  patientId: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "NOT_DISCLOSED";
  bloodGroup: "A_POSITIVE" | "A_NEGATIVE" | "B_POSITIVE" | "B_NEGATIVE" | "AB_POSITIVE" | "AB_NEGATIVE" | "O_POSITIVE" | "O_NEGATIVE" | "UNKNOWN";
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;
  allergies: string;
  existingConditions: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockDoctorProfile {
  id: string;
  userId: string;
  professionalName: string;
  qualifications: string;
  registrationNumber: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  clinicAddress: string;
  clinicPhone: string;
  consultationFee: number;
  bio: string;
  specialty: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockRadiologyReport {
  id: string;
  patientId: string;
  category: "X_RAY" | "CT_SCAN" | "MRI" | "SONOGRAPHY_ULTRASOUND" | "PET_CT_SCAN" | "OTHER";
  testDate: string;
  reportDate: string;
  diagnosticCentre: string;
  radiologistName: string;
  findings: string;
  clinicalNotes?: string;
  pdfFileId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockLabResult {
  id: string;
  reportId: string;
  testName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  abnormalityFlag: "NORMAL" | "LOW" | "HIGH" | "CRITICAL" | "ABNORMAL";
}

export interface MockLaboratoryReport {
  id: string;
  patientId: string;
  category: "CBC" | "BLOOD_SUGAR" | "KIDNEY_FUNCTION_TEST" | "LIVER_FUNCTION_TEST" | "URINE_TEST" | "HISTOPATHOLOGY" | "HIV_TEST" | "HBSAG_TEST" | "BIOPSY" | "BT_CT_PT" | "OTHER";
  testDate: string;
  reportDate: string;
  laboratoryName: string;
  findings: string;
  doctorNotes?: string;
  pdfFileId?: string;
  results: MockLabResult[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockPrescriptionMedicine {
  id: string;
  prescriptionId: string;
  medicineName: string;
  strength: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
  startDate?: string;
  endDate?: string;
}

export interface MockPrescriptionRevision {
  id: string;
  prescriptionId: string;
  revisionNumber: number;
  doctorId: string;
  reasonForAmendment: string;
  snapshotJson: string;
  createdAt: string;
}

export interface MockPrescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  doctorId: string;
  prescriptionDate: string;
  clinicalNotes?: string;
  diagnosis: string;
  status: "DRAFT" | "FINALIZED" | "AMENDED" | "CANCELLED";
  followUpDate?: string;
  finalizedAt?: string;
  medicines: MockPrescriptionMedicine[];
  revisions: MockPrescriptionRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface MockAppointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  clinicId?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: "IN_PERSON" | "ONLINE";
  reasonForVisit: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "REJECTED";
  bookingTimestamp: string;
  cancellationReason?: string;
  cancelledById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockMedicalDocument {
  id: string;
  patientId: string;
  title: string;
  category: "DISCHARGE_SUMMARY" | "MEDICAL_CERTIFICATE" | "REFERRAL_LETTER" | "OPERATION_REPORT" | "OTHER";
  documentDate: string;
  description: string;
  fileId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockAuditLog {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadataJson?: string;
  timestamp: string;
}

export interface MockReportCategory {
  id: string;
  type: "RADIOLOGY" | "LABORATORY";
  code: string;
  name: string;
  modalityOrSpecimen: string;
  typicalTurnaround: string;
  parametersCount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getInitialSeedData() {
  const users: MockUser[] = [
    {
      id: "usr-admin-01",
      mobileNumber: "+919000000001",
      passwordHash: "Password123",
      role: "ADMIN",
      status: "ACTIVE",
      mobileVerifiedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "usr-doc-01",
      mobileNumber: "+919820011223",
      passwordHash: "Password123",
      role: "DOCTOR",
      status: "ACTIVE",
      mobileVerifiedAt: "2026-01-05T00:00:00.000Z",
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z",
    },
    {
      id: "usr-doc-02",
      mobileNumber: "+919820022334",
      passwordHash: "Password123",
      role: "DOCTOR",
      status: "ACTIVE",
      mobileVerifiedAt: "2026-01-10T00:00:00.000Z",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "usr-doc-03",
      mobileNumber: "+919820044556",
      passwordHash: "Password123",
      role: "DOCTOR",
      status: "PENDING_VERIFICATION",
      mobileVerifiedAt: "2026-02-01T00:00:00.000Z",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
    {
      id: "usr-pat-01",
      mobileNumber: "+919876543210",
      passwordHash: "Password123",
      role: "PATIENT",
      status: "ACTIVE",
      mobileVerifiedAt: "2026-01-15T00:00:00.000Z",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
    {
      id: "usr-pat-02",
      mobileNumber: "+919876543211",
      passwordHash: "Password123",
      role: "PATIENT",
      status: "ACTIVE",
      mobileVerifiedAt: "2026-01-20T00:00:00.000Z",
      createdAt: "2026-01-20T00:00:00.000Z",
      updatedAt: "2026-01-20T00:00:00.000Z",
    },
  ];

  const patients: MockPatientProfile[] = [
    {
      id: "pat-prof-01",
      patientId: "PAT-2026-0001",
      userId: "usr-pat-01",
      fullName: "Rohan Verma",
      dateOfBirth: "1990-05-14T00:00:00.000Z",
      gender: "MALE",
      bloodGroup: "O_POSITIVE",
      emergencyContactName: "Meera Verma (Spouse)",
      emergencyContactPhone: "+919876500001",
      address: "Flat 402, Green Meadows, Sector 18, Navi Mumbai",
      allergies: "Penicillin, Peanuts",
      existingConditions: "Mild Bronchial Asthma, Hypertension (Stage 1)",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
    {
      id: "pat-prof-02",
      patientId: "PAT-2026-0002",
      userId: "usr-pat-02",
      fullName: "Ananya Sen",
      dateOfBirth: "1988-11-22T00:00:00.000Z",
      gender: "FEMALE",
      bloodGroup: "B_POSITIVE",
      emergencyContactName: "Amit Sen (Brother)",
      emergencyContactPhone: "+919876500002",
      address: "12B Lake View Apartments, Kolkata",
      allergies: "Sulfa antibiotics",
      existingConditions: "Type 2 Diabetes Mellitus",
      createdAt: "2026-01-20T00:00:00.000Z",
      updatedAt: "2026-01-20T00:00:00.000Z",
    },
  ];

  const doctors: MockDoctorProfile[] = [
    {
      id: "doc-prof-01",
      userId: "usr-doc-01",
      professionalName: "Dr. Aarav Mehta",
      qualifications: "MBBS, MD (Internal Medicine), FACP",
      registrationNumber: "MCI-2015-44921",
      verificationStatus: "APPROVED",
      clinicAddress: "Apex Medical Centre, Suite 301, Nariman Point, Mumbai",
      clinicPhone: "+912222881100",
      consultationFee: 1200,
      bio: "Senior Consultant Physician with over 11 years of clinical practice specializing in adult medicine, hypertension, and lifestyle diseases.",
      specialty: "General Medicine",
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-05T00:00:00.000Z",
    },
    {
      id: "doc-prof-02",
      userId: "usr-doc-02",
      professionalName: "Dr. Priya Sharma",
      qualifications: "MBBS, MS (Orthopedics), DNB",
      registrationNumber: "MCI-2017-88231",
      verificationStatus: "APPROVED",
      clinicAddress: "Bone & Joint Clinic, Powai, Mumbai",
      clinicPhone: "+912225709900",
      consultationFee: 1500,
      bio: "Orthopedic surgeon specializing in arthroscopy, spine care, and sports medicine with international fellowship training.",
      specialty: "Orthopedics",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
    },
    {
      id: "doc-prof-03",
      userId: "usr-doc-03",
      professionalName: "Dr. Vikram Deshmukh",
      qualifications: "MBBS, MD (Cardiology)",
      registrationNumber: "MCI-2022-77190",
      verificationStatus: "PENDING",
      clinicAddress: "Heart Care Institute, Dadar, Mumbai",
      clinicPhone: "+912224151122",
      consultationFee: 1800,
      bio: "Interventional cardiologist with focus on preventive cardiology and coronary interventions.",
      specialty: "Cardiology",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
  ];

  const radiologyReports: MockRadiologyReport[] = [
    {
      id: "rad-rep-01",
      patientId: "pat-prof-01",
      category: "X_RAY",
      testDate: "2026-02-10T00:00:00.000Z",
      reportDate: "2026-02-11T00:00:00.000Z",
      diagnosticCentre: "Metro Diagnostics Centre, Mumbai",
      radiologistName: "Dr. Rajesh Nair, DMRD",
      findings: "Chest X-Ray PA View: Both lung fields are clear. No focal consolidation, pneumothorax, or pleural effusion noted. Cardiothoracic ratio is normal (CTR < 0.5). Trachea is central. Bony thorax and visualised soft tissues are unremarkable.",
      clinicalNotes: "Patient presented with dry cough for 2 weeks. Post-viral bronchitic etiology suspected.",
      createdById: "usr-doc-01",
      createdAt: "2026-02-11T10:30:00.000Z",
      updatedAt: "2026-02-11T10:30:00.000Z",
    },
    {
      id: "rad-rep-02",
      patientId: "pat-prof-01",
      category: "MRI",
      testDate: "2026-01-18T00:00:00.000Z",
      reportDate: "2026-01-19T00:00:00.000Z",
      diagnosticCentre: "Apollo Advanced Imaging Institute",
      radiologistName: "Dr. Sunita Rao, MD Radiodiagnosis",
      findings: "MRI Lumbar Spine: Mild diffuse disc bulge noted at L4-L5 level with subtle indent on the thecal sac. Bilateral neural foramina remain patent. No cord compression or canal stenosis. Vertebral alignment and marrow signal are preserved.",
      clinicalNotes: "Evaluated for recurrent lower back stiffness after prolonged sitting.",
      createdById: "usr-doc-02",
      createdAt: "2026-01-19T14:15:00.000Z",
      updatedAt: "2026-01-19T14:15:00.000Z",
    },
  ];

  const laboratoryReports: MockLaboratoryReport[] = [
    {
      id: "lab-rep-01",
      patientId: "pat-prof-01",
      category: "CBC",
      testDate: "2026-02-12T00:00:00.000Z",
      reportDate: "2026-02-12T00:00:00.000Z",
      laboratoryName: "Metropolis Central Reference Lab",
      findings: "Complete Blood Count is within physiological limits except for mildly elevated Absolute Eosinophil Count suggestive of allergic diathesis.",
      doctorNotes: "Correlate with history of bronchial asthma and seasonal allergies.",
      createdById: "usr-doc-01",
      createdAt: "2026-02-12T16:00:00.000Z",
      updatedAt: "2026-02-12T16:00:00.000Z",
      results: [
        {
          id: "res-01",
          reportId: "lab-rep-01",
          testName: "Hemoglobin",
          resultValue: "14.8",
          unit: "g/dL",
          referenceRange: "13.0 - 17.0",
          abnormalityFlag: "NORMAL",
        },
        {
          id: "res-02",
          reportId: "lab-rep-01",
          testName: "Total Leukocyte Count (WBC)",
          resultValue: "7,800",
          unit: "cells/mcL",
          referenceRange: "4,000 - 11,000",
          abnormalityFlag: "NORMAL",
        },
        {
          id: "res-03",
          reportId: "lab-rep-01",
          testName: "Platelet Count",
          resultValue: "245,000",
          unit: "/mcL",
          referenceRange: "150,000 - 450,000",
          abnormalityFlag: "NORMAL",
        },
        {
          id: "res-04",
          reportId: "lab-rep-01",
          testName: "Absolute Eosinophil Count",
          resultValue: "520",
          unit: "cells/mcL",
          referenceRange: "20 - 400",
          abnormalityFlag: "HIGH",
        },
      ],
    },
    {
      id: "lab-rep-02",
      patientId: "pat-prof-01",
      category: "LIVER_FUNCTION_TEST",
      testDate: "2026-01-25T00:00:00.000Z",
      reportDate: "2026-01-26T00:00:00.000Z",
      laboratoryName: "SRL Healthcare Diagnostics",
      findings: "Bilirubin and transaminases are within normal limits. Normal hepatic biochemical profile.",
      createdById: "usr-doc-01",
      createdAt: "2026-01-26T11:20:00.000Z",
      updatedAt: "2026-01-26T11:20:00.000Z",
      results: [
        {
          id: "res-05",
          reportId: "lab-rep-02",
          testName: "Total Bilirubin",
          resultValue: "0.8",
          unit: "mg/dL",
          referenceRange: "0.2 - 1.2",
          abnormalityFlag: "NORMAL",
        },
        {
          id: "res-06",
          reportId: "lab-rep-02",
          testName: "SGOT (AST)",
          resultValue: "24",
          unit: "U/L",
          referenceRange: "10 - 40",
          abnormalityFlag: "NORMAL",
        },
        {
          id: "res-07",
          reportId: "lab-rep-02",
          testName: "SGPT (ALT)",
          resultValue: "28",
          unit: "U/L",
          referenceRange: "7 - 56",
          abnormalityFlag: "NORMAL",
        },
      ],
    },
  ];

  const prescriptions: MockPrescription[] = [
    {
      id: "rx-01",
      prescriptionNumber: "RX-2026-0001",
      patientId: "pat-prof-01",
      doctorId: "doc-prof-01",
      prescriptionDate: "2026-02-12T00:00:00.000Z",
      diagnosis: "Acute Bronchitis with Allergic Component; Controlled Hypertension",
      clinicalNotes: "Patient advised adequate rest and hydration. Steam inhalation twice daily. Strict avoidance of cold beverages and known allergen triggers.",
      status: "FINALIZED",
      followUpDate: "2026-02-26T00:00:00.000Z",
      finalizedAt: "2026-02-12T16:30:00.000Z",
      createdAt: "2026-02-12T16:15:00.000Z",
      updatedAt: "2026-02-12T16:30:00.000Z",
      revisions: [],
      medicines: [
        {
          id: "rx-med-01",
          prescriptionId: "rx-01",
          medicineName: "Montelukast + Levocetirizine",
          strength: "10mg / 5mg",
          dosage: "1 tablet",
          route: "Oral",
          frequency: "Once daily at bedtime",
          duration: "10 days",
          instructions: "Take with water after dinner",
          startDate: "2026-02-12T00:00:00.000Z",
          endDate: "2026-02-22T00:00:00.000Z",
        },
        {
          id: "rx-med-02",
          prescriptionId: "rx-01",
          medicineName: "Telmisartan",
          strength: "40 mg",
          dosage: "1 tablet",
          route: "Oral",
          frequency: "Once daily in the morning",
          duration: "30 days",
          instructions: "Take regularly before breakfast",
          startDate: "2026-02-12T00:00:00.000Z",
          endDate: "2026-03-14T00:00:00.000Z",
        },
      ],
    },
  ];

  const appointments: MockAppointment[] = [
    {
      id: "apt-01",
      appointmentNumber: "APT-2026-0001",
      patientId: "pat-prof-01",
      doctorId: "doc-prof-01",
      appointmentDate: "2026-03-05T00:00:00.000Z",
      startTime: "10:00",
      endTime: "10:30",
      type: "IN_PERSON",
      reasonForVisit: "Routine Follow-up & Blood Pressure Monitoring",
      status: "CONFIRMED",
      bookingTimestamp: "2026-02-20T10:00:00.000Z",
      createdAt: "2026-02-20T10:00:00.000Z",
      updatedAt: "2026-02-20T10:00:00.000Z",
    },
    {
      id: "apt-02",
      appointmentNumber: "APT-2026-0002",
      patientId: "pat-prof-01",
      doctorId: "doc-prof-02",
      appointmentDate: "2026-01-18T00:00:00.000Z",
      startTime: "15:00",
      endTime: "15:30",
      type: "IN_PERSON",
      reasonForVisit: "Lower Back Pain Assessment",
      status: "COMPLETED",
      bookingTimestamp: "2026-01-15T09:00:00.000Z",
      createdAt: "2026-01-15T09:00:00.000Z",
      updatedAt: "2026-01-18T15:30:00.000Z",
    },
  ];

  const medicalDocuments: MockMedicalDocument[] = [
    {
      id: "doc-01",
      patientId: "pat-prof-01",
      title: "Annual Health Checkup Clearance Certificate",
      category: "MEDICAL_CERTIFICATE",
      documentDate: "2026-01-20T00:00:00.000Z",
      description: "Medical fitness certificate issued following comprehensive annual physical checkup.",
      createdById: "usr-doc-01",
      createdAt: "2026-01-20T12:00:00.000Z",
      updatedAt: "2026-01-20T12:00:00.000Z",
    },
  ];

  const auditLogs: MockAuditLog[] = [
    {
      id: "aud-01",
      actorId: "usr-admin-01",
      action: "PLATFORM_INITIALIZATION",
      entityType: "System",
      entityId: "SYSTEM",
      metadataJson: JSON.stringify({ version: "1.0.0", environment: "production-ready" }),
      timestamp: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "aud-02",
      actorId: "usr-doc-01",
      action: "FINALIZE_PRESCRIPTION",
      entityType: "Prescription",
      entityId: "rx-01",
      metadataJson: JSON.stringify({ prescriptionNumber: "RX-2026-0001", patientId: "pat-prof-01" }),
      timestamp: "2026-02-12T16:30:00.000Z",
    },
  ];

  const reportCategories: MockReportCategory[] = [
    {
      id: "cat-rad-01",
      type: "RADIOLOGY",
      code: "X_RAY",
      name: "X-Ray (Chest & Skeletal)",
      modalityOrSpecimen: "Projection Radiography",
      typicalTurnaround: "2 hours",
      parametersCount: "Single / Dual Views",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-rad-02",
      type: "RADIOLOGY",
      code: "CT_SCAN",
      name: "Computed Tomography (CT Scan)",
      modalityOrSpecimen: "Multi-slice Helical CT",
      typicalTurnaround: "4 hours",
      parametersCount: "Axial & 3D Volumetric",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-rad-03",
      type: "RADIOLOGY",
      code: "MRI",
      name: "Magnetic Resonance Imaging (MRI)",
      modalityOrSpecimen: "High-Field 1.5T/3.0T MR",
      typicalTurnaround: "12 hours",
      parametersCount: "Multi-sequence Contrast",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-rad-04",
      type: "RADIOLOGY",
      code: "SONOGRAPHY_ULTRASOUND",
      name: "Sonography & Color Doppler",
      modalityOrSpecimen: "Acoustic Ultrasonography",
      typicalTurnaround: "1 hour",
      parametersCount: "Real-time High-resolution",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-rad-05",
      type: "RADIOLOGY",
      code: "PET_CT_SCAN",
      name: "Whole Body PET-CT Scan",
      modalityOrSpecimen: "Positron Emission Tomography",
      typicalTurnaround: "24 hours",
      parametersCount: "Metabolic Fusion Imaging",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-rad-06",
      type: "RADIOLOGY",
      code: "DEXA_SCAN",
      name: "Bone Mineral Density (DEXA)",
      modalityOrSpecimen: "Dual-energy X-ray Absorptiometry",
      typicalTurnaround: "3 hours",
      parametersCount: "T-Score & Z-Score Analysis",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-lab-01",
      type: "LABORATORY",
      code: "CBC",
      name: "Complete Blood Count (CBC with ESR)",
      modalityOrSpecimen: "Whole Blood (EDTA)",
      typicalTurnaround: "3 hours",
      parametersCount: "18 Biomarkers (Hb, TLC, Platelets...)",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-lab-02",
      type: "LABORATORY",
      code: "BLOOD_SUGAR",
      name: "Blood Glucose (Fasting & PP)",
      modalityOrSpecimen: "Fluoride Plasma",
      typicalTurnaround: "2 hours",
      parametersCount: "2 Biomarkers",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-lab-03",
      type: "LABORATORY",
      code: "KIDNEY_FUNCTION_TEST",
      name: "Kidney Function Test (KFT / RFT)",
      modalityOrSpecimen: "Serum",
      typicalTurnaround: "4 hours",
      parametersCount: "6 Biomarkers (Urea, Creatinine, Uric Acid...)",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-lab-04",
      type: "LABORATORY",
      code: "LIVER_FUNCTION_TEST",
      name: "Liver Function Test (LFT)",
      modalityOrSpecimen: "Serum",
      typicalTurnaround: "4 hours",
      parametersCount: "8 Biomarkers (SGOT, SGPT, Bilirubin...)",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-lab-05",
      type: "LABORATORY",
      code: "LIPID_PROFILE",
      name: "Comprehensive Lipid Profile",
      modalityOrSpecimen: "Serum (12h Fasting)",
      typicalTurnaround: "5 hours",
      parametersCount: "5 Biomarkers (Cholesterol, HDL, LDL, Triglycerides)",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-lab-06",
      type: "LABORATORY",
      code: "THYROID_PANEL",
      name: "Thyroid Profile (Total T3, T4, TSH)",
      modalityOrSpecimen: "Serum",
      typicalTurnaround: "6 hours",
      parametersCount: "3 Biomarkers",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "cat-lab-07",
      type: "LABORATORY",
      code: "URINE_TEST",
      name: "Urinalysis Routine & Microscopic",
      modalityOrSpecimen: "Clean-catch Midstream Urine",
      typicalTurnaround: "2 hours",
      parametersCount: "12 Parameters (pH, Protein, RBCs...)",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  return {
    users,
    patients,
    doctors,
    radiologyReports,
    laboratoryReports,
    prescriptions,
    appointments,
    medicalDocuments,
    auditLogs,
    reportCategories,
  };
}
