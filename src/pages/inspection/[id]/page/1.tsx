import { useRouter } from "next/router";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { Inspection } from "@/types/inspection";
import { useApp } from "@/contexts/AppContext";

const REJECT_REASONS = [
  "DOORS are unusable",
  "HOLES in Roof, Floor or Walls",
  "RAILCAR IS DIRTY (excessive cleaning, evidence of tar, metal, oil etc.)",
  "repugnant ODOR",
  "IRREGULARITIES (rust holes, holes from nails/bolts protruding, unremoved shipping straps, etc.)",
];

export default function InspectionPage1() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useApp();
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [acceptReject, setAcceptReject] = useState<"yes" | "no" | undefined>(undefined);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (currentUser === null) {
      router.push("/");
      return;
    }
    
    if (typeof id === "string") {
      const loaded = inspectionStorage.getInspection(id);
      if (loaded) {
        setInspection(loaded);
        setAcceptReject(loaded.acceptReject);
        setRejectReason(loaded.rejectReason || "");
      }
    }
  }, [mounted, id, currentUser, router]);

  if (!mounted || !currentUser || !inspection) {
    return null;
  }

  const handleBack = () => {
    // Step 1 - show exit confirmation
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    router.push("/inspections");
  };

  const handleFieldUpdate = (field: string, value: any) => {
    // Update local state
    if (field === "acceptReject") {
      setAcceptReject(value);
    } else if (field === "rejectReason") {
      setRejectReason(value);
    }

    // Auto-save to storage with debounce
    inspectionStorage.updateInspectionDebounced(inspection.id, {
      [field]: value,
    });
  };

  const handleNext = () => {
    if (!acceptReject) return;
    if (acceptReject === "no" && !rejectReason) return;

    // Check if signature exists
    if (!inspection.inspectorSignatures?.initial?.signatureDataUrl) {
      // Show signature modal
      setShowSignatureModal(true);
      return;
    }

    // Move to step 2
    inspectionStorage.updateInspection(inspection.id, {
      currentStep: 2,
      status: "in_progress",
    });

    router.push(`/inspection/${inspection.id}/page/2`);
  };

  const handleMediaStub = () => {
    alert("Media capture coming soon");
  };

  const handleActionStub = (action: string) => {
    alert(`${action} coming soon`);
  };

  const canProceed = acceptReject && 
    (acceptReject === "yes" || rejectReason) &&
    inspection.inspectorSignatures?.initial?.signatureDataUrl;

  const getCompletionScore = () => {
    let completed = 0;
    const total = 2;
    
    if (acceptReject) {
      if (acceptReject === "yes" || (acceptReject === "no" && rejectReason)) {
        completed++;
      }
    }
    
    if (inspection.inspectorSignatures?.initial?.signatureDataUrl) {
      completed++;
    }
    
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  };

  const score = getCompletionScore();

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Accept/Reject</h1>
              <div className="text-sm text-zinc-400">
                Step 1/4 • {score.percentage}% ({score.completed}/{score.total})
              </div>
            </div>
            <p className="text-zinc-500 text-sm">
              {inspection.carNumber || "No car number"}
            </p>
          </div>
        </div>

        {/* Question Section */}
        <div className="space-y-6">
          
          {/* Accept/Reject Question */}
          <div>
            <h2 className="text-lg font-medium mb-4">
              Accept / Reject
            </h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  handleFieldUpdate("acceptReject", "yes");
                  handleFieldUpdate("rejectReason", "");
                }}
                className={`py-6 rounded-lg text-lg font-bold transition-colors ${
                  acceptReject === "yes"
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleFieldUpdate("acceptReject", "no")}
                className={`py-6 rounded-lg text-lg font-bold transition-colors ${
                  acceptReject === "no"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                No
              </button>
            </div>

            {/* Reject Reason */}
            {acceptReject === "no" && (
              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Reason for Reject <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowRejectSheet(true)}
                  className="w-full bg-zinc-800 text-left px-4 py-4 rounded-lg border-2 border-zinc-700 flex items-center justify-between group hover:border-zinc-600 transition-colors"
                >
                  <span className={rejectReason ? "text-white text-sm" : "text-zinc-500"}>
                    {rejectReason || "Select reason..."}
                  </span>
                  <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 flex-shrink-0" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleActionStub("Add note")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Add note
            </button>
            <button
              type="button"
              onClick={handleMediaStub}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Media
            </button>
            <button
              type="button"
              onClick={() => handleActionStub("Action")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Action
            </button>
            <button
              type="button"
              onClick={() => handleActionStub("History")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              History
            </button>
          </div>

          {/* Required Photos Section */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <p className="text-sm text-zinc-300 mb-3">
              PICTURE(s) of 1) Exterior doorway with railcar number; 2) Interior each side from doorway
            </p>
            <button
              type="button"
              onClick={handleMediaStub}
              className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors"
            >
              ADD MEDIA
            </button>
            <p className="text-xs text-zinc-500 mt-2 text-center">
              Media capture coming soon
            </p>
          </div>

          {/* Initial Signature Section */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">
              Inspector Signature (Initial) <span className="text-red-500">*</span>
            </h3>
            
            {inspection.inspectorSignatures?.initial?.signatureDataUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-green-500 font-medium">Signed</span>
                  {inspection.inspectorSignatures.initial.signedAt && (
                    <span className="text-xs text-zinc-500">
                      {new Date(inspection.inspectorSignatures.initial.signedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={inspection.inspectorSignatures.initial.signatureDataUrl}
                    alt="Initial signature"
                    className="w-full h-32 object-contain"
                  />
                </div>
                <div className="text-sm text-zinc-400">
                  {inspection.inspectorSignatures.initial.fullName && (
                    <p>Signed by: {inspection.inspectorSignatures.initial.fullName}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(true)}
                  className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors"
                >
                  Re-sign
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center">
                    <span className="text-red-500 text-xs font-bold">!</span>
                  </div>
                  <span className="text-red-500 font-medium">Required</span>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(true)}
                  className="w-full py-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors"
                >
                  Tap to sign
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Next Button */}
        <div className="mt-12">
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full py-4 rounded-lg text-lg font-bold transition-colors ${
              canProceed
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Next
          </button>
          {!canProceed && (
            <p className="text-center text-sm text-zinc-500 mt-2">
              {!acceptReject && "Select Accept or Reject"}
              {acceptReject === "no" && !rejectReason && "Select a reject reason"}
              {acceptReject && (acceptReject === "yes" || rejectReason) && !inspection.inspectorSignatures?.initial?.signatureDataUrl && "Add initial signature to continue"}
            </p>
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border-2 border-zinc-800 p-6">
            <h3 className="text-xl font-bold mb-2">Exit Inspection?</h3>
            <p className="text-zinc-400 mb-6">
              Your progress is saved as a draft. You can resume later from the inspections list.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal (Embedded) */}
      {showSignatureModal && (
        <SignatureModal
          inspectionId={inspection.id}
          type="initial"
          currentUser={currentUser}
          onClose={() => setShowSignatureModal(false)}
          onSave={() => {
            setShowSignatureModal(false);
            // Reload inspection to get updated signature
            const updated = inspectionStorage.getInspection(inspection.id);
            if (updated) {
              setInspection(updated);
            }
          }}
        />
      )}

      {/* Reject Reason Selection Sheet */}
      {showRejectSheet && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="bg-zinc-900 rounded-t-3xl w-full max-w-2xl border-t-2 border-zinc-800 p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 flex-shrink-0" />
            <h3 className="text-xl font-bold mb-4">Reason for Reject</h3>
            <div className="space-y-2">
              {REJECT_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => {
                    handleFieldUpdate("rejectReason", reason);
                    setShowRejectSheet(false);
                  }}
                  className={`w-full text-left px-4 py-4 rounded-lg text-sm transition-colors ${
                    rejectReason === reason
                      ? "bg-green-600/20 text-green-500 border border-green-600/50"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white"
                  }`}
                >
                  {reason}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowRejectSheet(false)}
                className="w-full text-center px-4 py-4 mt-4 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Embedded Signature Modal Component
function SignatureModal({ 
  inspectionId, 
  type, 
  currentUser, 
  onClose, 
  onSave 
}: { 
  inspectionId: string;
  type: "initial" | "final";
  currentUser: any;
  onClose: () => void;
  onSave: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(false);
    ctx.closePath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsDrawing(false);
    setHasDrawn(false);
    ctx.beginPath();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (!hasDrawn) {
      alert("Please sign before saving");
      return;
    }

    try {
      const signatureDataUrl = canvas.toDataURL("image/png");
      
      // Load current inspection to preserve all fields
      const currentInspection = inspectionStorage.getInspection(inspectionId);
      if (!currentInspection) {
        alert("Inspection not found");
        return;
      }

      const signatureData = {
        fullName: currentUser.crewName,
        signatureDataUrl,
        signedAt: new Date().toISOString(),
      };

      // CRITICAL: Preserve all existing fields, only update signature
      const updates: any = {
        inspectorSignatures: {
          ...currentInspection.inspectorSignatures,
          [type]: signatureData,
        },
      };

      inspectionStorage.updateInspection(inspectionId, updates);
      onSave();
    } catch (error) {
      console.error("Error saving signature:", error);
      alert("Failed to save signature. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl border-2 border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            {type === "initial" ? "Initial Signature" : "Final Signature"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 relative">
          <div className="relative w-full h-64">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full touch-none cursor-crosshair absolute inset-0"
              style={{ touchAction: "none" }}
            />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-12 left-5 right-5 border-t-2 border-dashed border-slate-300" />
              <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-slate-500">
                Sign above the dotted line
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={clearSignature}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
          >
            Clear
          </button>
          <button
            onClick={saveSignature}
            disabled={!hasDrawn}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              hasDrawn
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}

// Import useRef at top of file
import { useRef } from "react";