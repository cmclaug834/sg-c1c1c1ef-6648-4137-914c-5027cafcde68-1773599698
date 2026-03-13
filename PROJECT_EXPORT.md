# Rail Yard Tracker - Complete Project Export

**Version:** 2.0.0  
**Export Date:** March 13, 2026  
**Project Type:** Multi-Device Inspection System  
**Tech Stack:** Next.js 15 (Pages Router) + TypeScript + Tailwind CSS

---

## 📦 Package Contents

This export contains the complete Rail Yard Tracker application with:

✅ **Multi-device sync system** - Desktop server + mobile clients  
✅ **Advanced role-based access control** - Admin/Inspector/Viewer  
✅ **Automated health monitoring** - 15 system checks  
✅ **Offline-capable** - Works without internet  
✅ **Real-time sync** - 30-second periodic sync  
✅ **QR code connection** - Easy mobile setup  
✅ **Complete inspection workflow** - Fix for signature clearing bug  
✅ **Proper navigation** - Fix for back button behavior  

---

## 🚀 Quick Start (Desktop Server)

### Prerequisites

```bash
- Node.js 18+ installed
- npm or yarn package manager
- Windows/macOS/Linux desktop computer
```

### Installation Steps

```bash
# 1. Extract the package
unzip rail-yard-tracker-v2.0.0.zip
cd rail-yard-tracker

# 2. Install dependencies
npm install

# 3. Configure environment (optional)
cp .env.example .env.local
# Edit .env.local with your settings

# 4. Build the application
npm run build

# 5. Start the server
npm start

# Server will start on http://localhost:3000
# Your local IP: http://192.168.1.XXX:3000
```

### First-Time Setup

```
1. Open browser: http://localhost:3000
2. Go to Settings → Backend & System Settings
3. Click "Start Quick Setup" wizard
4. Wait for automated configuration
5. Go to Settings → Network & Server
6. Enable "Desktop Server"
7. Create user accounts for mobile devices
8. Share QR code with mobile users
```

---

## 📱 Mobile Device Setup

### Connect Mobile/Tablet

```
1. Connect to same WiFi as desktop
2. Scan QR code from desktop OR
   Type server URL: http://192.168.1.XXX:3000
3. Login with credentials from desktop admin
4. Start using the app!
```

### Mobile Users

- Inspectors can create/edit inspections
- Viewers can read-only access
- Auto-sync every 30 seconds
- Works offline, syncs when reconnected

---

## 📁 Project Structure

```
rail-yard-tracker/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui component library
│   │   ├── BottomNav.tsx
│   │   ├── OutboundConfirmDialog.tsx
│   │   ├── DuplicateCarDialog.tsx
│   │   └── ...
│   │
│   ├── contexts/         # React context providers
│   │   ├── AppContext.tsx     # Global app state
│   │   └── ThemeProvider.tsx  # Dark/light theme
│   │
│   ├── hooks/           # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/             # Core business logic
│   │   ├── storage.ts           # Track/car storage
│   │   ├── inspectionStorage.ts # Inspection CRUD
│   │   ├── auth.ts              # User authentication
│   │   ├── sync.ts              # Multi-device sync
│   │   ├── systemHealth.ts      # Health monitoring
│   │   ├── backendConfig.ts     # System configuration
│   │   └── ...
│   │
│   ├── pages/           # Next.js routes
│   │   ├── index.tsx              # Home/tracks list
│   │   ├── tracks.tsx             # All tracks view
│   │   ├── inspections.tsx        # Inspections list
│   │   ├── settings.tsx           # Settings hub
│   │   │
│   │   ├── api/                   # Backend API routes
│   │   │   ├── auth/             # Login/logout/session
│   │   │   ├── inspections/      # Inspection CRUD
│   │   │   ├── tracks/           # Track CRUD
│   │   │   ├── users/            # User management
│   │   │   └── sync/             # Sync endpoints
│   │   │
│   │   ├── track/[id]/
│   │   │   ├── index.tsx         # Track detail page
│   │   │   └── import.tsx        # Import cars
│   │   │
│   │   ├── inspection/
│   │   │   ├── new.tsx           # Start inspection
│   │   │   └── [id]/
│   │   │       ├── page/1.tsx   # Inspection step 1
│   │   │       └── page/2.tsx   # Inspection step 2
│   │   │
│   │   ├── settings/
│   │   │   ├── backend.tsx           # Backend config
│   │   │   ├── network-server.tsx    # Server setup
│   │   │   ├── system-health.tsx     # Health checks
│   │   │   ├── manage-tracks.tsx     # Track management
│   │   │   └── cn-rail-api.tsx       # API integration
│   │   │
│   │   └── inspections/
│   │       ├── admin.tsx         # Admin dashboard
│   │       └── review.tsx        # Review inspections
│   │
│   ├── styles/          # Global styles
│   │   └── globals.css
│   │
│   └── types/           # TypeScript definitions
│       ├── index.ts
│       ├── inspection.ts
│       └── auth.ts
│
├── public/              # Static assets
│   └── favicon.ico
│
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── tailwind.config.ts   # Tailwind CSS config
├── next.config.mjs      # Next.js config
└── README.md           # This file
```

