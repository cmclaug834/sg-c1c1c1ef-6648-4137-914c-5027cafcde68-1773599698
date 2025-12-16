interface DuplicateCarDialogProps {
  carNumber: string;
  existingTrackName: string;
  onContinue: () => void;
  onReenter: () => void;
  onRemoveExisting: () => void;
  onCancel?: () => void;
}

export function DuplicateCarDialog({
  carNumber,
  existingTrackName,
  onContinue,
  onReenter,
  onRemoveExisting,
  onCancel,
}: DuplicateCarDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
        {/* Y.dialogTitle */}
        <h2 id="Y.dialogTitle" className="text-2xl font-bold mb-4">
          Duplicate car detected
        </h2>

        {/* Y.dialogBody */}
        <div id="Y.dialogBody" className="text-zinc-400 text-lg mb-6">
          <p className="mb-2">
            Car <span className="font-mono font-semibold text-white">{carNumber}</span> already exists on: <span className="font-mono font-semibold text-white">{existingTrackName}</span>
          </p>
          <p>What would you like to do?</p>
        </div>

        <div className="space-y-3">
          {/* Y.continueBtn */}
          <button
            id="Y.continueBtn"
            onClick={onContinue}
            className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors"
          >
            Add duplicate anyway
          </button>

          {/* Y.removeExistingBtn */}
          <button
            id="Y.removeExistingBtn"
            onClick={onRemoveExisting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
          >
            Remove existing
          </button>

          {/* Y.reenterBtn */}
          <button
            id="Y.reenterBtn"
            onClick={onReenter}
            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
          >
            Re-enter
          </button>

          {/* Y.cancelBtn (optional) */}
          {onCancel && (
            <button
              id="Y.cancelBtn"
              onClick={onCancel}
              className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}