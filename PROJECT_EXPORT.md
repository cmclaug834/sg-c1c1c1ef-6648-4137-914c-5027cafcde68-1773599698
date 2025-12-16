# Rail Yard Tracker - Complete Project Export
**Generated:** 2025-12-16
**Tech Stack:** Next.js 15.2 (Pages Router), TypeScript, React 18

---

## PROJECT STRUCTURE

```
rail-yard-tracker/
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn components - 45+ files)
│   │   ├── BottomNav.tsx
│   │   ├── DuplicateCarDialog.tsx
│   │   ├── ThemeSwitch.tsx
│   │   ├── TrackPickerModal.tsx
│   │   └── UnconfirmDialog.tsx
│   ├── contexts/
│   │   ├── AppContext.tsx (368 lines)
│   │   └── ThemeProvider.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── carIdFormatter.ts
│   │   ├── carImportParser.ts
│   │   ├── diagnostics.ts
│   │   ├── profileStorage.ts
│   │   ├── storage.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── index.tsx (Landing/Login)
│   │   ├── tracks.tsx (Track List)
│   │   ├── settings.tsx
│   │   ├── track/
│   │   │   ├── [id].tsx (Track Detail - 1124 lines)
│   │   │   └── [id]/import.tsx
│   │   ├── reorder/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   └── exceptions/
│   │       └── [id].tsx
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── index.ts
├── public/
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── vercel.json
```

---

## CORE SOURCE FILES

### 1. TYPE DEFINITIONS

**File:** `src/types/index.ts`

```typescript
export interface RailCar {
  id: string;
  carNumber: string;
  carType: string;
  confirmedAt?: string;
  confirmedBy?: string;
  status: "pending" | "confirmed" | "missing";
}

export interface MoveLog {
  id: string;
  carId: string;
  carNumber: string;
  fromTrack: string;
  toTrack: string;
  timestamp: string;
  crewId: string;
  reason: "MORNING_RECONCILE" | "DAY_MOVE";
}

export interface Track {
  id: string;
  name: string;
  cars: RailCar[];
  totalCars: number;
  confirmedCars: number;
  lastChecked?: string;
  lastCheckClearedAt?: string;
  enabled?: boolean;
}

export interface User {
  id: string;
  name: string;
  crewId: string;
}

export interface AppSettings {
  requireUnconfirmDialog: boolean;
  resolveOnDone?: boolean;
  showMissingInList?: boolean;
  movePlacement?: "append" | "prepend";
  adminManageTracks?: boolean;
  shiftChangeA?: string;
  shiftChangeB?: string;
}
```

---

### 2. STORAGE LAYER

**File:** `src/lib/storage.ts`

```typescript
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
};

export interface ActiveCrew {
  name: string;
  crewId: string;
  startedAt: string;
}

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
      adminManageTracks: false,
      shiftChangeA: "06:00",
      shiftChangeB: "18:00",
    };
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { 
      requireUnconfirmDialog: false,
      resolveOnDone: true,
      showMissingInList: false,
      movePlacement: "append",
      adminManageTracks: false,
      shiftChangeA: "06:00",
      shiftChangeB: "18:00",
    };
  },

  saveSettings: (settings: AppSettings) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getAppName: (): string => {
    if (typeof window === "undefined") return "Rail Yard Tracker";
    const data = localStorage.getItem(STORAGE_KEYS.APP_NAME);
    return data || "Rail Yard Tracker";
  },

  saveAppName: (name: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.APP_NAME, name);
  },

  getSiteName: (): string => {
    if (typeof window === "undefined") return "GFC Rail Yard";
    const data = localStorage.getItem(STORAGE_KEYS.SITE_NAME);
    return data || "GFC Rail Yard";
  },

  saveSiteName: (name: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SITE_NAME, name);
  },

  getActiveCrew: (): ActiveCrew | null => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_CREW);
    return data ? JSON.parse(data) : null;
  },

  saveActiveCrew: (crew: ActiveCrew) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CREW, JSON.stringify(crew));
  },

  clearActiveCrew: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CREW);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
  },

  getSessionExpiresAt: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES_AT);
  },

  saveSessionExpiresAt: (timestamp: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES_AT, timestamp);
  },

  getShiftTimes: (): { shiftA: string; shiftB: string } => {
    if (typeof window === "undefined") return { shiftA: "06:00", shiftB: "18:00" };
    const shiftA = localStorage.getItem(STORAGE_KEYS.SHIFT_A) || "06:00";
    const shiftB = localStorage.getItem(STORAGE_KEYS.SHIFT_B) || "18:00";
    return { shiftA, shiftB };
  },

  saveShiftTimes: (shiftA: string, shiftB: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SHIFT_A, shiftA);
    localStorage.setItem(STORAGE_KEYS.SHIFT_B, shiftB);
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
```

