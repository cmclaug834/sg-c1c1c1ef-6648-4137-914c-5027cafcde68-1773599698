# Rail Yard Tracker - Complete Project Export

**Generated:** 2025-12-16 21:20:00 UTC
**Tech Stack:** Next.js 15.2 (Pages Router), TypeScript, React 18
**Version:** 2.0.0 - Enhanced Search & Shift Status

---

## PROJECT OVERVIEW

Rail Yard Tracker is a mobile-first web application designed for rail yard morning inventory checks. Built for one-handed operation with glove-friendly touch targets, it enables crews to track, confirm, and manage rail cars across multiple tracks.

### Key Features
- **Track Management:** 12 default tracks (AS28-AS48) with enable/disable control
- **Car Tracking:** Add, confirm, unconfirm, move, and remove rail cars
- **Shift Status Icons:** Visual indicators for cars checked during current shift
- **Enhanced Search:** Search both track names and car IDs with smart result ordering
- **Crew Sessions:** Name + Crew ID with automatic shift-based expiration
- **Profile Memory:** Auto-suggests recent crew profiles with history
- **Bulk Import:** Paste CN lists, auto-extract and validate car IDs
- **Car Reorder:** Tap-based sequencing for accurate track order
- **Multi-Select Mode:** Batch move and delete operations
- **Settings:** Branding customization, shift times, track management

### Data Integrity
- **Unique Car IDs:** crypto.randomUUID() with fallback to timestamp-based IDs
- **Duplicate Detection:** Prevents same car from appearing on multiple tracks
- **Automatic Data Repair:** Fixes missing/duplicate IDs on application load
- **Diagnostic System:** Debug logs for troubleshooting state issues
- **Normalized Car IDs:** Consistent format (MARK 123456) across the app

### UX Design Principles
- **Glove-Friendly:** 44px+ touch targets for cold-weather operation
- **High Contrast:** Dark theme (zinc-900) with clear visual hierarchy
- **One-Handed:** Bottom navigation, minimal scrolling required
- **Mobile-First:** Safe area insets, responsive layouts
- **Offline-Ready:** Full localStorage persistence, no backend required

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
│   │   ├── AppContext.tsx (455 lines)
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
│   │   ├── index.tsx (Landing/Login - 293 lines)
│   │   ├── tracks.tsx (Track List - 376 lines)
│   │   ├── settings.tsx (703 lines)
│   │   ├── track/
│   │   │   ├── [id].tsx (Track Detail - 1170 lines)
│   │   │   └── [id]/import.tsx (332 lines)
│   │   ├── reorder/
│   │   │   ├── index.tsx (45 lines)
│   │   │   └── [id].tsx (243 lines)
│   │   └── exceptions/
│   │       └── [id].tsx (264 lines)
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

## CORE TYPE DEFINITIONS

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

## KEY FEATURES DETAILED

### 1. Enhanced Search System

**Location:** `/tracks` (Morning Yard Check page)

**Capabilities:**
- Searches both track names and car IDs simultaneously
- Uses `normalizeCarId()` for accurate car number matching
- Smart result ordering based on query type

**Search Logic:**
```typescript
const hasDigits = /\d/.test(searchQuery);

matchingTracks = tracks.filter(track =>
  track.enabled !== false && 
  track.name.toLowerCase().includes(searchLower)
);

matchingCars = tracks.flatMap(track =>
  track.cars
    .filter(car => normalizeCarId(car.carNumber).toLowerCase().includes(searchLower))
    .map(car => ({ car, track }))
);

showCarsFirst = hasDigits && matchingCars.length > 0;
```

**Result Display:**
- **Track Results:** Track name, car count, progress, last checked time
- **Car Results:** Car number (large), track location, car type, status
- **Result Ordering:** Cars first if query has digits, tracks first otherwise

**Navigation:**
- Tap track → Opens track detail page
- Tap car → Opens that car's track detail page

**Examples:**
- Search "AS28" → Shows AS28 track
- Search "TBOX 663566" → Shows car with track location
- Search "663566" → Shows matching cars first
- Search "BOX" → Shows tracks first, then any cars with BOX in number

