import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import type { Track } from "@/types";

export default function ManageTracks() {
  const { tracks, saveTracks } = useApp();
  const router = useRouter();
  
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTrackCode, setNewTrackCode] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [validation, setValidation] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setLocalTracks(tracks.map(t => ({ ...t })));
    }
  }, [mounted, tracks]);

  if (!mounted) {
    return null;
  }

  const handleDisplayNameChange = (trackId: string, newDisplayName: string) => {
    setLocalTracks(prev => prev.map(track =>
      track.id === trackId
        ? { ...track, displayName: newDisplayName }
        : track
    ));
    setHasChanges(true);
  };

  const handleToggleEnabled = (trackId: string) => {
    setLocalTracks(prev => prev.map(track =>
      track.id === trackId
        ? { ...track, enabled: !track.enabled }
        : track
    ));
    setHasChanges(true);
  };

  const validateTrackCode = (code: string): boolean => {
    const pattern = /^AS\d+$/;
    return pattern.test(code.toUpperCase());
  };

  const handleAddTrack = () => {
    const normalizedCode = newTrackCode.toUpperCase();
    
    if (!validateTrackCode(normalizedCode)) {
      setValidation("Track code must be format AS## (example: AS50)");
      return;
    }

    if (localTracks.some(t => t.name === normalizedCode)) {
      setValidation("Track code already exists");
      return;
    }

    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: normalizedCode,
      displayName: newDisplayName.trim() || undefined,
      cars: [],
      enabled: true,
    };

    setLocalTracks(prev => [...prev, newTrack]);
    setHasChanges(true);
    setShowAddForm(false);
    setNewTrackCode("");
    setNewDisplayName("");
    setValidation("");
  };

  const handleSaveChanges = () => {
    saveTracks(localTracks);
    setHasChanges(false);
    setValidation("Changes saved successfully");
    setTimeout(() => {
      router.push("/settings");
    }, 1000);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("Discard unsaved changes?")) {
        router.push("/settings");
      }
    } else {
      router.push("/settings");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleCancel}
            className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Back to settings"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight">
            Manage Tracks
          </h1>
          <div className="w-14" />
        </div>

        {/* Helper Text */}
        <p className="text-zinc-500 text-base mb-6">
          Edits change display names only. Track IDs, cars, and history are not modified.
        </p>

        {/* Track List */}
        <div className="space-y-4 mb-6">
          {localTracks.map(track => (
            <div
              key={track.id}
              className="bg-zinc-800 p-5 rounded-xl border border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-zinc-500 text-sm mb-1">
                    Track Code
                  </label>
                  <div className="text-xl font-mono font-semibold mb-4">
                    {track.name}
                  </div>

                  <label className="block text-zinc-400 text-sm mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={track.displayName || ""}
                    onChange={(e) => handleDisplayNameChange(track.id, e.target.value)}
                    placeholder="North Storage, Tank Line, etc."
                    className="w-full bg-zinc-900 text-white text-base px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div className="flex-shrink-0">
                  <label className="block text-zinc-500 text-sm mb-3">
                    Enabled
                  </label>
                  <button
                    onClick={() => handleToggleEnabled(track.id)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      track.enabled ? "bg-green-600" : "bg-zinc-700"
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      track.enabled ? "translate-x-5" : ""
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Track Button/Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            + Add Track
          </button>
        ) : (
          <div className="bg-zinc-800 p-5 rounded-xl border border-zinc-700">
            <h3 className="text-lg font-bold mb-4">New Track</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Track Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTrackCode}
                  onChange={(e) => {
                    setNewTrackCode(e.target.value);
                    setValidation("");
                  }}
                  placeholder="AS40"
                  className="w-full bg-zinc-900 text-white text-lg font-mono px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="West Spur"
                  className="w-full bg-zinc-900 text-white text-base px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                />
              </div>

              {validation && !validation.includes("successfully") && (
                <p className="text-yellow-500 text-sm">{validation}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTrackCode("");
                    setNewDisplayName("");
                    setValidation("");
                  }}
                  className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTrack}
                  disabled={!newTrackCode.trim()}
                  className={`flex-1 py-3 rounded-lg text-base font-medium transition-colors ${
                    newTrackCode.trim()
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  Add Track
                </button>
              </div>
            </div>
          </div>
        )}

        {validation && validation.includes("successfully") && (
          <p className="mt-4 text-green-500 text-center">{validation}</p>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
              hasChanges
                ? "bg-green-600 hover:bg-green-700"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}