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

  const handleNext = () => {
    if (!acceptReject) return;
    if (acceptReject === "no" && !rejectReason) return;

    // Update inspection
    inspectionStorage.updateInspection(inspection.id, {
      acceptReject,
      rejectReason: acceptReject === "no" ? rejectReason : undefined,
      status: "in_progress",
    });

    // Navigate to Page 2
    router.push(`/inspection/${inspection.id}/page/2`);
  };

  const canProceed = acceptReject && (acceptReject === "yes" || rejectReason);

  const getCompletionScore = () => {
    let completed = 0;
    const total = 1;
    
    if (acceptReject) {
      if (acceptReject === "yes" || (acceptReject === "no" && rejectReason)) {
        completed = 1;
      }
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
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Title Page</h1>
              <div className="text-sm text-zinc-400">
                Page 1/2 (Score {score.percentage}% {score.completed}/{score.total})
              </div>
            </div>
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
                onClick={() => {
                  setAcceptReject("yes");
                  setRejectReason("");
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
                onClick={() => setAcceptReject("no")}
                className={`py-6 rounded-lg text-lg font-bold transition-colors ${
                  acceptReject === "no"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                No
              </button>
            </div>

            {/* Reject Reason (shown if No selected) */}
            {acceptReject === "no" && (
              <div>
                <label className="block text-zinc-400 text-sm mb-2">
                  Reason for Reject <span className="text-red-500">*</span>
                </label>
                <button
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

          {/* Action Buttons Row (Stubs) */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {/* Stub */}}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Add note
            </button>
            <button
              onClick={() => {/* Stub */}}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Media
            </button>
            <button
              onClick={() => {/* Stub */}}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              Action
            </button>
            <button
              onClick={() => {/* Stub */}}
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
              onClick={() => {/* Stub */}}
              className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors"
            >
              ADD MEDIA
            </button>
            <p className="text-xs text-zinc-500 mt-2 text-center">
              Media capture coming soon
            </p>
          </div>

        </div>

        {/* Next Button */}
        <div className="mt-12">
          <button
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
        </div>
      </div>

      {/* Reject Reason Selection Sheet */}
      {showRejectSheet && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="bg-zinc-900 rounded-t-3xl w-full max-w-2xl border-t-2 border-zinc-800 p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 flex-shrink-0" />
            <h3 className="text-xl font-bold mb-4">Reason for Reject</h3>
            <div className="space-y-2">
              {REJECT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    setRejectReason(reason);
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