---

## 🔧 Configuration Files

### .env.local (Environment Variables)

```env
# Optional: Custom port (default: 3000)
PORT=3000

# Optional: Custom host
HOST=0.0.0.0

# Optional: Node environment
NODE_ENV=production

# Optional: External database (future)
# DATABASE_URL=postgresql://...
# SUPABASE_URL=https://...
# SUPABASE_ANON_KEY=...
```

### Backend Configuration

Configured via UI: **Settings → Backend & System Settings**

```typescript
{
  storageBackend: "fileSystem" | "localStorage" | "externalDb",
  
  fileSystemPaths: {
    inspections: "C:\\RailYard\\Data\\Inspections",
    media: "C:\\RailYard\\Data\\Media",
    exports: "C:\\RailYard\\Exports"
  },
  
  offlineMode: {
    enabled: true,
    autoSync: true,
    syncInterval: 15  // minutes
  },
  
  backup: {
    enabled: true,
    location: "C:\\RailYard\\Backups",
    frequency: "weekly",
    retention: 4
  }
}
```

### Network Configuration

Configured via UI: **Settings → Network & Server**

```typescript
{
  serverEnabled: true,
  serverUrl: "http://192.168.1.100:3000",
  syncInterval: 30,  // seconds
  autoSync: true
}
```

---

## 🔐 User Roles & Permissions

### Default Admin Account

```
Username: admin
Password: admin123
Role: Admin

⚠️ Change password immediately after first login!
```

### Role Capabilities

| Feature | Admin | Inspector | Viewer |
|---------|-------|-----------|--------|
| Create Inspections | ✅ | ✅ | ❌ |
| Edit Inspections | ✅ | ✅ | ❌ |
| Delete Inspections | ✅ | ❌ | ❌ |
| View Inspections | ✅ | ✅ | ✅ |
| Manage Tracks | ✅ | ❌ | ❌ |
| Create Users | ✅ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ✅ |

---

## 📡 API Reference

### Authentication Endpoints

```
POST /api/auth/login
Body: { username: string, password: string }
Response: { user: User, session: AuthSession }

POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Response: { success: boolean }

GET /api/auth/session
Headers: { Authorization: Bearer <token> }
Response: { user: User, session: AuthSession }
```

### Inspection Endpoints

```
GET /api/inspections
Headers: { Authorization: Bearer <token> }
Response: { inspections: Inspection[] }

POST /api/inspections
Headers: { Authorization: Bearer <token> }
Body: { inspection: Inspection }
Response: { inspection: Inspection }

GET /api/inspections/[id]
Headers: { Authorization: Bearer <token> }
Response: { inspection: Inspection }

PUT /api/inspections/[id]
Headers: { Authorization: Bearer <token> }
Body: { inspection: Partial<Inspection> }
Response: { inspection: Inspection }

DELETE /api/inspections/[id]
Headers: { Authorization: Bearer <token> }
Response: { success: boolean }
```

### Track Endpoints

```
GET /api/tracks
Response: { tracks: Track[] }

POST /api/tracks
Headers: { Authorization: Bearer <token> }
Body: { track: Track }
Response: { track: Track }

GET /api/tracks/[id]
Response: { track: Track }

PUT /api/tracks/[id]
Headers: { Authorization: Bearer <token> }
Body: { track: Partial<Track> }
Response: { track: Track }

DELETE /api/tracks/[id]
Headers: { Authorization: Bearer <token> }
Response: { success: boolean }
```

### Sync Endpoints

```
GET /api/ping
Response: { success: true, timestamp: string }

POST /api/sync
Headers: { Authorization: Bearer <token> }
Body: { changes: Change[] }
Response: { success: boolean, conflicts: Change[] }

GET /api/sync/latest
Headers: { Authorization: Bearer <token> }
Query: ?since=timestamp
Response: { changes: Change[], timestamp: string }
```

---

## 🗄️ Data Structure

