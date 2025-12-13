import { useApp } from "@/contexts/AppContext";
import { useRouter } from "next/router";
import { ArrowLeft, Plus, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

export default function TrackDetail() {
  const { tracks, confirmCar, unconfirmCar } = useApp();
  const router = useRouter();
  const { id } = router.query;
  const [showAddModal, setShowAddModal] = useState(false);

  const track = tracks.find(t => t.id === id);

  if (!track) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p className="text-xl text-zinc-400">Track not found</p>
      </div>
    );
  }

  const handleToggleConfirm = (carId: string, currentStatus: string) => {
    if (currentStatus === "confirmed") {
      unconfirmCar(track.id, carId);
    } else {
      confirmCar(track.id, carId);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/")}
            className="p-3 hover:bg-zinc-800 rounded-lg"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-3xl font-bold tracking-tight">{track.name}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-3 bg-green-600 hover:bg-green-700 rounded-lg"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <div className="bg-zinc-800 p-4 rounded-xl mb-6">
          <div className="flex justify-between text-lg">
            <span className="text-zinc-400">Progress:</span>
            <span className="font-mono font-bold">
              {track.confirmedCars} / {track.totalCars}
            </span>
          </div>
        </div>

        {track.cars.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-xl mb-2">No cars on this track</p>
            <p>Tap + to add a car</p>
          </div>
        ) : (
          <div className="space-y-3">
            {track.cars.map(car => (
              <button
                key={car.id}
                onClick={() => handleToggleConfirm(car.id, car.status)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {car.status === "confirmed" ? (
                        <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-7 h-7 text-zinc-600 flex-shrink-0" />
                      )}
                      <span className="text-2xl font-bold font-mono">{car.carNumber}</span>
                    </div>
                    <div className="ml-10 text-zinc-400">
                      {car.carType}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddCarModal
          trackId={track.id}
          onClose={() => setShowAddModal(false)}
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