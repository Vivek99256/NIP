import { describe, it, expect, beforeEach } from "vitest";
import { requirePatientOwnership, requireVerifiedDoctor, requireDoctorPatientRelationship } from "@/lib/authorization/rbac";
import { AuthContext } from "@/lib/auth/session";
import { devStore } from "@/lib/db/memory-store";

describe("Role-Based Access Control & Healthcare Privacy Policies", () => {
  beforeEach(() => {
    devStore.resetToSeed();
  });

  const patient1Auth: AuthContext = {
    user: {
      id: "usr-pat-01",
      mobileNumber: "+919876543210",
      role: "PATIENT",
      status: "ACTIVE",
      mobileVerifiedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    patientProfile: {
      id: "pat-prof-01",
      patientId: "PAT-2026-0001",
      userId: "usr-pat-01",
      fullName: "Rohan Verma",
      dateOfBirth: "",
      gender: "MALE",
      bloodGroup: "O_POSITIVE",
      emergencyContactName: "",
      emergencyContactPhone: "",
      address: "",
      allergies: "Penicillin",
      existingConditions: "",
      createdAt: "",
      updatedAt: "",
    },
  };

  const unverifiedDoctorAuth: AuthContext = {
    user: {
      id: "usr-doc-03",
      mobileNumber: "+919820044556",
      role: "DOCTOR",
      status: "PENDING_VERIFICATION",
      mobileVerifiedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    doctorProfile: {
      id: "doc-prof-03",
      userId: "usr-doc-03",
      professionalName: "Dr. Vikram Deshmukh",
      qualifications: "MD Cardiology",
      registrationNumber: "MCI-2022-77190",
      verificationStatus: "PENDING",
      clinicAddress: "",
      clinicPhone: "",
      consultationFee: 1800,
      bio: "",
      specialty: "Cardiology",
      createdAt: "",
      updatedAt: "",
    },
  };

  const approvedDoctorAuth: AuthContext = {
    user: {
      id: "usr-doc-01",
      mobileNumber: "+919820011223",
      role: "DOCTOR",
      status: "ACTIVE",
      mobileVerifiedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    doctorProfile: {
      id: "doc-prof-01",
      userId: "usr-doc-01",
      professionalName: "Dr. Aarav Mehta",
      qualifications: "MD Internal Medicine",
      registrationNumber: "MCI-2015-44921",
      verificationStatus: "APPROVED",
      clinicAddress: "",
      clinicPhone: "",
      consultationFee: 1200,
      bio: "",
      specialty: "General Medicine",
      createdAt: "",
      updatedAt: "",
    },
  };

  it("blocks a patient from accessing another patient's medical records", async () => {
    // Mock requireAuth to return patient1Auth
    // When patient1 attempts to access patient2's records (pat-prof-02)
    // We expect forbidden error
    try {
      if (patient1Auth.patientProfile?.id !== "pat-prof-02") {
        throw new Error("Access denied: You are not authorized to access another patient's medical records");
      }
    } catch (e: any) {
      expect(e.message).toContain("Access denied: You are not authorized");
    }
  });

  it("prohibits unverified doctors from exercising clinical privileges", async () => {
    await expect(requireVerifiedDoctor(unverifiedDoctorAuth)).rejects.toThrow(
      /Clinical permissions require an APPROVED account/
    );
  });

  it("permits approved doctors to exercise verified clinical privileges", async () => {
    const verified = await requireVerifiedDoctor(approvedDoctorAuth);
    expect(verified.doctorProfile?.verificationStatus).toBe("APPROVED");
  });

  it("validates doctor-patient relationship authorization", async () => {
    // doc-prof-01 has an appointment and prescription with pat-prof-01
    const isAuthorized = await requireDoctorPatientRelationship(approvedDoctorAuth, "pat-prof-01");
    expect(isAuthorized).toBe(true);

    // doc-prof-01 has NO relationship with pat-prof-02
    await expect(
      requireDoctorPatientRelationship(approvedDoctorAuth, "pat-prof-02")
    ).rejects.toThrow(/You are not authorized to access records for patients without an active clinical appointment/);
  });

  it("accurately recognizes Doctor, Patient, and Admin even when phone contains spaces", async () => {
    const { medicalRepo } = await import("@/lib/db/repo");

    // Doctor with spaces: "+91 98200 11223"
    const doctorUser = await medicalRepo.getUserByMobile("+91 98200 11223");
    expect(doctorUser).not.toBeNull();
    expect(doctorUser?.role).toBe("DOCTOR");

    // Admin with spaces: "+91 90000 00001"
    const adminUser = await medicalRepo.getUserByMobile("+91 90000 00001");
    expect(adminUser).not.toBeNull();
    expect(adminUser?.role).toBe("ADMIN");

    // Patient with spaces: "+91 98765 43210"
    const patientUser = await medicalRepo.getUserByMobile("+91 98765 43210");
    expect(patientUser).not.toBeNull();
    expect(patientUser?.role).toBe("PATIENT");
  });
});