### Inspection Object

```typescript
interface Inspection {
  id: string;
  trackId: string;
  status: "draft" | "inProgress" | "completed";
  currentStep: 1 | 2 | 3 | 4;
  
  // Step 1: Basic Info
  site: string;
  date: string;
  house: string;
  vehicleId: string;
  
  // Step 2: Accept/Reject
  decision: "accept" | "reject" | "";
  rejectReason?: string;
  initialPhotos: string[];
  
  // Step 3: Pre-Inspection Signature
  inspectorSignatures: {
    initial?: {
      signature: string;
      timestamp: string;
      inspector: string;
    };
    final?: {
      signature: string;
      timestamp: string;
      inspector: string;
    };
  };
  
  // Step 4: Final Inspection
  finalPhotos: string[];
  loadNumber?: string;
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
}
```

### Track Object

```typescript
interface Track {
  id: string;
  name: string;
  location: string;
  cars: Car[];
  createdAt: string;
  updatedAt: string;
}

interface Car {
  id: string;
  carNumber: string;
  position: number;
  status: "pending" | "inspected" | "outbound";
  inspectionId?: string;
  notes?: string;
}
```

### User Object

```typescript
interface User {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "inspector" | "viewer";
  createdAt: string;
  lastLogin?: string;
}
```

---

## 🧪 Testing & Validation

### Run System Health Check

```
Settings → System Health & Stability → Run Health Check

Validates:
  ✅ Storage layer (4 checks)
  ✅ API layer (3 checks)
  ✅ Sync engine (2 checks)
  ✅ Auth system (3 checks)
  ✅ Data integrity (2 checks)
  ✅ UI components (1 check)
  ✅ Feature interactions (5 tests)

Total: 15 automated checks
```

### Manual Testing Checklist

```
Desktop Setup:
  ☐ Quick Setup wizard completes successfully
  ☐ Server starts on local network
  ☐ QR code generates correctly
  ☐ Admin can create user accounts

Mobile Connection:
  ☐ QR code scan connects successfully
  ☐ Login works with created credentials
  ☐ Sync status shows "Connected"
  ☐ Can view tracks from desktop

Inspection Flow:
  ☐ Create new inspection
  ☐ Fill Step 1 fields
  ☐ Sign pre-inspection signature
  ☐ Navigate to Step 2
  ☐ All Step 1 data persists (BUG FIX VERIFIED)
  ☐ Fill Step 2 fields
  ☐ Sign final signature
  ☐ Complete inspection
  ☐ Inspection syncs to other devices

Navigation:
  ☐ Back button on Step 1 shows exit confirm
  ☐ Back button on Step 2 returns to Step 1
  ☐ No unexpected signature screen (BUG FIX VERIFIED)
  ☐ Draft saves and resumes correctly

Multi-Device Sync:
  ☐ Create inspection on Mobile 1
  ☐ Wait 30 seconds
  ☐ Inspection appears on Desktop
  ☐ Inspection appears on Mobile 2
  ☐ Edit on Desktop
  ☐ Changes sync to mobile devices

Permissions:
  ☐ Admin can delete inspections
  ☐ Inspector cannot delete inspections
  ☐ Viewer cannot edit inspections
  ☐ Viewer cannot create inspections
```

---

## 🐛 Bug Fixes Included

### Bug #1: Signing Clears Previously Entered Fields ✅

**Fixed:** Inspection form now uses single source of truth with debounced auto-save.

**Verification:**
```
1. Start inspection
2. Fill multiple fields
3. Sign pre-inspection signature
4. Navigate back to Step 1
5. Verify: All fields still have data ✅
```

**Implementation:**
- Single draft object in `inspectionStorage`
- Debounced save (300ms) on field changes
- Signature updates preserve all existing fields
- No form reset on signature save

### Bug #2: Back Button Takes You to Signature ✅

**Fixed:** Wizard-based navigation with proper step management.

**Verification:**
```
1. Start inspection (Step 1)
2. Press back button
3. Verify: Shows exit confirmation ✅
4. Advance to Step 2
5. Press back button
6. Verify: Returns to Step 1 ✅
7. Never unexpectedly jumps to signature ✅
```

**Implementation:**
- `currentStep` field tracks wizard progress
- Back on Step 1 = exit confirmation
- Back on Step 2+ = previous step
- Signature as modal, not separate route
- Clean browser history (no route pollution)

---

## 🚀 Deployment Options

### Option 1: Local Desktop Server (Recommended)

```bash
# Production build
npm run build

# Start server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "rail-yard-tracker" -- start
pm2 save
pm2 startup
```

