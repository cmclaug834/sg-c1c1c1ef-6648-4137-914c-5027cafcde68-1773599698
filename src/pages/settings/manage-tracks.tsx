import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, Trash2, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import type { Track } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ValidationError {
  trackId: string;
  field: "trackCode" | "displayName";
  message: string;
}

interface SortableTrackItemProps {
  track: Track;
  onTrackCodeChange: (trackId: string, newCode: string) => void;
  onDisplayNameChange: (trackId: string, newDisplayName: string) => void;
  onToggleEnabled: (trackId: string) => void;
  onToggleOutbound: (trackId: string) => void;
  onDelete: (track: Track) => void;
  getValidationError: (trackId: string, field: "trackCode" | "displayName") => string | null;
}

function SortableTrackItem({
  track,
  onTrackCodeChange,
  onDisplayNameChange,
  onToggleEnabled,
  onToggleOutbound,
  onDelete,
  getValidationError,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const trackCodeError = getValidationError(track.id, "trackCode");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-zinc-800 p-5 rounded-xl border border-zinc-700"
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <button
          type="button"
          className="flex-shrink-0 pt-6 text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-6 h-6" />
        </button>

        <div className="flex-1 space-y-4">
          {/* Track ID (Read-only) */}
          <div>
            <label className="block text-zinc-500 text-xs mb-1">
              Track ID
            </label>
            <div className="text-sm text-zinc-600 font-mono">
              {track.id}
            </div>
          </div>

          {/* Track Code (Editable) */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Track Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={track.name}
              onChange={(e) => onTrackCodeChange(track.id, e.target.value)}
              className={`w-full bg-zinc-900 text-white text-base font-mono px-4 py-3 rounded-lg border-2 ${
                trackCodeError 
                  ? "border-red-500 focus:border-red-500" 
                  : "border-zinc-700 focus:border-green-500"
              } focus:outline-none`}
              placeholder="AS50"
            />
            {trackCodeError && (
              <p className="mt-1 text-sm text-red-500">
                {trackCodeError}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-600">
              Changing the code updates labels only. Cars and history remain unchanged.
            </p>
          </div>

          {/* Display Name (Editable) */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={track.displayName || ""}
              onChange={(e) => onDisplayNameChange(track.id, e.target.value)}
              placeholder="North Storage, Tank Line, etc."
              className="w-full bg-zinc-900 text-white text-base px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Outbound Mode Toggle */}
          <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
            <div>
              <label className="block text-zinc-300 text-sm font-medium">
                Outbound Track
              </label>
              <p className="text-xs text-zinc-500 mt-1">
                Cars here will prompt for offsite removal next day
              </p>
            </div>
            <button
              onClick={() => onToggleOutbound(track.id)}
              className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${
                track.outboundMode === "manual-confirmation" ? "bg-blue-600" : "bg-zinc-700"
              }`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                track.outboundMode === "manual-confirmation" ? "translate-x-5" : ""
              }`} />
            </button>
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(track)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Track
          </button>
        </div>

        {/* Enabled Toggle */}
        <div className="flex-shrink-0 pt-6">
          <label className="block text-zinc-500 text-sm mb-3">
            Enabled
          </label>
          <button
            onClick={() => onToggleEnabled(track.id)}
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
  );
}

export default function ManageTracks() {
  const { tracks, saveTracks } = useApp();
  const router = useRouter();
  
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTrackCode, setNewTrackCode] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [validation, setValidation] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogTrack, setDeleteDialogTrack] = useState<Track | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setLocalTracks(tracks.map(t => ({ ...t })));
    }
  }, [mounted, tracks]);

  useEffect(() => {
    // Validate all tracks whenever localTracks changes
    const errors: ValidationError[] = [];
    
    localTracks.forEach(track => {
      // Check if track code is empty
      if (!track.name.trim()) {
        errors.push({
          trackId: track.id,
          field: "trackCode",
          message: "Track code is required."
        });
      }
      
      // Check for duplicate track codes among enabled tracks
      if (track.enabled) {
        const duplicates = localTracks.filter(
          t => t.id !== track.id && 
          t.enabled && 
          t.name.trim().toUpperCase() === track.name.trim().toUpperCase()
        );
        
        if (duplicates.length > 0) {
          errors.push({
            trackId: track.id,
            field: "trackCode",
            message: "Track code must be unique."
          });
        }
      }
    });
    
    setValidationErrors(errors);
  }, [localTracks]);

  if (!mounted) {
    return null;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const getValidationError = (trackId: string, field: "trackCode" | "displayName"): string | null => {
    const error = validationErrors.find(e => e.trackId === trackId && e.field === field);
    return error ? error.message : null;
  };

  const hasValidationErrors = validationErrors.length > 0;

  const handleTrackCodeChange = (trackId: string, newCode: string) => {
    setLocalTracks(prev => prev.map(track =>
      track.id === trackId
        ? { ...track, name: newCode }
        : track
    ));
    setHasChanges(true);
  };

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

  const handleToggleOutbound = (trackId: string) => {
    setLocalTracks(prev => prev.map(track =>
      track.id === trackId
        ? { 
            ...track, 
            outboundMode: track.outboundMode === "manual-confirmation" ? "none" : "manual-confirmation" 
          }
        : track
    ));
    setHasChanges(true);
  };

  const handleDeleteTrack = (track: Track) => {
    setDeleteDialogTrack(track);
  };

  const confirmDeleteTrack = () => {
    if (!deleteDialogTrack) return;
    
    setLocalTracks(prev => prev.filter(t => t.id !== deleteDialogTrack.id));
    setHasChanges(true);
    setDeleteDialogTrack(null);
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
      capacity: 50,
      order: localTracks.length + 1,
      cars: [],
      enabled: true,
      outboundMode: "none",
    };

    setLocalTracks(prev => [...prev, newTrack]);
    setHasChanges(true);
    setShowAddForm(false);
    setNewTrackCode("");
    setNewDisplayName("");
    setValidation("");
  };

  const handleSaveChanges = () => {
    if (hasValidationErrors) return;
    
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
    <div className="min-h-screen bg-zinc-900 text-white">
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
        <p className="text-zinc-500 text-base mb-2">
          Drag tracks to reorder them. Changes apply to the main tracks list.
        </p>
        <p className="text-zinc-500 text-base mb-6">
          Edits change display names only. Track IDs, cars, and history are not modified.
        </p>

        {/* Track List with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localTracks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4 mb-6">
              {localTracks.map(track => (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  onTrackCodeChange={handleTrackCodeChange}
                  onDisplayNameChange={handleDisplayNameChange}
                  onToggleEnabled={handleToggleEnabled}
                  onToggleOutbound={handleToggleOutbound}
                  onDelete={handleDeleteTrack}
                  getValidationError={getValidationError}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Track Button/Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors mb-6"
          >
            + Add Track
          </button>
        ) : (
          <div className="bg-zinc-800 p-5 rounded-xl border border-zinc-700 mb-6">
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

        {/* Save/Discard Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleCancel}
            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={!hasChanges || hasValidationErrors}
            className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
              hasChanges && !hasValidationErrors
                ? "bg-green-600 hover:bg-green-700"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Save Changes
          </button>
        </div>

        {validation && validation.includes("successfully") && (
          <p className="text-green-500 text-center text-lg">{validation}</p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogTrack && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-4">Delete Track?</h2>
            
            <p className="text-zinc-400 text-lg mb-2">
              Are you sure you want to delete <span className="font-mono font-semibold text-white">{deleteDialogTrack.name}</span>
              {deleteDialogTrack.displayName && (
                <span> ({deleteDialogTrack.displayName})</span>
              )}?
            </p>
            
            {deleteDialogTrack.cars.length > 0 && (
              <p className="text-red-400 text-base mb-6 font-semibold">
                This track has {deleteDialogTrack.cars.length} car{deleteDialogTrack.cars.length !== 1 ? 's' : ''}. All car data will be permanently deleted.
              </p>
            )}
            
            {deleteDialogTrack.cars.length === 0 && (
              <p className="text-zinc-500 text-sm mb-6">
                This track is empty and can be safely deleted.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialogTrack(null)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTrack}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}