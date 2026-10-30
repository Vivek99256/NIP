import { PrismaClient, UserRole, AccountStatus, Gender, BloodGroup, DoctorVerificationStatus, RadiologyCategory, LabCategory, AbnormalityFlag, PrescriptionStatus } from "@prisma/client";
import { getInitialSeedData } from "../lib/db/mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Medical Record Database...");
  const seed = getInitialSeedData();

  // 1. Seed Specialties
  const specialties = [
    { name: "General Medicine", description: "Primary care, adult medicine, chronic condition management" },
    { name: "Orthopedics", description: "Musculoskeletal system, spine, joint care, and sports medicine" },
    { name: "Radiology", description: "Diagnostic imaging, X-Ray, CT scan, and MRI interpretation" },
    { name: "Pathology", description: "Laboratory testing, hematology, and clinical biochemistry" },
    { name: "Cardiology", description: "Cardiovascular health and interventional cardiology" },
  ];

  for (const s of specialties) {
    await prisma.specialty.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }

  // 2. Seed Users & Profiles
  for (const u of seed.users) {
    await prisma.user.upsert({
      where: { mobileNumber: u.mobileNumber },
      update: {},
      create: {
        id: u.id,
        mobileNumber: u.mobileNumber,
        role: u.role as UserRole,
        status: u.status as AccountStatus,
        mobileVerifiedAt: new Date(u.mobileVerifiedAt),
      },
    });
  }

  // 3. Seed Patients
  for (const p of seed.patients) {
    await prisma.patientProfile.upsert({
      where: { patientId: p.patientId },
      update: {},
      create: {
        id: p.id,
        patientId: p.patientId,
        userId: p.userId,
        fullName: p.fullName,
        dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth) : null,
        gender: p.gender as Gender,
        bloodGroup: p.bloodGroup as BloodGroup,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        address: p.address,
        allergies: p.allergies,
        existingConditions: p.existingConditions,
      },
    });
  }

  // 4. Seed Doctors
  for (const d of seed.doctors) {
    await prisma.doctorProfile.upsert({
      where: { registrationNumber: d.registrationNumber },
      update: {},
      create: {
        id: d.id,
        userId: d.userId,
        professionalName: d.professionalName,
        qualifications: d.qualifications,
        registrationNumber: d.registrationNumber,
        verificationStatus: d.verificationStatus as DoctorVerificationStatus,
        clinicAddress: d.clinicAddress,
        clinicPhone: d.clinicPhone,
        consultationFee: d.consultationFee,
        bio: d.bio,
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