### 2. Shift Status Icon System

**Location:** `/track/[id]` (Track Detail page)

**Purpose:** Visually distinguish cars checked during current shift vs previous shifts

**Icons:**
- **BadgeCheck (green):** Car checked this shift
- **CircleDashed (grey):** Car not checked this shift
- **AlertTriangle (yellow):** Car marked missing

**Logic:**
```typescript
isCheckedThisShift(car):
  if car.status !== "confirmed": return false
  if !car.confirmedAt: return false
  if !track.lastCheckClearedAt: return true
  return new Date(car.confirmedAt) > new Date(track.lastCheckClearedAt)
```

**Visual Layout:**
```
[Shift Icon] [Checkbox] [Car Details]
   ✅          ✓         TBOX 663566
                        BOX
                        Confirmed 2h ago by CREW-001
```

**Legend:** Displayed below progress bar
```
[✅ green] Checked this shift  [⭕ grey] Not checked  [⚠️ yellow] Missing
```

**Filter Integration:**
- "Unconfirmed only" toggle filters by `!isCheckedThisShift(car)`
- Shows only cars that need attention this shift
- More accurate than simple status filtering

**Workflow:**
1. Morning: All cars show CircleDashed (not checked)
2. Confirmation: Checkbox turns green, shift icon stays grey
3. Done: lastCheckClearedAt updates, confirmed cars → BadgeCheck
4. Next visit: BadgeCheck cars are already done, focus on CircleDashed

### 3. Multi-Select Mode

**Location:** `/track/[id]` (Track Detail page)

**Activation:** Tap "Select" button in header (next to "Unconfirmed only")

**Features:**
- Select multiple cars with tap
- Batch move to another track
- Batch delete from track
- Selection count displayed in button

**UI Changes in Selection Mode:**
- Checkboxes replaced with selection indicators
- Row menu (⋮) hidden
- Bottom action bar shows: Cancel | Move (N) | Delete (N)

**Batch Operations:**
- **Move:** Opens track picker, moves all selected cars
- **Delete:** Shows confirmation, removes all selected cars
- Both operations log to localStorage for history

**Exit:** Tap "Cancel" or complete batch operation

### 4. Car Import System

**Location:** `/track/[id]/import`

**Parser:** `src/lib/carImportParser.ts`

**Accepts Formats:**
- MARK123456
- MARK 123456
- MARK-123456
- Multiple cars per line
- 2-4 letter marks, 3-7 digit numbers

**Process:**
1. Paste CN list into textarea
2. Tap "Preview Import"
3. Review three sections:
   - Will Add (green)
   - Skipped - Duplicates (yellow)
   - Unrecognized Lines (red)
4. Tap car to expand and see source line
5. Tap "Add Cars" to import

**Duplicate Handling:**
- Detects cars already on any track
- Shows which track has the duplicate
- Prevents accidental duplicates

**Normalization:**
- All car IDs normalized to "MARK 123456" format
- Consistent with global `normalizeCarId()` function

### 5. Car Reorder System

**Location:** `/reorder/[id]`

**Interface:**
- **Left Panel:** Current order (tap to move right)
- **Right Panel:** New order (tap X to remove)
- **Bottom:** Reset | Cancel | Confirm

**Workflow:**
1. Navigate to Reorder → Select Track
2. Tap cars in left panel to add to right panel
3. Right panel builds new order sequentially
4. Tap X on right panel to move car back to left
5. Tap "Confirm order" to save

**Data Handling:**
- Final order = right panel + remaining left panel
- Safety net prevents lost cars
- Logs order update with timestamp and crew ID

**Use Cases:**
- Reflecting physical track order
- Prioritizing specific cars
- Organizing by type or destination

### 6. Crew Session Management

**Location:** `/` (Landing page)

**Features:**
- Name + Crew ID entry
- Profile history with auto-suggestions
- Shift-based session expiration
- Manual logout via Settings

**Session Logic:**
```typescript
computeNextShiftChange(shiftA, shiftB):
  - Finds next upcoming shift time
  - Returns ISO timestamp for expiration
  - Uses configurable shift times from settings

isSessionValid():
  - Checks if active crew exists
  - Verifies current time < expiration
  - Returns true/false
```

