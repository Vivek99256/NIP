import { prisma, checkDatabaseConnection } from "./prisma";
import { devStore } from "./memory-store";
import { AppError } from "@/lib/errors/app-error";
import {
  MockUser,
  MockPatientProfile,
  MockDoctorProfile,
  MockRadiologyReport,
  MockLaboratoryReport,
  MockPrescription,
  MockAppointment,
  MockMedicalDocument,
  MockAuditLog,
  MockReportCategory,
} from "./mock-data";

export class MedicalDataRepository {
  // ---------------------------------------------------------------------------
  // AUTH & USER
  // ---------------------------------------------------------------------------

  async getUserByMobile(mobileNumber: string): Promise<MockUser | null> {
    if (!mobileNumber) return null;
    const isDb = await checkDatabaseConnection();
    const cleanNumber = mobileNumber.replace(/\s+/g, "");
    if (isDb) {
      try {
        let u = await prisma.user.findUnique({
          where: { mobileNumber: cleanNumber },
        });
        if (!u && cleanNumber !== mobileNumber) {
          u = await prisma.user.findUnique({
            where: { mobileNumber },
          });
        }
        if (u) {
          return {
            id: u.id,
            mobileNumber: u.mobileNumber,
            passwordHash: (u as any).passwordHash || undefined,
            role: u.role as any,
            status: u.status as any,
            mobileVerifiedAt: u.mobileVerifiedAt?.toISOString() || new Date().toISOString(),
            createdAt: u.createdAt.toISOString(),
            updatedAt: u.updatedAt.toISOString(),
          };
        }
      } catch {
        // Fallback to devStore if error
      }
    }
    devStore.loadFromDisk();
    const found = devStore.findUserByMobile(cleanNumber) || devStore.findUserByMobile(mobileNumber);
    return found || null;
  }

  async getUserById(id: string): Promise<MockUser | null> {
    const isDb = await checkDatabaseConnection();
    if (isDb) {
      try {
        const u = await prisma.user.findUnique({ where: { id } });
        if (!u) return null;
        return {
          id: u.id,
          mobileNumber: u.mobileNumber,
          passwordHash: (u as any).passwordHash || undefined,
          role: u.role as any,
          status: u.status as any,
          mobileVerifiedAt: u.mobileVerifiedAt?.toISOString() || new Date().toISOString(),
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
        };
      } catch {
        // Fallback
      }
    }
    devStore.loadFromDisk();
    const found = devStore.findUserById(id);
    return found || null;
  }

