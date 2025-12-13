import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, Plus, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { UnconfirmDialog } from "@/components/UnconfirmDialog";

export default function TrackDetail() {
  const { tracks, confirmCar, unconfirmCar, settings } = useApp();
  const router = useRouter();
  const { id } = router.query;
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUnconfirmedOnly, setShowUnconfirmedOnly] = useState(false);
  const [unconfirmDialogCar, setUnconfirmDialogCar] = useState<{ trackId: string; carId: string; carNumber: string } | null>(null);

  const track = tracks.find(t => t.id === id);

  if (!track) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Track not found</p>
      </div>
    );
  }

  const handleToggleConfirm = (carId: string, currentStatus: string, carNumber: string) => {
    if (currentStatus === "confirmed") {
      if (settings.requireUnconfirmDialog) {
        setUnconfirmDialogCar({ trackId: track.id, carId, carNumber });
      } else {
        unconfirmCar(track.id, carId);
      }
    } else {
      confirmCar(track.id, carId);
    }
  };

  const handleUnconfirmConfirmed = () => {
    if (unconfirmDialogCar) {
      unconfirmCar(unconfirmDialogCar.trackId, unconfirmDialogCar.carId);
      setUnconfirmDialogCar(null);
    }
  };

  const filteredCars = showUnconfirmedOnly 
    ? track.cars.filter(car => car.status === "pending")
    : track.cars;

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
            {/* B.backBtn */}
            <button
              id="B.backBtn"
              onClick={() => router.push("/")}
              className="p-3 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Back to track list"
            >
              <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
            </button>
            
            {/* B.trackTitle */}
            <h1 id="B.trackTitle" className="text-2xl md:text-3xl font-bold tracking-tight">
              {track.name}
            </h1>
            
            <div className="w-14 md:w-16" />
          </div>

          {/* B.progressText */}
          <div id="B.progressText" className="bg-zinc-800 p-4 rounded-xl mb-4">
            <div className="flex justify-between items-center text-lg md:text-xl">
              <span className="text-zinc-400">Progress:</span>
              <span className="font-mono font-bold text-2xl md:text-3xl">
                {track.confirmedCars} / {track.totalCars}
              </span>
            </div>
          </div>

          {/* B.filterToggle */}
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
      <div id="B.carList" className="flex-1 overflow-y-auto pb-24">
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
              {filteredCars.map(car => (
                <button
                  key={car.id}
                  onClick={() => handleToggleConfirm(car.id, car.status, car.carNumber)}
                  className="B.carRow w-full bg-zinc-800 hover:bg-zinc-700 p-5 md:p-6 rounded-xl text-left transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* B.confirmStateIcon */}
                    <div className="B.confirmStateIcon flex-shrink-0">
                      {car.status === "confirmed" ? (
                        <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
                      ) : (
                        <Circle className="w-8 h-8 md:w-10 md:h-10 text-zinc-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* B.carNumber */}
                      <div className="B.carNumber text-3xl md:text-4xl font-bold font-mono mb-1">
                        {car.carNumber}
                      </div>
                      
                      <div className="text-zinc-400 text-base md:text-lg mb-1">
                        {car.carType}
                      </div>

                      {/* B.lastConfirmedText */}
                      {car.status === "confirmed" && car.confirmedAt && (
                        <div className="B.lastConfirmedText text-zinc-500 text-sm md:text-base">
                          Confirmed {formatConfirmedTime(car.confirmedAt)}
                          {car.confirmedBy && ` by ${car.confirmedBy}`}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* B.addCarFab */}
      <button
        id="B.addCarFab"
        onClick={() => setShowAddModal(true)}
        className="fixed right-4 md:right-8 bottom-24 md:bottom-28 w-16 h-16 md:w-20 md:h-20 bg-green-600 hover:bg-green-700 rounded-full shadow-lg flex items-center justify-center transition-colors z-20"
        aria-label="Add car"
      >
        <Plus className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </button>

      {/* B.doneBtn */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <button
            id="B.doneBtn"
            onClick={() => router.push("/")}
            className="w-full py-4 md:py-5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xl md:text-2xl font-bold transition-colors"
          >
            Done
          </button>
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
          carNumber={unconfirmDialogCar.carNumber}
          onCancel={() => setUnconfirmDialogCar(null)}
          onConfirm={handleUnconfirmConfirmed}
        />
      )}
    </div>
  );
}

function AddCarModal({ trackId, onClose }: { trackId: string; onClose: () => void }) {
  const { addCar } = useApp();
  const [carNumber, setCarNumber] = useState("");
  const [carType, setCarType] = useState("BOX");

  const carTypes = ["BOX", "TANK", "FLAT", "HOPPER", "GONDOLA", "AUTO"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (carNumber.trim()) {
      addCar(trackId, {
        carNumber: carNumber.trim(),
        carType,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Add Car</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-zinc-400 mb-2 text-lg">Car Number</label>
              <input
                type="text"
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value)}
                className="w-full bg-zinc-800 text-white text-2xl font-mono px-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                placeholder="123456"
                autoFocus
              />
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
                type="submit"
                className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium"
              >
                Add Car
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}