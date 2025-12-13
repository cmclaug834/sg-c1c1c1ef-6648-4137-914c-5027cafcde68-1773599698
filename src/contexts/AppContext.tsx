import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Track, User, RailCar, AppSettings } from "@/types";
import { storage } from "@/lib/storage";

interface AppContextType {
  tracks: Track[];
  currentUser: User | null;
  settings: AppSettings;
  addCar: (trackId: string, car: Omit<RailCar, "id" | "status">) => void;
  confirmCar: (trackId: string, carId: string) => void;
  unconfirmCar: (trackId: string, carId: string) => void;
  setUser: (user: User) => void;
  updateSettings: (settings: AppSettings) => void;
  updateLastChecked: (trackId: string) => void;
  addTrack: (trackName: string) => void;
  toggleTrackEnabled: (trackId: string) => void;
  saveTracks: (tracks: Track[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ requireUnconfirmDialog: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTracks(storage.getTracks());
    setCurrentUser(storage.getUser());
    setSettings(storage.getSettings());
  }, []);

  useEffect(() => {
    if (mounted) {
      storage.saveTracks(tracks);
    }
  }, [tracks, mounted]);

  const addCar = (trackId: string, car: Omit<RailCar, "id" | "status">) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const newCar: RailCar = {
          ...car,
          id: `car-${Date.now()}`,
          status: "pending",
        };
        return {
          ...track,
          cars: [...track.cars, newCar],
          totalCars: track.totalCars + 1,
        };
      }
      return track;
    }));
  };

  const confirmCar = (trackId: string, carId: string) => {
    if (!currentUser) return;
    
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const updatedCars = track.cars.map(car => 
          car.id === carId 
            ? { 
                ...car, 
                status: "confirmed" as const,
                confirmedAt: new Date().toISOString(),
                confirmedBy: currentUser.crewId,
              }
            : car
        );
        return {
          ...track,
          cars: updatedCars,
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };
      }
      return track;
    }));
  };

  const unconfirmCar = (trackId: string, carId: string) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const updatedCars = track.cars.map(car => 
          car.id === carId 
            ? { 
                ...car, 
                status: "pending" as const,
                confirmedAt: undefined,
                confirmedBy: undefined,
              }
            : car
        );
        return {
          ...track,
          cars: updatedCars,
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };
      }
      return track;
    }));
  };

  const updateLastChecked = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, lastChecked: new Date().toISOString() }
        : track
    ));
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const setUser = (user: User) => {
    setCurrentUser(user);
    storage.saveUser(user);
  };

  const addTrack = (trackName: string) => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: trackName,
      cars: [],
      totalCars: 0,
      confirmedCars: 0,
      enabled: true,
    };
    setTracks(prev => [...prev, newTrack]);
  };

  const toggleTrackEnabled = (trackId: string) => {
    setTracks(prev => prev.map(track =>
      track.id === trackId
        ? { ...track, enabled: !track.enabled }
        : track
    ));
  };

  const saveTracks = (updatedTracks: Track[]) => {
    setTracks(updatedTracks);
  };

  return (
    <AppContext.Provider value={{
      tracks,
      currentUser,
      settings,
      addCar,
      confirmCar,
      unconfirmCar,
      setUser,
      updateSettings,
      updateLastChecked,
      addTrack,
      toggleTrackEnabled,
      saveTracks,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}