---

### 3. CAR ID FORMATTER

**File:** `src/lib/carIdFormatter.ts`

```typescript
export function normalizeCarId(input: string): string {
  if (!input) return "";
  
  const letters = input.match(/[a-zA-Z]/g) || [];
  const digits = input.match(/[0-9]/g) || [];
  
  const prefix = letters.join("").toUpperCase();
  const number = digits.join("");
  
  if (!prefix && !number) return "";
  if (!prefix) return number;
  if (!number) return prefix;
  
  return `${prefix} ${number}`;
}

export function isValidCarId(input: string): boolean {
  return /[a-zA-Z0-9]/.test(input);
}
```

---

### 4. APP CONTEXT (CORE STATE MANAGEMENT)

**File:** `src/contexts/AppContext.tsx` (Key Functions)

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Track, User, RailCar, AppSettings, MoveLog } from "@/types";
import { storage } from "@/lib/storage";
import { logDiagnostic } from "@/lib/diagnostics";

function generateUniqueCarId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `car-${crypto.randomUUID()}`;
  }
  return `car-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function repairTrackData(tracks: Track[]): Track[] {
  let repairCount = 0;
  const usedIds = new Set<string>();

  const repairedTracks = tracks.map(track => {
    const repairedCars = track.cars.map(car => {
      if (!car.id || usedIds.has(car.id)) {
        const oldId = car.id || "(missing)";
        const newId = generateUniqueCarId();
        repairCount++;
        console.warn(`[DATA REPAIR] Track ${track.name}: Fixed car ${car.carNumber} - ID ${oldId} → ${newId}`);
        usedIds.add(newId);
        return { ...car, id: newId };
      }
      usedIds.add(car.id);
      return car;
    });

    return {
      ...track,
      cars: repairedCars,
    };
  });

  if (repairCount > 0) {
    console.warn(`[DATA REPAIR] Fixed ${repairCount} cars with missing/duplicate IDs`);
  }

  return repairedTracks;
}

interface AppContextType {
  tracks: Track[];
  currentUser: User | null;
  settings: AppSettings;
  appName: string;
  siteName: string;
  addCar: (trackId: string, car: Omit<RailCar, "id" | "status">) => void;
  confirmCar: (trackId: string, carId: string) => void;
  unconfirmCar: (trackId: string, carId: string) => void;
  moveCar: (carId: string, fromTrackId: string, toTrackId: string, reason: "MORNING_RECONCILE" | "DAY_MOVE") => boolean;
  setUser: (user: User) => void;
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
    setCurrentUser(storage.getUser());
    setSettings(storage.getSettings());
    setAppName(storage.getAppName());
    setSiteName(storage.getSiteName());
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
          id: generateUniqueCarId(),
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
        const updatedTrack = {
          ...track,
          cars: updatedCars,
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };

        logDiagnostic("CONFIRM_CAR", updatedTrack);

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
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };

        logDiagnostic("UNCONFIRM_CAR", updatedTrack);

        return updatedTrack;
      }
      return track;
    }));
  };

  const moveCar = (carId: string, fromTrackId: string, toTrackId: string, reason: "MORNING_RECONCILE" | "DAY_MOVE"): boolean => {
    if (!currentUser) return false;

    const fromTrack = tracks.find(t => t.id === fromTrackId);
    const car = fromTrack?.cars.find(c => c.id === carId);
    
    if (!fromTrack || !car) return false;

    const toTrack = tracks.find(t => t.id === toTrackId);
    if (!toTrack) return false;

    const duplicateExists = toTrack.cars.some(c => c.carNumber === car.carNumber);
    if (duplicateExists) return false;

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

    const existingLogs = JSON.parse(localStorage.getItem("rail_yard_move_logs") || "[]");
    localStorage.setItem("rail_yard_move_logs", JSON.stringify([...existingLogs, moveLog]));

    setTracks(prev => prev.map(track => {
      if (track.id === fromTrackId) {
        const updatedCars = track.cars.filter(c => c.id !== carId);
        return {
          ...track,
          cars: updatedCars,
          totalCars: updatedCars.length,
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };
      }
      
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

      const orderedIds = new Set(orderedCarList.map(c => c.id));
      const missingCars = track.cars.filter(c => !orderedIds.has(c.id));

      const finalOrder = [...orderedCarList, ...missingCars];

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
      appName,
      siteName,
      addCar,
      confirmCar,
      unconfirmCar,
      moveCar,
      setUser,
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
```

