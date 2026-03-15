import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, X } from "lucide-react";
import { useState, useEffect } from "react";
import { normalizeCarId } from "@/lib/carIdFormatter";
import { RailCar } from "@/types";

export default function TrackReorder() {
  const { tracks, commitTrackOrder } = useApp();
  const router = useRouter();
  const { id } = router.query;

  // Normalize route param
  const trackId = Array.isArray(id) ? id[0] : id;

  // Find track by id (not name)
  const track = tracks.find(t => t.id === trackId);
  
  const [leftCars, setLeftCars] = useState<RailCar[]>([]);
  const [rightCars, setRightCars] = useState<RailCar[]>([]);

  // Initialize reorder state when track is available
  useEffect(() => {
    if (track) {
      setLeftCars([...track.cars]);
      setRightCars([]);
    }
  }, [track]);

  // Loading guard: wait for router and data to be ready
  if (!router.isReady || !trackId || tracks.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Loading…</p>
      </div>
    );
  }

  // Show fallback if track not found (after loading completes)
  if (!track) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Track not found</p>
      </div>
    );
  }

  const handleLeftCarTap = (car: RailCar) => {
    // Move from left to end of right
    setLeftCars(prev => prev.filter(c => c.id !== car.id));
    setRightCars(prev => [...prev, car]);
  };

  const handleRightRemove = (car: RailCar) => {
    // Move from right back to left
    setRightCars(prev => prev.filter(c => c.id !== car.id));
    setLeftCars(prev => [...prev, car]);
  };

  const handleReset = () => {
    // Reset to original order
    if (track) {
      setLeftCars([...track.cars]);
      setRightCars([]);
    }
  };

  const handleConfirm = () => {
    // Commit the new order: right panel first, then remaining left panel
    const finalOrder = [...rightCars, ...leftCars];
    commitTrackOrder(track.id, finalOrder);
    router.push(`/track/${track.id}`);
  };

  const handleCancel = () => {
    router.push(`/track/${track.id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-safe-bottom-nav">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold">Reorder: {track.name}</h1>
          </div>

          {/* Action Buttons - Sticky at Top */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleReset}
              className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-base font-medium transition-colors"
            >
              Reset
            </button>

            <button
              onClick={handleCancel}
              className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-base font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={rightCars.length === 0}
              className={`py-3 rounded-lg text-base font-medium transition-colors ${
                rightCars.length > 0
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-zinc-800/50 p-4 rounded-lg mb-6">
          <p className="text-zinc-300 text-sm md:text-base">
            Drag cars from left to right to set new order. Top of right list = first position on track.
          </p>
        </div>

        {/* G.splitContainer */}
        <div id="G.splitContainer" className="flex-1 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 py-4 h-full">
            <div className="grid md:grid-cols-2 gap-4 h-full">
              {/* Left Side - Current Order */}
              <div className="flex flex-col bg-zinc-800 rounded-xl p-4 h-full">
                {/* G.leftTitle */}
                <h2 id="G.leftTitle" className="text-xl font-bold mb-4 text-zinc-300">
                  Current order
                </h2>

                {/* G.leftList */}
                <div id="G.leftList" className="flex-1 overflow-y-auto space-y-2">
                  {leftCars.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <p className="text-base">All cars moved to new order</p>
                    </div>
                  ) : (
                    leftCars.map((car, index) => (
                      <button
                        key={car.id}
                        onClick={() => handleLeftCarTap(car)}
                        className="G.leftRow w-full bg-zinc-900 hover:bg-zinc-700 p-4 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          {/* G.leftCarId */}
                          <span className="G.leftCarId text-2xl font-mono font-bold">
                            {normalizeCarId(car.carNumber)}
                          </span>
                          
                          {/* G.leftTapHint */}
                          <span className="G.leftTapHint text-sm text-zinc-500">
                            Tap to add →
                          </span>
                        </div>
                        <div className="text-zinc-500 text-sm mt-1">
                          #{index + 1} · {car.carType}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right Side - New Order */}
              <div className="flex flex-col bg-zinc-800 rounded-xl p-4 h-full">
                {/* G.rightTitle */}
                <h2 id="G.rightTitle" className="text-xl font-bold mb-4 text-green-400">
                  New order
                </h2>

                {/* G.rightList */}
                <div id="G.rightList" className="flex-1 overflow-y-auto space-y-2">
                  {rightCars.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <p className="text-base">Tap cars to build new order</p>
                    </div>
                  ) : (
                    rightCars.map((car, index) => (
                      <div
                        key={car.id}
                        className="G.rightRow bg-zinc-900 p-4 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            {/* G.rightCarId */}
                            <span className="G.rightCarId text-2xl font-mono font-bold block">
                              {normalizeCarId(car.carNumber)}
                            </span>
                            <div className="text-zinc-500 text-sm mt-1">
                              #{index + 1} · {car.carType}
                            </div>
                          </div>
                          
                          {/* G.rightRemoveBtn */}
                          <button
                            id="G.rightRemoveBtn"
                            onClick={() => handleRightRemove(car)}
                            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors ml-2"
                            aria-label="Remove from new order"
                          >
                            <X className="w-6 h-6 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}