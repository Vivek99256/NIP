import crypto from "crypto";
import { cookies } from "next/headers";
import { medicalRepo } from "@/lib/db/repo";
import { MockUser, MockPatientProfile, MockDoctorProfile } from "@/lib/db/mock-data";

export interface SessionPayload {
  userId: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  expiresAt: number;
}

export interface AuthContext {
  user: MockUser;
  patientProfile?: MockPatientProfile;
  doctorProfile?: MockDoctorProfile;
}

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "medrec_session_token";
const SESSION_SECRET = process.env.SESSION_SECRET || "default_super_secure_session_secret_2026_xyz";
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Sign session payload into tamper-proof token
 */
export function signSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

/**
 * Verify and parse session token
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes(".")) return null;

  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");

  // Constant-time signature comparison
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    if (Date.now() > payload.expiresAt) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Establish session cookie in Next.js Server Components / Route Handlers
 */
export async function createSession(userId: string, role: "PATIENT" | "DOCTOR" | "ADMIN") {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const token = signSessionToken({ userId, role, expiresAt });

  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    });
  } catch {
    // When called outside Next.js request context (e.g., unit test environments)
  }

  return token;
}

/**
 * Terminate current session
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Retrieve current authenticated session context
 */
export async function getCurrentUser(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  const user = await medicalRepo.getUserById(session.userId);
  if (!user || user.status === "SUSPENDED") return null;

  let patientProfile: MockPatientProfile | undefined;
  let doctorProfile: MockDoctorProfile | undefined;

  if (user.role === "PATIENT") {
    patientProfile = (await medicalRepo.getPatientProfileByUserId(user.id)) || undefined;
  } else if (user.role === "DOCTOR") {
    doctorProfile = (await medicalRepo.getDoctorProfileByUserId(user.id)) || undefined;
  }

  return {
    user,
    patientProfile,
    doctorProfile,
  };
}
