import { useRouter } from "next/router";
import { ArrowLeft, Edit, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { Inspection } from "@/types/inspection";
import { useApp } from "@/contexts/AppContext";

export default function InspectionPage2() {
  const router = useRouter();
  const { id, scrollY } = router.query;
  const { currentUser } = useApp();
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoadBalanced, setIsLoadBalanced] = useState<"yes" | "no" | undefined>(undefined);
  const [loadNo, setLoadNo] = useState("");
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
        setIsLoadBalanced(loaded.isLoadBalanced);
        setLoadNo(loaded.loadNo || "");
      }
    }
  }, [mounted, id, currentUser, router]);

  // Scroll restoration
  useEffect(() => {
    if (!mounted || !scrollY) return;
    const scrollPos = Number(scrollY);
    if (!isNaN(scrollPos)) {
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
        // Clean up query param
        router.replace(`/inspection/${id}/page/2`, undefined, { shallow: true });
      }, 100);
    }
  }, [mounted, scrollY, id, router]);

  if (!mounted || !currentUser || !inspection) {
    return null;
  }

  const handleLoadNoChange = (value: string) => {
    setLoadNo(value);
    inspectionStorage.updateInspection(inspection.id, {
      loadNo: value,
    });
  };

  const handleLoadBalancedChange = (value: "yes" | "no") => {
    setIsLoadBalanced(value);
    inspectionStorage.updateInspection(inspection.id, {
      isLoadBalanced: value,
    });
  };

  const handleSignature = () => {
    const returnTo = `/inspection/${inspection.id}/page/2`;
    const currentScrollY = window.scrollY;
    router.push(
      `/inspection/${inspection.id}/signature?type=final&returnTo=${encodeURIComponent(returnTo)}&scrollY=${currentScrollY}`
    );
  };

  const handleComplete = () => {
    if (!isLoadBalanced) return;
    if (!loadNo.trim()) return;
    if (!inspection.inspectorSignatures?.final?.signatureDataUrl) return;

    // Mark inspection as complete
    inspectionStorage.updateInspection(inspection.id, {
      status: "complete",
    });

    // Navigate back to inspections list
    router.push("/inspections");
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
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Final Inspection</h1>
              <div className="text-sm text-zinc-400">
                Page 2/2 (Score {score.percentage}% {score.completed}/{score.total})
              </div>
            </div>
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
                onClick={() => handleLoadBalancedChange("yes")}
                className={`py-6 rounded-lg text-lg font-bold transition-colors ${
                  isLoadBalanced === "yes"
                    ? "bg-green-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleLoadBalancedChange("no")}
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

          {/* Action Buttons Row (Stubs) */}
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
          <div className="bg-zinc-800 rounded-lg p-4">
            <p className="text-sm text-zinc-300 mb-3">
              PICTURE(s) of doorway before closing door with railcar number visible
            </p>
            <button
              onClick={() => alert("Media coming soon")}
              className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors"
            >
              ADD MEDIA
            </button>
            <p className="text-xs text-zinc-500 mt-2 text-center">
              Media capture coming soon
            </p>
          </div>

          {/* Load No Field */}
          <div className="bg-zinc-800 rounded-lg p-4">
            <label className="block text-base font-medium mb-3">
              Load No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={loadNo}
              onChange={(e) => handleLoadNoChange(e.target.value)}
              placeholder="Tap here to edit"
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
                {/* Signed Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
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
                    alt="Inspector signature"
                    className="w-full h-32 object-contain"
                  />
                </div>
                <div className="text-sm text-zinc-400">
                  {inspection.inspectorSignatures.final.fullName && (
                    <p>Signed by: {inspection.inspectorSignatures.final.fullName}</p>
                  )}
                </div>
                <button
                  onClick={handleSignature}
                  className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Re-sign
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Required Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center">
                    <span className="text-red-500 text-xs font-bold">!</span>
                  </div>
                  <span className="text-red-500 font-medium">Required</span>
                </div>
                
                <button
                  onClick={handleSignature}
                  className="w-full py-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-5 h-5" />
                  Tap to sign
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Complete Button */}
        <div className="mt-12">
          <button
            onClick={handleComplete}
            disabled={!canComplete}
            className={`w-full py-4 rounded-lg text-lg font-bold transition-colors ${
              canComplete
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            Complete inspection
          </button>
          {!canComplete && (
            <p className="text-center text-sm text-zinc-500 mt-2">
              Complete all required fields, add Load No, and sign to finish
            </p>
          )}
        </div>
      </div>
    </div>
  );
}