  async createPatientUser(mobileNumber: string, fullName: string, passwordHash?: string): Promise<{ user: MockUser; profile: MockPatientProfile }> {
    const isDb = await checkDatabaseConnection();
    const userId = `usr-pat-${Date.now()}`;
    const patientProfileId = `pat-prof-${Date.now()}`;
    const patientCode = `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const mockUser: MockUser = {
      id: userId,
      mobileNumber,
      passwordHash: passwordHash || "Password123",
      role: "PATIENT",
      status: "ACTIVE",
      mobileVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const mockProfile: MockPatientProfile = {
      id: patientProfileId,
      patientId: patientCode,
      userId,
      fullName: fullName || "New Patient",
      dateOfBirth: "",
      gender: "NOT_DISCLOSED",
      bloodGroup: "UNKNOWN",
      emergencyContactName: "",
      emergencyContactPhone: "",
      address: "",
      allergies: "",
      existingConditions: "",
      createdAt: now,
      updatedAt: now,
    };

    if (isDb) {
      try {
        const user = await prisma.user.create({
          data: {
            id: userId,
            mobileNumber,
            passwordHash: passwordHash || "Password123",
            role: "PATIENT",
            status: "ACTIVE",
            mobileVerifiedAt: new Date(),
            patientProfile: {
              create: {
                id: patientProfileId,
                patientId: patientCode,
                fullName: fullName || "New Patient",
              },
            },
          } as any,
          include: { patientProfile: true },
        });

        return {
          user: {
            id: user.id,
            mobileNumber: user.mobileNumber,
            passwordHash: (user as any).passwordHash || passwordHash || "Password123",
            role: user.role as any,
            status: user.status as any,
            mobileVerifiedAt: user.mobileVerifiedAt?.toISOString() || now,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          profile: {
            id: user.patientProfile!.id,
            patientId: user.patientProfile!.patientId,
            userId: user.id,
            fullName: user.patientProfile!.fullName,
            dateOfBirth: user.patientProfile!.dateOfBirth?.toISOString() || "",
            gender: user.patientProfile!.gender as any,
            bloodGroup: user.patientProfile!.bloodGroup as any,
            emergencyContactName: user.patientProfile!.emergencyContactName || "",
            emergencyContactPhone: user.patientProfile!.emergencyContactPhone || "",
            address: user.patientProfile!.address || "",
            allergies: user.patientProfile!.allergies || "",
            existingConditions: user.patientProfile!.existingConditions || "",
            createdAt: user.patientProfile!.createdAt.toISOString(),
            updatedAt: user.patientProfile!.updatedAt.toISOString(),
          },
        };
      } catch {
        // Fallback to devStore
      }
    }

    devStore.users.set(userId, mockUser);
    devStore.patients.set(patientProfileId, mockProfile);
    devStore.persist();
    return { user: mockUser, profile: mockProfile };
  }

  async createDoctorUser(
    mobileNumber: string,
    fullName: string,
    specialty = "General Medicine",
    qualifications = "MBBS, MD",
    passwordHash?: string
  ): Promise<{ user: MockUser; profile: MockDoctorProfile }> {
    const isDb = await checkDatabaseConnection();
    const cleanMobile = mobileNumber.replace(/\s+/g, "");
    const userId = `usr-doc-${Date.now()}`;
    const doctorProfileId = `doc-prof-${Date.now()}`;
    const regNumber = `MCI-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const mockUser: MockUser = {
      id: userId,
      mobileNumber: cleanMobile,
      passwordHash: passwordHash || "Password123",
      role: "DOCTOR",
      status: "ACTIVE",
      mobileVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const mockProfile: MockDoctorProfile = {
      id: doctorProfileId,
      userId,
      professionalName: fullName.startsWith("Dr.") ? fullName : `Dr. ${fullName}`,
      qualifications,
      registrationNumber: regNumber,
      verificationStatus: "APPROVED",
      clinicAddress: "Room 304, OPD Block, City Hospital",
      clinicPhone: cleanMobile,
      consultationFee: 500,
      bio: "Practicing specialist physician.",
      specialty,
      createdAt: now,
      updatedAt: now,
    };

    if (isDb) {
      try {
        const user = await prisma.user.create({
          data: {
            id: userId,
            mobileNumber: cleanMobile,
            role: "DOCTOR",
            status: "ACTIVE",
            mobileVerifiedAt: new Date(),
            doctorProfile: {
              create: {
                id: doctorProfileId,
                professionalName: mockProfile.professionalName,
                qualifications: mockProfile.qualifications,
                registrationNumber: mockProfile.registrationNumber,
                verificationStatus: "APPROVED",
                clinicAddress: mockProfile.clinicAddress,
                clinicPhone: mockProfile.clinicPhone,
                consultationFee: mockProfile.consultationFee,
                bio: mockProfile.bio,
              },
            },
          },
          include: { doctorProfile: true },
        }) as any;

        return {
          user: {
            id: user.id,
            mobileNumber: user.mobileNumber,
            role: user.role as any,
            status: user.status as any,
            mobileVerifiedAt: user.mobileVerifiedAt?.toISOString() || now,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
          profile: {
            id: user.doctorProfile.id,
            userId: user.id,
            professionalName: user.doctorProfile.professionalName,
            qualifications: user.doctorProfile.qualifications,
            registrationNumber: user.doctorProfile.registrationNumber,
            verificationStatus: user.doctorProfile.verificationStatus as any,
            clinicAddress: user.doctorProfile.clinicAddress || "",
            clinicPhone: user.doctorProfile.clinicPhone || "",
            consultationFee: user.doctorProfile.consultationFee || 500,
            bio: user.doctorProfile.bio || "",
            specialty,
            createdAt: user.doctorProfile.createdAt.toISOString(),
            updatedAt: user.doctorProfile.updatedAt.toISOString(),
          },
        };
      } catch {
        // Fallback to devStore
      }
    }

    devStore.users.set(userId, mockUser);
    devStore.doctors.set(doctorProfileId, mockProfile);
    devStore.persist();
    return { user: mockUser, profile: mockProfile };
  }

  async createAdminUser(mobileNumber: string, fullName = "Hospital Admin", passwordHash?: string): Promise<{ user: MockUser }> {
    const isDb = await checkDatabaseConnection();
    const cleanMobile = mobileNumber.replace(/\s+/g, "");
    const userId = `usr-admin-${Date.now()}`;
    const now = new Date().toISOString();

    const mockUser: MockUser = {
      id: userId,
      mobileNumber: cleanMobile,
      passwordHash: passwordHash || "Password123",
      role: "ADMIN",
      status: "ACTIVE",
      mobileVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    if (isDb) {
      try {
        const user = await prisma.user.create({
          data: {
            id: userId,
            mobileNumber: cleanMobile,
            role: "ADMIN",
            status: "ACTIVE",
            mobileVerifiedAt: new Date(),
          },
        });
        return {
          user: {
            id: user.id,
            mobileNumber: user.mobileNumber,
            role: user.role as any,
            status: user.status as any,
            mobileVerifiedAt: user.mobileVerifiedAt?.toISOString() || now,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
          },
        };
      } catch {
        // Fallback
      }
    }

    devStore.users.set(userId, mockUser);
    devStore.persist();
    return { user: mockUser };
  }

  async setUserPassword(userId: string, passwordHash: string): Promise<boolean> {
    const isDb = await checkDatabaseConnection();
    if (isDb) {
      try {
        await (prisma.user as any).update({
          where: { id: userId },
          data: { passwordHash },
        });
      } catch {
        // Fallback
      }
    }
    const user = devStore.findUserById(userId);
    if (user) {
      user.passwordHash = passwordHash;
      devStore.persist();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // PATIENT PROFILES
  // ---------------------------------------------------------------------------

  async getPatientProfileByUserId(userId: string): Promise<MockPatientProfile | null> {
    const isDb = await checkDatabaseConnection();
    if (isDb) {
      try {
        const p = await prisma.patientProfile.findUnique({ where: { userId } });
        if (p) {
          return {
            id: p.id,
            patientId: p.patientId,
            userId: p.userId,
            fullName: p.fullName,
            dateOfBirth: p.dateOfBirth?.toISOString() || "",
            gender: p.gender as any,
            bloodGroup: p.bloodGroup as any,
            emergencyContactName: p.emergencyContactName || "",
            emergencyContactPhone: p.emergencyContactPhone || "",
            address: p.address || "",
            allergies: p.allergies || "",
            existingConditions: p.existingConditions || "",
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          };
        }
      } catch {
        // Fallback
      }
    }
    return devStore.findPatientByUserId(userId) || null;
  }

  async getPatientProfileById(patientId: string): Promise<MockPatientProfile | null> {
    const isDb = await checkDatabaseConnection();
    if (isDb) {
      try {
        const p = await prisma.patientProfile.findUnique({ where: { id: patientId } });
        if (p) {
          return {
            id: p.id,
            patientId: p.patientId,
            userId: p.userId,
            fullName: p.fullName,
            dateOfBirth: p.dateOfBirth?.toISOString() || "",
            gender: p.gender as any,
            bloodGroup: p.bloodGroup as any,
            emergencyContactName: p.emergencyContactName || "",
            emergencyContactPhone: p.emergencyContactPhone || "",
            address: p.address || "",
            allergies: p.allergies || "",
            existingConditions: p.existingConditions || "",
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
          };
        }
      } catch {
        // Fallback
      }
    }
    return devStore.findPatientById(patientId) || null;
  }

  async updatePatientProfile(
    patientId: string,
    data: Partial<Omit<MockPatientProfile, "id" | "patientId" | "userId" | "createdAt">>
  ): Promise<MockPatientProfile> {
    const current = await this.getPatientProfileById(patientId);
    if (!current) throw AppError.notFound("Patient profile not found");

    const updated: MockPatientProfile = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const isDb = await checkDatabaseConnection();
    if (isDb) {
      try {
        await prisma.patientProfile.update({
          where: { id: patientId },
          data: {
            fullName: updated.fullName,
            dateOfBirth: updated.dateOfBirth ? new Date(updated.dateOfBirth) : null,
            gender: updated.gender as any,
            bloodGroup: updated.bloodGroup as any,
            emergencyContactName: updated.emergencyContactName,
            emergencyContactPhone: updated.emergencyContactPhone,
            address: updated.address,
            allergies: updated.allergies,
            existingConditions: updated.existingConditions,
          },
        });
      } catch {
        // Ignore fallback
      }
    }

    devStore.patients.set(patientId, updated);
    devStore.persist();
    return updated;
  }

  async getAllPatients(): Promise<MockPatientProfile[]> {
    const isDb = await checkDatabaseConnection();
    if (isDb) {
      try {
        const list = await prisma.patientProfile.findMany({ orderBy: { createdAt: "desc" } });
        return list.map((p) => ({
          id: p.id,
          patientId: p.patientId,
          userId: p.userId,
          fullName: p.fullName,
          dateOfBirth: p.dateOfBirth?.toISOString() || "",
          gender: p.gender as any,
          bloodGroup: p.bloodGroup as any,
          emergencyContactName: p.emergencyContactName || "",
          emergencyContactPhone: p.emergencyContactPhone || "",
          address: p.address || "",
          allergies: p.allergies || "",
          existingConditions: p.existingConditions || "",
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));
      } catch {
        // Fallback
      }
    }
    return Array.from(devStore.patients.values());
  }

  // ---------------------------------------------------------------------------
  // DOCTORS
  // ---------------------------------------------------------------------------

  async getDoctorProfileByUserId(userId: string): Promise<MockDoctorProfile | null> {
    const isDb = await checkDatabaseConnection();
    if (isDb) {
      try {
        const d = await prisma.doctorProfile.findUnique({
          where: { userId },
          include: { specialties: { include: { specialty: true } } },
        });
        if (d) {
          return {
            id: d.id,
            userId: d.userId,
            professionalName: d.professionalName,
            qualifications: d.qualifications,
            registrationNumber: d.registrationNumber,
            verificationStatus: d.verificationStatus as any,
            clinicAddress: d.clinicAddress || "",
            clinicPhone: d.clinicPhone || "",
            consultationFee: d.consultationFee || 0,
            bio: d.bio || "",
            specialty: d.specialties[0]?.specialty.name || "General Medicine",
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          };
        }
      } catch {
        // Fallback
      }
    }
    return devStore.findDoctorByUserId(userId) || null;
  }

  async getDoctorProfileById(id: string): Promise<MockDoctorProfile | null> {
    const isDb = await checkDatabaseConnection();
    if (isDb) {
      try {
        const d = await prisma.doctorProfile.findUnique({
          where: { id },
          include: { specialties: { include: { specialty: true } } },
        });
        if (d) {
          return {
            id: d.id,
            userId: d.userId,
            professionalName: d.professionalName,
            qualifications: d.qualifications,
            registrationNumber: d.registrationNumber,
            verificationStatus: d.verificationStatus as any,
            clinicAddress: d.clinicAddress || "",
            clinicPhone: d.clinicPhone || "",
            consultationFee: d.consultationFee || 0,
            bio: d.bio || "",
            specialty: d.specialties[0]?.specialty.name || "General Medicine",
            createdAt: d.createdAt.toISOString(),
            updatedAt: d.updatedAt.toISOString(),
          };
        }
      } catch {
        // Fallback
      }
    }
    return devStore.findDoctorById(id) || null;
  }

  async getAllDoctors(filterSpecialty?: string): Promise<MockDoctorProfile[]> {
    const all = Array.from(devStore.doctors.values());
    if (filterSpecialty && filterSpecialty !== "ALL") {
      return all.filter((d) => d.specialty.toLowerCase() === filterSpecialty.toLowerCase());
    }
    return all;
  }

  async updateDoctorVerification(
    doctorId: string,
    status: "APPROVED" | "REJECTED" | "SUSPENDED",
    adminUserId: string
  ): Promise<MockDoctorProfile> {
    const doc = await this.getDoctorProfileById(doctorId);
    if (!doc) throw AppError.notFound("Doctor profile not found");

    doc.verificationStatus = status;
    doc.updatedAt = new Date().toISOString();
    devStore.doctors.set(doctorId, doc);
    devStore.persist();

    devStore.logAudit({
      actorId: adminUserId,
      action: `DOCTOR_VERIFICATION_${status}`,
      entityType: "DoctorProfile",
      entityId: doctorId,
      metadataJson: JSON.stringify({ doctorName: doc.professionalName, status }),
    });

    return doc;
  }

  // ---------------------------------------------------------------------------
  // RADIOLOGY REPORTS
  // ---------------------------------------------------------------------------

  async getRadiologyReports(
    patientId: string,
    filters?: { category?: string; search?: string }
  ): Promise<MockRadiologyReport[]> {
    let list = Array.from(devStore.radiologyReports.values()).filter((r) => r.patientId === patientId);

    if (filters?.category && filters.category !== "ALL") {
      list = list.filter((r) => r.category === filters.category);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (r) =>
          r.findings.toLowerCase().includes(q) ||
          r.diagnosticCentre.toLowerCase().includes(q) ||
          r.radiologistName.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
  }

  async getRadiologyReportById(id: string): Promise<MockRadiologyReport | null> {
    return devStore.radiologyReports.get(id) || null;
  }

  async createRadiologyReport(data: Omit<MockRadiologyReport, "id" | "createdAt" | "updatedAt">): Promise<MockRadiologyReport> {
    const id = `rad-rep-${Date.now()}`;
    const now = new Date().toISOString();
    const report: MockRadiologyReport = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    devStore.radiologyReports.set(id, report);
    devStore.persist();
    return report;
  }

  // ---------------------------------------------------------------------------
  // LABORATORY REPORTS
  // ---------------------------------------------------------------------------

  async getLaboratoryReports(
    patientId: string,
    filters?: { category?: string; search?: string }
  ): Promise<MockLaboratoryReport[]> {
    let list = Array.from(devStore.laboratoryReports.values()).filter((l) => l.patientId === patientId);

    if (filters?.category && filters.category !== "ALL") {
      list = list.filter((l) => l.category === filters.category);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.findings.toLowerCase().includes(q) ||
          l.laboratoryName.toLowerCase().includes(q) ||
          l.results.some((r) => r.testName.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
  }

  async getLaboratoryReportById(id: string): Promise<MockLaboratoryReport | null> {
    return devStore.laboratoryReports.get(id) || null;
  }

  async createLaboratoryReport(data: Omit<MockLaboratoryReport, "id" | "createdAt" | "updatedAt">): Promise<MockLaboratoryReport> {
    const id = `lab-rep-${Date.now()}`;
    const now = new Date().toISOString();
    const report: MockLaboratoryReport = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    devStore.laboratoryReports.set(id, report);
    devStore.persist();
    return report;
  }

  // ---------------------------------------------------------------------------
  // PRESCRIPTIONS
  // ---------------------------------------------------------------------------

  async getPrescriptions(
    patientId?: string,
    doctorId?: string,
    status?: string
  ): Promise<MockPrescription[]> {
    let list = Array.from(devStore.prescriptions.values());

    if (patientId) {
      list = list.filter((rx) => rx.patientId === patientId);
    }

    if (doctorId) {
      list = list.filter((rx) => rx.doctorId === doctorId);
    }

    if (status && status !== "ALL") {
      list = list.filter((rx) => rx.status === status);
    }

    return list.sort((a, b) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime());
  }

  async getPrescriptionById(id: string): Promise<MockPrescription | null> {
    return devStore.prescriptions.get(id) || null;
  }

  async createPrescription(data: Omit<MockPrescription, "id" | "prescriptionNumber" | "createdAt" | "updatedAt" | "revisions">): Promise<MockPrescription> {
    const id = `rx-${Date.now()}`;
    const prescriptionNumber = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const rx: MockPrescription = {
      ...data,
      id,
      prescriptionNumber,
      revisions: [],
      createdAt: now,
      updatedAt: now,
    };

    devStore.prescriptions.set(id, rx);
    devStore.persist();
    return rx;
  }

  async finalizePrescription(prescriptionId: string, doctorId: string): Promise<MockPrescription> {
    const rx = await this.getPrescriptionById(prescriptionId);
    if (!rx) throw AppError.notFound("Prescription not found");
    if (rx.doctorId !== doctorId) throw AppError.forbidden("Only the prescribing doctor may finalize this prescription");
    if (rx.status === "FINALIZED") throw AppError.badRequest("Prescription is already finalized");

    rx.status = "FINALIZED";
    rx.finalizedAt = new Date().toISOString();
    rx.updatedAt = new Date().toISOString();
    devStore.prescriptions.set(prescriptionId, rx);
    devStore.persist();

    devStore.logAudit({
      actorId: doctorId,
      action: "FINALIZE_PRESCRIPTION",
      entityType: "Prescription",
      entityId: prescriptionId,
      metadataJson: JSON.stringify({ prescriptionNumber: rx.prescriptionNumber, patientId: rx.patientId }),
    });

    return rx;
  }

  async amendPrescription(
    prescriptionId: string,
    doctorId: string,
    reason: string,
    updatedMedicines: MockPrescription["medicines"],
    clinicalNotes?: string
  ): Promise<MockPrescription> {
    const rx = await this.getPrescriptionById(prescriptionId);
    if (!rx) throw AppError.notFound("Prescription not found");
    if (rx.doctorId !== doctorId) throw AppError.forbidden("Only the authorized doctor may amend this prescription");
    if (rx.status !== "FINALIZED" && rx.status !== "AMENDED") {
      throw AppError.badRequest("Only finalized prescriptions can be amended through the amendment workflow");
    }

    // Save historical revision snapshot
    const revisionNumber = rx.revisions.length + 1;
    const snapshotJson = JSON.stringify({
      prescriptionDate: rx.prescriptionDate,
      diagnosis: rx.diagnosis,
      clinicalNotes: rx.clinicalNotes,
      medicines: rx.medicines,
    });

    rx.revisions.push({
      id: `rev-${Date.now()}`,
      prescriptionId: rx.id,
      revisionNumber,
      doctorId,
      reasonForAmendment: reason,
      snapshotJson,
      createdAt: new Date().toISOString(),
    });

    // Apply amendments
    rx.status = "AMENDED";
    rx.medicines = updatedMedicines;
    if (clinicalNotes !== undefined) rx.clinicalNotes = clinicalNotes;
    rx.updatedAt = new Date().toISOString();

    devStore.prescriptions.set(prescriptionId, rx);
    devStore.persist();

    devStore.logAudit({
      actorId: doctorId,
      action: "AMEND_PRESCRIPTION",
      entityType: "Prescription",
      entityId: prescriptionId,
      metadataJson: JSON.stringify({
        revisionNumber,
        reason,
        prescriptionNumber: rx.prescriptionNumber,
      }),
    });

    return rx;
  }

  // ---------------------------------------------------------------------------
  // APPOINTMENTS
  // ---------------------------------------------------------------------------

  async getAppointments(patientId?: string, doctorId?: string, status?: string): Promise<MockAppointment[]> {
    let list = Array.from(devStore.appointments.values());

    if (patientId) {
      list = list.filter((a) => a.patientId === patientId);
    }

    if (doctorId) {
      list = list.filter((a) => a.doctorId === doctorId);
    }

    if (status && status !== "ALL") {
      list = list.filter((a) => a.status === status);
    }

    return list.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }

  async getAppointmentById(id: string): Promise<MockAppointment | null> {
    return devStore.appointments.get(id) || null;
  }

  async createAppointment(data: Omit<MockAppointment, "id" | "appointmentNumber" | "bookingTimestamp" | "createdAt" | "updatedAt">): Promise<MockAppointment> {
    // Double booking transaction check
    const hasConflict = devStore.checkAppointmentConflict(data.doctorId, data.appointmentDate, data.startTime);
    if (hasConflict) {
      throw AppError.conflict("This appointment slot is no longer available. Please select another time.");
    }

    const id = `apt-${Date.now()}`;
    const appointmentNumber = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const appointment: MockAppointment = {
      ...data,
      id,
      appointmentNumber,
      bookingTimestamp: now,
      createdAt: now,
      updatedAt: now,
    };

    devStore.appointments.set(id, appointment);
    devStore.persist();

    devStore.logAudit({
      actorId: data.patientId,
      action: "BOOK_APPOINTMENT",
      entityType: "Appointment",
      entityId: id,
      metadataJson: JSON.stringify({
        appointmentNumber,
        doctorId: data.doctorId,
        date: data.appointmentDate,
        startTime: data.startTime,
      }),
    });

    return appointment;
  }

  async updateAppointmentStatus(
    appointmentId: string,
    status: MockAppointment["status"],
    actorUserId: string,
    cancellationReason?: string
  ): Promise<MockAppointment> {
    const apt = await this.getAppointmentById(appointmentId);
    if (!apt) throw AppError.notFound("Appointment not found");

    apt.status = status;
    apt.updatedAt = new Date().toISOString();
    if (cancellationReason) {
      apt.cancellationReason = cancellationReason;
      apt.cancelledById = actorUserId;
    }

    devStore.appointments.set(appointmentId, apt);
    devStore.persist();

    devStore.logAudit({
      actorId: actorUserId,
      action: `APPOINTMENT_STATUS_${status}`,
      entityType: "Appointment",
      entityId: appointmentId,
      metadataJson: JSON.stringify({ appointmentNumber: apt.appointmentNumber, status }),
    });

    return apt;
  }

  // ---------------------------------------------------------------------------
  // MEDICAL DOCUMENTS
  // ---------------------------------------------------------------------------

  async getMedicalDocuments(patientId: string, category?: string): Promise<MockMedicalDocument[]> {
    devStore.loadFromDisk();
    let list = Array.from(devStore.medicalDocuments.values()).filter((d) => d.patientId === patientId);
    if (category && category !== "ALL") {
      list = list.filter((d) => d.category === category);
    }
    return list.sort((a, b) => new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime());
  }

  async createMedicalDocument(data: Omit<MockMedicalDocument, "id" | "createdAt" | "updatedAt">): Promise<MockMedicalDocument> {
    const id = `doc-${Date.now()}`;
    const now = new Date().toISOString();
    const doc: MockMedicalDocument = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    devStore.medicalDocuments.set(id, doc);
    devStore.persist();
    return doc;
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------

  async getAuditLogs(limit: number = 50, entityType?: string): Promise<MockAuditLog[]> {
    let list = devStore.auditLogs;
    if (entityType && entityType !== "ALL") {
      list = list.filter((l) => l.entityType === entityType);
    }
    return list.slice(0, limit);
  }

  // ---------------------------------------------------------------------------
  // REPORT CATEGORIES (MASTER DATA CRUD)
  // ---------------------------------------------------------------------------

  async getReportCategories(type?: "RADIOLOGY" | "LABORATORY"): Promise<MockReportCategory[]> {
    if (typeof devStore.getReportCategories === "function") {
      return devStore.getReportCategories(type);
    }
    // Fallback if HMR retained a stale singleton instance
    const seed = (await import("./mock-data")).getInitialSeedData();
    const list = seed.reportCategories || [];
    return type ? list.filter((c) => c.type === type) : list;
  }

  async getReportCategoryById(id: string): Promise<MockReportCategory | null> {
    if (typeof devStore.getReportCategoryById === "function") {
      return devStore.getReportCategoryById(id) || null;
    }
    const seed = (await import("./mock-data")).getInitialSeedData();
    return seed.reportCategories?.find((c) => c.id === id) || null;
  }

  async createReportCategory(
    data: Omit<MockReportCategory, "id" | "createdAt" | "updatedAt">
  ): Promise<MockReportCategory> {
    const id = `cat-${data.type.toLowerCase().slice(0, 3)}-${Date.now()}`;
    const now = new Date().toISOString();
    const category: MockReportCategory = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    if (typeof devStore.createReportCategory === "function") {
      return devStore.createReportCategory(category);
    }
    return category;
  }

  async updateReportCategory(
    id: string,
    updates: Partial<MockReportCategory>
  ): Promise<MockReportCategory | null> {
    if (typeof devStore.updateReportCategory === "function") {
      return devStore.updateReportCategory(id, updates);
    }
    return null;
  }

  async deleteReportCategory(id: string): Promise<boolean> {
    if (typeof devStore.deleteReportCategory === "function") {
      return devStore.deleteReportCategory(id);
    }
    return true;
  }

  async toggleReportCategoryStatus(id: string): Promise<MockReportCategory | null> {
    if (typeof devStore.toggleReportCategoryStatus === "function") {
      return devStore.toggleReportCategoryStatus(id);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // DOCTOR PROFILE UPDATES
  // ---------------------------------------------------------------------------

  async updateDoctorProfile(
    doctorId: string,
    updates: Partial<MockDoctorProfile>
  ): Promise<MockDoctorProfile | null> {
    const doc = devStore.doctors.get(doctorId);
    if (!doc) return null;
    const updated: MockDoctorProfile = {
      ...doc,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    devStore.doctors.set(doctorId, updated);
    devStore.persist();
    return updated;
  }

  // ---------------------------------------------------------------------------
  // PATIENT ACCOUNT ADMIN TOGGLES
  // ---------------------------------------------------------------------------

  async togglePatientAccountStatus(patientId: string): Promise<MockUser | null> {
    const patient = devStore.patients.get(patientId);
    if (!patient) return null;
    const user = devStore.users.get(patient.userId);
    if (!user) return null;
    user.status = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    user.updatedAt = new Date().toISOString();
    devStore.users.set(user.id, user);
    devStore.persist();
    return user;
  }
}

export const medicalRepo = new MedicalDataRepository();
