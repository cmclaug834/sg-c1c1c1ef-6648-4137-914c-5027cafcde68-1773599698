import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function Settings() {
  const { currentUser, setUser, settings, updateSettings, tracks, addTrack, toggleTrackEnabled, saveTracks } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [crewId, setCrewId] = useState("");
  const [requireDialog, setRequireDialog] = useState(false);
  const [resolveOnDone, setResolveOnDone] = useState(true);
  const [showMissingInList, setShowMissingInList] = useState(false);
  const [movePlacement, setMovePlacement] = useState<"append" | "prepend">("append");
  const [adminManageTracks, setAdminManageTracks] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newTrackInput, setNewTrackInput] = useState("");
  const [trackValidation, setTrackValidation] = useState("");
  const [localTracks, setLocalTracks] = useState<typeof tracks>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && currentUser) {
      setName(currentUser.name);
      setCrewId(currentUser.crewId);
    }
    if (mounted) {
      setRequireDialog(settings.requireUnconfirmDialog);
      setResolveOnDone(settings.resolveOnDone ?? true);
      setShowMissingInList(settings.showMissingInList ?? false);
      setMovePlacement(settings.movePlacement ?? "append");
      setAdminManageTracks(settings.adminManageTracks ?? false);
      setLocalTracks(tracks);
    }
  }, [mounted, currentUser, settings, tracks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && crewId.trim()) {
      setUser({
        id: currentUser?.id || `user-${Date.now()}`,
        name: name.trim(),
        crewId: crewId.trim(),
      });
      router.push("/");
    }
  };

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

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {currentUser && (
            <button
              onClick={() => router.push("/")}
              className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Back to track list"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
          )}
          {/* D.headerTitle */}
          <h1 id="D.headerTitle" className="text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <div className="w-14" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-zinc-400 mb-2 text-lg">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 text-white text-xl px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-2 text-lg">Crew ID</label>
              <input
                type="text"
                value={crewId}
                onChange={(e) => setCrewId(e.target.value)}
                className="w-full bg-zinc-800 text-white text-xl font-mono px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                placeholder="CREW-001"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-medium transition-colors"
          >
            Save Settings
          </button>
        </form>

        {/* D.sectionConfirmations */}
        <div id="D.sectionConfirmations" className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Confirmations</h2>

          {/* D.unconfirmDialogToggle */}
          <button
            id="D.unconfirmDialogToggle"
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
            
            {/* D.unconfirmHelpText */}
            <p id="D.unconfirmHelpText" className="text-sm text-zinc-500">
              When enabled, you'll be asked to confirm before unmarking a car as unconfirmed
            </p>
          </button>
        </div>

        {/* D.sectionReconciliation */}
        <div id="D.sectionReconciliation" className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Reconciliation</h2>

          <div className="space-y-4">
            {/* D.resolveOnDoneToggle */}
            <button
              id="D.resolveOnDoneToggle"
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
              
              {/* D.resolveHelpText */}
              <p id="D.resolveHelpText" className="text-sm text-zinc-500">
                Automatically marks remaining unconfirmed cars as resolved when you finish checking a track
              </p>
            </button>

            {/* D.showMissingInListToggle */}
            <button
              id="D.showMissingInListToggle"
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
              
              {/* D.missingHelpText */}
              <p id="D.missingHelpText" className="text-sm text-zinc-500">
                Display cars that weren't confirmed during the check in the track overview
              </p>
            </button>

            {/* D.movePlacementOption */}
            <div id="D.movePlacementOption" className="bg-zinc-800 p-5 rounded-xl">
              <div className="mb-4">
                <span className="text-lg font-medium block mb-2">When moving cars to another track:</span>
                
                {/* D.movePlacementHelpText */}
                <p id="D.movePlacementHelpText" className="text-sm text-zinc-500">
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

        {/* D.sectionTracks */}
        <div id="D.sectionTracks" className="mt-12 pt-8 border-t border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">Tracks</h2>

          {/* D.adminManageTracksToggle */}
          <button
            id="D.adminManageTracksToggle"
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

          {/* D.manageTracksPanel */}
          {adminManageTracks && (
            <div id="D.manageTracksPanel" className="bg-zinc-800 p-5 rounded-xl space-y-4">
              {/* D.trackManageList */}
              <div id="D.trackManageList" className="space-y-3">
                {localTracks.map(track => (
                  <div key={track.id} className="D.trackManageRow flex items-center justify-between bg-zinc-900 p-4 rounded-lg">
                    {/* D.trackIdText */}
                    <span id="D.trackIdText" className="text-lg font-mono font-medium">
                      {track.name}
                    </span>

                    {/* D.trackEnabledToggle */}
                    <button
                      id="D.trackEnabledToggle"
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
                  {/* D.addTrackInput */}
                  <input
                    id="D.addTrackInput"
                    type="text"
                    value={newTrackInput}
                    onChange={(e) => {
                      setNewTrackInput(e.target.value);
                      setTrackValidation("");
                    }}
                    className="w-full bg-zinc-900 text-white text-lg font-mono px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                    placeholder="AS## (example: AS50)"
                  />
                  
                  {/* D.trackValidationText */}
                  {trackValidation && (
                    <p id="D.trackValidationText" className={`mt-2 text-sm ${
                      trackValidation.includes("successfully") ? "text-green-500" : "text-yellow-500"
                    }`}>
                      {trackValidation}
                    </p>
                  )}
                </div>

                {/* D.addTrackBtn */}
                <button
                  id="D.addTrackBtn"
                  onClick={handleAddTrack}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-base font-medium transition-colors"
                >
                  Add Track
                </button>

                {/* D.saveTrackChangesBtn */}
                <button
                  id="D.saveTrackChangesBtn"
                  onClick={handleSaveTrackChanges}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-base font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}