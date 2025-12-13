import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Track, User, RailCar, AppSettings, MoveLog } from "@/types";
import { storage } from "@/lib/storage";

interface AppContextType {
  tracks: Track[];
  currentUser: User | null;
  settings: AppSettings;
  addCar: (trackId: string, car: Omit<RailCar, "id" | "status">) => void;
  confirmCar: (trackId: string, carId: string) => void;
  unconfirmCar: (trackId: string, carId: string) => void;
  moveCar: (carId: string, fromTrackId: string, toTrackId: string, reason: "MORNING_RECONCILE" | "DAY_MOVE") => boolean;
  setUser: (user: User) => void;
  updateSettings: (settings: AppSettings) => void;
  updateLastChecked: (trackId: string) => void;
  addTrack: (trackName: string) => void;
  toggleTrackEnabled: (trackId: string) => void;
  saveTracks: (tracks: Track[]) => void;
  commitTrackOrder: (trackId: string, orderedCarList: RailCar[]) => void;
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

  const moveCar = (carId: string, fromTrackId: string, toTrackId: string, reason: "MORNING_RECONCILE" | "DAY_MOVE"): boolean => {
    if (!currentUser) return false;

    // Find source track and car
    const fromTrack = tracks.find(t => t.id === fromTrackId);
    const car = fromTrack?.cars.find(c => c.id === carId);
    
    if (!fromTrack || !car) return false;

    // Validate destination track exists
    const toTrack = tracks.find(t => t.id === toTrackId);
    if (!toTrack) return false;

    // Check for duplicates in destination track
    const duplicateExists = toTrack.cars.some(c => c.carNumber === car.carNumber);
    if (duplicateExists) return false;

    // Create move log entry
    const moveLog: MoveLog = {
      id: `move-${Date.now()}`,
      carId: car.id,
      carNumber: car.carNumber,
      fromTrack: fromTrack.name,
      toTrack: toTrack.name,
      timestamp: new Date().toISOString(),
      crewId: currentUser.crewId,
      reason,
    };

    // Store move log (localStorage for now)
    const existingLogs = JSON.parse(localStorage.getItem("rail_yard_move_logs") || "[]");
    localStorage.setItem("rail_yard_move_logs", JSON.stringify([...existingLogs, moveLog]));

    // Perform the move
    setTracks(prev => prev.map(track => {
      // Remove from source track
      if (track.id === fromTrackId) {
        const updatedCars = track.cars.filter(c => c.id !== carId);
        return {
          ...track,
          cars: updatedCars,
          totalCars: updatedCars.length,
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };
      }
      
      // Add to destination track
      if (track.id === toTrackId) {
        const placement = settings.movePlacement || "append";
        const movedCar = { ...car, status: "pending" as const, confirmedAt: undefined, confirmedBy: undefined };
        const updatedCars = placement === "prepend" 
          ? [movedCar, ...track.cars]
          : [...track.cars, movedCar];
        
        return {
          ...track,
          cars: updatedCars,
          totalCars: updatedCars.length,
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };
      }
      
      return track;
    }));

    return true;
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

  const commitTrackOrder = (trackId: string, orderedCarList: RailCar[]) => {
    if (!currentUser) return;

    setTracks(prev => prev.map(track => {
      if (track.id !== trackId) return track;

      // Safety net: find any cars not in the ordered list
      const orderedIds = new Set(orderedCarList.map(c => c.id));
      const missingCars = track.cars.filter(c => !orderedIds.has(c.id));

      // New order = ordered list + missing cars appended
      const finalOrder = [...orderedCarList, ...missingCars];

      // Log the order update event
      const orderLog = {
        id: `order-${Date.now()}`,
        trackId: track.id,
        trackName: track.name,
        timestamp: new Date().toISOString(),
        crewId: currentUser.crewId,
        reason: "ORDER_UPDATED",
        carCount: finalOrder.length,
      };

      const existingLogs = JSON.parse(localStorage.getItem("rail_yard_order_logs") || "[]");
      localStorage.setItem("rail_yard_order_logs", JSON.stringify([...existingLogs, orderLog]));

      return {
        ...track,
        cars: finalOrder,
      };
    }));
  };

  return (
    <AppContext.Provider value={{
      tracks,
      currentUser,
      settings,
      addCar,
      confirmCar,
      unconfirmCar,
      moveCar,
      setUser,
      updateSettings,
      updateLastChecked,
      addTrack,
      toggleTrackEnabled,
      saveTracks,
      commitTrackOrder,
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