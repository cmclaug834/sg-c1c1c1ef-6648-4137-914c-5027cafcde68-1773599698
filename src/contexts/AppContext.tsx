import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Track, User, RailCar } from "@/types";
import { storage } from "@/lib/storage";

interface AppContextType {
  tracks: Track[];
  currentUser: User | null;
  addCar: (trackId: string, car: Omit<RailCar, "id" | "status">) => void;
  confirmCar: (trackId: string, carId: string) => void;
  unconfirmCar: (trackId: string, carId: string) => void;
  setUser: (user: User) => void;
  updateLastChecked: (trackId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTracks(storage.getTracks());
    setCurrentUser(storage.getUser());
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

  const setUser = (user: User) => {
    setCurrentUser(user);
    storage.saveUser(user);
  };

  return (
    <AppContext.Provider value={{
      tracks,
      currentUser,
      addCar,
      confirmCar,
      unconfirmCar,
      setUser,
      updateLastChecked,
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