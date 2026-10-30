"use client";

import React, { useState } from "react";
import { MockPatientProfile } from "@/lib/db/mock-data";
import {
  adminCreatePatientAction,
  adminTogglePatientStatusAction,
} from "@/features/admin/admin-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { BloodGroupBadge } from "@/components/shared/status-badge";
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Phone,
  User,
  AlertTriangle,
  Calendar,
  Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  initialPatients: MockPatientProfile[];
}

export function AdminPatientManager({ initialPatients }: Props) {
  const [patients, setPatients] = useState<MockPatientProfile[]>(initialPatients);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<MockPatientProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // New Patient Form State
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("+91 ");
  const [password, setPassword] = useState("Password123");
  const [bloodGroup, setBloodGroup] = useState<any>("UNKNOWN");
  const [gender, setGender] = useState<any>("NOT_DISCLOSED");
  const [dateOfBirth, setDateOfBirth] = useState("1995-01-01");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("+91 ");
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState("");

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.patientId.toLowerCase().includes(q) ||
      p.emergencyContactPhone.toLowerCase().includes(q)
    );
  });

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !mobileNumber.trim()) {
      toast.error("Please enter patient name and mobile number");
      return;
    }

    setIsSubmitting(true);
    const res = await adminCreatePatientAction({
      fullName,
      mobileNumber,
      password,
      bloodGroup,
      gender,
      dateOfBirth,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      address,
      allergies,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Patient ${fullName} registered successfully`);
      setIsAddOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to register patient");
    }
  };

  const handleToggleStatus = async (patient: MockPatientProfile) => {
    setTogglingId(patient.id);
    const res = await adminTogglePatientStatusAction(patient.id);
    setTogglingId(null);

    if (res.success) {
      toast.success(`Patient account security status: ${res.status}`);
    } else {
      toast.error(res.error || "Failed to change patient status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Patient Account Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full CRUD control: Register patient medical IDs, review demographics, manage account security, and audit emergency contacts.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Patient</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Search patient name, ID (e.g. PAT-2026-0001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Patients Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient Identifier</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Registered Date</TableHead>
                <TableHead>Emergency Contact</TableHead>
                <TableHead className="text-right">Administration Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((pat) => (
                <TableRow key={pat.id}>
                  <TableCell className="font-mono text-xs font-bold text-sky-800">
                    {pat.patientId}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-slate-900">
                    {pat.fullName}
                  </TableCell>
                  <TableCell>
                    <BloodGroupBadge bloodGroup={pat.bloodGroup} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {pat.gender.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    {formatDate(pat.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {pat.emergencyContactName ? (
                      <span>
                        {pat.emergencyContactName} ({pat.emergencyContactPhone || "N/A"})
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedPatient(pat)}
                        className="h-7 text-xs gap-1 border-slate-200"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Info</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(pat)}
                        isLoading={togglingId === pat.id}
                        className="h-7 text-xs text-amber-700 hover:bg-amber-50"
                        title="Toggle active / suspended access"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        <span>Access Status</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No patient records found matching query.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* REGISTER NEW PATIENT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Register New Patient</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="patName">Full Legal Name</Label>
                  <Input
                    id="patName"
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="patPhone">Mobile Number</Label>
                  <Input
                    id="patPhone"
                    placeholder="+91 98765 11223"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="patBlood">Blood Group</Label>
                  <select
                    id="patBlood"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="patGender">Gender</Label>
                  <select
                    id="patGender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2 text-xs"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="NOT_DISCLOSED">Not Disclosed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="patDob">Date of Birth</Label>
                  <Input
                    id="patDob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="emName">Emergency Contact Name</Label>
                  <Input
                    id="emName"
                    placeholder="e.g. Suman Sharma (Spouse)"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emPhone">Emergency Phone</Label>
                  <Input
                    id="emPhone"
                    placeholder="+91 98765 00001"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="patAddress">Residential Address</Label>
                <Input
                  id="patAddress"
                  placeholder="e.g. 104 Blossom Heights, Sector 14, Navi Mumbai"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="patAllergies">Drug Allergies &amp; Medical Warnings</Label>
                <Input
                  id="patAllergies"
                  placeholder="e.g. Penicillin, Sulfa drugs, None known"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="patPassword">Patient Login Password</Label>
                  <span className="text-[10px] text-slate-400">Default: Password123</span>
                </div>
                <Input
                  id="patPassword"
                  type="text"
                  placeholder="Set login password (e.g. Password123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Patient</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT DETAILS MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedPatient.fullName}
                </h3>
                <span className="text-[11px] font-mono text-sky-800 font-bold">
                  {selectedPatient.patientId}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Blood Group:</span>
                <BloodGroupBadge bloodGroup={selectedPatient.bloodGroup} />
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gender:</span>
                <span className="font-semibold text-slate-800">{selectedPatient.gender}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Date of Birth:</span>
                <span className="font-mono text-slate-800">{selectedPatient.dateOfBirth || "Not set"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Emergency Contact:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPatient.emergencyContactName || "None"} ({selectedPatient.emergencyContactPhone || "N/A"})
                </span>
              </div>
              <div className="py-1.5 border-b border-slate-100">
                <span className="text-slate-500 block">Address:</span>
                <span className="text-slate-800">{selectedPatient.address || "No address entered"}</span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 block">Known Allergies:</span>
                <span className="text-rose-700 font-semibold">{selectedPatient.allergies || "No drug allergies recorded"}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedPatient(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
