import { describe, it, expect, beforeEach } from "vitest";
import { devStore } from "@/lib/db/memory-store";
import { medicalRepo } from "@/lib/db/repo";

describe("Admin & Clinical Diagnostic CRUD Operations", () => {
  beforeEach(() => {
    devStore.resetToSeed();
  });

  it("performs full CRUD lifecycle on report diagnostic categories", async () => {
    // 1. Initial categories
    const initialList = await medicalRepo.getReportCategories();
    expect(initialList.length).toBeGreaterThan(0);

    // 2. CREATE
    const created = await medicalRepo.createReportCategory({
      type: "RADIOLOGY",
      code: "ECHOCARDIOGRAPHY",
      name: "2D Echocardiography with Color Doppler",
      modalityOrSpecimen: "Cardiac Ultrasound Transducer",
      typicalTurnaround: "1 hour",
      parametersCount: "EF, Valvular Gradients, LV Function",
      isActive: true,
    });
    expect(created.id).toBeDefined();
    expect(created.code).toBe("ECHOCARDIOGRAPHY");

    // 3. READ
    const fetched = await medicalRepo.getReportCategoryById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toContain("Echocardiography");

    // 4. UPDATE
    const updated = await medicalRepo.updateReportCategory(created.id, {
      typicalTurnaround: "30 minutes",
      name: "Echo Doppler 2D",
    });
    expect(updated?.typicalTurnaround).toBe("30 minutes");
    expect(updated?.name).toBe("Echo Doppler 2D");

    // 5. TOGGLE STATUS
    const toggled = await medicalRepo.toggleReportCategoryStatus(created.id);
    expect(toggled?.isActive).toBe(false);

    const reToggled = await medicalRepo.toggleReportCategoryStatus(created.id);
    expect(reToggled?.isActive).toBe(true);

    // 6. DELETE
    const deleted = await medicalRepo.deleteReportCategory(created.id);
    expect(deleted).toBe(true);
    expect(await medicalRepo.getReportCategoryById(created.id)).toBeNull();
  });

  it("updates doctor practice profiles and consultation fee", async () => {
    const updatedDoc = await medicalRepo.updateDoctorProfile("doc-prof-01", {
      consultationFee: 1500,
      clinicAddress: "Suite 501, Specialist Tower",
    });

    expect(updatedDoc).not.toBeNull();
    expect(updatedDoc?.consultationFee).toBe(1500);
    expect(updatedDoc?.clinicAddress).toBe("Suite 501, Specialist Tower");
  });

  it("toggles patient account active and suspended status", async () => {
    // usr-pat-01 is initially ACTIVE
    const user1 = await medicalRepo.getUserById("usr-pat-01");
    expect(user1?.status).toBe("ACTIVE");

    // Toggle to SUSPENDED
    const toggledUser = await medicalRepo.togglePatientAccountStatus("pat-prof-01");
    expect(toggledUser?.status).toBe("SUSPENDED");

    // Toggle back to ACTIVE
    const restoredUser = await medicalRepo.togglePatientAccountStatus("pat-prof-01");
    expect(restoredUser?.status).toBe("ACTIVE");
  });

  it("allows issuing clinical radiology and laboratory diagnostic reports", async () => {
    // Create Radiology Report
    const radReport = await medicalRepo.createRadiologyReport({
      patientId: "pat-prof-01",
      category: "CT_SCAN",
      testDate: "2026-03-01",
      reportDate: "2026-03-01",
      diagnosticCentre: "City Imaging Centre",
      radiologistName: "Dr. Diagnostic Specialist",
      findings: "High resolution CT scan of thorax reveals no bronchiectasis or pulmonary nodules.",
      clinicalNotes: "Normal study.",
      createdById: "usr-doc-01",
    });

    expect(radReport.id).toBeDefined();
    expect(radReport.findings).toContain("CT scan of thorax");

    // Create Laboratory Report
    const labReport = await medicalRepo.createLaboratoryReport({
      patientId: "pat-prof-01",
      category: "KIDNEY_FUNCTION_TEST",
      testDate: "2026-03-01",
      reportDate: "2026-03-01",
      laboratoryName: "Metropolis Lab",
      findings: "Serum renal profile within expected reference parameters.",
      results: [
        {
          id: "res-01",
          reportId: "lab-rep-test",
          testName: "Serum Creatinine",
          resultValue: "0.9",
          unit: "mg/dL",
          referenceRange: "0.7 - 1.3",
          abnormalityFlag: "NORMAL",
        },
      ],
      createdById: "usr-doc-01",
    });

    expect(labReport.id).toBeDefined();
    expect(labReport.results[0].testName).toBe("Serum Creatinine");
    expect(labReport.results[0].abnormalityFlag).toBe("NORMAL");
  });
});
