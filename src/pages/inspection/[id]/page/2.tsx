import { useRouter } from "next/router";
import { ArrowLeft, Camera, Video, Images, File } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { Inspection } from "@/types/inspection";
import { useApp } from "@/contexts/AppContext";

export default function InspectionPage2() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useApp();
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoadBalanced, setIsLoadBalanced] = useState<"yes" | "no" | undefined>(undefined);
  const [loadNo, setLoadNo] = useState("");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  const mediaMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close media menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mediaMenuRef.current &&
        !mediaMenuRef.current.contains(event.target as Node)
      ) {
        setShowMediaMenu(false);
      }
    };

    if (showMediaMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMediaMenu]);

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
        setIsLoadBalanced(loaded.isLoadBalanced);
        setLoadNo(loaded.loadNo || "");
      }
    }
  }, [mounted, id, currentUser, router]);

  if (!mounted || !currentUser || !inspection) {
    return null;
  }

  const handleBack = () => {
    // Exit form back to main list
    router.push("/inspections");
  };

  const handleFieldUpdate = (field: string, value: any) => {
    // Update local state
    if (field === "loadNo") {
      setLoadNo(value);
    } else if (field === "isLoadBalanced") {
      setIsLoadBalanced(value);
    }

    // Auto-save with debounce
    inspectionStorage.updateInspectionDebounced(inspection.id, {
      [field]: value,
    });
  };

  const handleComplete = () => {
    if (!isLoadBalanced) return;
    if (!loadNo.trim()) return;

    // Check if signature exists
    if (!inspection.inspectorSignatures?.final?.signatureDataUrl) {
      setShowSignatureModal(true);
      return;
    }

    // Mark as complete and move to archive
    inspectionStorage.archiveCompletedInspection(inspection.id);

    router.push("/inspections");
  };

  const handleAddPhotos = () => {
    setShowMediaMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.multiple = true;
      fileInputRef.current.click();
    }
  };

  const handleTakeVideo = () => {
    setShowMediaMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = "video/*";
      fileInputRef.current.multiple = false;
      fileInputRef.current.click();
    }
  };

  const handleInsertFromGallery = () => {
    setShowMediaMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.multiple = true;
      fileInputRef.current.click();
    }
  };

  const handleAddPDF = () => {
    setShowMediaMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = "application/pdf";
      fileInputRef.current.multiple = true;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    console.log("Files selected:", Array.from(files));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canComplete = 
    isLoadBalanced && 
    loadNo.trim() && 
    inspection.inspectorSignatures?.final?.signatureDataUrl;

  const getCompletionScore = () => {
    let completed = 0;
    const total = 3;
    
    if (isLoadBalanced) completed++;
    if (loadNo.trim()) completed++;
    if (inspection.inspectorSignatures?.final?.signatureDataUrl) completed++;
    
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
              <h1 className="text-xl font-bold">Final Inspection</h1>
              <div className="text-sm text-zinc-400">
                Step 2/4 • {score.percentage}% ({score.completed}/{score.total})
              </div>
            </div>
            <p className="text-zinc-500 text-sm">
              {inspection.carNumber || "No car number"}
            </p>
          </div>
        </div>

        {/* Question Section */}
        <div className="space-y-6">
          
          {/* Load Balanced Question */}
          <div>
            <h2 className="text-base font-medium mb-4">
              Is the load balanced? Is there sufficient space between doorway and load? Is Doorway banding in place
            </h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleFieldUpdate("isLoadBalanced", "yes")}
                className={`py-6 rounded-lg text-lg font-bold transition-colors ${
                  isLoadBalanced === "yes"
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleFieldUpdate("isLoadBalanced", "no")}
                className={`py-6 rounded-lg text-lg font-bold transition-colors ${
                  isLoadBalanced === "no"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => alert("Add note coming soon")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Add note
            </button>
            <button
              onClick={() => alert("Media coming soon")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Media
            </button>
            <button
              onClick={() => alert("Action coming soon")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Action
            </button>
            <button
              onClick={() => alert("History coming soon")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              History
            </button>
          </div>

          {/* Required Photos Section */}
          <div className="bg-zinc-800 rounded-lg p-4 relative" ref={mediaMenuRef}>
            <p className="text-sm text-zinc-300 mb-3">
              PICTURE(s) of doorway before closing door with railcar number visible
            </p>
            <button
              type="button"
              onClick={() => setShowMediaMenu(!showMediaMenu)}
              className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              ADD MEDIA
            </button>

            {/* Media Menu Dropdown */}
            {showMediaMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={handleAddPhotos}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Camera className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Add Photos</div>
                    <div className="text-xs text-zinc-400">Take or select photos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleTakeVideo}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Video className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Take Video</div>
                    <div className="text-xs text-zinc-400">Record up to 3 minutes</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleInsertFromGallery}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Images className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Insert from Gallery</div>
                    <div className="text-xs text-zinc-400">Choose existing photos</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleAddPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-700 transition-colors text-left border-t border-zinc-700"
                >
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <File className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Add PDF Files</div>
                    <div className="text-xs text-zinc-400">Upload document files</div>
                  </div>
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Load No Field */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <label className="block text-base font-medium mb-3">
              Load No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={loadNo}
              onChange={(e) => handleFieldUpdate("loadNo", e.target.value)}
              placeholder="Enter load number"
              className="w-full bg-zinc-900 text-white text-lg px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
            />
            {!loadNo.trim() && (
              <p className="text-xs text-zinc-500 mt-2">
                Required to complete inspection
              </p>
            )}
          </div>

          {/* Final Signature Section */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="text-base font-medium mb-3">
              Inspector Signature (Final) <span className="text-red-500">*</span>
            </h3>
            
            {inspection.inspectorSignatures?.final?.signatureDataUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-green-500 font-medium">Signed</span>
                  {inspection.inspectorSignatures.final.signedAt && (
                    <span className="text-xs text-zinc-500">
                      {new Date(inspection.inspectorSignatures.final.signedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={inspection.inspectorSignatures.final.signatureDataUrl}
                    alt="Final signature"
                    className="w-full h-32 object-contain"
                  />
                </div>
                <div className="text-sm text-zinc-400">
                  {inspection.inspectorSignatures.final.fullName && (
                    <p>Signed by: {inspection.inspectorSignatures.final.fullName}</p>
                  )}
                </div>
                <button
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
                  onClick={() => setShowSignatureModal(true)}
                  className="w-full py-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors"
                >
                  Tap to sign
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Complete Button */}
        <div className="mt-12">
          <div className="flex gap-3">
            <button
              onClick={() => {
                inspectionStorage.updateInspection(inspection.id, { currentStep: 1 });
                router.push(`/inspection/${inspection.id}/page/1`);
              }}
              className="w-1/3 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-bold transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleComplete}
              disabled={!canComplete}
              className={`w-2/3 py-4 rounded-lg text-lg font-bold transition-colors ${
                canComplete
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              Complete
            </button>
          </div>
          {!canComplete && (
            <p className="text-center text-sm text-zinc-500 mt-2">
              {!isLoadBalanced && "Answer load balanced question"}
              {isLoadBalanced && !loadNo.trim() && "Enter load number"}
              {isLoadBalanced && loadNo.trim() && !inspection.inspectorSignatures?.final?.signatureDataUrl && "Add final signature to complete"}
            </p>
          )}
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          inspectionId={inspection.id}
          type="final"
          currentUser={currentUser}
          onClose={() => setShowSignatureModal(false)}
          onSave={() => {
            setShowSignatureModal(false);
            const updated = inspectionStorage.getInspection(inspection.id);
            if (updated) {
              setInspection(updated);
            }
          }}
        />
      )}
    </div>
  );
}

// Embedded Signature Modal Component (same as page 1)
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
      
      // CRITICAL: Load current inspection to preserve all fields
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

      // CRITICAL: Only update signature field, preserve everything else
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