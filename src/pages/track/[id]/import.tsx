import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useState } from "react";
import { extractCarIds, computeImportBuckets } from "@/lib/carImportParser";

interface PreviewData {
  toAdd: string[];
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
    const existingToday = track.cars.map(car => car.carNumber);

    // TODO: Load existing snapshot when snapshot feature is implemented
    const existingSnapshot: string[] = [];

    // Compute buckets
    const buckets = computeImportBuckets(recognized, existingToday, existingSnapshot);

    setPreview({
      toAdd: buckets.toAdd,
      skipped: buckets.skipped,
      unrecognized,
    });
  };

  const handleClear = () => {
    setPasteText("");
    setPreview(null);
  };

  const handleCancel = () => {
    router.push(`/track/${id}`);
  };

  const handleConfirmImport = () => {
    if (!preview || preview.toAdd.length === 0) return;

    // Add all new cars to the track
    preview.toAdd.forEach(carNumber => {
      addCar(track.id, {
        carNumber,
        carType: "BOX", // Default type, user can edit later
      });
    });

    // Show toast
    const message = `Imported ${preview.toAdd.length} cars. Skipped ${preview.skipped.length} duplicates.`;
    setImportToast(message);

    // Return to track detail after short delay
    setTimeout(() => {
      router.push(`/track/${id}`);
    }, 2000);
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
              <div id="I.willAddSection" className="bg-zinc-800 rounded-xl p-5">
                <h3 className="text-xl font-bold text-green-400 mb-3">
                  Will Add ({preview.toAdd.length})
                </h3>
                {preview.toAdd.length === 0 ? (
                  <p className="text-zinc-500 text-base">No new cars to add</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {preview.toAdd.map((carId, idx) => (
                      <div key={idx} className="bg-zinc-900 p-3 rounded-lg">
                        <span className="font-mono text-lg">{carId}</span>
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
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-3">
            {/* I.cancelBtn */}
            <button
              id="I.cancelBtn"
              onClick={handleCancel}
              className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
            >
              Cancel
            </button>

            {/* I.confirmImportBtn */}
            <button
              id="I.confirmImportBtn"
              onClick={handleConfirmImport}
              disabled={!preview || preview.toAdd.length === 0}
              className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
                preview && preview.toAdd.length > 0
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              Confirm Import ({preview?.toAdd.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* I.importToast */}
      {importToast && (
        <div id="I.importToast" className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-6 py-4 rounded-lg shadow-lg z-50 border border-zinc-700">
          <p className="text-base md:text-lg font-medium">{importToast}</p>
        </div>
      )}
    </div>
  );
}