### Option 2: Desktop App (Electron)

```bash
# Install Electron
npm install --save-dev electron electron-builder

# Add scripts to package.json:
"electron": "electron .",
"electron:build": "electron-builder"

# Build desktop app
npm run electron:build
```

### Option 3: Cloud Server

```bash
# Deploy to any Node.js hosting:
- Vercel (recommended for Next.js)
- Railway
- Render
- DigitalOcean
- AWS/Azure/GCP

# Build command: npm run build
# Start command: npm start
# Port: 3000 (or PORT env var)
```

---

## 📦 Dependencies

### Core Framework
```json
"next": "^15.2.0",
"react": "^18.3.0",
"react-dom": "^18.3.0",
"typescript": "^5.0.0"
```

### UI & Styling
```json
"tailwindcss": "^3.4.0",
"@radix-ui/react-*": "Various versions",
"lucide-react": "^0.474.0",
"class-variance-authority": "^0.7.1",
"clsx": "^2.1.1",
"tailwind-merge": "^2.6.0"
```

### Forms & Validation
```json
"react-hook-form": "^7.54.2",
"zod": "^3.24.1",
"@hookform/resolvers": "^3.9.1"
```

### Animation
```json
"framer-motion": "^11.15.0"
```

### Utilities
```json
"date-fns": "^4.1.0",
"react-signature-canvas": "^1.0.6"
```

---

## 🔄 Update Process

### Check for Updates

```bash
# Check for outdated packages
npm outdated

# Update all packages to latest
npm update

# Or update specific package
npm install package-name@latest
```

### After Updates

```
1. Run health check: Settings → System Health
2. Verify all 15 checks pass
3. Test multi-device sync
4. Test inspection workflow
5. Export health report for records
```

---

## 🆘 Troubleshooting

### Server Won't Start

```
Error: Port 3000 already in use

Solution:
1. Find process using port 3000:
   Windows: netstat -ano | findstr :3000
   Mac/Linux: lsof -i :3000
   
2. Kill the process or use different port:
   PORT=3001 npm start
```

### Mobile Can't Connect

```
Error: Cannot reach server

Solutions:
1. Ensure mobile on same WiFi as desktop
2. Check desktop firewall settings
3. Verify server is running
4. Test connection: Settings → Network & Server → Test
5. Try using IP instead of hostname
```

### Sync Not Working

```
Error: Sync stuck or failing

Solutions:
1. Check network connection
2. Run health check: Settings → System Health
3. Manual sync: Settings → Network & Server → Sync Now
4. Check server logs for errors
5. Restart server if needed
```

### Data Not Persisting

```
Error: Changes don't save

Solutions:
1. Check localStorage availability
2. Run health check: Settings → System Health
3. Verify storage configuration: Settings → Backend
4. Check browser console for errors
5. Clear cache and reload
```

### Health Check Failures

```
Error: System health checks failing

Solutions:
1. Review detailed error messages
2. Fix reported issues one by one
3. Re-run health check after each fix
4. Export report for documentation
5. Contact support if persistent
```

---

## 📞 Support

### Documentation

- Full documentation: This README file
- API Reference: See "API Reference" section above
- Configuration Guide: See "Configuration Files" section

### Community

- GitHub Issues: [Report bugs or request features]
- Discussions: [Ask questions and share ideas]

### Professional Support

For enterprise support, custom features, or deployment assistance:
- Email: support@softgen.ai
- Priority support available for business licenses

---

## 📄 License

Copyright © 2026 Rail Yard Tracker

All rights reserved. This software is proprietary.

---

## 🎉 Thank You!

Thank you for using Rail Yard Tracker. We hope this system makes your rail yard inspection process more efficient and reliable.

**Key Features Summary:**
✅ Multi-device sync (Desktop + Mobile)
✅ Role-based access control
✅ Offline-capable inspection forms
✅ Automated health monitoring
✅ QR code easy setup
✅ Bug fixes for signature/navigation

**Version:** 2.0.0  
**Last Updated:** March 13, 2026  
**Built with:** Next.js, TypeScript, Tailwind CSS

---

## 🚀 Quick Reference Commands

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start            # Start production server

# Maintenance
npm run lint         # Check code quality
npm run type-check   # TypeScript validation

# Process Management (PM2)
pm2 start npm --name rail-yard -- start
pm2 stop rail-yard
pm2 restart rail-yard
pm2 logs rail-yard
pm2 monit
```

---

**Ready to Deploy!** Follow the "Quick Start" section above to get started.