"use client";

import React, { useState } from "react";
import { MockReportCategory } from "@/lib/db/mock-data";
import {
  createReportCategoryAction,
  updateReportCategoryAction,
  deleteReportCategoryAction,
  toggleReportCategoryStatusAction,
} from "@/features/admin/admin-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Plus,
  Search,
  FileScan,
  FlaskConical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialCategories: MockReportCategory[];
}

export function ReportCategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState<MockReportCategory[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<"ALL" | "RADIOLOGY" | "LABORATORY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MockReportCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Form State
  const [newType, setNewType] = useState<"RADIOLOGY" | "LABORATORY">("RADIOLOGY");
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newModality, setNewModality] = useState("");
  const [newTurnaround, setNewTurnaround] = useState("2-4 hours");
  const [newParameters, setNewParameters] = useState("");

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editModality, setEditModality] = useState("");
  const [editTurnaround, setEditTurnaround] = useState("");
  const [editParameters, setEditParameters] = useState("");

  // Filter categories
  const filtered = categories.filter((c) => {
    const matchesTab = activeTab === "ALL" || c.type === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.modalityOrSpecimen.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const radiologyCount = categories.filter((c) => c.type === "RADIOLOGY").length;
  const labCount = categories.filter((c) => c.type === "LABORATORY").length;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      toast.error("Please fill in the category code and name");
      return;
    }

    setIsSubmitting(true);
    const res = await createReportCategoryAction({
      type: newType,
      code: newCode,
      name: newName,
      modalityOrSpecimen: newModality || (newType === "RADIOLOGY" ? "Radiological Modality" : "Blood / Serum Specimen"),
      typicalTurnaround: newTurnaround || "4 hours",
      parametersCount: newParameters || (newType === "RADIOLOGY" ? "Standard Views" : "Standard Panel"),
      isActive: true,
    });
    setIsSubmitting(false);

    if (res.success && res.category) {
      setCategories([res.category, ...categories]);
      setIsAddOpen(false);
      setNewCode("");
      setNewName("");
      setNewModality("");
      setNewParameters("");
      toast.success(`Category "${res.category.name}" created successfully`);
    } else {
      toast.error(res.error || "Failed to create category");
    }
  };

  const openEditModal = (cat: MockReportCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditModality(cat.modalityOrSpecimen);
    setEditTurnaround(cat.typicalTurnaround);
    setEditParameters(cat.parametersCount);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setIsSubmitting(true);
    const res = await updateReportCategoryAction(editingCategory.id, {
      name: editName,
      modalityOrSpecimen: editModality,
      typicalTurnaround: editTurnaround,
      parametersCount: editParameters,
    });
    setIsSubmitting(false);

    if (res.success && res.category) {
      setCategories(categories.map((c) => (c.id === editingCategory.id ? res.category! : c)));
      setEditingCategory(null);
      toast.success("Category updated successfully");
    } else {
      toast.error(res.error || "Failed to update category");
    }
  };

  const handleToggleStatus = async (cat: MockReportCategory) => {
    const res = await toggleReportCategoryStatusAction(cat.id);
    if (res.success && res.category) {
      setCategories(categories.map((c) => (c.id === cat.id ? res.category! : c)));
      toast.success(
        `Category is now ${res.category.isActive ? "Active (Available)" : "Inactive (Hidden)"}`
      );
    } else {
      toast.error(res.error || "Failed to toggle status");
    }
  };

  const handleDeleteCategory = async (cat: MockReportCategory) => {
    if (!window.confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
      return;
    }

    const res = await deleteReportCategoryAction(cat.id);
    if (res.success) {
      setCategories(categories.filter((c) => c.id !== cat.id));
      toast.success(`Deleted category "${cat.name}"`);
    } else {
      toast.error(res.error || "Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Report &amp; Diagnostic Categories
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full CRUD management: Create, configure, edit, or archive clinical diagnostic test definitions.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </Button>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RADIOLOGY")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "RADIOLOGY"
                ? "bg-white text-sky-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileScan className="h-3.5 w-3.5 text-sky-600" />
            <span>Radiology ({radiologyCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("LABORATORY")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "LABORATORY"
                ? "bg-white text-teal-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5 text-teal-600" />
            <span>Pathology / Labs ({labCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search code, name, modality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat) => (
          <Card
            key={cat.id}
            className={`border transition-all ${
              cat.isActive ? "border-slate-200 shadow-xs bg-white" : "border-slate-200 bg-slate-50/70 opacity-75"
            }`}
          >
            <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1.5 rounded-lg text-xs ${
                      cat.type === "RADIOLOGY" ? "bg-sky-50 text-sky-700" : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {cat.type === "RADIOLOGY" ? (
                      <FileScan className="h-4 w-4" />
                    ) : (
                      <FlaskConical className="h-4 w-4" />
                    )}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-slate-500 uppercase">
                    {cat.code}
                  </span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-900">{cat.name}</CardTitle>
              </div>

              <button
                type="button"
                onClick={() => handleToggleStatus(cat)}
                title={cat.isActive ? "Click to deactivate" : "Click to activate"}
                className="cursor-pointer"
              >
                {cat.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    <XCircle className="h-3 w-3" />
                    <span>Inactive</span>
                  </span>
                )}
              </button>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 block">
                  {cat.type === "RADIOLOGY" ? "Imaging Modality" : "Sample / Specimen"}
                </span>
                <p className="text-slate-700 font-medium">{cat.modalityOrSpecimen}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1 text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Turnaround: <strong>{cat.typicalTurnaround}</strong></span>
                </div>
                <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 font-semibold text-[10px]">
                  {cat.parametersCount}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(cat)}
                  className="h-7 text-xs gap-1 border-slate-200 hover:bg-slate-50"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteCategory(cat)}
                  className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Layers className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No categories found matching your query</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or add a new diagnostic category.</p>
          </div>
        )}
      </div>

      {/* ADD CATEGORY MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Add New Diagnostic Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label>Diagnostic Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType("RADIOLOGY")}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      newType === "RADIOLOGY"
                        ? "bg-sky-50 border-sky-300 text-sky-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Radiology Imaging
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("LABORATORY")}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition-all ${
                      newType === "LABORATORY"
                        ? "bg-teal-50 border-teal-300 text-teal-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Pathology Laboratory
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Category Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g. DEXA_SCAN"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                    className="font-mono uppercase text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Bone Density (DEXA)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modality">
                  {newType === "RADIOLOGY" ? "Imaging Modality" : "Specimen / Sample Type"}
                </Label>
                <Input
                  id="modality"
                  placeholder={
                    newType === "RADIOLOGY"
                      ? "e.g. Dual-energy X-ray Absorptiometry"
                      : "e.g. Serum (12h Fasting) / Whole Blood"
                  }
                  value={newModality}
                  onChange={(e) => setNewModality(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="turnaround">Standard Turnaround</Label>
                  <Input
                    id="turnaround"
                    placeholder="e.g. 2 hours / 24 hours"
                    value={newTurnaround}
                    onChange={(e) => setNewTurnaround(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="params">Parameters / Views Summary</Label>
                  <Input
                    id="params"
                    placeholder="e.g. 8 Biomarkers / 3D Multi-slice"
                    value={newParameters}
                    onChange={(e) => setNewParameters(e.target.value)}
                    className="text-xs"
                  />
                </div>
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
                  <span>Create Category</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Edit Category: {editingCategory.code}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Type: {editingCategory.type}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="mt-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="editName">Display Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editModality">
                  {editingCategory.type === "RADIOLOGY" ? "Imaging Modality" : "Specimen / Sample Type"}
                </Label>
                <Input
                  id="editModality"
                  value={editModality}
                  onChange={(e) => setEditModality(e.target.value)}
                  required
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editTurnaround">Standard Turnaround</Label>
                  <Input
                    id="editTurnaround"
                    value={editTurnaround}
                    onChange={(e) => setEditTurnaround(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editParameters">Parameters / Views Summary</Label>
                  <Input
                    id="editParameters"
                    value={editParameters}
                    onChange={(e) => setEditParameters(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
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
