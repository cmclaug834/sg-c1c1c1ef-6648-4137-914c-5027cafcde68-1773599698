/**
 * CODE REVIEW REPORT - Track Detail Page
 * ========================================
 * 
 * UPDATES:
 * - Fixed BIG circle to be session-only (resets to grey after Done)
 * - Fixed SMALL left icon to show persistent state (green stays after Done)
 * - Fixed Progress to always compute from track.cars (no drift)
 * - Kept selection mode checkbox independent
 * - Kept all existing move/remove/import functionality
 * - Added tank type support with quick edit popover
 */

import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, CheckCircle2, Circle, AlertTriangle, MoreVertical, Trash2, ArrowUpDown, BadgeCheck, CircleDashed, X, Plus, Search, Copy, Check } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { UnconfirmDialog } from "@/components/UnconfirmDialog";
import { normalizeCarId } from "@/lib/carIdFormatter";
import { DuplicateCarDialog } from "@/components/DuplicateCarDialog";
import { logDiagnostic } from "@/lib/diagnostics";
import { RailCar } from "@/types";
import { inspectionStorage } from "@/lib/inspectionStorage";

const BOTTOM_BAR_H = 96;

export default function TrackDetail() {
  const { tracks, confirmCar, unconfirmCar, settings, moveCar, currentUser, updateLastChecked, updateTrackTimestamp, saveTracks } = useApp();
  const router = useRouter();
  const { id } = router.query;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUnconfirmedOnly, setShowUnconfirmedOnly] = useState(false);
  const [unconfirmDialogCar, setUnconfirmDialogCar] = useState<{ trackId: string; carId: string; carNumber: string } | null>(null);
  const [movePickerCar, setMovePickerCar] = useState<{ carId: string; carNumber: string } | null>(null);
  const [moveToast, setMoveToast] = useState<string | null>(null);
  const [carActionMenu, setCarActionMenu] = useState<{ carId: string; carNumber: string } | null>(null);
  const [removeConfirmCar, setRemoveConfirmCar] = useState<{ carId: string; carNumber: string } | null>(null);
  
  // Tank type quick edit
  const [tankTypeEditCar, setTankTypeEditCar] = useState<{ carId: string; carNumber: string; currentType?: string } | null>(null);
  
  // Pending changes tracking
  const [pendingConfirmations, setPendingConfirmations] = useState<Set<string>>(new Set());
  const [pendingUnconfirmations, setPendingUnconfirmations] = useState<Set<string>>(new Set());
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [commitToast, setCommitToast] = useState<string | null>(null);

  // Pending moves tracking
  const [pendingMoves, setPendingMoves] = useState<Map<string, { targetTrackId: string; targetTrackName: string }>>(new Map());

  // Multi-select mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCarIds, setSelectedCarIds] = useState<Set<string>>(new Set());
  const [showBatchMoveModal, setShowBatchMoveModal] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);

  const track = tracks.find(t => t.id === id);

  // Reset pending changes and selection when track changes
  useEffect(() => {
    setPendingConfirmations(new Set());
    setPendingUnconfirmations(new Set());
    setPendingMoves(new Map());
    setSelectedCarIds(new Set());
    setSelectionMode(false);
  }, [id]);

  if (!track) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Track not found</p>
      </div>
    );
  }

  // Compute progress from track.cars directly (no drift)
  const computedTotal = track.cars.length;
  const computedConfirmed = track.cars.filter(c => c.status === "confirmed").length;

  // Check if there are pending changes
  const hasPendingChanges = pendingConfirmations.size > 0 || pendingUnconfirmations.size > 0 || pendingMoves.size > 0;

  // Determine if car was checked this shift (for filtering)
  const isCheckedThisShift = (car: RailCar) => {
    if (car.status !== "confirmed") return false;
    if (!car.confirmedAt) return false;
    if (!track.lastCheckClearedAt) return true;
    return new Date(car.confirmedAt) > new Date(track.lastCheckClearedAt);
  };

  // Check if car was confirmed TODAY (calendar day)
  const isConfirmedToday = (car: RailCar) => {
    if (car.status !== "confirmed" || !car.confirmedAt) return false;
    
    const confirmedDate = new Date(car.confirmedAt).toISOString().split('T')[0]; // YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    return confirmedDate === today;
  };

  // SMALL left status icon - PERSISTENT STATE (uses car.status)
  const getSmallStatusIcon = (car: RailCar) => {
    if (car.status === "missing") {
      return <AlertTriangle className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" />;
    }
    
    if (car.status === "confirmed") {
      return <BadgeCheck className="w-6 h-6 md:w-7 md:h-7 text-green-500" />;
    }
    
    return <CircleDashed className="w-6 h-6 md:w-7 md:h-7 text-zinc-600" />;
  };

  const handleToggleConfirm = (carId: string, currentStatus: string, carNumber: string) => {
    // Don't toggle if in selection mode
    if (selectionMode) {
      handleToggleSelection(carId);
      return;
    }

    if (currentStatus === "missing") {
      return;
    }

    const car = track.cars.find(c => c.id === carId);
    if (!car) return;

    // If car is already confirmed TODAY, open move picker instead
    if (isConfirmedToday(car)) {
      setMovePickerCar({ carId, carNumber });
      return;
    }

    // Otherwise, handle as new confirmation
    const isPendingConfirm = pendingConfirmations.has(carId);

    if (isPendingConfirm) {
      // Remove from pending confirmations
      setPendingConfirmations(prev => {
        const next = new Set(prev);
        next.delete(carId);
        return next;
      });
    } else {
      // Add to pending confirmations
      setPendingConfirmations(prev => new Set(prev).add(carId));
    }
  };

  const handleUnconfirmConfirmed = () => {
    if (unconfirmDialogCar) {
      setPendingUnconfirmations(prev => new Set(prev).add(unconfirmDialogCar.carId));
      setPendingConfirmations(prev => {
        const next = new Set(prev);
        next.delete(unconfirmDialogCar.carId);
        return next;
      });
      setUnconfirmDialogCar(null);
    }
  };

  // Toggle selection mode
  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedCarIds(new Set());
  };

  // Toggle individual car selection
  const handleToggleSelection = (carId: string) => {
    setSelectedCarIds(prev => {
      const next = new Set(prev);
      if (next.has(carId)) {
        next.delete(carId);
      } else {
        next.add(carId);
      }
      return next;
    });
  };

  // Batch move selected cars
  const handleBatchMove = (targetTrackId: string, targetTrackName: string) => {
    let movedCount = 0;
    let skippedCount = 0;

    selectedCarIds.forEach(carId => {
      const success = moveCar(carId, track.id, targetTrackId, "DAY_MOVE");
      if (success) {
        movedCount++;
      } else {
        skippedCount++;
      }
    });

    setShowBatchMoveModal(false);
    setSelectedCarIds(new Set());
    setSelectionMode(false);

    if (skippedCount > 0) {
      setMoveToast(`Moved ${movedCount} cars. ${skippedCount} skipped (duplicates).`);
    } else {
      setMoveToast(`Moved ${movedCount} cars to ${targetTrackName}`);
    }
    
    setTimeout(() => setMoveToast(null), 3000);
  };

  // Batch delete selected cars
  const handleBatchDeleteConfirmed = () => {
    if (!currentUser) return;

    const selectedCars = track.cars.filter(car => selectedCarIds.has(car.id));

    // Log removal events
    selectedCars.forEach(car => {
      const removeLog = {
        id: `remove-${Date.now()}-${car.id}`,
        carId: car.id,
        carNumber: car.carNumber,
        trackId: track.id,
        trackName: track.name,
        timestamp: new Date().toISOString(),
        crewId: currentUser.crewId,
        reason: "BATCH_REMOVED",
      };

      const existingLogs = JSON.parse(localStorage.getItem("rail_yard_remove_logs") || "[]");
      localStorage.setItem("rail_yard_remove_logs", JSON.stringify([...existingLogs, removeLog]));
    });

    // Build updated tracks
    const updatedTracks = tracks.map(t => {
      if (t.id === track.id) {
        const updatedCars = t.cars.filter(c => !selectedCarIds.has(c.id));
        return {
          ...t,
          cars: updatedCars,
        };
      }
      return t;
    });

    // Save the updated tracks
    saveTracks(updatedTracks);

    // Log diagnostic after save
    const updatedTrack = updatedTracks.find(t => t.id === track.id);
    if (updatedTrack) {
      logDiagnostic("BATCH_DELETE_COMPLETE", updatedTrack);
    }

    setShowBatchDeleteConfirm(false);
    setSelectedCarIds(new Set());
    setSelectionMode(false);
    setMoveToast(`Removed ${selectedCars.length} cars from track`);
    setTimeout(() => setMoveToast(null), 3000);
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

    // Build updated tracks AND save them
    const updatedTracks = tracks.map(t => {
      if (t.id === track.id) {
        const updatedCars = t.cars.filter(c => c.id !== carId);
        return {
          ...t,
          cars: updatedCars,
        };
      }
      return t;
    });

    // Save the updated tracks immediately
    saveTracks(updatedTracks);

    // Log diagnostic after save
    const updatedTrack = updatedTracks.find(t => t.id === track.id);
    if (updatedTrack) {
      logDiagnostic("REMOVE_CAR_COMPLETE", updatedTrack);
    }

    setRemoveConfirmCar(null);
    setMoveToast("Car removed from track");
    setTimeout(() => setMoveToast(null), 3000);
  };

  const handleMoveToTrack = (targetTrackId: string, targetTrackName: string) => {
    if (!movePickerCar) return;

    // Check for duplicate in target track
    const targetTrack = tracks.find(t => t.id === targetTrackId);
    if (targetTrack) {
      const normalizedCarNumber = normalizeCarId(movePickerCar.carNumber);
      const duplicate = targetTrack.cars.find(c => normalizeCarId(c.carNumber) === normalizedCarNumber);
      
      if (duplicate) {
        setMoveToast(`Cannot move: ${targetTrackName} already has this car`);
        setTimeout(() => setMoveToast(null), 3000);
        setMovePickerCar(null);
        return;
      }
    }

    // Add to pending moves
    setPendingMoves(prev => {
      const next = new Map(prev);
      next.set(movePickerCar.carId, { targetTrackId, targetTrackName });
      return next;
    });

    setMoveToast(`Will move to ${targetTrackName} when Done is pressed`);
    setTimeout(() => setMoveToast(null), 3000);
    setMovePickerCar(null);
  };

  // Handle tank type quick edit save
  const handleSaveTankType = (newTankType: "C" | "A" | "HP" | "SC") => {
    if (!tankTypeEditCar) return;

    const updatedTracks = tracks.map(t => {
      if (t.id === track.id) {
        const updatedCars = t.cars.map(c => {
          if (c.id === tankTypeEditCar.carId) {
            return { ...c, tankType: newTankType };
          }
          return c;
        });
        return { ...t, cars: updatedCars };
      }
      return t;
    });

    saveTracks(updatedTracks);
    setTankTypeEditCar(null);
    setMoveToast(`Tank type set to ${newTankType}`);
    setTimeout(() => setMoveToast(null), 2000);
  };

  const handleStartInspection = (car: { carNumber: string }) => {
    if (!currentUser) return;
    
    // Create new inspection with car pre-filled
    const newInspection = inspectionStorage.createInspection({
      templateId: "default",
      status: "in_progress",
      carNumber: normalizeCarId(car.carNumber),
      currentStep: 1,
      media: {
        doorwayExteriorAndInterior: [],
        doorwayBeforeClosing: [],
      }
    });

    // Navigate to inspection form
    router.push(`/inspection/${newInspection.id}/page/1`);
  };

  // Handle back button with pending changes check
  const handleBack = () => {
    if (hasPendingChanges) {
      setShowDiscardDialog(true);
    } else {
      router.push("/tracks");
    }
  };

  // Discard pending changes and go back
  const handleDiscardChanges = () => {
    setPendingConfirmations(new Set());
    setPendingUnconfirmations(new Set());
    setPendingMoves(new Map());
    setShowDiscardDialog(false);
    router.push("/tracks");
  };

  // Commit all pending changes and clear pending sets
  const handleYardCheckCompleted = () => {
    if (!track) return;

    logDiagnostic(
      "DONE_COMMIT_START",
      track,
      pendingConfirmations.size,
      pendingMoves.size
    );

    // Apply all pending confirmations
    pendingConfirmations.forEach(carId => {
      confirmCar(track.id, carId);
    });

    logDiagnostic(
      "DONE_AFTER_CONFIRMATIONS",
      track,
      pendingConfirmations.size,
      0
    );

    // Apply all pending moves
    let movedCount = 0;
    pendingMoves.forEach((moveInfo, carId) => {
      const success = moveCar(carId, track.id, moveInfo.targetTrackId, "DAY_MOVE");
      if (success) {
        movedCount++;
      }
    });

    logDiagnostic(
      "DONE_AFTER_MOVES",
      track,
      0,
      movedCount
    );

    // Update last checked timestamp
    updateLastChecked(track.id);
    
    // Update lastCheckClearedAt
    updateTrackTimestamp(track.id, "lastCheckClearedAt");

    logDiagnostic(
      "DONE_AFTER_LAST_CHECKED",
      tracks.find(t => t.id === track.id) || track,
      0,
      0
    );

    // Clear pending changes (this resets BIG circles to grey)
    setPendingConfirmations(new Set());
    setPendingUnconfirmations(new Set());
    setPendingMoves(new Map());

    logDiagnostic(
      "DONE_COMMIT_END",
      tracks.find(t => t.id === track.id) || track,
      0,
      0
    );

    // Show success toast
    const moveMessage = movedCount > 0 ? `, ${movedCount} moved` : '';
    setCommitToast(`Yard check saved for ${track.name}${moveMessage}`);

    // Navigate to track list after short delay
    setTimeout(() => {
      router.push("/tracks");
    }, 1500);
  };

  // Filter logic for "Unconfirmed only" toggle
  const filteredCars = showUnconfirmedOnly 
    ? track.cars.filter(car => !isCheckedThisShift(car))
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

  // Get car type badge display text
  const getCarTypeBadge = (car: RailCar) => {
    if (car.carType === "TANK") {
      if (car.tankType) {
        return `TANK — ${car.tankType}`;
      }
      return "TANK — (?)";
    }
    return car.carType;
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
                {computedConfirmed + pendingConfirmations.size - pendingUnconfirmations.size} / {computedTotal}
              </span>
            </div>
            {hasPendingChanges && (
              <div className="mt-2 text-sm text-yellow-500">
                {pendingConfirmations.size > 0 && `${pendingConfirmations.size} to confirm`}
                {pendingConfirmations.size > 0 && pendingMoves.size > 0 && ', '}
                {pendingMoves.size > 0 && `${pendingMoves.size} to move`}
              </div>
            )}
          </div>

          {/* Shift Status Legend */}
          <div className="bg-zinc-800/50 p-3 rounded-lg mb-4">
            <div className="flex items-center justify-around text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-green-500" />
                <span className="text-zinc-400">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleDashed className="w-4 h-4 text-zinc-600" />
                <span className="text-zinc-400">Not confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-zinc-400">Missing</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              id="B.filterToggle"
              onClick={() => setShowUnconfirmedOnly(!showUnconfirmedOnly)}
              className={`flex-1 p-4 rounded-xl text-left transition-colors text-base md:text-lg font-medium ${
                showUnconfirmedOnly 
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Not confirmed only</span>
                <div className={`w-12 h-7 rounded-full transition-colors relative ${
                  showUnconfirmedOnly ? "bg-yellow-800" : "bg-zinc-700"
                }`}>
                  <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    showUnconfirmedOnly ? "translate-x-5" : ""
                  }`} />
                </div>
              </div>
            </button>

            {/* Select Mode Toggle */}
            <button
              id="B.selectModeToggle"
              onClick={handleToggleSelectionMode}
              className={`flex-1 p-4 rounded-xl text-center transition-colors text-base md:text-lg font-medium ${
                selectionMode 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
              }`}
            >
              {selectionMode ? `Selected: ${selectedCarIds.size}` : "Select"}
            </button>
          </div>
        </div>
      </div>

      {/* Car List */}
      <div id="B.carList" className="flex-1 overflow-y-auto pb-safe-bottom-nav">
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
                const isSelected = selectedCarIds.has(car.id);
                const isPendingConfirm = pendingConfirmations.has(car.id);
                const isPendingUnconfirm = pendingUnconfirmations.has(car.id);

                return (
                  <div
                    key={car.id}
                    className={`B.carRow bg-zinc-800 rounded-xl overflow-hidden ${
                      isSelected ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => handleToggleConfirm(car.id, car.status, car.carNumber)}
                        disabled={car.status === "missing"}
                        className="flex-1 p-5 md:p-6 text-left hover:bg-zinc-700 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-4">
                          {/* SMALL left status icon - PERSISTENT STATE (uses car.status) */}
                          <div className="flex-shrink-0">
                            {getSmallStatusIcon(car)}
                          </div>

                          {selectionMode ? (
                            <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-blue-600 border-blue-600"
                                : "border-zinc-600"
                            }`}>
                              {isSelected && (
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          ) : (
                            /* BIG confirm circle - SESSION ONLY (uses pending state only) */
                            <div className="B.confirmStateIcon flex-shrink-0">
                              {car.status === "missing" ? (
                                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
                              ) : pendingMoves.has(car.id) ? (
                                <ArrowUpDown className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                              ) : isPendingConfirm ? (
                                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
                              ) : isPendingUnconfirm ? (
                                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
                              ) : (
                                <Circle className="w-8 h-8 md:w-10 md:h-10 text-zinc-600" />
                              )}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="B.carNumber text-3xl md:text-4xl font-bold font-mono mb-1">
                              {normalizeCarId(car.carNumber)}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-1">
                              {/* Car Type Badge - Display only, click handler moved outside */}
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-zinc-700 text-zinc-300">
                                {getCarTypeBadge(car)}
                              </span>
                            </div>

                            {pendingMoves.has(car.id) && (
                              <div className="text-blue-500 text-sm md:text-base">
                                Pending move to: {pendingMoves.get(car.id)?.targetTrackName}
                              </div>
                            )}

                            {!pendingMoves.has(car.id) && (isPendingConfirm || isPendingUnconfirm) && (
                              <div className="text-yellow-500 text-sm md:text-base">
                                Pending: {isPendingConfirm ? "will confirm" : "will unconfirm"}
                              </div>
                            )}

                            {!pendingMoves.has(car.id) && !isPendingConfirm && !isPendingUnconfirm && car.status === "confirmed" && car.confirmedAt && (
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

                      {/* Tank type edit button - Only show for TANK cars, separate from main button */}
                      {!selectionMode && car.carType === "TANK" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTankTypeEditCar({
                              carId: car.id,
                              carNumber: car.carNumber,
                              currentType: car.tankType,
                            });
                          }}
                          className="p-6 hover:bg-zinc-700 transition-colors border-l border-zinc-700"
                          aria-label="Edit tank type"
                        >
                          <span className="text-sm font-medium text-zinc-400">
                            {car.tankType || "?"}
                          </span>
                        </button>
                      )}

                      {/* Row menu - Hide in selection mode */}
                      {!selectionMode && (
                        <button
                          id="B.rowMenuBtn"
                          onClick={() => setCarActionMenu({ carId: car.id, carNumber: car.carNumber })}
                          className="p-6 hover:bg-zinc-700 transition-colors border-l border-zinc-700"
                          aria-label="Car actions"
                        >
                          <MoreVertical className="w-6 h-6 md:w-7 md:h-7 text-zinc-400" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Consolidated Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-[60] pointer-events-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-4xl mx-auto p-4">
          {selectionMode && selectedCarIds.size > 0 ? (
            // Batch action buttons when items selected
            <div className="grid grid-cols-3 gap-3">
              <button
                id="B.cancelSelectionBtn"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedCarIds(new Set());
                }}
                className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-base md:text-lg font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                id="B.batchMoveBtn"
                onClick={() => setShowBatchMoveModal(true)}
                className="py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-base md:text-lg font-bold transition-colors"
              >
                Move ({selectedCarIds.size})
              </button>

              <button
                id="B.batchDeleteBtn"
                onClick={() => setShowBatchDeleteConfirm(true)}
                className="py-4 bg-red-600 hover:bg-red-700 rounded-xl text-base md:text-lg font-bold transition-colors"
              >
                Delete ({selectedCarIds.size})
              </button>
            </div>
          ) : (
            // Original action buttons
            <div className="grid grid-cols-4 gap-3">
              <button
                id="B.backActionBtn"
                onClick={handleBack}
                className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-base md:text-lg font-bold transition-colors"
              >
                Back
              </button>

              <button
                id="B.importActionBtn"
                onClick={() => router.push(`/track/${id}/import`)}
                className="py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-base md:text-lg font-bold transition-colors"
              >
                Import
              </button>

              <button
                id="B.addCarActionBtn"
                onClick={() => setShowAddModal(true)}
                className="py-4 bg-green-600 hover:bg-green-700 rounded-xl text-base md:text-lg font-bold transition-colors"
              >
                Add +
              </button>

              <button
                id="B.yardCheckCompletedBtn"
                onClick={handleYardCheckCompleted}
                className="py-4 bg-green-600 hover:bg-green-700 rounded-xl text-base md:text-lg font-bold transition-colors border-2 border-green-400"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Car Modal */}
      {showAddModal && (
        <AddCarModal
          trackId={track.id}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Tank Type Quick Edit Popover */}
      {tankTypeEditCar && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100]">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Tank Type</h2>
              <button
                onClick={() => setTankTypeEditCar(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-zinc-400" />
              </button>
            </div>

            <p className="text-zinc-400 text-base mb-4">
              Car: <span className="font-mono font-semibold text-white">{normalizeCarId(tankTypeEditCar.carNumber)}</span>
            </p>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {(["C", "A", "HP", "SC"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleSaveTankType(type)}
                  className={`py-4 rounded-lg text-lg font-bold transition-colors ${
                    tankTypeEditCar.currentType === type
                      ? "bg-green-600 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <p className="text-xs text-zinc-500 mb-6">
              C=Caustic, A=Acid, HP=Hydrogen Peroxide, SC=Sodium Chlorate
            </p>

            <button
              onClick={() => setTankTypeEditCar(null)}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-base font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
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
              <button
                id="B.rowActionMove"
                onClick={() => handleMoveCar(carActionMenu.carId, carActionMenu.carNumber)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium text-left px-4 transition-colors"
              >
                Move to Track…
              </button>

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

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartInspection(carActionMenu);
                  setCarActionMenu(null);
                }}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium text-left px-4 transition-colors flex items-center gap-3"
              >
                <Check className="w-5 h-5 text-green-500" />
                <span>Start Inspection</span>
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

      {/* Batch Move Modal */}
      {showBatchMoveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-2">Move Selected Cars</h2>
            <p className="text-zinc-400 text-base mb-6">
              Move {selectedCarIds.size} cars to which track?
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {otherTracks.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleBatchMove(t.id, t.name)}
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium text-left px-4 transition-colors"
                >
                  Move to {t.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowBatchMoveModal(false)}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Dialog */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              Delete selected cars?
            </h2>

            <p className="text-zinc-400 text-lg mb-2">
              This will remove {selectedCarIds.size} cars from {track.name}.
            </p>
            
            <p className="text-zinc-500 text-base mb-6">
              History will be kept in logs.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleBatchDeleteConfirmed}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Car Confirmation Dialog */}
      {removeConfirmCar && (
        <div id="B.removeConfirmDialog" className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 id="B.removeConfirmTitle" className="text-2xl font-bold mb-4">
              Remove this car from the list?
            </h2>

            <p id="B.removeConfirmBody" className="text-zinc-400 text-lg mb-2">
              This removes it from this track's active list (history is kept).
            </p>
            
            <p className="text-zinc-500 text-base mb-6">
              Car: <span className="font-mono font-semibold">{normalizeCarId(removeConfirmCar.carNumber)}</span>
            </p>

            <div className="flex gap-3">
              <button
                id="B.removeCancelBtn"
                onClick={() => setRemoveConfirmCar(null)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>

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

      {/* Discard Changes Dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              Discard changes?
            </h2>

            <p className="text-zinc-400 text-lg mb-2">
              You have {pendingConfirmations.size + pendingUnconfirmations.size + pendingMoves.size} pending changes that haven't been saved.
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

      {/* Commit Success Toast */}
      {commitToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 border border-green-700">
          <p className="text-base md:text-lg font-medium">{commitToast}</p>
        </div>
      )}

      {/* Move Toast */}
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
  const [carType, setCarType] = useState<"BOX" | "TANK" | "FLAT">("BOX");
  const [tankType, setTankType] = useState<"C" | "A" | "HP" | "SC" | undefined>(undefined);
  const [duplicateInfo, setDuplicateInfo] = useState<{ trackId: string; trackName: string } | null>(null);

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
      tankType: carType === "TANK" ? tankType : undefined,
    });
    onClose();
  };

  const handleContinueWithDuplicate = () => {
    // Add duplicate anyway
    addCar(trackId, {
      carNumber: normalizedPreview,
      carType,
      tankType: carType === "TANK" ? tankType : undefined,
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
        };
      }
      return track;
    });

    saveTracks(updatedTracks);

    // Now add to current track
    addCar(trackId, {
      carNumber: normalizedPreview,
      carType,
      tankType: carType === "TANK" ? tankType : undefined,
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
      <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-[100]">
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
                  placeholder="e.g. TBOX663566"
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
                  {(["BOX", "TANK", "FLAT"] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setCarType(type);
                        if (type !== "TANK") {
                          setTankType(undefined);
                        }
                      }}
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

              {/* Conditional Tank Type Selector */}
              {carType === "TANK" && (
                <div>
                  <label className="block text-zinc-400 mb-2 text-lg">Tank Type</label>
                  <div className="grid grid-cols-4 gap-3">
                    {(["C", "A", "HP", "SC"] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTankType(type)}
                        className={`py-4 rounded-lg text-lg font-bold transition-colors ${
                          tankType === type
                            ? "bg-green-600 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    C=Caustic, A=Acid, HP=Hydrogen Peroxide, SC=Sodium Chlorate
                  </p>
                </div>
              )}

              {carType !== "TANK" && (
                <p className="text-sm text-zinc-500">
                  Tank type required only when TANK is selected.
                </p>
              )}

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

      {/* Duplicate Car Warning Dialog */}
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