import { Inspection } from "@/types/inspection";

const STORAGE_KEY = "gp_inspections_v1";

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
    };
  }
  
  return inspection;
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
    
    inspectionStorage.saveInspections(inspections);
  },

  deleteInspection: (id: string) => {
    const inspections = inspectionStorage.getInspections();
    const filtered = inspections.filter(i => i.id !== id);
    inspectionStorage.saveInspections(filtered);
  },
};