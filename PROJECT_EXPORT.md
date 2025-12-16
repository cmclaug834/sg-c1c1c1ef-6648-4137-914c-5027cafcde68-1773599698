# Rail Yard Tracker - Complete Project Export
**Generated:** 2025-12-16
**Tech Stack:** Next.js 15.2 (Pages Router), TypeScript, Tailwind CSS v3, React 18

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
/**
 * GLOBAL RULE: NormalizedCarId
 * 
 * Normalizes and formats car IDs consistently throughout the application.
 * 
 * Rules:
 * - Accept any input containing letters and digits (spaces/punctuation allowed)
 * - Extract letters as prefix (A-Z only) and digits as number (0-9 only)
 * - Uppercase prefix
 * - Remove all spaces and punctuation from the number and concatenate digits
 * - Display format: PREFIX + single space + DIGITS
 * 
 * Examples:
 * - "t box 663 566" → "TBOX 663566"
 * - "tbox663566" → "TBOX 663566"
 * - "TBOX-663-566" → "TBOX 663566"
 * - "abc123def456" → "ABCDEF 123456"
 */

export function normalizeCarId(input: string): string {
  if (!input) return "";
  
  // Extract only letters (A-Z) and digits (0-9)
  const letters = input.match(/[a-zA-Z]/g) || [];
  const digits = input.match(/[0-9]/g) || [];
  
  // Uppercase prefix and join digits
  const prefix = letters.join("").toUpperCase();
  const number = digits.join("");
  
  // Return formatted: PREFIX + space + DIGITS
  if (!prefix && !number) return "";
  if (!prefix) return number;
  if (!number) return prefix;
  
  return `${prefix} ${number}`;
}

/**
 * Validates if a car ID input is valid (contains at least some letters or digits)
 */
export function isValidCarId(input: string): boolean {
  return /[a-zA-Z0-9]/.test(input);
}
```

---

### 4. BOTTOM NAVIGATION

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
          {/* NAV.tabYardCheck */}
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

          {/* NAV.tabReorder */}
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

          {/* NAV.tabSettings */}
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

### 5. REORDER PAGE (FIXED)

**File:** `src/pages/reorder/index.tsx`

```typescript
import { useRouter } from "next/router";

const MASTER_TRACK_LIST = [
  "AS28", "AS29", "AS30", "AS31", "AS32", "AS33",
  "AS34", "AS38", "AS39", "AS46", "AS47", "AS48"
];

export default function ReorderTrackSelect() {
  const router = useRouter();

  const handleTrackSelect = (trackName: string) => {
    router.push(`/reorder/${trackName}`);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* H.headerTitle */}
        <h1 id="H.headerTitle" className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Reorder
        </h1>

        {/* H.subText */}
        <p id="H.subText" className="text-zinc-400 text-base md:text-lg mb-6">
          Choose a track to reorder cars.
        </p>

        {/* H.trackList */}
        <div id="H.trackList" className="space-y-3 md:space-y-4">
          {MASTER_TRACK_LIST.map(trackName => (
            <button
              key={trackName}
              onClick={() => handleTrackSelect(trackName)}
              className="H.trackRow w-full bg-zinc-800 hover:bg-zinc-700 p-5 md:p-6 rounded-xl text-left transition-colors"
            >
              {/* H.trackName */}
              <h2 className="H.trackName text-2xl md:text-3xl font-bold font-mono">
                {trackName}
              </h2>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### 6. CONFIGURATION FILES

**File:** `package.json`

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

**File:** `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## KEY FEATURES

### ✅ Core Functionality
- **Track Management**: 12 default tracks (AS28-AS48)
- **Car Tracking**: Add/confirm/unconfirm rail cars
- **Crew Sessions**: Name + Crew ID with shift-based expiration
- **Profile Memory**: Auto-suggests recent crew profiles
- **Car Import**: Paste CN lists, auto-extract car IDs
- **Reorder**: Drag-and-drop car sequencing
- **Settings**: Branding, shifts, track management

### ✅ Data Integrity
- **Unique Car IDs**: crypto.randomUUID() with fallback
- **Duplicate Detection**: Prevents same car on multiple tracks
- **Data Repair**: Auto-fixes missing/duplicate IDs on load
- **Diagnostics**: Debug logs for troubleshooting

### ✅ UX Features
- **Glove-Friendly**: 44px+ touch targets
- **High Contrast**: Dark theme (zinc-900 background)
- **One-Handed**: Bottom navigation, minimal scrolling
- **Mobile-First**: Safe area insets, responsive design
- **Offline-Ready**: localStorage persistence

### ✅ Recent Fixes (2025-12-16)
- **✓ Fixed:** /reorder page tap blocking (added pb-24 padding)
- **✓ Fixed:** BottomNav z-index and pointer-events
- **✓ Fixed:** Safe area insets for iOS devices
- **✓ Fixed:** Unique car ID generation + data repair
- **✓ Fixed:** Track reorder functionality

---

## KNOWN LIMITATIONS

1. **No Backend**: All data stored in localStorage (client-side only)
2. **No Sync**: No multi-device or crew synchronization
3. **No Auth**: Simple name + crew ID (no passwords)
4. **No History Export**: Can't export move/remove logs to CSV
5. **No Offline Indicator**: Assumes always online

---

## DEPLOYMENT

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Build
```bash
# Install dependencies
npm install

# Build production
npm run build

# Start server
npm start
```

---

## TESTING CHECKLIST

### ✅ Core Workflows
- [ ] Landing page → Enter name + crew ID → Tracks list
- [ ] Tap track → See cars → Tap car to confirm/unconfirm
- [ ] Add car → Enter car number + type → Appears in list
- [ ] Import cars → Paste CN list → Review preview → Add
- [ ] Reorder → Tap track → Drag cars to reorder → Confirm
- [ ] Settings → Change app name, shift times, manage tracks

### ✅ Mobile Testing
- [ ] iOS Safari: Safe area insets working
- [ ] Android Chrome: Touch targets responsive
- [ ] Gloves: Can tap all buttons easily
- [ ] Portrait/landscape: Layout adapts
- [ ] Bottom nav: Always tappable, never blocked

### ✅ Data Integrity
- [ ] Duplicate car detection working
- [ ] Car IDs normalize correctly (TBOX 663566)
- [ ] Shift expiration forces re-login
- [ ] Profile history suggests recent users

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

**License:** Private project (no license specified)

---

**END OF EXPORT**
Generated: 2025-12-16 01:49:03 UTC
Total Files: 50+ files (core files shown above)
```