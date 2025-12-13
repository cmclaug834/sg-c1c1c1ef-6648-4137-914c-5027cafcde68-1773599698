import { normalizeCarId } from "@/lib/carIdFormatter";

interface UnconfirmDialogProps {
  carNumber: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function UnconfirmDialog({ carNumber, onCancel, onConfirm }: UnconfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
        {/* X.dialogTitle */}
        <h2 id="X.dialogTitle" className="text-2xl font-bold mb-4">
          Unconfirm this car?
        </h2>

        {/* X.dialogBody */}
        <p id="X.dialogBody" className="text-zinc-400 text-lg mb-2">
          This will mark the car as not confirmed.
        </p>
        
        <p className="text-zinc-500 text-base mb-6">
          Car: <span className="font-mono font-semibold">{normalizeCarId(carNumber)}</span>
        </p>

        <div className="flex gap-3">
          {/* X.cancelBtn */}
          <button
            id="X.cancelBtn"
            onClick={onCancel}
            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            Cancel
          </button>

          {/* X.unconfirmBtn */}
          <button
            id="X.unconfirmBtn"
            onClick={onConfirm}
            className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
          >
            Unconfirm
          </button>
        </div>
      </div>
    </div>
  );
}