**Session Flow:**
1. User enters name + crew ID
2. Profile saved/updated in localStorage
3. Session expiration calculated based on next shift
4. Session stored with expiration timestamp
5. On return: Check validity → Auto-login or re-prompt

**Profile Storage:**
- Keeps last 10 profiles
- Sorted by most recently used
- Shows last used timestamp
- Dropdown suggestions for quick selection

### 7. Diagnostic System

**Location:** Settings → View Debug Logs

**Purpose:** Troubleshoot state inconsistencies and track operations

**Logged Events:**
- CONFIRM_CAR
- UNCONFIRM_CAR
- DONE_COMMIT_START
- DONE_AFTER_CONFIRMATIONS
- DONE_AFTER_UNCONFIRMATIONS
- DONE_COMMIT_END
- TOGGLE_CONFIRM_BEFORE
- TOGGLE_CONFIRM_AFTER
- BATCH_DELETE_COMPLETE
- REMOVE_CAR_COMPLETE

**Log Contents:**
```typescript
{
  timestamp: ISO string
  action: string
  diagnostic: {
    trackId: string
    trackName: string
    carsLength: number
    computedConfirmedCars: number
  }
  pendingConfirmations: number
  pendingUnconfirmations: number
}
```

**Features:**
- Last 100 logs kept in localStorage
- View in modal with formatted display
- Copy to clipboard for sharing
- Clear logs button

**Use Cases:**
- Debugging count mismatches
- Verifying operation sequences
- Tracking user actions
- Support troubleshooting

---

## STORAGE ARCHITECTURE

### LocalStorage Keys

```typescript
STORAGE_KEYS = {
  TRACKS: "rail_yard_tracks"
  USER: "rail_yard_user"
  SETTINGS: "rail_yard_settings"
  APP_NAME: "rail_yard_app_name"
  SITE_NAME: "rail_yard_site_name"
  ACTIVE_CREW: "rail_yard_active_crew"
  SESSION_EXPIRES_AT: "rail_yard_session_expires_at"
  SHIFT_A: "rail_yard_shift_a"
  SHIFT_B: "rail_yard_shift_b"
  PROFILES: "rail_yard_profiles"
  DEBUG_LOGS: "rail_yard_debug_logs"
  MOVE_LOGS: "rail_yard_move_logs"
  REMOVE_LOGS: "rail_yard_remove_logs"
  ORDER_LOGS: "rail_yard_order_logs"
}
```

### Data Repair System

**Purpose:** Fix data integrity issues on application load

**Repairs:**
1. Missing car IDs → Generate unique IDs
2. Duplicate car IDs → Regenerate duplicates
3. Legacy count fields → Remove (now computed dynamically)

**Implementation:**
```typescript
repairTrackData(tracks):
  for each track:
    for each car:
      if !car.id or usedIds.has(car.id):
        Generate new unique ID
        Log repair action
        Add to usedIds
    Remove legacy totalCars/confirmedCars fields
  Return repaired tracks
```

**Logging:**
```
[DATA REPAIR] Track AS28: Fixed car TBOX 663566 - ID (missing) → car-abc123
[DATA REPAIR] Fixed 3 cars with missing/duplicate IDs
```

### Dynamic Count Computation

**Principle:** Counts are always computed from cars array, never stored

**Implementation:**
```typescript
computeTrackCounts(cars):
  return {
    totalCars: cars.length
    confirmedCars: cars.filter(c => c.status === "confirmed").length
  }

TrackWithCounts = Track & {
  totalCars: number
  confirmedCars: number
}
```

**Benefits:**
- Eliminates count drift issues
- Single source of truth (cars array)
- Automatic consistency
- Simpler state management

---

## COMPONENT ARCHITECTURE

### App Context (State Management)

**File:** `src/contexts/AppContext.tsx`

**Responsibilities:**
- Track data management
- Car operations (add, confirm, unconfirm, move, delete)
- User session management
- Settings persistence
- Track order management

