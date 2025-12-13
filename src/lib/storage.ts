import { Track, User } from "@/types";

const STORAGE_KEYS = {
  TRACKS: "rail_yard_tracks",
  USER: "rail_yard_user",
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
};

function getInitialTracks(): Track[] {
  return [
    {
      id: "track-1",
      name: "Track 1",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
    },
    {
      id: "track-2",
      name: "Track 2",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
    },
    {
      id: "track-3",
      name: "Track 3",
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
    },
  ];
}