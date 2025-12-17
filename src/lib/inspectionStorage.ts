import { Inspection } from "@/types/inspection";

const STORAGE_KEY = "gp_inspections_v1";
const APPROVED_STORAGE_KEY = "gp_approved_inspections_v1";

/**
 * Migrate old inspection format to new dual signature format
 * Backwards compatibility for inspections created before dual signature implementation
 */
function migrateInspection(inspection: any): Inspection {
  // If inspection has old single signature field, migrate to final signature
  if (inspection.inspectorSignature && !inspection.inspectorSignatures) {
    return {
      ...inspection,
      inspectorSignatures: {
        final: {
          signatureDataUrl: inspection.inspectorSignature.signatureDataUrl,
          signedAt: inspection.inspectorSignature.signedAt,
          fullName: inspection.inspectorSignature.fullName,
        }
      },
      // Remove old field
      inspectorSignature: undefined,
      // Add reviewStatus default
      reviewStatus: inspection.reviewStatus || "pending",
    };
  }
  
  // Ensure reviewStatus exists
  return {
    ...inspection,
    reviewStatus: inspection.reviewStatus || "pending",
  };
}

export const inspectionStorage = {
  getInspections: (): Inspection[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      // Migrate all inspections on load
      return parsed.map(migrateInspection);
    } catch (error) {
      console.error("[InspectionStorage] Failed to parse inspections:", error);
      return [];
    }
  },

  saveInspections: (inspections: Inspection[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
    } catch (error) {
      console.error("[InspectionStorage] Failed to save inspections:", error);
    }
  },

  getInspection: (id: string): Inspection | null => {
    const inspections = inspectionStorage.getInspections();
    return inspections.find(i => i.id === id) || null;
  },

  createInspection: (inspection: Omit<Inspection, "id" | "createdAt" | "updatedAt">): Inspection => {
    const newInspection: Inspection = {
      ...inspection,
      id: `inspection-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewStatus: "pending",
    };
    
    const inspections = inspectionStorage.getInspections();
    inspections.push(newInspection);
    inspectionStorage.saveInspections(inspections);
    
    return newInspection;
  },

  updateInspection: (id: string, updates: Partial<Inspection>) => {
    const inspections = inspectionStorage.getInspections();
    const index = inspections.findIndex(i => i.id === id);
    
    if (index === -1) return;
    
    inspections[index] = {
      ...inspections[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // If marking as complete, set completedAt
    if (updates.status === "complete" && !inspections[index].completedAt) {
      inspections[index].completedAt = new Date().toISOString();
    }
    
    inspectionStorage.saveInspections(inspections);
  },

  deleteInspection: (id: string) => {
    const inspections = inspectionStorage.getInspections();
    const filtered = inspections.filter(i => i.id !== id);
    inspectionStorage.saveInspections(filtered);
  },

  // Approved inspections (archive)
  getApprovedInspections: (): Inspection[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(APPROVED_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("[InspectionStorage] Failed to parse approved inspections:", error);
      return [];
    }
  },

  saveApprovedInspections: (inspections: Inspection[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(APPROVED_STORAGE_KEY, JSON.stringify(inspections));
    } catch (error) {
      console.error("[InspectionStorage] Failed to save approved inspections:", error);
    }
  },

  approveInspection: (id: string) => {
    const inspections = inspectionStorage.getInspections();
    const inspection = inspections.find(i => i.id === id);
    
    if (!inspection) return;
    
    // Mark as approved
    inspection.reviewStatus = "approved";
    inspection.updatedAt = new Date().toISOString();
    
    // Move to approved archive
    const approved = inspectionStorage.getApprovedInspections();
    approved.push(inspection);
    inspectionStorage.saveApprovedInspections(approved);
    
    // Remove from active inspections
    inspectionStorage.deleteInspection(id);
  },

  rejectInspection: (id: string, managerNote: string) => {
    const inspections = inspectionStorage.getInspections();
    const index = inspections.findIndex(i => i.id === id);
    
    if (index === -1) return;
    
    inspections[index] = {
      ...inspections[index],
      reviewStatus: "rejected",
      status: "in_progress", // Send back to in-progress
      managerNote,
      updatedAt: new Date().toISOString(),
    };
    
    inspectionStorage.saveInspections(inspections);
  },
};