**Key Functions:**

```typescript
addCar(trackId, car)
  - Generates unique car ID
  - Adds to track's cars array
  - Normalizes car number

confirmCar(trackId, carId)
  - Sets status to "confirmed"
  - Records timestamp and crew ID
  - Logs diagnostic

unconfirmCar(trackId, carId)
  - Sets status to "pending"
  - Clears timestamp and crew ID
  - Logs diagnostic

moveCar(carId, fromTrackId, toTrackId, reason)
  - Validates move (no duplicates)
  - Logs move operation
  - Updates both tracks atomically
  - Returns success boolean

commitTrackOrder(trackId, orderedCarList)
  - Replaces track car order
  - Logs order update
  - Preserves any missing cars (safety net)
```

**State Structure:**
```typescript
{
  tracks: TrackWithCounts[]
  currentUser: User | null
  settings: AppSettings
  appName: string
  siteName: string
}
```

### Bottom Navigation

**File:** `src/components/BottomNav.tsx`

**Tabs:**
1. Yard Check (ClipboardList icon)
2. Reorder (ArrowUpDown icon)
3. Settings (Settings icon)

**Active State:**
- Green background when active
- Grey background when inactive
- Icon + label for clarity

**Positioning:**
- Fixed bottom with safe area insets
- z-index: 50 (above most content)
- pointer-events: auto (always tappable)

### Car ID Formatter

**File:** `src/lib/carIdFormatter.ts`

**Format:** MARK 123456 (uppercase prefix + space + digits)

**Rules:**
1. Extract all letters → Uppercase prefix
2. Extract all digits → Number
3. Join with single space
4. Handle edge cases (no letters, no digits, empty)

**Examples:**
- "t box 663 566" → "TBOX 663566"
- "tbox663566" → "TBOX 663566"
- "TBOX-663-566" → "TBOX 663566"
- "abc123def456" → "ABCDEF 123456"

**Global Usage:**
- All car number inputs
- All car number displays
- Search matching
- Duplicate detection
- Import normalization

---

## PAGE-BY-PAGE BREAKDOWN

### Landing Page (`/`)

**Purpose:** Crew authentication and session initialization

**Features:**
- Name + Crew ID input fields
- Profile history dropdowns
- Last used timestamp display
- Session validation on mount
- Auto-navigation if session valid

**Shift Calculation:**
```typescript
computeNextShiftChange(shiftA, shiftB):
  1. Parse shift times (HH:MM format)
  2. Create Date objects for today
  3. Find next upcoming shift
  4. If all shifts passed, use first shift tomorrow
  5. Return ISO timestamp
```

**Profile Management:**
- Auto-suggests from history
- Shows unique names and crew IDs in dropdowns
- Updates last used timestamp on login
- Keeps 10 most recent profiles

**Navigation:**
- Valid session → /tracks (automatic)
- New login → Save session → /tracks
- Settings link at bottom

### Track List (`/tracks`)

**Purpose:** Overview of all tracks with search capability

**Display Sections:**

**Header:**
- Title: "Morning Yard Check"
- Current date
- Crew badge (tap to edit)

**Search Bar:**
- Placeholder: "Search tracks or cars…"
- Icon: Search (lucide)
- Filters tracks + cars in real-time

**Results:**

Default View (no search):
- All enabled tracks
- Progress: X / Y
- Last checked timestamp
- Status icon (complete/progress/pending)

Search Results:
- Section: "Matching Cars (N)"
- Section: "Matching Tracks (N)"
- Order: Cars first if query has digits
- Empty state: "No tracks or cars found"

**Track Card:**
```
AS28                           [Icon]
Cars: 12 / 15
Last checked 2h ago
```

**Car Card:**
```
[Icon] TBOX 663566
       On: AS28
       BOX • Confirmed
```

**Bottom Navigation:** Always visible

### Track Detail (`/track/[id]`)

**Purpose:** View and manage cars on a specific track

**Header:**
- Back button
- Track name (large)
- Reorder button

**Progress Box:**
- Shows: X / Y (confirmed / total)
- Pending changes indicator

