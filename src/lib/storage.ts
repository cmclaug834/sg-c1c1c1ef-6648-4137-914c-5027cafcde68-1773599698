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
      movePlacement: "append"
    };
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { 
      requireUnconfirmDialog: false,
      resolveOnDone: true,
      showMissingInList: false,
      movePlacement: "append"
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
      name: "Track 1",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
    },
    {
      id: "track-2",
      name: "Track 2",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
    },
    {
      id: "track-3",
      name: "Track 3",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
    },
    {
      id: "track-4",
      name: "Track 4",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
    },
    {
      id: "track-5",
      name: "Track 5",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      lastChecked: undefined,
    },
  ];
}