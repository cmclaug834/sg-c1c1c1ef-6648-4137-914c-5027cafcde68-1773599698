import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Track, User, RailCar, AppSettings, MoveLog } from "@/types";
import { storage } from "@/lib/storage";
import { logDiagnostic } from "@/lib/diagnostics";
import { normalizeCarId } from "@/lib/carIdFormatter";

/**
 * Legacy track type that may have stored count fields
 */
interface LegacyTrack extends Track {
  totalCars?: number;
  confirmedCars?: number;
}

/**
 * Generate a unique car ID
 * Uses crypto.randomUUID() if available, otherwise Date.now() + random suffix
 */
function generateUniqueCarId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `car-${crypto.randomUUID()}`;
  }
  return `car-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Repair track data: ensure all cars have unique IDs
 * Also reconciles totalCars and confirmedCars from legacy data
 * Returns repaired tracks and logs any fixes made
 */
function repairTrackData(tracks: Track[]): Track[] {
  let repairCount = 0;
  let countMismatches = 0;
  const usedIds = new Set<string>();

  const repairedTracks = tracks.map(track => {
    const repairedCars = track.cars.map(car => {
      // Normalize car number on load if not already normalized
      const normalized = normalizeCarId(car.carNumber);
      const needsNormalization = car.carNumber !== normalized;

      // Check if car is missing ID or has duplicate ID
      if (!car.id || usedIds.has(car.id)) {
        const oldId = car.id || "(missing)";
        const newId = generateUniqueCarId();
        repairCount++;
        console.warn(`[DATA REPAIR] Track ${track.name}: Fixed car ${car.carNumber} - ID ${oldId} → ${newId}`);
        usedIds.add(newId);
        return {
          ...car,
          id: newId,
          carNumber: normalized,
        };
      }

      usedIds.add(car.id);
      return needsNormalization ? { ...car, carNumber: normalized } : car;
    });

    // Remove legacy totalCars and confirmedCars if present
    // These will be computed dynamically going forward
    const cleanedTrack: Track = {
      id: track.id,
      name: track.name,
      cars: repairedCars,
      lastChecked: track.lastChecked,
      lastCheckClearedAt: track.lastCheckClearedAt,
      enabled: track.enabled,
    };

    // Check if legacy counts existed and were wrong
    const legacyTrack = track as LegacyTrack;
    if (legacyTrack.totalCars !== undefined || legacyTrack.confirmedCars !== undefined) {
      const actualTotal = repairedCars.length;
      const actualConfirmed = repairedCars.filter(c => c.status === "confirmed").length;
      if (legacyTrack.totalCars !== actualTotal || legacyTrack.confirmedCars !== actualConfirmed) {
        countMismatches++;
      }
    }

    return cleanedTrack;
  });

  if (repairCount > 0) {
    console.warn(`[DATA REPAIR] Fixed ${repairCount} cars with missing/duplicate IDs`);
  }
  if (countMismatches > 0) {
    console.warn(`[DATA REPAIR] Removed legacy count fields from ${countMismatches} tracks (now computed dynamically)`);
  }

  return repairedTracks;
}

/**
 * Compute dynamic track counts from cars array
 * This is the single source of truth for counts
 */
function computeTrackCounts(cars: RailCar[]): { totalCars: number; confirmedCars: number } {
  return {
    totalCars: cars.length,
    confirmedCars: cars.filter(c => c.status === "confirmed").length,
  };
}

/**
 * Enhance track with computed counts for display
 */
export interface TrackWithCounts extends Track {
  totalCars: number;
  confirmedCars: number;
}

interface AppContextType {
  tracks: TrackWithCounts[];
  currentUser: User | null;
  settings: AppSettings;
  appName: string;
  siteName: string;
  addCar: (trackId: string, car: Omit<RailCar, "id" | "status">) => void;
  confirmCar: (trackId: string, carId: string) => void;
  unconfirmCar: (trackId: string, carId: string) => void;
  moveCar: (carId: string, fromTrackId: string, toTrackId: string, reason: "MORNING_RECONCILE" | "DAY_MOVE") => boolean;
  setUser: (user: User) => void;
  setCurrentUser: (user: User) => void;
  updateSettings: (settings: AppSettings) => void;
  updateBranding: (appName: string, siteName: string) => void;
  updateLastChecked: (trackId: string) => void;
  updateTrackTimestamp: (trackId: string, field: "lastChecked" | "lastCheckClearedAt") => void;
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
  const [appName, setAppName] = useState<string>("Rail Yard Tracker");
  const [siteName, setSiteName] = useState<string>("GFC Rail Yard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadedTracks = storage.getTracks();
    const repairedTracks = repairTrackData(loadedTracks);
    setTracks(repairedTracks);
    setSettings(storage.getSettings());
    setAppName(storage.getAppName());
    setSiteName(storage.getSiteName());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem("rail_yard_user");
    if (!raw) return;

    try {
      const user = JSON.parse(raw);
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      storage.saveTracks(tracks);
    }
  }, [tracks, mounted]);

  // Enhance tracks with computed counts for consumer components
  const tracksWithCounts: TrackWithCounts[] = tracks.map(track => {
    const counts = computeTrackCounts(track.cars);
    return {
      ...track,
      totalCars: counts.totalCars,
      confirmedCars: counts.confirmedCars,
    };
  });

  const addCar = (trackId: string, car: Omit<RailCar, "id" | "status">) => {
    setTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        // Normalize car number at entry point
        const normalizedCarNumber = normalizeCarId(car.carNumber);
        
        const newCar: RailCar = {
          ...car,
          carNumber: normalizedCarNumber,
          id: generateUniqueCarId(),
          status: "pending",
        };
        
        return {
          ...track,
          cars: [...track.cars, newCar],
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
        
        const updatedTrack = {
          ...track,
          cars: updatedCars,
        };

        // Log diagnostic after confirm
        logDiagnostic("CONFIRM_CAR", updatedTrack as LegacyTrack, 0, 0);

        return updatedTrack;
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
        
        const updatedTrack = {
          ...track,
          cars: updatedCars,
        };

        // Log diagnostic after unconfirm
        logDiagnostic("UNCONFIRM_CAR", updatedTrack as LegacyTrack, 0, 0);

        return updatedTrack;
      }
      return track;
    }));
  };

  /**
   * moveCar - Fixed to eliminate stale state reads
   * All track lookups now happen inside setTracks callback
   */
  const moveCar = (carId: string, fromTrackId: string, toTrackId: string, reason: "MORNING_RECONCILE" | "DAY_MOVE"): boolean => {
    if (!currentUser) return false;

    let success = false;

    setTracks(prev => {
      // All reads happen inside this callback - no stale state
      const fromTrack = prev.find(t => t.id === fromTrackId);
      const car = fromTrack?.cars.find(c => c.id === carId);
      
      if (!fromTrack || !car) {
        success = false;
        return prev; // No change
      }

      const toTrack = prev.find(t => t.id === toTrackId);
      if (!toTrack) {
        success = false;
        return prev; // No change
      }

      // Duplicate detection using normalized car numbers
      const normalizedCarNumber = normalizeCarId(car.carNumber);
      const duplicateExists = toTrack.cars.some(c => normalizeCarId(c.carNumber) === normalizedCarNumber);
      
      if (duplicateExists) {
        success = false;
        return prev; // No change
      }

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
      try {
        const existingLogs = JSON.parse(localStorage.getItem("rail_yard_move_logs") || "[]");
        localStorage.setItem("rail_yard_move_logs", JSON.stringify([...existingLogs, moveLog]));
      } catch (error) {
        console.error("[moveCar] Failed to save move log:", error);
      }

      // Perform the move atomically
      success = true;
      return prev.map(track => {
        // Remove from source track
        if (track.id === fromTrackId) {
          const updatedCars = track.cars.filter(c => c.id !== carId);
          return {
            ...track,
            cars: updatedCars,
          };
        }
        
        // Add to destination track
        if (track.id === toTrackId) {
          const placement = settings.movePlacement || "append";
          const movedCar = { 
            ...car, 
            status: "pending" as const, 
            confirmedAt: undefined, 
            confirmedBy: undefined 
          };
          const updatedCars = placement === "prepend" 
            ? [movedCar, ...track.cars]
            : [...track.cars, movedCar];
          
          return {
            ...track,
            cars: updatedCars,
          };
        }
        
        return track;
      });
    });

    return success;
  };

  const updateLastChecked = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, lastChecked: new Date().toISOString() }
        : track
    ));
  };

  const updateTrackTimestamp = (trackId: string, field: "lastChecked" | "lastCheckClearedAt") => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, [field]: new Date().toISOString() }
        : track
    ));
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const updateBranding = (newAppName: string, newSiteName: string) => {
    setAppName(newAppName);
    setSiteName(newSiteName);
    storage.saveAppName(newAppName);
    storage.saveSiteName(newSiteName);
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
      try {
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
      } catch (error) {
        console.error("[commitTrackOrder] Failed to save order log:", error);
      }

      return {
        ...track,
        cars: finalOrder,
      };
    }));
  };

  return (
    <AppContext.Provider value={{
      tracks: tracksWithCounts,
      currentUser,
      settings,
      appName,
      siteName,
      addCar,
      confirmCar,
      unconfirmCar,
      moveCar,
      setUser,
      setCurrentUser: setUser,
      updateSettings,
      updateBranding,
      updateLastChecked,
      updateTrackTimestamp,
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