**Shift Status Legend:**
```
[✅] Checked this shift  [⭕] Not checked  [⚠️] Missing
```

**Filters:**
- "Not checked only" toggle
- "Select" mode toggle

**Car List:**

Each car card shows:
- Shift status icon (left)
- Checkbox icon (middle)
- Car number (large, bold, monospace)
- Car type
- Confirmation details (if confirmed)
- Row menu (⋮) when not in select mode

**Bottom Actions:**

Normal Mode:
- Back | Import | Add + | Done

Selection Mode:
- Cancel | Move (N) | Delete (N)

**Modals:**
- Add Car Modal
- Unconfirm Confirmation Dialog
- Car Action Menu (Move, Remove)
- Move Track Picker
- Remove Confirmation Dialog
- Batch Move Modal
- Batch Delete Confirmation
- Discard Changes Dialog
- Move Toast Notifications

### Import Page (`/track/[id]/import`)

**Purpose:** Bulk import cars from CN paste data

**Layout:**

**Header:**
- Back button
- Title: "Import Cars"
- Track badge

**Instructions:**
"Paste the CN car list below. We'll extract car IDs and add only new cars."

**Input:**
- Large textarea (min 48px height)
- Placeholder with example format
- Monospace font

**Actions:**
- Preview Import (blue)
- Clear (grey)

**Preview Sections:**

1. Will Add (green)
   - Shows new cars to be added
   - Tap to expand source line
   - Normalized format displayed

2. Skipped - Already on list (yellow)
   - Shows duplicate car numbers
   - Track location displayed

3. Unrecognized Lines (red)
   - Shows lines that didn't match pattern
   - Truncated if too long

**Bottom Actions:**
- Back to Edit
- Add Cars (green, disabled if none to add)

**Success Toast:**
"Added N cars to TRACK"

### Reorder Page (`/reorder/[id]`)

**Purpose:** Reorder cars on a track

**Layout:**

**Header:**
- Back button
- Title: "Reorder Cars"
- Track badge

**Split View:**

