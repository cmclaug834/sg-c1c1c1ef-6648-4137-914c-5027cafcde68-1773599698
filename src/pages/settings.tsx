import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { 
  ArrowLeft, 
  User as UserIcon, 
  Building2, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Settings2, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Database, 
  Mail,
  Server as ServerIcon,
  Activity,
  Wrench,
  Network,
  Shield,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import { getDebugLogs, clearDebugLogs, copyLogsToClipboard } from "@/lib/diagnostics";
import type { DebugLogEntry } from "@/lib/diagnostics";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const { currentUser, settings, updateSettings, tracks, addTrack, saveTracks, appName, siteName, updateBranding, setCurrentUser } = useApp();
  const router = useRouter();
  const [requireDialog, setRequireDialog] = useState(false);
  const [resolveOnDone, setResolveOnDone] = useState(true);
  const [showMissingInList, setShowMissingInList] = useState(false);
  const [movePlacement, setMovePlacement] = useState<"append" | "prepend">("append");
  const [adminManageTracks, setAdminManageTracks] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newTrackInput, setNewTrackInput] = useState("");
  const [trackValidation, setTrackValidation] = useState("");
  const [localTracks, setLocalTracks] = useState<typeof tracks>([]);

  const [localAppName, setLocalAppName] = useState("");
  const [localSiteName, setLocalSiteName] = useState("");

  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [clearDataToast, setClearDataToast] = useState<string | null>(null);

  const [shiftChangeA, setShiftChangeA] = useState("06:00");
  const [shiftChangeB, setShiftChangeB] = useState("18:00");

  const [localCrewName, setLocalCrewName] = useState("");
  const [localCrewId, setLocalCrewId] = useState("");
  const [crewValidation, setCrewValidation] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setRequireDialog(settings.requireUnconfirmDialog);
      setResolveOnDone(settings.resolveOnDone ?? true);
      setShowMissingInList(settings.showMissingInList ?? false);
      setMovePlacement(settings.movePlacement ?? "append");
      setAdminManageTracks(settings.adminManageTracks ?? false);
      setLocalTracks(tracks);
      setLocalAppName(appName);
      setLocalSiteName(siteName);
      setShiftChangeA(settings.shiftChangeA ?? "06:00");
      setShiftChangeB(settings.shiftChangeB ?? "18:00");
      setLocalCrewName(currentUser?.crewName ?? "");
      setLocalCrewId(currentUser?.crewId ?? "");
    }
  }, [mounted, settings, tracks, appName, siteName, currentUser]);

  const handleToggleDialog = () => {
    const newValue = !requireDialog;
    setRequireDialog(newValue);
    updateSettings({ 
      ...settings,
      requireUnconfirmDialog: newValue 
    });
  };

  const handleToggleResolveOnDone = () => {
    const newValue = !resolveOnDone;
    setResolveOnDone(newValue);
    updateSettings({
      ...settings,
      resolveOnDone: newValue
    });
  };

  const handleToggleShowMissing = () => {
    const newValue = !showMissingInList;
    setShowMissingInList(newValue);
    updateSettings({
      ...settings,
      showMissingInList: newValue
    });
  };

  const handleMovePlacementChange = (value: "append" | "prepend") => {
    setMovePlacement(value);
    updateSettings({
      ...settings,
      movePlacement: value
    });
  };

  const handleToggleAdminManageTracks = () => {
    const newValue = !adminManageTracks;
    setAdminManageTracks(newValue);
    updateSettings({
      ...settings,
      adminManageTracks: newValue
    });
  };

  const handleSaveShiftTimes = () => {
    updateSettings({
      ...settings,
      shiftChangeA,
      shiftChangeB,
    });
    setTrackValidation("Shift times saved successfully");
    setTimeout(() => setTrackValidation(""), 2000);
  };

  const validateTrackName = (input: string): boolean => {
    const pattern = /^AS\d+$/;
    return pattern.test(input.toUpperCase());
  };

  const handleAddTrack = () => {
    const normalized = newTrackInput.toUpperCase();
    
    if (!validateTrackName(normalized)) {
      setTrackValidation("Format must be AS## (example: AS50)");
      return;
    }

    if (localTracks.some(t => t.name === normalized)) {
      setTrackValidation("Track already exists");
      return;
    }

    addTrack(normalized);
    setNewTrackInput("");
    setTrackValidation("");
  };

  const handleToggleTrack = (trackId: string) => {
    setLocalTracks(prev => prev.map(track =>
      track.id === trackId
        ? { ...track, enabled: !track.enabled }
        : track
    ));
  };

  const handleSaveTrackChanges = () => {
    saveTracks(localTracks);
    setTrackValidation("Changes saved successfully");
    setTimeout(() => setTrackValidation(""), 2000);
  };

  const handleSaveBranding = () => {
    updateBranding(localAppName.trim() || "Rail Yard Tracker", localSiteName.trim() || "GFC Rail Yard");
    setTrackValidation("Branding saved successfully");
    setTimeout(() => setTrackValidation(""), 2000);
  };

  const handleViewDebugLogs = () => {
    const logs = getDebugLogs();
    setDebugLogs(logs.slice(-20).reverse());
    setShowDebugLogs(true);
  };

  const handleClearDebugLogs = () => {
    clearDebugLogs();
    setDebugLogs([]);
    setTrackValidation("Debug logs cleared");
    setTimeout(() => setTrackValidation(""), 2000);
  };

  const handleCopyDebugLogs = async () => {
    const success = await copyLogsToClipboard();
    setCopySuccess(success);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleClearLocalData = () => {
    // Clear all localStorage keys used by the app
    const keysToRemove = [
      "rail_yard_tracks",
      "rail_yard_user",
      "rail_yard_settings",
      "rail_yard_app_name",
      "rail_yard_site_name",
      "rail_yard_profiles",
      "rail_yard_debug_logs",
      "rail_yard_move_logs",
      "rail_yard_remove_logs",
      "rail_yard_order_logs",
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Close dialog
    setShowClearDataDialog(false);

    // Show success toast
    setClearDataToast("Local data cleared");

    // Navigate to Front Page after short delay
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  const handleSaveCrew = () => {
    if (!localCrewName.trim() || !localCrewId.trim()) {
      setCrewValidation("Both crew name and ID are required");
      return;
    }

    const updatedUser: User = {
      crewName: localCrewName.trim(),
      crewId: localCrewId.trim(),
      timestamp: new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    setCrewValidation("Crew information saved successfully");
    setTimeout(() => setCrewValidation(""), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-safe-bottom-nav">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {currentUser && (
            <button
              onClick={() => router.push("/tracks")}
              className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Back to track list"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <div className="w-14" />
        </div>

        {/* ADVANCED SETTINGS - Navigational Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Advanced Settings</h2>
          
          <div className="space-y-3">
            {/* Manage Tracks */}
            <button
              onClick={() => router.push("/settings/manage-tracks")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                  <MapPin className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-medium mb-1">Manage Tracks</div>
                  <p className="text-sm text-zinc-500">
                    Rename track display names, add or disable tracks
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>

            {/* Backend & System */}
            <button
              onClick={() => router.push("/settings/backend")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600/10 rounded-lg group-hover:bg-purple-600/20 transition-colors">
                  <Database className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-medium mb-1">Backend & System</div>
                  <p className="text-sm text-zinc-500">
                    Configure backend services, database, and storage
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>

            {/* Network & Server */}
            <button
              onClick={() => router.push("/settings/network-server")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600/10 rounded-lg group-hover:bg-green-600/20 transition-colors">
                  <Network className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-medium mb-1">Network & Server</div>
                  <p className="text-sm text-zinc-500">
                    Multi-device sync, user management, server settings
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>

            {/* System Health */}
            <button
              onClick={() => router.push("/settings/system-health")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-600/10 rounded-lg group-hover:bg-red-600/20 transition-colors">
                  <Activity className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <div className="text-lg font-medium mb-1">System Health & Stability</div>
                  <p className="text-sm text-zinc-500">
                    Diagnostics, health checks, performance monitoring
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>

            {/* CN Rail API */}
            <button
              onClick={() => router.push("/settings/cn-rail-api")}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-600/10 rounded-lg group-hover:bg-orange-600/20 transition-colors">
                  <Wrench className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <div className="text-lg font-medium mb-1">CN Rail API Integration</div>
                  <p className="text-sm text-zinc-500">
                    Configure CN Rail API, car import, and data sync
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>

            {/* Downloads & Exports */}
            <button
              onClick={() => router.push("/downloads")}
              className="flex items-center gap-4 p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700 text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-600/10 group-hover:bg-indigo-600/20 flex items-center justify-center transition-colors">
                <Download className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold group-hover:text-white transition-colors">Downloads & Exports</div>
                <span className="text-xs text-zinc-400 mt-1">Export inspection data, reports, and backups</span>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>
          </div>
        </div>

        {/* Crew Information */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Crew Information</h2>

          <div className="bg-zinc-800 p-5 rounded-xl space-y-4">
            <div>
              <label className="block text-zinc-400 mb-2 text-base">Crew Name</label>
              <input
                type="text"
                value={localCrewName}
                onChange={(e) => {
                  setLocalCrewName(e.target.value);
                  setCrewValidation("");
                }}
                className="w-full bg-zinc-900 text-white text-lg px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                placeholder="Enter crew name"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-2 text-base">Crew ID</label>
              <input
                type="text"
                value={localCrewId}
                onChange={(e) => {
                  setLocalCrewId(e.target.value);
                  setCrewValidation("");
                }}
                className="w-full bg-zinc-900 text-white text-lg px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none font-mono"
                placeholder="Enter crew ID"
              />
            </div>

            {crewValidation && (
              <p className={`text-sm ${
                crewValidation.includes("successfully") ? "text-green-500" : "text-yellow-500"
              }`}>
                {crewValidation}
              </p>
            )}

            <button
              onClick={handleSaveCrew}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-base font-medium transition-colors"
            >
              Save Crew Information
            </button>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Branding</h2>

          <div className="bg-zinc-800 p-5 rounded-xl space-y-4">
            <div>
              <label className="block text-zinc-400 mb-2 text-base">App Name</label>
              <input
                type="text"
                value={localAppName}
                onChange={(e) => setLocalAppName(e.target.value)}
                className="w-full bg-zinc-900 text-white text-lg px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                placeholder="Rail Yard Tracker"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-2 text-base">Site Name</label>
              <input
                type="text"
                value={localSiteName}
                onChange={(e) => setLocalSiteName(e.target.value)}
                className="w-full bg-zinc-900 text-white text-lg px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                placeholder="GFC Rail Yard"
              />
            </div>

            <button
              onClick={handleSaveBranding}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-base font-medium transition-colors"
            >
              Save Branding
            </button>
          </div>
        </div>

        {/* Confirmations */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Confirmations</h2>

          <button
            onClick={handleToggleDialog}
            className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">Require confirmation to unconfirm</span>
              <div className={`w-12 h-7 rounded-full transition-colors relative ${
                requireDialog ? "bg-green-600" : "bg-zinc-700"
              }`}>
                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  requireDialog ? "translate-x-5" : ""
                }`} />
              </div>
            </div>
            
            <p className="text-sm text-zinc-500">
              When enabled, you'll be asked to confirm before unmarking a car as unconfirmed
            </p>
          </button>
        </div>

        {/* Reconciliation */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Reconciliation</h2>

          <div className="space-y-4">
            <button
              onClick={handleToggleResolveOnDone}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-medium">Resolve unconfirmed cars when Done is tapped</span>
                <div className={`w-12 h-7 rounded-full transition-colors relative ${
                  resolveOnDone ? "bg-green-600" : "bg-zinc-700"
                }`}>
                  <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    resolveOnDone ? "translate-x-5" : ""
                  }`} />
                </div>
              </div>
              
              <p className="text-sm text-zinc-500">
                Automatically marks remaining unconfirmed cars as resolved when you finish checking a track
              </p>
            </button>

            <button
              onClick={handleToggleShowMissing}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-medium">Show missing cars in the track list after completing a check</span>
                <div className={`w-12 h-7 rounded-full transition-colors relative ${
                  showMissingInList ? "bg-green-600" : "bg-zinc-700"
                }`}>
                  <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    showMissingInList ? "translate-x-5" : ""
                  }`} />
                </div>
              </div>
              
              <p className="text-sm text-zinc-500">
                Display cars that weren't confirmed during the check in the track overview
              </p>
            </button>

            <div className="bg-zinc-800 p-5 rounded-xl">
              <div className="mb-4">
                <span className="text-lg font-medium block mb-2">When moving cars to another track:</span>
                
                <p className="text-sm text-zinc-500">
                  Choose where moved cars appear in the destination track's list
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleMovePlacementChange("append")}
                  className={`flex-1 py-4 rounded-lg text-base font-medium transition-colors ${
                    movePlacement === "append"
                      ? "bg-green-600 text-white"
                      : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                  }`}
                >
                  Append to bottom
                </button>
                <button
                  type="button"
                  onClick={() => handleMovePlacementChange("prepend")}
                  className={`flex-1 py-4 rounded-lg text-base font-medium transition-colors ${
                    movePlacement === "prepend"
                      ? "bg-green-600 text-white"
                      : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                  }`}
                >
                  Insert at top
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Shift Changes */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Shift Changes</h2>

          <div className="bg-zinc-800 p-5 rounded-xl space-y-4">
            <p className="text-zinc-400 text-base mb-4">
              Set the times when crew sessions expire and require re-confirmation at the landing page.
            </p>

            <div>
              <label className="block text-zinc-400 mb-2 text-base">Shift A Time</label>
              <input
                type="time"
                value={shiftChangeA}
                onChange={(e) => setShiftChangeA(e.target.value)}
                className="w-full bg-zinc-900 text-white text-lg px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-2 text-base">Shift B Time</label>
              <input
                type="time"
                value={shiftChangeB}
                onChange={(e) => setShiftChangeB(e.target.value)}
                className="w-full bg-zinc-900 text-white text-lg px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none font-mono"
              />
            </div>

            <button
              onClick={handleSaveShiftTimes}
              className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-base font-medium transition-colors"
            >
              Save Shift Times
            </button>
          </div>
        </div>

        {/* Tracks Management Toggle */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Quick Track Management</h2>

          <button
            onClick={handleToggleAdminManageTracks}
            className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors mb-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">Admin: Manage Tracks</span>
              <div className={`w-12 h-7 rounded-full transition-colors relative ${
                adminManageTracks ? "bg-green-600" : "bg-zinc-700"
              }`}>
                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  adminManageTracks ? "translate-x-5" : ""
                }`} />
              </div>
            </div>
            
            <p className="text-sm text-zinc-500">
              Enable to add new tracks or disable existing ones
            </p>
          </button>

          {adminManageTracks && (
            <div className="bg-zinc-800 p-5 rounded-xl space-y-4">
              <div className="space-y-3">
                {localTracks.map(track => (
                  <div key={track.id} className="flex items-center justify-between bg-zinc-900 p-4 rounded-lg">
                    <span className="text-lg font-mono font-medium">
                      {track.name}
                    </span>

                    <button
                      onClick={() => handleToggleTrack(track.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        track.enabled
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-zinc-700 hover:bg-zinc-600 text-zinc-400"
                      }`}
                    >
                      {track.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-700 space-y-3">
                <div>
                  <label className="block text-zinc-400 mb-2 text-sm">Add New Track</label>
                  <input
                    type="text"
                    value={newTrackInput}
                    onChange={(e) => {
                      setNewTrackInput(e.target.value);
                      setTrackValidation("");
                    }}
                    className="w-full bg-zinc-900 text-white text-lg font-mono px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                    placeholder="AS## (example: AS50)"
                  />
                  
                  {trackValidation && (
                    <p className={`mt-2 text-sm ${
                      trackValidation.includes("successfully") ? "text-green-500" : "text-yellow-500"
                    }`}>
                      {trackValidation}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleAddTrack}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-base font-medium transition-colors"
                >
                  Add Track
                </button>

                <button
                  onClick={handleSaveTrackChanges}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-base font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Diagnostics */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Diagnostics</h2>

          <button
            onClick={handleViewDebugLogs}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            View Debug Logs
          </button>

          <button
            onClick={handleClearDebugLogs}
            className="w-full mt-3 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
          >
            Clear Debug Logs
          </button>
        </div>

        {/* Data Management */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Data Management</h2>

          <div className="bg-zinc-800 p-5 rounded-xl">
            <p className="text-zinc-400 text-base mb-4">
              Clear all local data stored on this device. This includes tracks, crew profiles, settings, and history.
            </p>

            <button
              onClick={() => setShowClearDataDialog(true)}
              className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
            >
              Clear Local Data
            </button>
          </div>
        </div>
      </div>

      {/* Debug Logs Modal */}
      {showDebugLogs && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-4xl border border-zinc-800 p-6 my-8 max-h-[90vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold mb-4">Debug Logs (Last 20)</h2>

            <div className="flex-1 overflow-y-auto mb-6 space-y-4">
              {debugLogs.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No debug logs yet</p>
              ) : (
                debugLogs.map((log, idx) => {
                  const { diagnostic } = log;

                  return (
                    <div
                      key={idx}
                      className="bg-zinc-800 p-4 rounded-lg border-2 border-zinc-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-lg font-bold text-green-400 mb-1">
                            {log.action}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Track:</span>
                          <span className="font-mono font-semibold">{diagnostic.trackName}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-zinc-400">Total Cars:</span>
                          <span className="font-mono">{diagnostic.carsLength}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-zinc-400">Confirmed:</span>
                          <span className="font-mono">{diagnostic.computedConfirmedCars}</span>
                        </div>

                        {(log.pendingConfirmations > 0 || log.pendingUnconfirmations > 0) && (
                          <div className="flex justify-between text-yellow-400">
                            <span>Pending:</span>
                            <span className="font-mono">
                              +{log.pendingConfirmations} / -{log.pendingUnconfirmations}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDebugLogs(false)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Close
              </button>

              <button
                onClick={handleCopyDebugLogs}
                className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
                  copySuccess
                    ? "bg-green-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {copySuccess ? "✓ Copied!" : "Copy to Clipboard"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Local Data Confirmation Dialog */}
      {showClearDataDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-4">Clear all local data?</h2>

            <p className="text-zinc-400 text-lg mb-2">
              This will erase saved tracks, crew profiles, settings, and history from this device.
            </p>
            
            <p className="text-red-400 text-base mb-6 font-semibold">
              This cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearDataDialog(false)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleClearLocalData}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Success Toast */}
      {clearDataToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-4 rounded-lg shadow-lg z-50 border border-zinc-700">
          <p className="text-base md:text-lg font-medium">{clearDataToast}</p>
        </div>
      )}
    </div>
  );
}