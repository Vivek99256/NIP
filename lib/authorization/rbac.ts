import { AuthContext, getCurrentUser } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { medicalRepo } from "@/lib/db/repo";
import { devStore } from "@/lib/db/memory-store";

export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

/**
 * Enforce that a valid authenticated session exists
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getCurrentUser();
  if (!auth) {
    throw AppError.unauthorized("Please sign in to access this resource");
  }
  return auth;
}

/**
 * Enforce that the user has one of the allowed roles
 */
export async function requireRole(allowedRoles: Role[]): Promise<AuthContext> {
  const auth = await requireAuth();
  if (!allowedRoles.includes(auth.user.role)) {
    throw AppError.forbidden(`Access restricted to [${allowedRoles.join(", ")}] roles`);
  }
  return auth;
}

/**
 * Enforce Patient ownership:
 * Patients may only access their own medical records.
 */
export async function requirePatientOwnership(targetPatientId: string): Promise<AuthContext> {
  const auth = await requireAuth();

  if (auth.user.role === "PATIENT") {
    if (!auth.patientProfile || auth.patientProfile.id !== targetPatientId) {
      throw AppError.forbidden("Access denied: You are not authorized to access another patient's medical records");
    }
    return auth;
  }

  if (auth.user.role === "DOCTOR") {
    // Check doctor-patient relationship
    await requireDoctorPatientRelationship(auth, targetPatientId);
    return auth;
  }

  if (auth.user.role === "ADMIN") {
    // Admin exceptional audit access
    devStore.logAudit({
      actorId: auth.user.id,
      action: "ADMIN_CLINICAL_RECORD_ACCESS",
      entityType: "PatientProfile",
      entityId: targetPatientId,
      metadataJson: JSON.stringify({ warning: "Admin exceptional access exercised" }),
    });
    return auth;
  }

  throw AppError.forbidden("Access denied");
}

/**
 * Enforce Doctor is verified before granting clinical permissions
 */
export async function requireVerifiedDoctor(auth?: AuthContext): Promise<AuthContext> {
  const currentAuth = auth || (await requireRole(["DOCTOR"]));

  if (!currentAuth.doctorProfile) {
    throw AppError.forbidden("Doctor profile does not exist");
  }

  if (currentAuth.doctorProfile.verificationStatus !== "APPROVED") {
    throw AppError.forbidden(
      `Your doctor account status is "${currentAuth.doctorProfile.verificationStatus}". Clinical permissions require an APPROVED account.`
    );
  }

  return currentAuth;
}

/**
 * Enforce that a doctor is authorized to treat a patient.
 * Doctors have authorization if:
 * 1. An appointment exists between the doctor and patient, OR
 * 2. The doctor has issued an existing prescription or report for the patient.
 */
export async function requireDoctorPatientRelationship(
  auth: AuthContext,
  patientId: string
): Promise<boolean> {
  await requireVerifiedDoctor(auth);
  const doctorId = auth.doctorProfile!.id;

  // Check appointments
  const appointments = await medicalRepo.getAppointments(patientId, doctorId);
  if (appointments.length > 0) return true;

  // Check prescriptions
  const prescriptions = await medicalRepo.getPrescriptions(patientId, doctorId);
  if (prescriptions.length > 0) return true;

  throw AppError.forbidden(
    "Access denied: You are not authorized to access records for patients without an active clinical appointment or treatment relationship."
  );
}

/**
 * Enforce Admin privileges
 */
export async function requireAdmin(): Promise<AuthContext> {
  return requireRole(["ADMIN"]);
}