---

### 5. BOTTOM NAVIGATION

**File:** `src/components/BottomNav.tsx`

```typescript
import { useRouter } from "next/router";
import { ClipboardList, ArrowUpDown, Settings } from "lucide-react";

export function BottomNav() {
  const router = useRouter();
  const { pathname } = router;

  const isYardCheckActive = pathname === "/tracks" || pathname.startsWith("/track/");
  const isReorderActive = pathname.startsWith("/reorder");
  const isSettingsActive = pathname.startsWith("/settings");

  const handleYardCheck = () => {
    router.push("/tracks");
  };

  const handleReorder = () => {
    router.push("/reorder");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50 pointer-events-auto">
      <div className="max-w-4xl mx-auto px-2 py-2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
        <div className="grid grid-cols-3 gap-2">
          <button
            id="NAV.tabYardCheck"
            onClick={handleYardCheck}
            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors ${
              isYardCheckActive
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-xs font-medium">Yard Check</span>
          </button>

          <button
            id="NAV.tabReorder"
            onClick={handleReorder}
            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors ${
              isReorderActive
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <ArrowUpDown className="w-6 h-6" />
            <span className="text-xs font-medium">Reorder</span>
          </button>

          <button
            id="NAV.tabSettings"
            onClick={handleSettings}
            className={`flex flex-col items-center gap-1 py-3 px-4 rounded-lg transition-colors ${
              isSettingsActive
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
```

---

### 6. CAR IMPORT PARSER

**File:** `src/lib/carImportParser.ts`

```typescript
export interface ImportBuckets {
  toAdd: string[];
  skipped: string[];
  unrecognized: string[];
}

export interface ExtractedCar {
  normalized: string;
  source: string;
}

export interface ExtractedCarData {
  recognized: ExtractedCar[];
  unrecognized: string[];
}

export function extractCarIds(rawText: string): ExtractedCarData {
  const lines = rawText.split(/[\r\n]+/);
  const carMap = new Map<string, string>();
  const unrecognized: string[] = [];

  const carPattern = /([A-Za-z]{2,4})[\s\-_]*(\d{3,7})/g;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const matches = Array.from(trimmed.matchAll(carPattern));
    
    if (matches.length > 0) {
      matches.forEach(match => {
        const mark = match[1].toUpperCase();
        const number = match[2];
        const normalized = `${mark} ${number}`;
        if (!carMap.has(normalized)) {
          carMap.set(normalized, trimmed);
        }
      });
    } else {
      if (trimmed.length > 0) {
        unrecognized.push(trimmed);
      }
    }
  });

  const recognized: ExtractedCar[] = Array.from(carMap.entries()).map(([normalized, source]) => ({
    normalized,
    source,
  }));

  return {
    recognized,
    unrecognized,
  };
}

export function computeImportBuckets(
  incoming: ExtractedCar[],
  existingToday: string[],
  existingSnapshot: string[] = []
): ImportBuckets {
  const blocked = new Set([
    ...existingToday.map(id => id.toUpperCase().trim()),
    ...existingSnapshot.map(id => id.toUpperCase().trim()),
  ]);

  const toAdd: string[] = [];
  const skipped: string[] = [];

  incoming.forEach(car => {
    const normalized = car.normalized.toUpperCase().trim();
    if (blocked.has(normalized)) {
      skipped.push(car.normalized);
    } else {
      toAdd.push(car.normalized);
      blocked.add(normalized);
    }
  });

  return {
    toAdd,
    skipped,
    unrecognized: [],
  };
}
```

---

### 7. DIAGNOSTICS SYSTEM

**File:** `src/lib/diagnostics.ts`

```typescript
import { Track } from "@/types";

