export function calculateProfileCompletion(profile?: {
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  allergies?: string;
  existingConditions?: string;
}): { percentage: number; missingFields: string[] } {
  if (!profile) return { percentage: 0, missingFields: ["Profile data"] };

  const fields: { key: keyof typeof profile; label: string; condition: boolean }[] = [
    { key: "fullName", label: "Full Name", condition: !!profile.fullName && profile.fullName !== "New Patient" },
    { key: "dateOfBirth", label: "Date of Birth", condition: !!profile.dateOfBirth },
    { key: "gender", label: "Gender", condition: !!profile.gender && profile.gender !== "NOT_DISCLOSED" },
    { key: "bloodGroup", label: "Blood Group", condition: !!profile.bloodGroup && profile.bloodGroup !== "UNKNOWN" },
    { key: "emergencyContactName", label: "Emergency Contact Name", condition: !!profile.emergencyContactName },
    { key: "emergencyContactPhone", label: "Emergency Contact Phone", condition: !!profile.emergencyContactPhone },
    { key: "address", label: "Address", condition: !!profile.address },
    { key: "allergies", label: "Allergy Information", condition: !!profile.allergies },
  ];

  const completed = fields.filter((f) => f.condition).length;
  const missing = fields.filter((f) => !f.condition).map((f) => f.label);
  const percentage = Math.round((completed / fields.length) * 100);

  return { percentage, missingFields: missing };
}
