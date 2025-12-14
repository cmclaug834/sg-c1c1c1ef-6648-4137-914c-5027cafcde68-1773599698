import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { extractCarIds, computeImportBuckets } from "@/lib/carImportParser";
import type { ExtractedCar } from "@/lib/carImportParser";

interface PreviewData {
  toAdd: ExtractedCar[];
  skipped: string[];
  unrecognized: string[];
}

export default function ImportCars() {
  const { tracks, addCar } = useApp();
  const router = useRouter();
  const { id } = router.query;

  const [pasteText, setPasteText] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importToast, setImportToast] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showDuplicateReview, setShowDuplicateReview] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [expandedCars, setExpandedCars] = useState<Set<string>>(new Set());
  const willAddSectionRef = useRef<HTMLDivElement>(null);

  const track = tracks.find(t => t.id === id);

  if (!track) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Track not found</p>
      </div>
    );
  }

  const handlePreview = () => {
    // Extract car IDs from paste text
    const { recognized, unrecognized } = extractCarIds(pasteText);

    // Get existing car numbers from current track
    const existingToday = track?.cars.map(car => car.carNumber) || [];

    // TODO: Load existing snapshot when snapshot feature is implemented
    const existingSnapshot: string[] = [];

    // Compute buckets
    const buckets = computeImportBuckets(recognized, existingToday, existingSnapshot);

    // Map buckets.toAdd back to ExtractedCar format with source info
    const toAddWithSource = recognized.filter(car => 
      buckets.toAdd.includes(car.normalized)
    );

    setPreview({
      toAdd: toAddWithSource,
      skipped: buckets.skipped,
      unrecognized,
    });

    // Auto-scroll to preview results after state update
    setTimeout(() => {
      willAddSectionRef.current?.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }, 100);
  };

  const toggleCarExpand = (carId: string) => {
    const newExpanded = new Set(expandedCars);
    if (newExpanded.has(carId)) {
      newExpanded.delete(carId);
    } else {
      newExpanded.add(carId);
    }
    setExpandedCars(newExpanded);
  };

  const handleClear = () => {
    setPasteText("");
    setPreview(null);
    setExpandedCars(new Set());
  };

  const handleCancel = () => {
    router.push(`/track/${id}`);
  };

  const handleConfirmClick = () => {
    if (!preview) return;

    if (preview.skipped.length === 0) {
      // No duplicates - show simple confirmation
      setShowConfirmDialog(true);
    } else {
      // Has duplicates - show duplicate dialog
      setShowDuplicateDialog(true);
    }
  };

  const handleAddNewOnly = () => {
    if (!preview) return;
    setShowDuplicateDialog(false);
    const carsToAdd = preview.toAdd.map(car => car.normalized);
    executeImport(carsToAdd);
  };

  const handleAddEverything = () => {
    if (!preview) return;
    const allCars = [
      ...preview.toAdd.map(car => car.normalized),
      ...preview.skipped
    ];
    setShowDuplicateDialog(false);
    executeImport(allCars);
  };

  const handleReviewDuplicates = () => {
    setShowDuplicateDialog(false);
    setShowDuplicateReview(true);
    setSelectedDuplicates(new Set());
  };

  const toggleDuplicate = (carId: string) => {
    const newSelected = new Set(selectedDuplicates);
    if (newSelected.has(carId)) {
      newSelected.delete(carId);
    } else {
      newSelected.add(carId);
    }
    setSelectedDuplicates(newSelected);
  };

  const handleConfirmDuplicateSelection = () => {
    if (!preview) return;
    const carsToAdd = [
      ...preview.toAdd.map(car => car.normalized),
      ...Array.from(selectedDuplicates)
    ];
    setShowDuplicateReview(false);
    executeImport(carsToAdd);
  };

  const executeImport = (carsToAdd: string[]) => {
    // Add all cars to the track
    carsToAdd.forEach(carNumber => {
      addCar(track!.id, {
        carNumber,
        carType: "BOX", // Default type, user can edit later
      });
    });

    const skippedCount = preview!.skipped.length - selectedDuplicates.size;
    const message = skippedCount > 0 
      ? `Added ${carsToAdd.length} cars. Skipped ${skippedCount} duplicates.`
      : `Added ${carsToAdd.length} cars.`;
    
    setImportToast(message);

    // Return to track detail after short delay
    setTimeout(() => {
      router.push(`/track/${id}`);
    }, 2000);
  };

  const handleSimpleConfirm = () => {
    if (!preview) return;
    setShowConfirmDialog(false);
    const carsToAdd = preview.toAdd.map(car => car.normalized);
    executeImport(carsToAdd);
  };

  const handleBackToEdit = () => {
    setPreview(null);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* I.backBtn */}
            <button
              id="I.backBtn"
              onClick={handleCancel}
              className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Back to track detail"
            >
              <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
            </button>
            
            {/* I.headerTitle */}
            <h1 id="I.headerTitle" className="text-2xl md:text-3xl font-bold tracking-tight">
              Import Cars
            </h1>
            
            <div className="w-14 md:w-16" />
          </div>

          {/* I.trackBadge */}
          <div id="I.trackBadge" className="bg-zinc-800 px-5 py-3 rounded-lg inline-flex items-center gap-2 mb-4">
            <span className="text-zinc-400">Track:</span>
            <span className="font-mono font-semibold text-lg">{track.name}</span>
          </div>

          {/* I.subText */}
          <p id="I.subText" className="text-zinc-400 text-base md:text-lg mb-4">
            Paste the CN car list below. We'll extract car IDs and add only new cars.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* I.pasteTextArea */}
          <div className="mb-6">
            <label className="block text-zinc-400 mb-2 text-lg">Paste CN List</label>
            <textarea
              id="I.pasteTextArea"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="TBOX 663566&#10;GBRX 123456&#10;BNSF789012&#10;..."
              className="w-full bg-zinc-800 text-white text-base md:text-lg px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none font-mono min-h-48 resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* I.previewBtn */}
            <button
              id="I.previewBtn"
              onClick={handlePreview}
              disabled={!pasteText.trim()}
              className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
                pasteText.trim()
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              Preview Import
            </button>

            {/* I.clearBtn */}
            <button
              id="I.clearBtn"
              onClick={handleClear}
              className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Preview Results */}
          {preview && (
            <div className="space-y-4">
              {/* I.willAddSection */}
              <div id="I.willAddSection" ref={willAddSectionRef} className="bg-zinc-800 rounded-xl p-5">
                <h3 className="text-xl font-bold text-green-400 mb-3">
                  Will Add ({preview.toAdd.length})
                </h3>
                {preview.toAdd.length === 0 ? (
                  <p className="text-zinc-500 text-base">No new cars to add</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {preview.toAdd.map((car, idx) => {
                      const isExpanded = expandedCars.has(car.normalized);
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleCarExpand(car.normalized)}
                          className="w-full bg-zinc-900 p-3 rounded-lg text-left hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-lg">{car.normalized}</span>
                            <svg
                              className={`w-5 h-5 text-zinc-500 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-zinc-700 space-y-2 text-sm">
                              <div>
                                <span className="text-zinc-500">Normalized: </span>
                                <span className="text-zinc-300 font-mono">{car.normalized}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500">Source: </span>
                                <span className="text-zinc-400 break-all">
                                  {car.source || "(not available)"}
                                </span>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* I.skippedSection */}
              <div id="I.skippedSection" className="bg-zinc-800 rounded-xl p-5">
                <h3 className="text-xl font-bold text-yellow-400 mb-3">
                  Skipped - Already on list ({preview.skipped.length})
                </h3>
                {preview.skipped.length === 0 ? (
                  <p className="text-zinc-500 text-base">No duplicates</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {preview.skipped.map((carId, idx) => (
                      <div key={idx} className="bg-zinc-900 p-3 rounded-lg">
                        <span className="font-mono text-base text-zinc-400">{carId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* I.unrecognizedSection */}
              <div id="I.unrecognizedSection" className="bg-zinc-800 rounded-xl p-5">
                <h3 className="text-xl font-bold text-red-400 mb-3">
                  Unrecognized Lines ({preview.unrecognized.length})
                </h3>
                {preview.unrecognized.length === 0 ? (
                  <p className="text-zinc-500 text-base">All lines recognized</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {preview.unrecognized.map((line, idx) => (
                      <div key={idx} className="bg-zinc-900 p-3 rounded-lg">
                        <span className="text-sm text-zinc-500 break-all">
                          {line.length > 80 ? `${line.substring(0, 80)}...` : line}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar - Shows ONLY after preview */}
      {preview && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-10">
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex gap-3">
              {/* I.backToEditBtn */}
              <button
                id="I.backToEditBtn"
                onClick={handleBackToEdit}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Back to Edit
              </button>

              {/* I.confirmAddCarsBtn */}
              <button
                id="I.confirmAddCarsBtn"
                onClick={handleConfirmClick}
                disabled={preview.toAdd.length === 0 && selectedDuplicates.size === 0}
                className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
                  preview.toAdd.length > 0 || selectedDuplicates.size > 0
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                }`}
              >
                Confirm & Add Cars
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Confirmation Dialog - No Duplicates */}
      {showConfirmDialog && preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            {/* I.confirmDialogTitle */}
            <h2 id="I.confirmDialogTitle" className="text-2xl font-bold mb-4">
              Add Cars to Track
            </h2>

            {/* I.confirmDialogBody */}
            <p id="I.confirmDialogBody" className="text-zinc-400 text-lg mb-6">
              Add {preview.toAdd.length} cars to track {track.name}?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                id="I.confirmAddBtn"
                onClick={handleSimpleConfirm}
                className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors"
              >
                Add Cars
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Detection Dialog */}
      {showDuplicateDialog && preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            {/* I.duplicateDialogTitle */}
            <h2 id="I.duplicateDialogTitle" className="text-2xl font-bold mb-4">
              Duplicates Detected
            </h2>

            {/* I.duplicateDialogBody */}
            <p id="I.duplicateDialogBody" className="text-zinc-400 text-lg mb-4">
              Some cars already exist on this track. What would you like to do?
            </p>

            <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-base">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Will Add:</span>
                  <span className="font-semibold text-green-400">{preview.toAdd.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Duplicates:</span>
                  <span className="font-semibold text-yellow-400">{preview.skipped.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                id="I.addNewOnlyBtn"
                onClick={handleAddNewOnly}
                className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors"
              >
                Add new cars only (recommended)
              </button>

              <button
                id="I.addEverythingBtn"
                onClick={handleAddEverything}
                className="w-full py-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-lg font-medium transition-colors"
              >
                Add everything (including duplicates)
              </button>

              <button
                id="I.reviewDuplicatesBtn"
                onClick={handleReviewDuplicates}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-medium transition-colors"
              >
                Review duplicates
              </button>

              <button
                onClick={() => setShowDuplicateDialog(false)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Review Checklist */}
      {showDuplicateReview && preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6 my-8">
            {/* I.reviewTitle */}
            <h2 id="I.reviewTitle" className="text-2xl font-bold mb-4">
              Review Duplicates
            </h2>

            {/* I.reviewSubtext */}
            <p id="I.reviewSubtext" className="text-zinc-400 text-base mb-6">
              Select which duplicate cars to include anyway:
            </p>

            {/* I.duplicateCheckList */}
            <div id="I.duplicateCheckList" className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {preview.skipped.map((carId) => {
                const isSelected = selectedDuplicates.has(carId);
                return (
                  <button
                    key={carId}
                    onClick={() => toggleDuplicate(carId)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 p-4 rounded-lg text-left transition-colors flex items-center gap-4"
                  >
                    {/* Checkbox */}
                    <div className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-green-600 border-green-600"
                        : "border-zinc-600"
                    }`}>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <span className="font-mono text-lg">{carId}</span>
                      <p className="text-sm text-zinc-500">Include anyway</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDuplicateReview(false);
                  setShowDuplicateDialog(true);
                }}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Back
              </button>

              <button
                id="I.confirmSelectionBtn"
                onClick={handleConfirmDuplicateSelection}
                className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors"
              >
                Confirm ({preview.toAdd.length + selectedDuplicates.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* I.importToast */}
      {importToast && (
        <div id="I.importToast" className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-4 rounded-lg shadow-lg z-50 border border-zinc-700">
          <p className="text-base md:text-lg font-medium">{importToast}</p>
        </div>
      )}
    </div>
  );
}