import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { normalizeCarId } from "@/lib/carIdFormatter";
import { TrackPickerModal } from "@/components/TrackPickerModal";

export default function ExceptionsReview() {
  const { tracks, moveCar } = useApp();
  const router = useRouter();
  const { id } = router.query;
  
  const [selectedCars, setSelectedCars] = useState<Set<string>>(new Set());
  const [resolutions, setResolutions] = useState<Record<string, { type: "missing" | "move"; targetTrackId?: string; targetTrackName?: string }>>({});
  const [showTrackPicker, setShowTrackPicker] = useState(false);

  const track = tracks.find(t => t.id === id);
  const unconfirmedCars = track?.cars.filter(car => car.status === "pending") || [];

  if (!track) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Track not found</p>
      </div>
    );
  }

  const toggleCarSelection = (carId: string) => {
    const newSelected = new Set(selectedCars);
    if (newSelected.has(carId)) {
      newSelected.delete(carId);
    } else {
      newSelected.add(carId);
    }
    setSelectedCars(newSelected);
  };

  const markAsMissing = () => {
    const newResolutions = { ...resolutions };
    selectedCars.forEach(carId => {
      newResolutions[carId] = { type: "missing" };
    });
    setResolutions(newResolutions);
    setSelectedCars(new Set());
  };

  const handleMoveToTrack = (targetTrackId: string, targetTrackName: string) => {
    const newResolutions = { ...resolutions };
    selectedCars.forEach(carId => {
      newResolutions[carId] = { 
        type: "move", 
        targetTrackId: targetTrackId,
        targetTrackName: targetTrackName 
      };
    });
    setResolutions(newResolutions);
    setSelectedCars(new Set());
    setShowTrackPicker(false);
  };

  const clearResolution = (carId: string) => {
    const newResolutions = { ...resolutions };
    delete newResolutions[carId];
    setResolutions(newResolutions);
  };

  const allResolved = unconfirmedCars.length > 0 && unconfirmedCars.every(car => resolutions[car.id]);

  const handleFinish = () => {
    // Execute all move resolutions
    unconfirmedCars.forEach(car => {
      const resolution = resolutions[car.id];
      if (resolution?.type === "move" && resolution.targetTrackId) {
        // Execute the move using the moveCar method
        moveCar(car.id, track.id, resolution.targetTrackId, "MORNING_RECONCILE");
      }
      // Items marked "missing" remain on the track with status "pending"
      // They will show up as unconfirmed in the track's active list
    });

    // Return to Screen A (Track Select)
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* E.backBtn */}
            <button
              id="E.backBtn"
              onClick={() => router.push(`/track/${id}`)}
              className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Back to track detail"
            >
              <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
            </button>
            
            {/* E.headerTitle */}
            <h1 id="E.headerTitle" className="text-2xl md:text-3xl font-bold tracking-tight">
              Exceptions Review
            </h1>
            
            <div className="w-14 md:w-16" />
          </div>

          {/* E.trackSubtitle */}
          <p id="E.trackSubtitle" className="text-zinc-400 text-lg mb-4">
            {track.name} - {unconfirmedCars.length} unconfirmed
          </p>

          {/* Batch Actions */}
          {selectedCars.size > 0 && (
            <div className="bg-zinc-800 p-4 rounded-xl space-y-3">
              <div className="text-sm text-zinc-400 mb-2">
                {selectedCars.size} selected
              </div>

              {/* E.markMissingBtn */}
              <button
                id="E.markMissingBtn"
                onClick={markAsMissing}
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-base font-medium transition-colors"
              >
                Mark as Missing
              </button>

              {/* E.batchMoveBtn */}
              <button
                id="E.batchMoveBtn"
                onClick={() => setShowTrackPicker(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-base font-medium transition-colors"
              >
                Move to Track
              </button>
            </div>
          )}
        </div>
      </div>

      {/* E.carList */}
      <div id="E.carList" className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {unconfirmedCars.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-xl md:text-2xl">All cars confirmed!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unconfirmedCars.map(car => {
                const isSelected = selectedCars.has(car.id);
                const resolution = resolutions[car.id];

                return (
                  <div
                    key={car.id}
                    className="E.carRow bg-zinc-800 p-5 md:p-6 rounded-xl"
                  >
                    <div className="flex items-start gap-4">
                      {/* E.selectCheckbox */}
                      <button
                        id="E.selectCheckbox"
                        onClick={() => toggleCarSelection(car.id)}
                        className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-green-600 border-green-600"
                            : "border-zinc-600 hover:border-zinc-500"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        {/* E.carNumber */}
                        <div className="E.carNumber text-3xl md:text-4xl font-bold font-mono mb-1">
                          {normalizeCarId(car.carNumber)}
                        </div>
                        
                        <div className="text-zinc-400 text-base md:text-lg mb-2">
                          {car.carType}
                        </div>

                        {/* E.resolutionTag */}
                        {resolution && (
                          <div className="flex items-center gap-2">
                            {resolution.type === "missing" ? (
                              <div className="E.resolutionTag inline-flex items-center gap-2 bg-yellow-600/20 text-yellow-500 px-3 py-1.5 rounded-lg text-sm font-medium">
                                <AlertTriangle className="w-4 h-4" />
                                Missing
                              </div>
                            ) : (
                              <div className="E.resolutionTag inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-medium">
                                Move → {resolution.targetTrackName}
                              </div>
                            )}
                            <button
                              onClick={() => clearResolution(car.id)}
                              className="p-1 hover:bg-zinc-700 rounded transition-colors"
                              aria-label="Clear resolution"
                            >
                              <X className="w-4 h-4 text-zinc-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* E.finishBtn */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <button
            id="E.finishBtn"
            onClick={handleFinish}
            disabled={!allResolved}
            className={`w-full py-4 md:py-5 rounded-xl text-xl md:text-2xl font-bold transition-colors ${
              allResolved
                ? "bg-green-600 hover:bg-green-700"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Finish Review
          </button>
        </div>
      </div>

      {/* Track Picker Modal */}
      {showTrackPicker && (
        <TrackPickerModal
          onSelectTrack={handleMoveToTrack}
          onCancel={() => setShowTrackPicker(false)}
          excludeTrackId={track?.id}
          title="Move to which track?"
        />
      )}
    </div>
  );
}