import fs from "fs";
import path from "path";
import {
  getInitialSeedData,
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
import { AppError } from "@/lib/errors/app-error";

class DevMemoryStore {
  public users: Map<string, MockUser> = new Map();
  public patients: Map<string, MockPatientProfile> = new Map();
  public doctors: Map<string, MockDoctorProfile> = new Map();
  public radiologyReports: Map<string, MockRadiologyReport> = new Map();
  public laboratoryReports: Map<string, MockLaboratoryReport> = new Map();
  public prescriptions: Map<string, MockPrescription> = new Map();
  public appointments: Map<string, MockAppointment> = new Map();
  public medicalDocuments: Map<string, MockMedicalDocument> = new Map();
  public reportCategories: Map<string, MockReportCategory> = new Map();
  public auditLogs: MockAuditLog[] = [];

  private getStorageFilePath(): string {
    const dir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    return path.join(dir, "medrec_database.json");
  }

  constructor() {
    this.loadFromDisk();
  }

  private isTestEnv(): boolean {
    return (
      process.env.NODE_ENV === "test" ||
      typeof process.env.VITEST !== "undefined" ||
      typeof (globalThis as any).describe !== "undefined"
    );
  }

  public loadFromDisk() {
    if (this.isTestEnv()) {
      this.resetToSeed();
      return;
    }

    const filePath = this.getStorageFilePath();
    const backupPath = filePath.replace(".json", ".backup.json");

    const tryLoad = (target: string): boolean => {
      try {
        if (fs.existsSync(target)) {
          const raw = fs.readFileSync(target, "utf-8");
          const data = JSON.parse(raw);
          if (data && Array.isArray(data.users) && data.users.length > 0) {
            this.users = new Map(data.users);
            this.patients = new Map(data.patients || []);
            this.doctors = new Map(data.doctors || []);
            this.radiologyReports = new Map(data.radiologyReports || []);
            this.laboratoryReports = new Map(data.laboratoryReports || []);
            this.prescriptions = new Map(data.prescriptions || []);
            this.appointments = new Map(data.appointments || []);
            this.medicalDocuments = new Map(data.medicalDocuments || []);
            this.reportCategories = new Map(data.reportCategories || []);
            this.auditLogs = Array.isArray(data.auditLogs) ? data.auditLogs : [];
            return true;
          }
        }
      } catch (err) {
        console.warn(`Could not load database file ${target}:`, err);
      }
      return false;
    };

    if (tryLoad(filePath) || tryLoad(backupPath)) {
      return;
    }

    this.resetToSeed();
    this.persist();
  }

  public persist() {
    if (this.isTestEnv()) {
      return;
    }

    const filePath = this.getStorageFilePath();
    const backupPath = filePath.replace(".json", ".backup.json");
    const tempPath = filePath + ".tmp";
    try {
      const payload = {
        users: Array.from(this.users.entries()),
        patients: Array.from(this.patients.entries()),
        doctors: Array.from(this.doctors.entries()),
        radiologyReports: Array.from(this.radiologyReports.entries()),
        laboratoryReports: Array.from(this.laboratoryReports.entries()),
        prescriptions: Array.from(this.prescriptions.entries()),
        appointments: Array.from(this.appointments.entries()),
        medicalDocuments: Array.from(this.medicalDocuments.entries()),
        reportCategories: Array.from(this.reportCategories.entries()),
        auditLogs: this.auditLogs,
        updatedAt: new Date().toISOString(),
      };
      const jsonStr = JSON.stringify(payload, null, 2);
      fs.writeFileSync(tempPath, jsonStr, "utf-8");
      fs.renameSync(tempPath, filePath);
      try {
        fs.writeFileSync(backupPath, jsonStr, "utf-8");
      } catch {}
    } catch (err) {
      console.error("Failed to persist database to disk:", err);
    }
  }

  public resetToSeed() {
    const seed = getInitialSeedData();
    this.users.clear();
    this.patients.clear();
    this.doctors.clear();
    this.radiologyReports.clear();
    this.laboratoryReports.clear();
    this.prescriptions.clear();
    this.appointments.clear();
    this.medicalDocuments.clear();
    this.reportCategories.clear();
    this.auditLogs = [];

    seed.users.forEach((u) => this.users.set(u.id, { ...u }));
    seed.patients.forEach((p) => this.patients.set(p.id, { ...p }));
    seed.doctors.forEach((d) => this.doctors.set(d.id, { ...d }));
    seed.radiologyReports.forEach((r) => this.radiologyReports.set(r.id, { ...r }));
    seed.laboratoryReports.forEach((l) => this.laboratoryReports.set(l.id, { ...l }));
    seed.prescriptions.forEach((rx) => this.prescriptions.set(rx.id, { ...rx }));
    seed.appointments.forEach((a) => this.appointments.set(a.id, { ...a }));
    seed.medicalDocuments.forEach((doc) => this.medicalDocuments.set(doc.id, { ...doc }));
    seed.reportCategories.forEach((cat) => this.reportCategories.set(cat.id, { ...cat }));
    this.auditLogs = [...seed.auditLogs];
  }

  // User queries
  public findUserByMobile(mobileNumber: string): MockUser | undefined {
    if (!mobileNumber) return undefined;
    const rawClean = mobileNumber.replace(/\s+/g, "");
    const digitsOnly = mobileNumber.replace(/\D/g, "");
    for (const user of this.users.values()) {
      if (user.mobileNumber === mobileNumber) return user;
      const uRaw = user.mobileNumber.replace(/\s+/g, "");
      if (uRaw === rawClean) return user;
      const uDigits = user.mobileNumber.replace(/\D/g, "");
      if (digitsOnly.length >= 10 && uDigits.length >= 10 && uDigits.slice(-10) === digitsOnly.slice(-10)) {
        return user;
      }
    }
    return undefined;
  }

  public findUserById(id: string): MockUser | undefined {
    return this.users.get(id);
  }

  // Patient queries
  public findPatientByUserId(userId: string): MockPatientProfile | undefined {
    for (const p of this.patients.values()) {
      if (p.userId === userId) return p;
    }
    return undefined;
  }

  public findPatientById(id: string): MockPatientProfile | undefined {
    return this.patients.get(id);
  }

  // Doctor queries
  public findDoctorByUserId(userId: string): MockDoctorProfile | undefined {
    for (const d of this.doctors.values()) {
      if (d.userId === userId) return d;
    }
    return undefined;
  }

  public findDoctorById(id: string): MockDoctorProfile | undefined {
    return this.doctors.get(id);
  }

  // Appointment double-booking check
  public checkAppointmentConflict(doctorId: string, dateStr: string, startTime: string, excludeId?: string): boolean {
    const targetDate = new Date(dateStr).toISOString().split("T")[0];
    for (const apt of this.appointments.values()) {
      if (apt.id === excludeId) continue;
      if (apt.status === "CANCELLED" || apt.status === "REJECTED") continue;

      const aptDate = new Date(apt.appointmentDate).toISOString().split("T")[0];
      if (apt.doctorId === doctorId && aptDate === targetDate && apt.startTime === startTime) {
        return true; // Conflict found!
      }
    }
    return false;
  }

  // Audit logger
  public logAudit(entry: Omit<MockAuditLog, "id" | "timestamp">) {
    const log: MockAuditLog = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    // Keep max 1000 audit logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs.pop();
    }
    this.persist();
    return log;
  }

  // Report Category CRUD
  public getReportCategories(type?: "RADIOLOGY" | "LABORATORY"): MockReportCategory[] {
    const list = Array.from(this.reportCategories.values());
    if (type) {
      return list.filter((c) => c.type === type);
    }
    return list;
  }

  public getReportCategoryById(id: string): MockReportCategory | undefined {
    return this.reportCategories.get(id);
  }

  public createReportCategory(cat: MockReportCategory): MockReportCategory {
    this.reportCategories.set(cat.id, cat);
    this.persist();
    return cat;
  }

  public updateReportCategory(id: string, updates: Partial<MockReportCategory>): MockReportCategory | null {
    const existing = this.reportCategories.get(id);
    if (!existing) return null;
    const updated: MockReportCategory = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.reportCategories.set(id, updated);
    this.persist();
    return updated;
  }

  public deleteReportCategory(id: string): boolean {
    const res = this.reportCategories.delete(id);
    if (res) this.persist();
    return res;
  }

  public toggleReportCategoryStatus(id: string): MockReportCategory | null {
    const existing = this.reportCategories.get(id);
    if (!existing) return null;
    existing.isActive = !existing.isActive;
    existing.updatedAt = new Date().toISOString();
    this.reportCategories.set(id, existing);
    this.persist();
    return existing;
  }
}

// Global singleton to persist across HMR reloads in Next.js dev server
declare global {
  // eslint-disable-next-line no-var
  var devStoreGlobal: DevMemoryStore | undefined;
}

function getOrInitDevStore(): DevMemoryStore {
  const existing = globalThis.devStoreGlobal;
  if (
    !existing ||
    typeof existing.getReportCategories !== "function" ||
    !existing.reportCategories ||
    typeof existing.toggleReportCategoryStatus !== "function" ||
    typeof existing.persist !== "function"
  ) {
    const fresh = new DevMemoryStore();
    globalThis.devStoreGlobal = fresh;
    return fresh;
  }
  return existing;
}

export const devStore = getOrInitDevStore();