export interface TrackDiagnostic {
  trackId: string;
  trackName: string;
  carsLength: number;
  storedTotalCars: number;
  storedConfirmedCars: number;
  computedConfirmedCars: number;
  mismatchFlags: {
    totalMismatch: boolean;
    confirmedMismatch: boolean;
  };
}

export interface DebugLogEntry {
  timestamp: string;
  action: string;
  diagnostic: TrackDiagnostic;
  pendingConfirmations: number;
  pendingUnconfirmations: number;
}

export function diagnoseTrackIntegrity(track: Track): TrackDiagnostic {
  const carsLength = track.cars.length;
  const computedConfirmedCars = track.cars.filter(c => c.status === "confirmed").length;
  
  const totalMismatch = track.totalCars !== carsLength;
  const confirmedMismatch = track.confirmedCars !== computedConfirmedCars;

  return {
    trackId: track.id,
    trackName: track.name,
    carsLength,
    storedTotalCars: track.totalCars,
    storedConfirmedCars: track.confirmedCars,
    computedConfirmedCars,
    mismatchFlags: {
      totalMismatch,
      confirmedMismatch,
    },
  };
}

export function logDiagnostic(
  action: string,
  track: Track,
  pendingConfirmations: number = 0,
  pendingUnconfirmations: number = 0
): void {
  const diagnostic = diagnoseTrackIntegrity(track);
  
  const entry: DebugLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    diagnostic,
    pendingConfirmations,
    pendingUnconfirmations,
  };

  console.log(`[DIAGNOSTIC] ${action}`, {
    ...entry,
    mismatches: diagnostic.mismatchFlags.totalMismatch || diagnostic.mismatchFlags.confirmedMismatch
      ? "⚠️ MISMATCH DETECTED"
      : "✓ OK",
  });

  try {
    const existingLogs = JSON.parse(localStorage.getItem("rail_yard_debug_logs") || "[]");
    const updatedLogs = [...existingLogs, entry];
    
    const trimmedLogs = updatedLogs.slice(-100);
    
    localStorage.setItem("rail_yard_debug_logs", JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error("[DIAGNOSTIC] Failed to persist log:", error);
  }
}

export function getDebugLogs(): DebugLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem("rail_yard_debug_logs") || "[]");
  } catch (error) {
    console.error("[DIAGNOSTIC] Failed to read logs:", error);
    return [];
  }
}

export function clearDebugLogs(): void {
  try {
    localStorage.removeItem("rail_yard_debug_logs");
    console.log("[DIAGNOSTIC] Debug logs cleared");
  } catch (error) {
    console.error("[DIAGNOSTIC] Failed to clear logs:", error);
  }
}

export async function copyLogsToClipboard(): Promise<boolean> {
  try {
    const logs = getDebugLogs();
    const formatted = JSON.stringify(logs, null, 2);
    await navigator.clipboard.writeText(formatted);
    return true;
  } catch (error) {
    console.error("[DIAGNOSTIC] Failed to copy logs:", error);
    return false;
  }
}
```

---

### 8. PROFILE STORAGE

**File:** `src/lib/profileStorage.ts`

```typescript
export interface CrewProfile {
  name: string;
  crewId: string;
  lastUsedAt: string;
}

const STORAGE_KEY = "rail_yard_profiles";

