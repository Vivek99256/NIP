import { describe, it, expect } from "vitest";
import { normalizePhoneNumber, isValidMobileNumber } from "@/lib/validation/phone";
import {
  patientProfileUpdateSchema,
  prescriptionCreateSchema,
  appointmentBookingSchema,
} from "@/lib/validation/schemas";

describe("Phone Normalization and Zod Validation Schemas", () => {
  it("normalizes Indian mobile numbers into standard E.164", () => {
    expect(normalizePhoneNumber("+91 98765 43210")).toBe("+919876543210");
    expect(normalizePhoneNumber("9876543210", "IN")).toBe("+919876543210");
    expect(normalizePhoneNumber("+91-98765-43210")).toBe("+919876543210");
  });

  it("normalizes international mobile numbers", () => {
    expect(normalizePhoneNumber("+1 202 555 0123")).toBe("+12025550123");
  });

  it("rejects invalid or malformed numbers", () => {
    expect(isValidMobileNumber("12345")).toBe(false);
    expect(isValidMobileNumber("abcdefghij")).toBe(false);
    expect(() => normalizePhoneNumber("000000")).toThrow();
  });

  it("validates patient profile update schema", () => {
    const valid = {
      fullName: "Rohan Verma",
      dateOfBirth: "1990-05-14",
      gender: "MALE",
      bloodGroup: "O_POSITIVE",
      emergencyContactName: "Meera Verma",
      emergencyContactPhone: "+919876500001",
      address: "Navi Mumbai",
      allergies: "Penicillin",
      existingConditions: "Mild Asthma",
    };

    const parsed = patientProfileUpdateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const invalid = {
      fullName: "A", // too short
    };
    const invalidParsed = patientProfileUpdateSchema.safeParse(invalid);
    expect(invalidParsed.success).toBe(false);
  });

  it("validates prescription creation schema and requires at least 1 medicine", () => {
    const validRx = {
      patientId: "pat-123",
      diagnosis: "Acute Bronchitis",
      medicines: [
        {
          medicineName: "Amoxicillin",
          strength: "500 mg",
          dosage: "1 tablet",
          route: "Oral",
          frequency: "Twice daily",
          duration: "5 days",
        },
      ],
    };

    expect(prescriptionCreateSchema.safeParse(validRx).success).toBe(true);

    const emptyMeds = {
      patientId: "pat-123",
      diagnosis: "Cold",
      medicines: [], // Must have at least 1 medicine!
    };
    expect(prescriptionCreateSchema.safeParse(emptyMeds).success).toBe(false);
  });

  it("validates appointment booking schema", () => {
    const validBooking = {
      doctorId: "doc-123",
      appointmentDate: "2026-03-10",
      startTime: "10:30",
      type: "IN_PERSON",
      reasonForVisit: "Persistent cough evaluation",
    };

    expect(appointmentBookingSchema.safeParse(validBooking).success).toBe(true);

    const invalidTime = {
      ...validBooking,
      startTime: "25:99", // Invalid time format
    };
    expect(appointmentBookingSchema.safeParse(invalidTime).success).toBe(false);
  });
});
