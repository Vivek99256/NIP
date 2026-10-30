import { NextRequest, NextResponse } from "next/server";
import { medicalRepo } from "@/lib/db/repo";
import { createSession } from "@/lib/auth/session";
import { sanitizeError, AppError } from "@/lib/errors/app-error";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetRole = (body.targetRole as string)?.toUpperCase() || "PATIENT";

    let targetMobile = "+919876543210"; // Default Patient: Rohan Verma
    let targetRedirect = "/dashboard";

    if (targetRole === "DOCTOR") {
      targetMobile = "+919820011223"; // Dr. Aarav Mehta
      targetRedirect = "/doctor/dashboard";
    } else if (targetRole === "ADMIN") {
      targetMobile = "+919000000001"; // Platform Admin
      targetRedirect = "/admin/dashboard";
    }

    // Lookup user
    let user = await medicalRepo.getUserByMobile(targetMobile);

    if (!user) {
      if (targetRole === "DOCTOR") {
        const created = await medicalRepo.createDoctorUser(targetMobile, "Dr. Aarav Mehta");
        user = created.user;
      } else if (targetRole === "ADMIN") {
        const created = await medicalRepo.createAdminUser(targetMobile, "Platform Administrator");
        user = created.user;
      } else {
        const created = await medicalRepo.createPatientUser(targetMobile, "Rohan Verma");
        user = created.user;
      }
    }

    // Set signed HttpOnly session
    await createSession(user.id, user.role);

    return NextResponse.json({
      success: true,
      role: user.role,
      mobileNumber: user.mobileNumber,
      redirectTo: targetRedirect,
    });
  } catch (error) {
    const err = sanitizeError(error);
    return NextResponse.json({ error: err.message }, { status: err.statusCode });
  }
}