export const profileStorage = {
  getProfiles: (): CrewProfile[] => {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const profiles: CrewProfile[] = JSON.parse(data);
      return profiles.sort((a, b) => 
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      );
    } catch (error) {
      console.error("Failed to load profiles:", error);
      return [];
    }
  },

  upsertProfile: (name: string, crewId: string): void => {
    if (typeof window === "undefined") return;
    try {
      const profiles = profileStorage.getProfiles();
      const now = new Date().toISOString();
      
      const existingIndex = profiles.findIndex(
        p => p.name === name && p.crewId === crewId
      );

      if (existingIndex >= 0) {
        profiles[existingIndex].lastUsedAt = now;
      } else {
        profiles.push({ name, crewId, lastUsedAt: now });
      }

      const trimmed = profiles
        .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
        .slice(0, 10);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  },

  getMostRecent: (): CrewProfile | null => {
    const profiles = profileStorage.getProfiles();
    return profiles.length > 0 ? profiles[0] : null;
  },
};
```

---

## KEY FEATURES

### Core Functionality
- Track Management: 12 default tracks (AS28-AS48)
- Car Tracking: Add/confirm/unconfirm rail cars
- Crew Sessions: Name + Crew ID with shift-based expiration
- Profile Memory: Auto-suggests recent crew profiles
- Car Import: Paste CN lists, auto-extract car IDs
- Reorder: Tap-based car sequencing
- Settings: Branding, shifts, track management

### Data Integrity
- Unique Car IDs: crypto.randomUUID() with fallback
- Duplicate Detection: Prevents same car on multiple tracks
- Data Repair: Auto-fixes missing/duplicate IDs on load
- Diagnostics: Debug logs for troubleshooting

### UX Features
- Glove-Friendly: 44px+ touch targets
- High Contrast: Dark theme (zinc-900 background)
- One-Handed: Bottom navigation, minimal scrolling
- Mobile-First: Safe area insets, responsive design
- Offline-Ready: localStorage persistence

### Recent Fixes (2025-12-16)
- Fixed: /reorder page tap blocking (added pb-24 padding)
- Fixed: BottomNav z-index and pointer-events
- Fixed: Safe area insets for iOS devices
- Fixed: Unique car ID generation + data repair
- Fixed: Track reorder functionality

---

## CONFIGURATION FILES

### package.json

```json
{
  "name": "tracking-sheet",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-alert-dialog": "^1.1.4",
    "@radix-ui/react-aspect-ratio": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-collapsible": "^1.1.2",
    "@radix-ui/react-context-menu": "^2.2.4",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-hover-card": "^1.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-menubar": "^1.1.4",
    "@radix-ui/react-navigation-menu": "^1.2.3",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-radio-group": "^1.2.2",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slider": "^1.2.2",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-toggle": "^1.1.1",
    "@radix-ui/react-toggle-group": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "embla-carousel-react": "^8.5.1",
    "input-otp": "^1.4.1",
    "lucide-react": "^0.474.0",
    "next": "15.2.0",
    "next-themes": "^0.4.4",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-resizable-panels": "^2.1.7",
    "recharts": "^2.15.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^9",
    "eslint-config-next": "15.2.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## KNOWN LIMITATIONS

1. No Backend: All data stored in localStorage (client-side only)
2. No Sync: No multi-device or crew synchronization
3. No Auth: Simple name + crew ID (no passwords)
4. No History Export: Can't export move/remove logs to CSV
5. No Offline Indicator: Assumes always online

---

## DEPLOYMENT

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Manual Build
```bash
npm install
npm run build
npm start
```

---

## TESTING CHECKLIST

### Core Workflows
- Landing page → Enter name + crew ID → Tracks list
- Tap track → See cars → Tap car to confirm/unconfirm
- Add car → Enter car number + type → Appears in list
- Import cars → Paste CN list → Review preview → Add
- Reorder → Tap track → Drag cars to reorder → Confirm
- Settings → Change app name, shift times, manage tracks

### Mobile Testing
- iOS Safari: Safe area insets working
- Android Chrome: Touch targets responsive
- Gloves: Can tap all buttons easily
- Portrait/landscape: Layout adapts
- Bottom nav: Always tappable, never blocked

### Data Integrity
- Duplicate car detection working
- Car IDs normalize correctly (TBOX 663566)
- Shift expiration forces re-login
- Profile history suggests recent users

---

## SUPPORT

**Issues/Questions:**
- Check diagnostics: Settings → View Debug Logs
- Clear data: Settings → Clear Local Data
- Review this export for code reference

**Tech Stack:**
- Next.js 15.2 (Pages Router)
- React 18.3
- TypeScript 5
- Tailwind CSS 3.4
- shadcn/ui components
- lucide-react icons

---

**END OF EXPORT**
Generated: 2025-12-16 01:51:00 UTC
Total Files: 50+ files (core files shown above)