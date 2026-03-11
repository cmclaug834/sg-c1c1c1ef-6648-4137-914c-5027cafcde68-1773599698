import { Track, RailCar } from "@/types";
import { X, AlertTriangle } from "lucide-react";

interface OutboundConfirmDialogProps {
  tracks: Array<{ track: Track; cars: RailCar[] }>;
  onConfirm: (trackId: string) => void;
  onCancel: () => void;
}

export function OutboundConfirmDialog({
  tracks,
  onConfirm,
  onCancel,
}: OutboundConfirmDialogProps) {
  if (tracks.length === 0) return null;

  const handleConfirmAll = () => {
    tracks.forEach(({ track }) => onConfirm(track.id));
  };

  const totalCars = tracks.reduce((sum, { cars }) => sum + cars.length, 0);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl border border-zinc-800 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-yellow-500" />
            <h2 className="text-2xl font-bold">Daily Outbound Confirmation</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-zinc-400 text-lg mb-6">
            The following outbound tracks have cars staged for departure. 
            Confirm these cars have left the site to archive them.
          </p>

          <div className="space-y-6">
            {tracks.map(({ track, cars }) => (
              <div key={track.id} className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">
                      {track.displayName || track.name}
                    </h3>
                    <p className="text-zinc-500 text-sm mt-1">
                      {cars.length} car{cars.length !== 1 ? "s" : ""} ready for departure
                    </p>
                  </div>
                  <button
                    onClick={() => onConfirm(track.id)}
                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg text-base font-medium transition-colors"
                  >
                    Confirm Departed
                  </button>
                </div>

                {/* Car List */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                  {cars.map((car) => (
                    <div
                      key={car.id}
                      className="bg-zinc-900 px-3 py-2 rounded-lg text-sm font-mono"
                    >
                      {car.carNumber}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 p-6">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={handleConfirmAll}
              className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors"
            >
              Confirm All Departed ({totalCars})
            </button>
          </div>
          <p className="text-zinc-500 text-sm text-center mt-3">
            Cars will be moved to archive history
          </p>
        </div>
      </div>
    </div>
  );
}