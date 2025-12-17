import { useRouter } from "next/router";
import { ArrowLeft, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { Inspection } from "@/types/inspection";
import { useApp } from "@/contexts/AppContext";

export default function SignaturePage() {
  const router = useRouter();
  const { id, type, returnTo, scrollY } = router.query;
  const { currentUser } = useApp();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [mounted, setMounted] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const signatureType = (type as string) || "final";
  const isInitialSignature = signatureType === "initial";

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
      }
    }
  }, [mounted, id, currentUser, router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mounted) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // White background only - no lines or text
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Reset path state to prevent stray lines
    ctx.beginPath();
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Please log in first</p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading inspection...</p>
        </div>
      </div>
    );
  }

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    // Start a new path - this prevents connecting to any previous points
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);

    // Set drawing style
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // Draw line to current position
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(false);
    
    // Close the current path to prepare for next stroke
    ctx.closePath();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reset drawing state
    setIsDrawing(false);
    setHasDrawn(false);
    
    // Start fresh path state to prevent stray lines
    ctx.beginPath();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Validate signature was drawn
    if (!hasDrawn) {
      alert("Please sign before saving");
      return;
    }

    const signatureDataUrl = canvas.toDataURL("image/png");

    // Prepare signature data
    const signatureData = {
      fullName: currentUser.crewName,
      signatureDataUrl,
      signedAt: new Date().toISOString(),
    };

    // Save to correct location based on type
    if (isInitialSignature) {
      inspectionStorage.updateInspection(inspection.id, {
        inspectorSignatures: {
          ...inspection.inspectorSignatures,
          initial: signatureData,
        },
      });
    } else {
      inspectionStorage.updateInspection(inspection.id, {
        inspectorSignatures: {
          ...inspection.inspectorSignatures,
          final: signatureData,
        },
      });
    }

    // Navigate back to the return route with scroll restoration
    if (returnTo && typeof returnTo === "string") {
      const returnUrl = scrollY 
        ? `${returnTo}${returnTo.includes("?") ? "&" : "?"}scrollY=${scrollY}`
        : returnTo;
      router.push(returnUrl);
    } else {
      // Fallback: go back
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">
            {isInitialSignature ? "Inspector Signature (Initial)" : "Inspector Signature"}
          </h1>
          <button
            onClick={saveSignature}
            disabled={!hasDrawn}
            className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
              hasDrawn
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            SAVE
          </button>
        </div>

        {/* Canvas Container with Overlay */}
        <div className="bg-white rounded-lg p-4 mb-6 relative">
          <div className="relative w-full h-64">
            {/* Signature Canvas */}
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
            
            {/* Baseline Overlay (HTML - not drawn on canvas) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-12 left-5 right-5 border-t-2 border-dashed border-slate-300" />
              <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-slate-500">
                Sign above the dotted line
              </div>
            </div>
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearSignature}
          className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          CLEAR SIGNATURE
        </button>
      </div>
    </div>
  );
}