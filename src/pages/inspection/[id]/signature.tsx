import { useRouter } from "next/router";
import { ArrowLeft, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { Inspection } from "@/types/inspection";
import { useApp } from "@/contexts/AppContext";

export default function SignaturePage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useApp();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);
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
      }
    }
  }, [mounted, id, currentUser, router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw dotted line
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 60);
    ctx.lineTo(rect.width - 20, rect.height - 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw text
    ctx.fillStyle = "#64748B";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Sign above the dotted line", rect.width / 2, rect.height - 40);
  }, [mounted]);

  if (!mounted || !currentUser || !inspection) {
    return null;
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    // Clear and redraw background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw dotted line
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(20, rect.height - 60);
    ctx.lineTo(rect.width - 20, rect.height - 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Redraw text
    ctx.fillStyle = "#64748B";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Sign above the dotted line", rect.width / 2, rect.height - 40);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL("image/png");

    inspectionStorage.updateInspection(inspection.id, {
      inspectorSignature: {
        fullName: currentUser.crewName,
        signatureDataUrl,
        signedAt: new Date().toISOString(),
      },
    });

    router.back();
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
          <h1 className="text-xl font-bold">Inspector Signature</h1>
          <button
            onClick={saveSignature}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-base font-medium transition-colors"
          >
            SAVE
          </button>
        </div>

        {/* Canvas */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-64 touch-none cursor-crosshair"
            style={{ touchAction: "none" }}
          />
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