import { InspectionFormConfig } from "@/types/inspection";

const STORAGE_KEY = "gp_inspection_form_config_v1";

const DEFAULT_CONFIG: InspectionFormConfig = {
  sections: [
    { id: "site", label: "Site Conducted", enabled: true, required: true, order: 0 },
    { id: "dateTime", label: "Date/Time (auto)", enabled: true, required: false, order: 1 },
    { id: "houseCode", label: "House #", enabled: true, required: false, order: 2 },
    { id: "carNumber", label: "Vehicle ID (car number)", enabled: true, required: true, order: 3 },
    { id: "acceptReject", label: "Accept/Reject", enabled: true, required: true, order: 4 },
    { id: "rejectReasons", label: "Reject reasons", enabled: true, required: false, order: 5 },
    { id: "preInspectionPhotos", label: "Pre-inspection photo requirements", enabled: true, required: false, order: 6 },
    { id: "preInspectionSignature", label: "Pre-inspection signature", enabled: true, required: true, order: 7 },
    { id: "finalInspectionQuestions", label: "Final inspection questions", enabled: true, required: true, order: 8 },
    { id: "finalPhotos", label: "Final photos", enabled: true, required: false, order: 9 },
    { id: "loadNumber", label: "Load Number (end)", enabled: true, required: true, order: 10 },
    { id: "finalSignature", label: "Final signature (end)", enabled: true, required: true, order: 11 },
  ],
};

export const inspectionConfigStorage = {
  getConfig: (): InspectionFormConfig => {
    if (typeof window === "undefined") return DEFAULT_CONFIG;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return DEFAULT_CONFIG;
      return JSON.parse(data);
    } catch (error) {
      console.error("[InspectionConfig] Failed to parse config:", error);
      return DEFAULT_CONFIG;
    }
  },

  saveConfig: (config: InspectionFormConfig) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error("[InspectionConfig] Failed to save config:", error);
    }
  },

  resetToDefault: (): InspectionFormConfig => {
    inspectionConfigStorage.saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  },

  isSectionEnabled: (sectionId: string): boolean => {
    const config = inspectionConfigStorage.getConfig();
    const section = config.sections.find(s => s.id === sectionId);
    return section?.enabled ?? true;
  },

  isSectionRequired: (sectionId: string): boolean => {
    const config = inspectionConfigStorage.getConfig();
    const section = config.sections.find(s => s.id === sectionId);
    return section?.required ?? false;
  },
};