import { z } from "zod";
import { isValidMobileNumber } from "./phone";

// -----------------------------------------------------------------------------
// AUTH
// -----------------------------------------------------------------------------

export const loginSchema = z.object({
  mobileNumber: z
    .string()
    .min(8, "Phone number is too short")
    .refine((val) => isValidMobileNumber(val), {
      message: "Please enter a valid mobile number with country code (e.g. +91 98765 43210)",
    }),
  password: z
    .string()
    .min(1, "Password is required"),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).optional(),
  fullName: z.string().optional(),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  mobileNumber: z
    .string()
    .min(8, "Phone number is too short")
    .refine((val) => isValidMobileNumber(val), {
      message: "Please enter a valid mobile number with country code (e.g. +91 98765 43210)",
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).default("PATIENT"),
  specialty: z.string().optional(),
});

export const otpRequestSchema = z.object({
  mobileNumber: z
    .string()
    .min(8, "Phone number is too short")
    .refine((val) => isValidMobileNumber(val), {
      message: "Please enter a valid mobile number with country code (e.g. +91 98765 43210)",
    }),
});

export const otpVerifySchema = z.object({
  mobileNumber: z
    .string()
    .min(8, "Phone number is too short")
    .refine((val) => isValidMobileNumber(val), {
      message: "Please enter a valid mobile number",
    }),
  otp: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must contain only digits"),
});

// -----------------------------------------------------------------------------
// PATIENT PROFILE
// -----------------------------------------------------------------------------

export const patientProfileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "NOT_DISCLOSED"]).default("NOT_DISCLOSED"),
  bloodGroup: z.enum([
    "A_POSITIVE",
    "A_NEGATIVE",
    "B_POSITIVE",
    "B_NEGATIVE",
    "AB_POSITIVE",
    "AB_NEGATIVE",
    "O_POSITIVE",
    "O_NEGATIVE",
    "UNKNOWN",
  ]).default("UNKNOWN"),
  emergencyContactName: z.string().trim().max(100).optional().or(z.literal("")),
  emergencyContactPhone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().max(250).optional().or(z.literal("")),
  allergies: z.string().trim().max(300).optional().or(z.literal("")),
  existingConditions: z.string().trim().max(500).optional().or(z.literal("")),
});

// -----------------------------------------------------------------------------
// RADIOLOGY REPORT
// -----------------------------------------------------------------------------

export const radiologyReportCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  category: z.enum(["X_RAY", "CT_SCAN", "MRI", "SONOGRAPHY_ULTRASOUND", "PET_CT_SCAN", "OTHER"]),
  testDate: z.string().min(1, "Test date is required"),
  reportDate: z.string().min(1, "Report date is required"),
  diagnosticCentre: z.string().trim().min(2, "Diagnostic centre name required"),
  radiologistName: z.string().trim().min(2, "Radiologist name required"),
  findings: z.string().trim().min(5, "Radiological findings must be at least 5 characters"),
  clinicalNotes: z.string().trim().optional(),
  pdfFileId: z.string().optional(),
});

// -----------------------------------------------------------------------------
// LABORATORY REPORT
// -----------------------------------------------------------------------------

export const labResultItemSchema = z.object({
  testName: z.string().trim().min(1, "Test name is required"),
  resultValue: z.string().trim().min(1, "Result value is required"),
  unit: z.string().trim().min(1, "Unit is required"),
  referenceRange: z.string().trim().optional().default(""),
  abnormalityFlag: z.enum(["NORMAL", "LOW", "HIGH", "CRITICAL", "ABNORMAL"]).default("NORMAL"),
});

export const laboratoryReportCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  category: z.enum([
    "CBC",
    "BLOOD_SUGAR",
    "KIDNEY_FUNCTION_TEST",
    "LIVER_FUNCTION_TEST",
    "URINE_TEST",
    "HISTOPATHOLOGY",
    "BIOPSY",
    "BT_CT_PT",
    "HIV_TEST",
    "HBSAG_TEST",
    "OTHER",
  ]),
  testDate: z.string().min(1, "Test date is required"),
  reportDate: z.string().min(1, "Report date is required"),
  laboratoryName: z.string().trim().min(2, "Laboratory name is required"),
  findings: z.string().trim().min(5, "Findings summary must be at least 5 characters"),
  doctorNotes: z.string().trim().optional(),
  pdfFileId: z.string().optional(),
  results: z.array(labResultItemSchema).default([]),
});

// -----------------------------------------------------------------------------
// PRESCRIPTION
// -----------------------------------------------------------------------------

export const prescriptionMedicineSchema = z.object({
  medicineName: z.string().trim().min(2, "Medicine name is required"),
  strength: z.string().trim().min(1, "Strength is required (e.g. 500 mg)"),
  dosage: z.string().trim().min(1, "Dosage is required (e.g. 1 tablet)"),
  route: z.string().trim().default("Oral"),
  frequency: z.string().trim().min(1, "Frequency is required (e.g. Twice daily after meals)"),
  duration: z.string().trim().min(1, "Duration is required (e.g. 5 days)"),
  instructions: z.string().trim().optional().default(""),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const prescriptionCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  diagnosis: z.string().trim().min(3, "Diagnosis must be at least 3 characters"),
  clinicalNotes: z.string().trim().optional(),
  followUpDate: z.string().optional(),
  medicines: z.array(prescriptionMedicineSchema).min(1, "At least one medicine entry is required"),
});

export const prescriptionAmendSchema = z.object({
  reason: z.string().trim().min(5, "Reason for amendment must be at least 5 characters"),
  clinicalNotes: z.string().trim().optional(),
  medicines: z.array(prescriptionMedicineSchema).min(1, "At least one medicine entry is required"),
});

// -----------------------------------------------------------------------------
// APPOINTMENT
// -----------------------------------------------------------------------------

export const appointmentBookingSchema = z.object({
  doctorId: z.string().min(1, "Please select a doctor"),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  type: z.enum(["IN_PERSON", "ONLINE"]).default("IN_PERSON"),
  reasonForVisit: z.string().trim().min(5, "Reason for visit must be at least 5 characters"),
});

// -----------------------------------------------------------------------------
// MEDICAL DOCUMENT
// -----------------------------------------------------------------------------

export const medicalDocumentCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  title: z.string().trim().min(3, "Document title is required"),
  category: z.enum(["DISCHARGE_SUMMARY", "MEDICAL_CERTIFICATE", "REFERRAL_LETTER", "OPERATION_REPORT", "OTHER"]),
  documentDate: z.string().min(1, "Document date is required"),
  description: z.string().trim().optional(),
  fileId: z.string().optional(),
});