Left Panel: "Current order"
- Shows remaining cars
- Tap to move to right panel
- Hint: "Tap to add →"
- Position indicator (#1, #2, etc.)

Right Panel: "New order"
- Shows reordered sequence
- X button to remove back to left
- Position indicator
- Empty state: "Tap cars to build new order"

**Bottom Actions:**
- Reset (restore original)
- Cancel (discard changes)
- Confirm order (save, disabled if empty)

**Workflow:**
1. Tap cars in left to build new order
2. Tap X in right to undo
3. Confirm when satisfied
4. Navigates back to track detail

### Settings Page (`/settings`)

**Purpose:** Configure app behavior and manage data

**Sections:**

**1. Branding**
- App Name input
- Site Name input
- Save Branding button

**2. Confirmations**
- "Require confirmation to unconfirm" toggle
- Help text explaining behavior

**3. Reconciliation**
- "Resolve unconfirmed cars when Done is tapped" toggle
- "Show missing cars in track list" toggle
- "Move placement" radio (append/prepend)

**4. Shift Changes**
- Shift A Time input (time picker)
- Shift B Time input (time picker)
- Save Shift Times button
- Explanation text

**5. Tracks (Admin)**
- "Admin: Manage Tracks" toggle to enable
- When enabled:
  - List all tracks with enable/disable toggles
  - Add Track input (validates AS## format)
  - Save Changes button

**6. Diagnostics**
- View Debug Logs button
- Clear Debug Logs button

**7. Data Management**
- Clear Local Data button
- Warning about irreversibility
- Confirmation dialog

**Debug Logs Modal:**
- Last 20 logs displayed
- Formatted with:
  - Action name (green)
  - Timestamp
  - Track name
  - Car counts
  - Pending changes
- Copy to Clipboard button
- Close button

**Clear Data Confirmation:**
- Title: "Clear all local data?"
- Warning text
- Cancel | Yes, Clear buttons
- Redirects to landing page after clear

---

## STYLING & DESIGN SYSTEM

### Color Palette

**Background:**
- Primary: zinc-900
- Secondary: zinc-800
- Tertiary: zinc-700

**Text:**
- Primary: white
- Secondary: zinc-400
- Tertiary: zinc-500

**Status Colors:**
- Success: green-500, green-600
- Warning: yellow-500, yellow-600
- Error: red-500, red-600
- Info: blue-500, blue-600

**Interactive:**
- Hover: zinc-700
- Active: green-600
- Disabled: zinc-700 (text: zinc-500)

### Typography

**Font Families:**
- Default: System sans-serif
- Monospace: For car numbers, crew IDs

**Sizes:**
- Hero: text-3xl, text-4xl (track names)
- Large: text-2xl, text-3xl (car numbers)
- Base: text-lg, text-xl (body)
- Small: text-sm, text-base (secondary info)
- Tiny: text-xs (timestamps, hints)

**Weights:**
- Bold: font-bold (track names, car numbers)
- Semibold: font-semibold (labels)
- Medium: font-medium (buttons)
- Normal: Default for body text

### Spacing

**Component Padding:**
- Large: p-5, p-6 (cards, modals)
- Medium: p-4 (inputs, buttons)
- Small: p-3 (compact elements)

**Component Gaps:**
- Large: gap-4, gap-6 (sections)
- Medium: gap-3 (card lists)
- Small: gap-2 (inline elements)

**Margin:**
- Section: mb-6, mb-8
- Element: mb-2, mb-3, mb-4

### Touch Targets

**Minimum Size:** 44px (WCAG AAA)

**Button Heights:**
- Primary action: py-4, py-5 (56px+)
- Secondary action: py-3, py-4 (48px+)
- Icon button: p-3 (44px+)

**Interactive Areas:**
- Car cards: p-5, p-6 (full card tappable)
- Track cards: p-5, p-6
- List items: py-4 minimum

### Iconography

**Library:** lucide-react v0.474.0

**Sizes:**
- Large: w-8 h-8 (track status)
- Medium: w-6 h-6 (navigation, car status)
- Small: w-5 h-5 (inline icons)

**Common Icons:**
- CheckCircle2: Confirmed
- Circle: Pending
- AlertTriangle: Missing/Warning
- BadgeCheck: Checked this shift
- CircleDashed: Not checked
- ArrowLeft: Back navigation
- ArrowRight: Forward action
- Plus: Add action
- Upload: Import action
- ArrowUpDown: Reorder action
- MoreVertical: Row menu
- Trash2: Delete action
- Search: Search input
- Settings: Settings tab
- ClipboardList: Yard check tab

### Responsive Design

**Breakpoints:**
- Mobile: default (< 640px)
- Tablet: md: (640px - 768px)
- Desktop: lg: (> 768px)

**Max Width:** 4xl (896px) for content containers

**Responsive Patterns:**
- Font sizes: text-base md:text-lg
- Icon sizes: w-6 md:w-7
- Spacing: gap-3 md:gap-4
- Grid columns: grid-cols-1 md:grid-cols-2

### Accessibility

**Contrast Ratios:**
- Text on zinc-900: white (21:1)
- Secondary text: zinc-400 (9:1)
- Disabled text: zinc-500 (6:1)

**Focus States:**
- Border: border-green-500
- Ring: ring-2 ring-green-500
- Outline: focus:outline-none

**ARIA Labels:**
- Icon buttons: aria-label
- Navigation tabs: aria-label
- Status indicators: aria-label

**Keyboard Navigation:**
- Tab order: logical flow
- Focus visible: high contrast borders
- Skip links: Not implemented (consider adding)

---

## CONFIGURATION FILES

### package.json

```json
{
  "name": "tracking-sheet",
  "version": "2.0.0",
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

### tailwind.config.ts

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

### next.config.mjs

```javascript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
```

---

## TESTING GUIDE

### Core User Flows

**1. Morning Yard Check Workflow**
```
Landing → Enter credentials → Track List
→ Search "AS28" → Tap AS28
→ Tap cars to confirm → Done
→ Check shift status icons → All green
```

**2. Add Car Workflow**
```
Track Detail → Tap Add +
→ Enter "TBOX 663566"
→ Select "BOX" type
→ Tap Add Car
→ Car appears in list
→ Shift icon shows CircleDashed
```

**3. Import Cars Workflow**
```
Track Detail → Tap Import
→ Paste CN list
→ Tap Preview Import
→ Review sections
→ Tap car to see source
→ Tap Add Cars
→ Success toast → Returns to track
```

**4. Search Workflow**
```
Track List → Enter "TBOX"
→ See matching cars with track locations
→ Tap car → Opens track detail
→ Car is visible in list
```

**5. Reorder Workflow**
```
Track List → Bottom Nav → Reorder
→ Select track
→ Tap cars in left panel
→ Build order in right panel
→ Tap Confirm
→ Returns to track detail
```

**6. Multi-Select Workflow**
```
Track Detail → Tap Select
→ Tap multiple cars
→ Tap Move (N)
→ Select destination track
→ Cars moved
→ Success toast
```

### Mobile Testing

**iOS Safari:**
- Safe area insets working
- Bottom nav not covered by system UI
- Touch targets responsive
- Text inputs don't zoom (font-size: 16px)

**Android Chrome:**
- Touch targets responsive
- Back button navigation
- Keyboard behavior
- Safe area handling

**Glove Testing:**
- All buttons tappable with gloves
- No accidental taps
- Clear visual feedback
- Sufficient spacing between targets

**Orientation:**
- Portrait: Primary layout
- Landscape: Optional support

### Data Integrity Testing

**Duplicate Detection:**
```
Add car "TBOX 663566" to AS28
Try to add "TBOX 663566" to AS29
→ Blocked (duplicate detected)
Try to import "TBOX 663566" to AS28
→ Skipped (already on list)
```

**Car ID Normalization:**
```
Enter "t box 663 566" → Saves as "TBOX 663566"
Enter "tbox663566" → Saves as "TBOX 663566"
Enter "TBOX-663-566" → Saves as "TBOX 663566"
Search "tbox" → Finds "TBOX 663566"
```

**Session Expiration:**
```
Login at 05:30 (before Shift A at 06:00)
→ Session expires at 06:00
Return at 06:01
→ Redirects to landing page
```

**Data Repair:**
```
Manually corrupt localStorage (missing car IDs)
Refresh page
→ Console shows repair actions
→ All cars have unique IDs
→ No functionality broken
```

### Performance Testing

**Large Track Load:**
```
Add 100 cars to a track
Open track detail
→ Should load within 1 second
Scroll through list
→ Smooth scrolling
Search for car
→ Instant results
```

**Import Performance:**
```
Paste 200-line CN list
Tap Preview Import
→ Results within 2 seconds
Tap Add Cars
→ Completes within 3 seconds
```

### Browser Compatibility

**Supported:**
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

**Features:**
- CSS Grid: Full support
- Flexbox: Full support
- CSS Custom Properties: Full support
- localStorage: Full support
- crypto.randomUUID: Fallback provided

---

## DEPLOYMENT

### Vercel (Recommended)

**One-Click Deploy:**
```bash
npm i -g vercel
vercel
```

**Environment:**
- Node.js: 18.x or 20.x
- Build Command: npm run build
- Output Directory: .next
- Install Command: npm install

**Domain Setup:**
- Custom domain supported
- Automatic HTTPS
- Edge network

### Manual Deployment

**Build:**
```bash
npm install
npm run build
```

**Start:**
```bash
npm start
```

**Environment:**
- PORT: 3000 (default)
- NODE_ENV: production

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## KNOWN LIMITATIONS

### Technical Constraints

1. **No Backend:** All data stored in localStorage (client-side only)
2. **No Sync:** No multi-device or crew synchronization
3. **No Real Auth:** Simple name + crew ID (no passwords or security)
4. **No Offline Indicator:** Assumes always online (though works offline)
5. **No Export:** Can't export history to CSV or external format
6. **Browser Storage Limits:** localStorage typically 5-10MB per domain
7. **No Photo Capture:** No camera integration for car photos
8. **No GPS:** No location tracking or geofencing

### UX Limitations

1. **Single User:** No concurrent multi-user editing
2. **No Undo:** Actions are immediate (except discard changes dialog)
3. **No Notifications:** No reminders or alerts
4. **No Dark/Light Toggle:** Fixed dark theme
5. **Limited History:** Only diagnostic logs, no full audit trail
6. **No Analytics:** No usage statistics or insights

### Data Limitations

1. **No Backup:** Data only exists in browser localStorage
2. **No Versioning:** No track back to previous states (except basic revert)
3. **No Comments:** No notes or annotations on cars or tracks
4. **No Custom Fields:** Fixed car data structure
5. **No Relationships:** Cars independent, no coupling or consists

### Future Enhancements (Not Implemented)

1. Backend Integration (Supabase/Firebase)
2. Real-time Sync Across Devices
3. Photo Attachments for Cars
4. QR Code Scanning
5. CSV Export/Import
6. Advanced Reporting
7. Role-Based Access Control
8. Push Notifications
9. GPS Location Tracking
10. Offline Sync Queue

---

## TROUBLESHOOTING

### Common Issues

**Issue: Cars not appearing after import**
- Check browser console for errors
- Verify CN list format (2-4 letters + 3-7 digits)
- Check for duplicates in skipped section
- Run check_for_errors to validate state

**Issue: Session expires too quickly**
- Check shift times in Settings
- Verify next shift calculation logic
- Check localStorage for SESSION_EXPIRES_AT value

**Issue: Duplicate car IDs**
- Data repair runs on load
- Check console for repair messages
- View Debug Logs in Settings
- Clear local data if persistent

**Issue: Bottom nav not visible**
- Check z-index (should be 50)
- Verify pointer-events: auto
- Check safe area insets
- Test on actual device (not just browser)

**Issue: Search not finding cars**
- Verify car number normalization
- Check search query formatting
- Ensure track is enabled
- Try exact car number

### Diagnostic Tools

**View Debug Logs:**
```
Settings → View Debug Logs
→ Shows last 20 operations
→ Copy to Clipboard for sharing
```

**Check localStorage:**
```javascript
localStorage.getItem("rail_yard_tracks")
localStorage.getItem("rail_yard_debug_logs")
localStorage.getItem("rail_yard_move_logs")
```

**Console Commands:**
```javascript
JSON.parse(localStorage.getItem("rail_yard_tracks"))
Object.keys(localStorage).filter(k => k.startsWith("rail_yard"))
```

**Clear Data:**
```
Settings → Data Management → Clear Local Data
→ Confirmation dialog
→ Redirects to landing page
```

### Support Resources

**Code Reference:**
- This export document
- Inline code comments
- Type definitions in src/types/index.ts

**Debugging:**
- Browser DevTools Console
- Network tab (should be empty except initial load)
- Application tab → localStorage

**Community:**
- GitHub Issues (if applicable)
- Project documentation
- Team communication channels

---

## VERSION HISTORY

### v2.0.0 (2025-12-16)
- Added shift status icon system
- Enhanced search with car ID matching
- Added multi-select mode for batch operations
- Improved filter logic for "Unconfirmed only"
- Added shift status legend
- Updated PROJECT_EXPORT.md

### v1.0.0 (2025-12-16)
- Initial release
- Track management system
- Car add/confirm/unconfirm
- Bulk import functionality
- Car reorder system
- Crew session management
- Profile history
- Diagnostic logging
- Settings customization
- Data repair system

---

## CREDITS

**Framework:** Next.js 15.2
**UI Library:** shadcn/ui
**Icons:** lucide-react
**Styling:** Tailwind CSS 3.4
**Language:** TypeScript 5

**Design Principles:**
- Mobile-first responsive design
- Glove-friendly touch targets
- High contrast dark theme
- One-handed operation
- Minimal cognitive load

**Inspiration:**
- Industrial UI design
- Railway operations workflows
- Cold-weather usability requirements
- Real-world yard crew feedback

---

**END OF EXPORT**

Generated: 2025-12-16 21:20:00 UTC
Total Files: 50+ source files
Total Lines: 10,000+ lines of code
Document Version: 2.0.0