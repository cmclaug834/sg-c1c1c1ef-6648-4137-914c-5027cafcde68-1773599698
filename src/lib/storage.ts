import { Track, User, AppSettings } from "@/types";

const STORAGE_KEYS = {
  TRACKS: "rail_yard_tracks",
  USER: "rail_yard_user",
  SETTINGS: "rail_yard_settings",
};

export const storage = {
  getTracks: (): Track[] => {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEYS.TRACKS);
    return data ? JSON.parse(data) : getInitialTracks();
  },

  saveTracks: (tracks: Track[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
  },

  getUser: (): User | null => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  saveUser: (user: User) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getSettings: (): AppSettings => {
    if (typeof window === "undefined") return { 
      requireUnconfirmDialog: false,
      resolveOnDone: true,
      showMissingInList: false,
      movePlacement: "append",
      adminManageTracks: false
    };
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { 
      requireUnconfirmDialog: false,
      resolveOnDone: true,
      showMissingInList: false,
      movePlacement: "append",
      adminManageTracks: false
    };
  },

  saveSettings: (settings: AppSettings) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },
};

function getInitialTracks(): Track[] {
  return [
    {
      id: "track-1",
      name: "AS28",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-2",
      name: "AS29",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-3",
      name: "AS30",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-4",
      name: "AS31",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-5",
      name: "AS32",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-6",
      name: "AS33",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-7",
      name: "AS34",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-8",
      name: "AS38",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-9",
      name: "AS39",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-10",
      name: "AS46",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-11",
      name: "AS47",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
    {
      id: "track-12",
      name: "AS48",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
      enabled: true,
    },
  ];
}