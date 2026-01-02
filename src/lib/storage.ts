import { Track, User, AppSettings } from "@/types";

const STORAGE_KEYS = {
  TRACKS: "rail_yard_tracks",
  USER: "rail_yard_user",
  SETTINGS: "rail_yard_settings",
  APP_NAME: "rail_yard_app_name",
  SITE_NAME: "rail_yard_site_name",
  ACTIVE_CREW: "rail_yard_active_crew",
  SESSION_EXPIRES_AT: "rail_yard_session_expires_at",
  SHIFT_A: "rail_yard_shift_a",
  SHIFT_B: "rail_yard_shift_b",
  REFERENCE_DATA: "rail_yard_reference_data",
};

export interface ActiveCrew {
  name: string;
  crewId: string;
  startedAt: string;
}

export interface ReferenceData {
  sites: string[];
  houseCodes: string[];
  updatedAt: string;
}

export const storage = {
  getTracks: (): Track[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRACKS);
      if (!data) return getInitialTracks();
      const parsed = JSON.parse(data);
      
      // Return tracks as-is from localStorage, only applying defaults for missing optional fields
      if (Array.isArray(parsed)) {
        return parsed.map(track => ({
          ...track,
          // Only apply defaults if fields are missing
          enabled: track.enabled !== undefined ? track.enabled : true,
        }));
      }
      
      return getInitialTracks();
    } catch (error) {
      console.warn("[Storage] Failed to parse tracks, returning defaults:", error);
      return getInitialTracks();
    }
  },

  saveTracks: (tracks: Track[]) => {
    if (typeof window === "undefined") return;
    try {
      // Save complete Track objects without any transformation
      localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
    } catch (error) {
      console.error("[Storage] Failed to save tracks:", error);
    }
  },

  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.warn("[Storage] Failed to parse user, returning null:", error);
      return null;
    }
  },

  saveUser: (user: User) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error("[Storage] Failed to save user:", error);
    }
  },

  getSettings: (): AppSettings => {
    if (typeof window === "undefined") {
      return {
        requireUnconfirmDialog: false,
        resolveOnDone: true,
        showMissingInList: false,
        movePlacement: "append",
        adminManageTracks: false,
        shiftChangeA: "06:00",
        shiftChangeB: "18:00",
      };
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        return {
          requireUnconfirmDialog: false,
          resolveOnDone: true,
          showMissingInList: false,
          movePlacement: "append",
          adminManageTracks: false,
          shiftChangeA: "06:00",
          shiftChangeB: "18:00",
        };
      }
      return JSON.parse(data);
    } catch (error) {
      console.warn("[Storage] Failed to parse settings, returning defaults:", error);
      return {
        requireUnconfirmDialog: false,
        resolveOnDone: true,
        showMissingInList: false,
        movePlacement: "append",
        adminManageTracks: false,
        shiftChangeA: "06:00",
        shiftChangeB: "18:00",
      };
    }
  },

  saveSettings: (settings: AppSettings) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error("[Storage] Failed to save settings:", error);
    }
  },

  getAppName: (): string => {
    if (typeof window === "undefined") return "Rail Yard Tracker";
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APP_NAME);
      return data || "Rail Yard Tracker";
    } catch (error) {
      console.warn("[Storage] Failed to get app name:", error);
      return "Rail Yard Tracker";
    }
  },

  saveAppName: (name: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.APP_NAME, name);
    } catch (error) {
      console.error("[Storage] Failed to save app name:", error);
    }
  },

  getSiteName: (): string => {
    if (typeof window === "undefined") return "GFC Rail Yard";
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SITE_NAME);
      return data || "GFC Rail Yard";
    } catch (error) {
      console.warn("[Storage] Failed to get site name:", error);
      return "GFC Rail Yard";
    }
  },

  saveSiteName: (name: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.SITE_NAME, name);
    } catch (error) {
      console.error("[Storage] Failed to save site name:", error);
    }
  },

  getActiveCrew: (): ActiveCrew | null => {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_CREW);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.warn("[Storage] Failed to parse active crew:", error);
      return null;
    }
  },

  saveActiveCrew: (crew: ActiveCrew) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CREW, JSON.stringify(crew));
    } catch (error) {
      console.error("[Storage] Failed to save active crew:", error);
    }
  },

  clearActiveCrew: () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CREW);
      localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
    } catch (error) {
      console.error("[Storage] Failed to clear active crew:", error);
    }
  },

  getSessionExpiresAt: (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
    } catch (error) {
      console.warn("[Storage] Failed to get session expires at:", error);
      return null;
    }
  },

  saveSessionExpiresAt: (timestamp: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, timestamp);
    } catch (error) {
      console.error("[Storage] Failed to save session expires at:", error);
    }
  },

  getShiftTimes: (): { shiftA: string; shiftB: string } => {
    if (typeof window === "undefined") return { shiftA: "06:00", shiftB: "18:00" };
    try {
      const shiftA = localStorage.getItem(STORAGE_KEYS.SHIFT_A) || "06:00";
      const shiftB = localStorage.getItem(STORAGE_KEYS.SHIFT_B) || "18:00";
      return { shiftA, shiftB };
    } catch (error) {
      console.warn("[Storage] Failed to get shift times:", error);
      return { shiftA: "06:00", shiftB: "18:00" };
    }
  },

  saveShiftTimes: (shiftA: string, shiftB: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFT_A, shiftA);
      localStorage.setItem(STORAGE_KEYS.SHIFT_B, shiftB);
    } catch (error) {
      console.error("[Storage] Failed to save shift times:", error);
    }
  },

  getReferenceData: (): ReferenceData => {
    if (typeof window === "undefined") {
      return getDefaultReferenceData();
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REFERENCE_DATA);
      if (!data) {
        return getDefaultReferenceData();
      }
      return JSON.parse(data);
    } catch (error) {
      console.warn("[Storage] Failed to parse reference data, returning defaults:", error);
      return getDefaultReferenceData();
    }
  },

  saveReferenceData: (data: ReferenceData) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.REFERENCE_DATA, JSON.stringify(data));
    } catch (error) {
      console.error("[Storage] Failed to save reference data:", error);
    }
  },
};

function getInitialTracks(): Track[] {
  return [
    {
      id: "track-1",
      name: "AS28",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-2",
      name: "AS29",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-3",
      name: "AS30",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-4",
      name: "AS31",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-5",
      name: "AS32",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-6",
      name: "AS33",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-7",
      name: "AS34",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-8",
      name: "AS38",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-9",
      name: "AS39",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-10",
      name: "AS46",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-11",
      name: "AS47",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-12",
      name: "AS48",
      cars: [],
      lastChecked: undefined,
      enabled: true,
    },
  ];
}

function getDefaultReferenceData(): ReferenceData {
  return {
    sites: ["CCF", "CI IF", "FM", "FR", "GMF", "GP", "NB"],
    houseCodes: ["H2-1", "H2-2", "H2-3", "H1-1", "H1-2", "H1-3"],
    updatedAt: new Date().toISOString(),
  };
}