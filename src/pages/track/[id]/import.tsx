 
import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useState, useRef } from "react";
import { extractCarIds, computeImportBuckets } from "@/lib/carImportParser";
import { normalizeCarId } from "@/lib/carIdFormatter";
import type { ExtractedCar } from "@/lib/carImportParser";

interface PreviewData {
  toAdd: ExtractedCar[];
  skipped: string[];
  unrecognized: string[];
  tankCount: number;
}

export default function ImportCars() {
  const { tracks, addCar } = useApp();
  const router = useRouter();
  const { id } = router.query;

  const [pasteText, setPasteText] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importToast, setImportToast] = useState<string | null>(null);
  const willAddSectionRef = useRef<HTMLDivElement>(null);

  // Safe guard for missing id
  if (!id || Array.isArray(id)) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Invalid track ID</p>
      </div>
    );
  }

  const trackId = String(id);
  const track = tracks.find(t => t.id === trackId);

  if (!track) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Track not found</p>
      </div>
    );
  }

  const handlePreview = () => {
    const { recognized, unrecognized } = extractCarIds(pasteText);

    // Normalize existing car numbers for comparison
    const existingToday = track.cars.map(car => normalizeCarId(car.carNumber));

    const existingSnapshot: string[] = [];

    const buckets = computeImportBuckets(recognized, existingToday, existingSnapshot);

    const toAddWithSource = recognized.filter(car => 
      buckets.toAdd.includes(car.normalized)
    );

    // Count tank cars that need type confirmation
    const tankCount = toAddWithSource.filter(car => car.detectedType === "TANK").length;

    setPreview({
      toAdd: toAddWithSource,
      skipped: buckets.skipped,
      unrecognized,
      tankCount,
    });

    setTimeout(() => {
      willAddSectionRef.current?.scrollIntoView({ 
        behavior: "smooth", 
        block: "start" 
      });
    }, 100);
  };

  const handleClear = () => {
    setPasteText("");
    setPreview(null);
  };

  const handleCancel = () => {
    router.push(`/track/${trackId}`);
  };

  const handleAddCars = () => {
    if (!preview || preview.toAdd.length === 0) return;

    // Add all cars from toAdd list with detected types
    preview.toAdd.forEach(car => {
      addCar(track.id, {
        carNumber: car.normalized,
        carType: car.detectedType || "BOX",
        tankType: car.detectedType === "TANK" ? undefined : undefined,
      });
    });

    const tankWarning = preview.tankCount > 0 
      ? ` ⚠️ ${preview.tankCount} tank ${preview.tankCount === 1 ? 'car' : 'cars'} require type confirmation during yard check.`
      : "";

    setImportToast(`Added ${preview.toAdd.length} cars to ${track.name}.${tankWarning}`);

    // Return to track detail after delay
    setTimeout(() => {
      router.push(`/track/${trackId}`);
    }, 3000);
  };

  const handleBackToEdit = () => {
    setPreview(null);
  };

  const getCarTypeBadge = (car: ExtractedCar) => {
    if (car.detectedType === "TANK") {
      return "TANK — (?)";
    }
    return car.detectedType || "BOX";
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
            Paste car list from CN. Existing cars will be skipped.
          </p>

          {/* Tank Warning Banner */}
          {!preview && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-zinc-400">
                Tank cars will be imported with unknown type and must be confirmed during yard check.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-44">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* I.pasteTextArea */}
          <div className="mb-6">
            <label className="block text-zinc-400 mb-2 text-lg">Paste Car List</label>
            <textarea
              id="I.pasteTextArea"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste car list here…&#10;Example:&#10;TBOX663566&#10;DTTX401992&#10;UTLX302144"
              className="w-full bg-zinc-800 text-white text-base md:text-lg px-4 py-4 rounded-lg border-2 border-dashed border-zinc-700 focus:border-zinc-600 focus:outline-none font-mono min-h-48 resize-y"
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
              {/* Tank Warning Summary */}
              {preview.tankCount > 0 && (
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">
                      {preview.tankCount} tank {preview.tankCount === 1 ? 'car' : 'cars'} detected
                    </p>
                    <p className="text-sm text-yellow-500/80 mt-1">
                      Tank type can be assigned during yard check.
                    </p>
                  </div>
                </div>
              )}

              {/* I.willAddSection */}
              <div id="I.willAddSection" ref={willAddSectionRef} className="bg-zinc-800 rounded-xl p-5">
                <h3 className="text-xl font-bold text-green-400 mb-3">
                  Will Add ({preview.toAdd.length})
                </h3>
                {preview.toAdd.length === 0 ? (
                  <p className="text-zinc-500 text-base">No new cars to add</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {preview.toAdd.map((car, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-900 p-3 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          {car.detectedType === "TANK" && (
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-mono text-lg block">{car.normalized}</span>
                            <span className="text-sm text-zinc-500">{car.detectedType || "BOX"}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          car.detectedType === "TANK"
                            ? "bg-yellow-600/20 text-yellow-400"
                            : "bg-zinc-700 text-zinc-400"
                        }`}>
                          {getCarTypeBadge(car)}
                        </span>
                      </div>
                    ))}
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

              {/* Inline Action Row */}
              <div className="bg-zinc-800 rounded-xl p-5">
                <div className="flex gap-3">
                  {/* I.inlineBackToEditBtn */}
                  <button
                    id="I.inlineBackToEditBtn"
                    onClick={handleBackToEdit}
                    className="flex-1 py-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-lg font-medium transition-colors"
                  >
                    Discard Import
                  </button>

                  {/* I.inlineAddCarsBtn */}
                  <button
                    id="I.inlineAddCarsBtn"
                    onClick={handleAddCars}
                    disabled={preview.toAdd.length === 0}
                    className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
                      preview.toAdd.length > 0
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    Confirm Import
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      {preview && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex gap-3">
              {/* I.backToEditBtn */}
              <button
                id="I.backToEditBtn"
                onClick={handleBackToEdit}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Discard Import
              </button>

              {/* I.addCarsBtn */}
              <button
                id="I.addCarsBtn"
                onClick={handleAddCars}
                disabled={preview.toAdd.length === 0}
                className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
                  preview.toAdd.length > 0
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                }`}
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* I.importToast */}
      {importToast && (
        <div id="I.importToast" className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-4 rounded-lg shadow-lg z-50 border border-zinc-700 max-w-md">
          <p className="text-base md:text-lg font-medium">{importToast}</p>
        </div>
      )}
    </div>
  );
}