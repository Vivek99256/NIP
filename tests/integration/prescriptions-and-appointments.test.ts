import { describe, it, expect, beforeEach } from "vitest";
import { medicalRepo } from "@/lib/db/repo";
import { devStore } from "@/lib/db/memory-store";

describe("Prescription Lifecycle & Appointment Concurrency Guards", () => {
  beforeEach(() => {
    devStore.resetToSeed();
  });

  it("creates a prescription draft and allows the doctor to finalize it", async () => {
    const doctorId = "doc-prof-01";
    const patientId = "pat-prof-01";

    const draft = await medicalRepo.createPrescription({
      patientId,
      doctorId,
      prescriptionDate: new Date().toISOString(),
      diagnosis: "Acute Sinusitis",
      clinicalNotes: "Warm saline gargle and nasal spray",
      status: "DRAFT",
      medicines: [
        {
          id: "med-1",
          prescriptionId: "",
          medicineName: "Amoxicillin",
          strength: "500 mg",
          dosage: "1 capsule",
          route: "Oral",
          frequency: "Thrice daily",
          duration: "5 days",
          instructions: "After meals",
        },
      ],
    });

    expect(draft.status).toBe("DRAFT");
    expect(draft.prescriptionNumber).toMatch(/^RX-2026-/);

    // Finalize prescription
    const finalized = await medicalRepo.finalizePrescription(draft.id, doctorId);
    expect(finalized.status).toBe("FINALIZED");
    expect(finalized.finalizedAt).toBeDefined();
  });

  it("prevents an unauthorized doctor from finalizing another doctor's prescription", async () => {
    const rx = await medicalRepo.createPrescription({
      patientId: "pat-prof-01",
      doctorId: "doc-prof-01",
      prescriptionDate: new Date().toISOString(),
      diagnosis: "Hypertension",
      status: "DRAFT",
      medicines: [],
    });

    // doc-prof-02 tries to finalize doc-prof-01's prescription
    await expect(medicalRepo.finalizePrescription(rx.id, "doc-prof-02")).rejects.toThrow(
      /Only the prescribing doctor may finalize/
    );
  });

  it("strictly prohibits silent modification of a finalized prescription and enforces amendment workflow", async () => {
    const doctorId = "doc-prof-01";
    const rx = await medicalRepo.finalizePrescription("rx-01", doctorId).catch(() => devStore.prescriptions.get("rx-01")!);

    // Re-finalizing an already finalized prescription must fail
    await expect(medicalRepo.finalizePrescription("rx-01", doctorId)).rejects.toThrow(
      /already finalized/
    );

    // Amending requires reason and preserves snapshot
    const amended = await medicalRepo.amendPrescription(
      "rx-01",
      doctorId,
      "Patient developed allergic reaction to first-line antibiotic",
      [
        {
          id: "med-alt",
          prescriptionId: "rx-01",
          medicineName: "Azithromycin",
          strength: "500 mg",
          dosage: "1 tablet",
          route: "Oral",
          frequency: "Once daily",
          duration: "3 days",
          instructions: "1 hour before food",
        },
      ]
    );

    expect(amended.status).toBe("AMENDED");
    expect(amended.revisions.length).toBeGreaterThan(0);
    expect(amended.revisions[0].reasonForAmendment).toContain("allergic reaction");
    expect(amended.revisions[0].snapshotJson).toContain("Montelukast"); // Old medicine snapshot preserved
    expect(amended.medicines[0].medicineName).toBe("Azithromycin"); // New medicine active
  });

  it("prevents double-booking collisions for identical doctor, date, and slot", async () => {
    const doctorId = "doc-prof-01";
    const patient1Id = "pat-prof-01";
    const patient2Id = "pat-prof-02";
    const appointmentDate = "2026-04-15T00:00:00.000Z";
    const startTime = "11:00";

    // First booking succeeds
    const apt1 = await medicalRepo.createAppointment({
      patientId: patient1Id,
      doctorId,
      appointmentDate,
      startTime,
      endTime: "11:30",
      type: "IN_PERSON",
      reasonForVisit: "Annual cardiovascular review",
      status: "CONFIRMED",
    });

    expect(apt1.id).toBeDefined();

    // Concurrent/second booking attempt for same slot must be rejected with conflict
    await expect(
      medicalRepo.createAppointment({
        patientId: patient2Id,
        doctorId,
        appointmentDate,
        startTime,
        endTime: "11:30",
        type: "IN_PERSON",
        reasonForVisit: "General consultation",
        status: "CONFIRMED",
      })
    ).rejects.toThrow(/slot is no longer available/);
  });

  it("releases slot upon cancellation allowing subsequent rebooking", async () => {
    const doctorId = "doc-prof-01";
    const date = "2026-05-10T00:00:00.000Z";
    const slot = "14:00";

    const apt = await medicalRepo.createAppointment({
      patientId: "pat-prof-01",
      doctorId,
      appointmentDate: date,
      startTime: slot,
      endTime: "14:30",
      type: "IN_PERSON",
      reasonForVisit: "Routine follow-up",
      status: "CONFIRMED",
    });

    // Cancel appointment
    await medicalRepo.updateAppointmentStatus(apt.id, "CANCELLED", "usr-pat-01", "Rescheduled by patient");

    // Slot is now free and can be booked
    const newApt = await medicalRepo.createAppointment({
      patientId: "pat-prof-02",
      doctorId,
      appointmentDate: date,
      startTime: slot,
      endTime: "14:30",
      type: "IN_PERSON",
      reasonForVisit: "Urgent consultation",
      status: "CONFIRMED",
    });

    expect(newApt.id).toBeDefined();
  });
});
