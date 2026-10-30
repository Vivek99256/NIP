"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MockDoctorProfile } from "@/lib/db/mock-data";
import {
  adminCreateDoctorAction,
  adminUpdateDoctorAction,
  updateDoctorVerificationAction,
} from "@/features/admin/admin-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { DoctorStatusBadge } from "@/components/shared/status-badge";
import {
  Stethoscope,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Edit2,
  X,
  Phone,
  Building2,
  DollarSign,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialDoctors: MockDoctorProfile[];
}

export function AdminDoctorManager({ initialDoctors }: Props) {
  const [doctors, setDoctors] = useState<MockDoctorProfile[]>(initialDoctors);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<MockDoctorProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // New Doctor Form State
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("+91 ");
  const [newPassword, setNewPassword] = useState("Password123");
  const [newSpecialty, setNewSpecialty] = useState("General Medicine");
  const [newQualifications, setNewQualifications] = useState("MBBS, MD");
  const [newRegNumber, setNewRegNumber] = useState("");
  const [newFee, setNewFee] = useState(1000);
  const [newAddress, setNewAddress] = useState("OPD Clinic, Main Hospital");

  // Edit Doctor Form State
  const [editName, setEditName] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editQualifications, setEditQualifications] = useState("");
  const [editFee, setEditFee] = useState(1000);
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const filteredDoctors = doctors.filter((doc) => {
    const matchesStatus = statusFilter === "ALL" || doc.verificationStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      doc.professionalName.toLowerCase().includes(q) ||
      doc.registrationNumber.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMobile.trim()) {
      toast.error("Please enter doctor name and mobile number");
      return;
    }

    setIsSubmitting(true);
    const res = await adminCreateDoctorAction({
      fullName: newName,
      mobileNumber: newMobile,
      password: newPassword,
      specialty: newSpecialty,
      qualifications: newQualifications,
      registrationNumber: newRegNumber || undefined,
      consultationFee: Number(newFee) || 800,
      clinicAddress: newAddress,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Doctor ${newName} registered successfully with verified status`);
      setIsAddOpen(false);
      // Hard refresh state
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to register doctor");
    }
  };

  const handleUpdateStatus = async (
    doctorId: string,
    status: "APPROVED" | "REJECTED" | "SUSPENDED"
  ) => {
    setLoadingId(doctorId);
    const res = await updateDoctorVerificationAction(doctorId, status);
    setLoadingId(null);

    if (res.success && res.doctor) {
      setDoctors(doctors.map((d) => (d.id === doctorId ? res.doctor! : d)));
      toast.success(`Doctor status changed to ${status}`);
    } else {
      toast.error(res.error || "Failed to update doctor status");
    }
  };

  const openEditModal = (doc: MockDoctorProfile) => {
    setEditingDoctor(doc);
    setEditName(doc.professionalName);
    setEditSpecialty(doc.specialty);
    setEditQualifications(doc.qualifications);
    setEditFee(doc.consultationFee);
    setEditAddress(doc.clinicAddress);
    setEditPhone(doc.clinicPhone);
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;

    setIsSubmitting(true);
    const res = await adminUpdateDoctorAction(editingDoctor.id, {
      professionalName: editName,
      specialty: editSpecialty,
      qualifications: editQualifications,
      consultationFee: Number(editFee),
      clinicAddress: editAddress,
      clinicPhone: editPhone,
    });
    setIsSubmitting(false);

    if (res.success && res.doctor) {
      setDoctors(doctors.map((d) => (d.id === editingDoctor.id ? res.doctor! : d)));
      setEditingDoctor(null);
      toast.success("Doctor details updated successfully");
    } else {
      toast.error(res.error || "Failed to update doctor");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Physician Credential &amp; Verification Directory
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full CRUD control: Register new physicians, verify medical licenses, edit practice details, or suspend credentials.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Doctor</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-fit">
          {["ALL", "PENDING", "APPROVED", "SUSPENDED", "REJECTED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search doctor, registration, specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Doctors Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Physician Name</TableHead>
                <TableHead>Registration No.</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Qualifications</TableHead>
                <TableHead>Fee (₹)</TableHead>
                <TableHead>Verification Status</TableHead>
                <TableHead className="text-right">Administration Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-bold text-xs text-slate-900">
                    {doc.professionalName}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-bold text-sky-800">
                    {doc.registrationNumber}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">{doc.specialty}</TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                    {doc.qualifications}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">
                    ₹{doc.consultationFee}
                  </TableCell>
                  <TableCell>
                    <DoctorStatusBadge status={doc.verificationStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {doc.verificationStatus === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="teal"
                            onClick={() => handleUpdateStatus(doc.id, "APPROVED")}
                            isLoading={loadingId === doc.id}
                            className="h-7 text-xs gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(doc.id, "REJECTED")}
                            isLoading={loadingId === doc.id}
                            className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </>
                      )}

                      {doc.verificationStatus === "APPROVED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(doc.id, "SUSPENDED")}
                          isLoading={loadingId === doc.id}
                          className="h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 gap-1"
                        >
                          <ShieldAlert className="h-3 w-3" />
                          <span>Suspend</span>
                        </Button>
                      )}

                      {doc.verificationStatus === "SUSPENDED" && (
                        <Button
                          size="sm"
                          variant="teal"
                          onClick={() => handleUpdateStatus(doc.id, "APPROVED")}
                          isLoading={loadingId === doc.id}
                          className="h-7 text-xs gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Reactivate</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(doc)}
                        className="h-7 text-xs gap-1 border-slate-200"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </Button>

                      <Link href={`/admin/doctors/${doc.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-slate-600">
                          <span>Details</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredDoctors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                    No physicians found matching current filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* REGISTER NEW DOCTOR MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Register New Physician</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="docName">Physician Full Name</Label>
                  <Input
                    id="docName"
                    placeholder="e.g. Dr. Priya Patel"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="docPhone">Mobile (Country Code)</Label>
                  <Input
                    id="docPhone"
                    placeholder="+91 98200 99887"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    required
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="docSpecialty">Clinical Specialty</Label>
                  <Input
                    id="docSpecialty"
                    placeholder="e.g. Cardiology / Pediatrics"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="docReg">Medical Registration Number</Label>
                  <Input
                    id="docReg"
                    placeholder="e.g. MCI-2024-88123"
                    value={newRegNumber}
                    onChange={(e) => setNewRegNumber(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="docQual">Qualifications</Label>
                  <Input
                    id="docQual"
                    placeholder="e.g. MBBS, MD (Medicine)"
                    value={newQualifications}
                    onChange={(e) => setNewQualifications(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="docFee">Consultation Fee (₹)</Label>
                  <Input
                    id="docFee"
                    type="number"
                    value={newFee}
                    onChange={(e) => setNewFee(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="docAddress">Clinic / OPD Address</Label>
                <Input
                  id="docAddress"
                  placeholder="e.g. Room 402, OPD Wing, City General Hospital"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="docPassword">Doctor Login Password</Label>
                  <span className="text-[10px] text-slate-400">Default: Password123</span>
                </div>
                <Input
                  id="docPassword"
                  type="text"
                  placeholder="Set login password (e.g. Password123)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  <span>Register Physician</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Edit Physician Profile
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Reg: {editingDoctor.registrationNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="mt-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label htmlFor="editDocName">Physician Full Name</Label>
                <Input
                  id="editDocName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editDocSpecialty">Specialty</Label>
                  <Input
                    id="editDocSpecialty"
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editDocFee">Consultation Fee (₹)</Label>
                  <Input
                    id="editDocFee"
                    type="number"
                    value={editFee}
                    onChange={(e) => setEditFee(Number(e.target.value))}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editDocQual">Qualifications</Label>
                <Input
                  id="editDocQual"
                  value={editQualifications}
                  onChange={(e) => setEditQualifications(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="editDocAddress">Clinic Address</Label>
                  <Input
                    id="editDocAddress"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editDocPhone">Clinic Phone</Label>
                  <Input
                    id="editDocPhone"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDoctor(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
