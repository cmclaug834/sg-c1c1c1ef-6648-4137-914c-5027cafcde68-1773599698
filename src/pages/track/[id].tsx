import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, Plus, CheckCircle2, Circle, AlertTriangle, MoreVertical, Trash2, ArrowUpDown, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { UnconfirmDialog } from "@/components/UnconfirmDialog";
import { normalizeCarId } from "@/lib/carIdFormatter";
import { TrackPickerModal } from "@/components/TrackPickerModal";
import { DuplicateCarDialog } from "@/components/DuplicateCarDialog";

export default function TrackDetail() {
  const { tracks, confirmCar, unconfirmCar, settings, moveCar, currentUser, updateLastChecked } = useApp();
  const router = useRouter();
  const { id } = router.query;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUnconfirmedOnly, setShowUnconfirmedOnly] = useState(false);
  const [unconfirmDialogCar, setUnconfirmDialogCar] = useState<{ trackId: string; carId: string; carNumber: string } | null>(null);
  const [movePickerCar, setMovePickerCar] = useState<{ carId: string; carNumber: string } | null>(null);
  const [moveToast, setMoveToast] = useState<string | null>(null);
  const [carActionMenu, setCarActionMenu] = useState<{ carId: string; carNumber: string } | null>(null);
  const [removeConfirmCar, setRemoveConfirmCar] = useState<{ carId: string; carNumber: string } | null>(null);
  
  // NEW: Pending changes tracking
  const [pendingConfirmations, setPendingConfirmations] = useState<Set<string>>(new Set());
  const [pendingUnconfirmations, setPendingUnconfirmations] = useState<Set<string>>(new Set());
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [commitToast, setCommitToast] = useState<string | null>(null);

  const track = tracks.find(t => t.id === id);

  // NEW: Reset pending changes when track changes
  useEffect(() => {
    setPendingConfirmations(new Set());
    setPendingUnconfirmations(new Set());
  }, [id]);

  if (!track) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Track not found</p>
      </div>
    );
  }

  // NEW: Check if there are pending changes
  const hasPendingChanges = pendingConfirmations.size > 0 || pendingUnconfirmations.size > 0;

  // NEW: Get effective car status (including pending changes)
  const getEffectiveStatus = (carId: string, currentStatus: string) => {
    if (pendingConfirmations.has(carId)) return "confirmed";
    if (pendingUnconfirmations.has(carId)) return "pending";
    return currentStatus;
  };

  const handleToggleConfirm = (carId: string, currentStatus: string, carNumber: string) => {
    if (currentStatus === "missing") {
      return;
    }

    const effectiveStatus = getEffectiveStatus(carId, currentStatus);

    if (effectiveStatus === "confirmed") {
      // Handle unconfirm
      if (settings.requireUnconfirmDialog) {
        setUnconfirmDialogCar({ trackId: track.id, carId, carNumber });
      } else {
        // NEW: Add to pending unconfirmations
        setPendingUnconfirmations(prev => new Set(prev).add(carId));
        setPendingConfirmations(prev => {
          const next = new Set(prev);
          next.delete(carId);
          return next;
        });
      }
    } else {
      // NEW: Add to pending confirmations
      setPendingConfirmations(prev => new Set(prev).add(carId));
      setPendingUnconfirmations(prev => {
        const next = new Set(prev);
        next.delete(carId);
        return next;
      });
    }
  };

  const handleUnconfirmConfirmed = () => {
    if (unconfirmDialogCar) {
      // NEW: Add to pending unconfirmations
      setPendingUnconfirmations(prev => new Set(prev).add(unconfirmDialogCar.carId));
      setPendingConfirmations(prev => {
        const next = new Set(prev);
        next.delete(unconfirmDialogCar.carId);
        return next;
      });
      setUnconfirmDialogCar(null);
    }
  };

  const handleMoveCar = (carId: string, carNumber: string) => {
    setCarActionMenu(null);
    setMovePickerCar({ carId, carNumber });
  };

  const handleRemoveCar = (carId: string) => {
    if (!removeConfirmCar || !currentUser) return;

    // Log removal event
    const removeLog = {
      id: `remove-${Date.now()}`,
      carId: removeConfirmCar.carId,
      carNumber: removeConfirmCar.carNumber,
      trackId: track.id,
      trackName: track.name,
      timestamp: new Date().toISOString(),
      crewId: currentUser.crewId,
      reason: "REMOVED",
    };

    const existingLogs = JSON.parse(localStorage.getItem("rail_yard_remove_logs") || "[]");
    localStorage.setItem("rail_yard_remove_logs", JSON.stringify([...existingLogs, removeLog]));

    // Remove car from track using moveCar with special handling
    // Find the car and remove it from the track
    const updatedTracks = tracks.map(t => {
      if (t.id === track.id) {
        const updatedCars = t.cars.filter(c => c.id !== carId);
        return {
          ...t,
          cars: updatedCars,
          totalCars: updatedCars.length,
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };
      }
      return t;
    });

    // Update via context (need to add removeCarFromTrack method or handle via direct storage)
    // For now, we'll use a workaround with the existing context
    window.location.reload(); // Force reload to sync with storage

    setRemoveConfirmCar(null);
    setMoveToast("Car removed from track");
    setTimeout(() => setMoveToast(null), 3000);
  };

  const handleMoveToTrack = (targetTrackId: string, targetTrackName: string) => {
    if (!movePickerCar) return;

    const success = moveCar(movePickerCar.carId, track.id, targetTrackId, "DAY_MOVE");
    
    if (success) {
      setMoveToast(`Moved to ${targetTrackName}`);
      setTimeout(() => setMoveToast(null), 3000);
    } else {
      setMoveToast(`Cannot move: duplicate or error`);
      setTimeout(() => setMoveToast(null), 3000);
    }
    
    setMovePickerCar(null);
  };

  // NEW: Handle back button with pending changes check
  const handleBack = () => {
    if (hasPendingChanges) {
      setShowDiscardDialog(true);
    } else {
      router.push("/");
    }
  };

  // NEW: Discard pending changes and go back
  const handleDiscardChanges = () => {
    setPendingConfirmations(new Set());
    setPendingUnconfirmations(new Set());
    setShowDiscardDialog(false);
    router.push("/");
  };

  // NEW: Commit all pending changes
  const handleYardCheckCompleted = () => {
    // Apply all pending confirmations
    pendingConfirmations.forEach(carId => {
      confirmCar(track.id, carId);
    });

    // Apply all pending unconfirmations
    pendingUnconfirmations.forEach(carId => {
      unconfirmCar(track.id, carId);
    });

    // Update last checked timestamp
    updateLastChecked(track.id);

    // Clear pending changes
    setPendingConfirmations(new Set());
    setPendingUnconfirmations(new Set());

    // Show success toast
    setCommitToast(`Yard check saved for ${track.name}`);

    // Navigate back after short delay
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  const filteredCars = showUnconfirmedOnly 
    ? track.cars.filter(car => getEffectiveStatus(car.id, car.status) === "pending")
    : track.cars;

  const otherTracks = tracks.filter(t => t.id !== track.id && t.enabled !== false);

  const formatConfirmedTime = (timestamp?: string) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              id="B.backBtn"
              onClick={handleBack}
              className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Back to track list"
            >
              <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
            </button>
            
            <h1 id="B.trackTitle" className="text-2xl md:text-3xl font-bold tracking-tight">
              {track.name}
            </h1>
            
            <button
              id="B.reorderBtn"
              onClick={() => router.push(`/reorder/${track.id}`)}
              className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Reorder cars"
            >
              <ArrowUpDown className="w-7 h-7 md:w-8 md:h-8" />
            </button>
          </div>

          <div id="B.progressText" className="bg-zinc-800 p-4 rounded-xl mb-4">
            <div className="flex justify-between items-center text-lg md:text-xl">
              <span className="text-zinc-400">Progress:</span>
              <span className="font-mono font-bold text-2xl md:text-3xl">
                {track.confirmedCars + pendingConfirmations.size - pendingUnconfirmations.size} / {track.totalCars}
              </span>
            </div>
            {hasPendingChanges && (
              <div className="mt-2 text-sm text-yellow-500">
                {pendingConfirmations.size + pendingUnconfirmations.size} pending changes
              </div>
            )}
          </div>

          <button
            id="B.filterToggle"
            onClick={() => setShowUnconfirmedOnly(!showUnconfirmedOnly)}
            className={`w-full p-4 rounded-xl text-left transition-colors text-base md:text-lg font-medium ${
              showUnconfirmedOnly 
                ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Unconfirmed only</span>
              <div className={`w-12 h-7 rounded-full transition-colors relative ${
                showUnconfirmedOnly ? "bg-yellow-800" : "bg-zinc-700"
              }`}>
                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  showUnconfirmedOnly ? "translate-x-5" : ""
                }`} />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* B.carList */}
      <div id="B.carList" className="flex-1 overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {filteredCars.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-xl md:text-2xl mb-2">
                {showUnconfirmedOnly ? "All cars confirmed!" : "No cars on this track"}
              </p>
              {!showUnconfirmedOnly && (
                <p className="text-base md:text-lg">Tap + to add a car</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCars.map(car => {
                const effectiveStatus = getEffectiveStatus(car.id, car.status);
                const isPending = pendingConfirmations.has(car.id) || pendingUnconfirmations.has(car.id);

                return (
                  <div
                    key={car.id}
                    className="B.carRow bg-zinc-800 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => handleToggleConfirm(car.id, car.status, car.carNumber)}
                        disabled={car.status === "missing"}
                        className="flex-1 p-5 md:p-6 text-left hover:bg-zinc-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-4">
                          <div className="B.confirmStateIcon flex-shrink-0">
                            {effectiveStatus === "confirmed" ? (
                              <CheckCircle2 className={`w-8 h-8 md:w-10 md:h-10 ${isPending ? 'text-yellow-500' : 'text-green-500'}`} />
                            ) : car.status === "missing" ? (
                              <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
                            ) : (
                              <Circle className={`w-8 h-8 md:w-10 md:h-10 ${isPending ? 'text-yellow-500' : 'text-zinc-600'}`} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="B.carNumber text-3xl md:text-4xl font-bold font-mono mb-1">
                              {normalizeCarId(car.carNumber)}
                            </div>
                            
                            <div className="text-zinc-400 text-base md:text-lg mb-1">
                              {car.carType}
                            </div>

                            {isPending && (
                              <div className="text-yellow-500 text-sm md:text-base">
                                Pending: {effectiveStatus === "confirmed" ? "will confirm" : "will unconfirm"}
                              </div>
                            )}

                            {!isPending && effectiveStatus === "confirmed" && car.confirmedAt && (
                              <div className="B.lastConfirmedText text-zinc-500 text-sm md:text-base">
                                Confirmed {formatConfirmedTime(car.confirmedAt)}
                                {car.confirmedBy && ` by ${car.confirmedBy}`}
                              </div>
                            )}

                            {car.status === "missing" && (
                              <div className="B.missingSubtext text-yellow-500 text-sm md:text-base">
                                Marked missing in morning check
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* B.rowMenuBtn */}
                      <button
                        id="B.rowMenuBtn"
                        onClick={() => setCarActionMenu({ carId: car.id, carNumber: car.carNumber })}
                        className="p-6 hover:bg-zinc-700 transition-colors border-l border-zinc-700"
                        aria-label="Car actions"
                      >
                        <MoreVertical className="w-6 h-6 md:w-7 md:h-7 text-zinc-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* NEW: Consolidated Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-[9999] pointer-events-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-4xl mx-auto p-4">
          <div className="grid grid-cols-4 gap-3">
            {/* Back Button */}
            <button
              id="B.backActionBtn"
              onClick={handleBack}
              className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-base md:text-lg font-bold transition-colors"
            >
              Back
            </button>

            {/* Import Button */}
            <button
              id="B.importActionBtn"
              onClick={() => router.push(`/track/${id}/import`)}
              className="py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-base md:text-lg font-bold transition-colors"
            >
              Import
            </button>

            {/* Add Car Button */}
            <button
              id="B.addCarActionBtn"
              onClick={() => setShowAddModal(true)}
              className="py-4 bg-green-600 hover:bg-green-700 rounded-xl text-base md:text-lg font-bold transition-colors"
            >
              Add +
            </button>

            {/* Yard Check Completed Button */}
            <button
              id="B.yardCheckCompletedBtn"
              onClick={handleYardCheckCompleted}
              className="py-4 bg-green-600 hover:bg-green-700 rounded-xl text-base md:text-lg font-bold transition-colors border-2 border-green-400"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Add Car Modal */}
      {showAddModal && (
        <AddCarModal
          trackId={track.id}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Unconfirm Confirmation Dialog */}
      {unconfirmDialogCar && (
        <UnconfirmDialog
          carNumber={normalizeCarId(unconfirmDialogCar.carNumber)}
          onCancel={() => setUnconfirmDialogCar(null)}
          onConfirm={handleUnconfirmConfirmed}
        />
      )}

      {/* Car Action Menu */}
      {carActionMenu && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-2">Car Actions</h2>
            <p className="text-zinc-400 text-base mb-6">
              {normalizeCarId(carActionMenu.carNumber)}
            </p>

            <div className="space-y-3 mb-6">
              {/* B.rowActionMove */}
              <button
                id="B.rowActionMove"
                onClick={() => handleMoveCar(carActionMenu.carId, carActionMenu.carNumber)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium text-left px-4 transition-colors"
              >
                Move to Track…
              </button>

              {/* B.rowActionRemove */}
              <button
                id="B.rowActionRemove"
                onClick={() => {
                  setRemoveConfirmCar(carActionMenu);
                  setCarActionMenu(null);
                }}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium text-left px-4 transition-colors flex items-center gap-3"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
                <span>Remove from this track</span>
              </button>
            </div>

            <button
              onClick={() => setCarActionMenu(null)}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Move Track Picker Modal */}
      {movePickerCar && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-2">Move Car</h2>
            <p className="text-zinc-400 text-base mb-6">
              {normalizeCarId(movePickerCar.carNumber)}
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {otherTracks.map(t => (
                <button
                  key={t.id}
                  id="B.rowActionMove"
                  onClick={() => handleMoveToTrack(t.id, t.name)}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium text-left px-4 transition-colors"
                >
                  Move to {t.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setMovePickerCar(null)}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* B.removeConfirmDialog */}
      {removeConfirmCar && (
        <div id="B.removeConfirmDialog" className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            {/* B.removeConfirmTitle */}
            <h2 id="B.removeConfirmTitle" className="text-2xl font-bold mb-4">
              Remove this car from the list?
            </h2>

            {/* B.removeConfirmBody */}
            <p id="B.removeConfirmBody" className="text-zinc-400 text-lg mb-2">
              This removes it from this track's active list (history is kept).
            </p>
            
            <p className="text-zinc-500 text-base mb-6">
              Car: <span className="font-mono font-semibold">{normalizeCarId(removeConfirmCar.carNumber)}</span>
            </p>

            <div className="flex gap-3">
              {/* B.removeCancelBtn */}
              <button
                id="B.removeCancelBtn"
                onClick={() => setRemoveConfirmCar(null)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>

              {/* B.removeConfirmBtn */}
              <button
                id="B.removeConfirmBtn"
                onClick={() => handleRemoveCar(removeConfirmCar.carId)}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Discard Changes Dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              Discard changes?
            </h2>

            <p className="text-zinc-400 text-lg mb-2">
              You have {pendingConfirmations.size + pendingUnconfirmations.size} pending changes that haven't been saved.
            </p>
            
            <p className="text-zinc-500 text-base mb-6">
              These changes will be lost if you go back now.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardDialog(false)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Stay
              </button>

              <button
                onClick={handleDiscardChanges}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Commit Success Toast */}
      {commitToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 border border-green-700">
          <p className="text-base md:text-lg font-medium">{commitToast}</p>
        </div>
      )}

      {/* B.moveConfirmToast */}
      {moveToast && (
        <div id="B.moveConfirmToast" className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-4 rounded-lg shadow-lg z-50 border border-zinc-700">
          <p className="text-base md:text-lg font-medium">{moveToast}</p>
        </div>
      )}
    </div>
  );
}

function AddCarModal({ trackId, onClose }: { trackId: string; onClose: () => void }) {
  const { addCar, tracks, saveTracks } = useApp();
  const [carNumber, setCarNumber] = useState("");
  const [carType, setCarType] = useState("BOX");
  const [duplicateInfo, setDuplicateInfo] = useState<{ trackId: string; trackName: string } | null>(null);

  const carTypes = ["BOX", "TANK", "FLAT", "HOPPER", "GONDOLA", "AUTO"];

  const normalizedPreview = normalizeCarId(carNumber);
  const isValid = carNumber.trim() && /[a-zA-Z]/.test(carNumber) && /[0-9]/.test(carNumber);

  const findDuplicate = (normalizedCarId: string): { trackId: string; trackName: string } | null => {
    for (const track of tracks) {
      const existingCar = track.cars.find(car => 
        normalizeCarId(car.carNumber) === normalizedCarId
      );
      if (existingCar) {
        return { trackId: track.id, trackName: track.name };
      }
    }
    return null;
  };

  const handleAddCar = () => {
    if (!isValid) return;
    
    const duplicate = findDuplicate(normalizedPreview);
    if (duplicate) {
      setDuplicateInfo(duplicate);
      return;
    }

    // No duplicate - add normally
    addCar(trackId, {
      carNumber: normalizedPreview,
      carType,
    });
    onClose();
  };

  const handleContinueWithDuplicate = () => {
    // Add duplicate anyway
    addCar(trackId, {
      carNumber: normalizedPreview,
      carType,
    });
    setDuplicateInfo(null);
    onClose();
  };

  const handleReenter = () => {
    // Close dialog and return focus to input
    setDuplicateInfo(null);
  };

  const handleRemoveExisting = () => {
    if (!duplicateInfo) return;

    // Remove existing car from its track
    const updatedTracks = tracks.map(track => {
      if (track.id === duplicateInfo.trackId) {
        const updatedCars = track.cars.filter(car => 
          normalizeCarId(car.carNumber) !== normalizedPreview
        );
        return {
          ...track,
          cars: updatedCars,
          totalCars: updatedCars.length,
          confirmedCars: updatedCars.filter(c => c.status === "confirmed").length,
        };
      }
      return track;
    });

    saveTracks(updatedTracks);

    // Now add to current track
    addCar(trackId, {
      carNumber: normalizedPreview,
      carType,
    });
    
    setDuplicateInfo(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddCar();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
        <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Add Car</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-zinc-400 mb-2 text-lg">Car Number</label>
                <input
                  id="C.carNumberInput"
                  type="text"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  className="w-full bg-zinc-800 text-white text-2xl font-mono px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                  placeholder="tbox663566"
                  autoFocus
                />
                
                {carNumber.trim() && normalizedPreview && (
                  <div id="C.normalizedPreview" className="mt-2 text-zinc-400 text-base">
                    Will save as: <span className="font-mono font-semibold text-white">{normalizedPreview}</span>
                  </div>
                )}

                {carNumber.trim() && !isValid && (
                  <div id="C.duplicateWarn" className="mt-2 text-yellow-500 text-sm">
                    Enter letters + numbers (example: TBOX 663566)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-zinc-400 mb-2 text-lg">Car Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {carTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCarType(type)}
                      className={`py-4 rounded-lg text-lg font-medium transition-colors ${
                        carType === type
                          ? "bg-green-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  id="C.addBtn"
                  type="submit"
                  disabled={!isValid}
                  className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
                    isValid
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  Add Car
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Dialog Y: Duplicate Car Warning */}
      {duplicateInfo && (
        <DuplicateCarDialog
          carNumber={normalizedPreview}
          existingTrackName={duplicateInfo.trackName}
          onContinue={handleContinueWithDuplicate}
          onReenter={handleReenter}
          onRemoveExisting={handleRemoveExisting}
        />
      )}
    </>
  );
}