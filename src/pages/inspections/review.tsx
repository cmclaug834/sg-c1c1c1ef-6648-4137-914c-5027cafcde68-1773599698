import { useRouter } from "next/router";
import { ArrowLeft, LogOut, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { Inspection } from "@/types/inspection";

// IMPORTANT: This is a placeholder login gate
// Real authentication will replace this in production
const MANAGER_SESSION_KEY = "gp_manager_session_placeholder";

export default function ManagerReview() {
  const router = useRouter();
  const { viewId } = router.query;
  
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pendingReview, setPendingReview] = useState<Inspection[]>([]);
  const [approved, setApproved] = useState<Inspection[]>([]);
  const [viewingInspection, setViewingInspection] = useState<Inspection | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, []);

  useEffect(() => {
    if (mounted && isLoggedIn) {
      loadInspections();
    }
  }, [mounted, isLoggedIn]);

  useEffect(() => {
    if (viewId && typeof viewId === "string" && isLoggedIn) {
      const inspection = inspectionStorage.getInspection(viewId);
      setViewingInspection(inspection);
    }
  }, [viewId, isLoggedIn]);

  const checkSession = () => {
    if (typeof window === "undefined") return;
    const session = localStorage.getItem(MANAGER_SESSION_KEY);
    setIsLoggedIn(session === "true");
  };

  const loadInspections = () => {
    const active = inspectionStorage.getInspections();
    const pending = active.filter(
      i => i.status === "complete" && i.reviewStatus !== "approved"
    );
    setPendingReview(pending);
    
    const approvedList = inspectionStorage.getApprovedInspections();
    setApproved(approvedList);
  };

  if (!mounted) {
    return null;
  }

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) return;
    
    // Placeholder: Accept any credentials
    // TODO: Replace with real authentication
    localStorage.setItem(MANAGER_SESSION_KEY, "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(MANAGER_SESSION_KEY);
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
    router.push("/inspections/review");
  };

  const handleApprove = (id: string) => {
    if (!confirm("Approve this inspection?")) return;
    
    inspectionStorage.approveInspection(id);
    loadInspections();
    setViewingInspection(null);
    router.push("/inspections/review");
  };

  const handleReject = () => {
    if (!viewingInspection) return;
    if (!rejectNote.trim()) {
      alert("Please enter a reason for rejection");
      return;
    }
    
    inspectionStorage.rejectInspection(viewingInspection.id, rejectNote);
    loadInspections();
    setViewingInspection(null);
    setShowRejectDialog(false);
    setRejectNote("");
    router.push("/inspections/review");
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="bg-zinc-800 rounded-2xl p-6">
            <h1 className="text-2xl font-bold mb-2">Manager Review</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Placeholder login gate (real auth will replace this)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-zinc-900 text-white px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={!username.trim() || !password.trim()}
                className={`w-full py-4 rounded-lg text-lg font-bold transition-colors ${
                  username.trim() && password.trim()
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                }`}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review Detail View
  if (viewingInspection) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => {
                setViewingInspection(null);
                router.push("/inspections/review");
              }}
              className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Review Inspection</h1>
          </div>

          {/* Inspection Details */}
          <div className="space-y-4">
            {/* Header Info */}
            <div className="bg-zinc-800 p-5 rounded-xl">
              <div className="text-xl font-bold mb-4 font-mono">
                {viewingInspection.houseCode || viewingInspection.houseNumber || "—"} / {viewingInspection.carNumber || viewingInspection.vehicleId || "—"}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-zinc-400">Site: </span>
                  <span className="font-medium">{viewingInspection.site || viewingInspection.siteConducted || "—"}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Started: </span>
                  <span>{formatTimestamp(viewingInspection.startedAt || viewingInspection.createdAt)}</span>
                </div>
                {viewingInspection.completedAt && (
                  <div>
                    <span className="text-zinc-400">Completed: </span>
                    <span>{formatTimestamp(viewingInspection.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Accept/Reject */}
            <div className="bg-zinc-800 p-5 rounded-xl">
              <h3 className="text-base font-bold mb-3">Accept/Reject Decision</h3>
              <div className="text-lg">
                {viewingInspection.acceptReject === "yes" ? (
                  <span className="text-green-500">✓ Accepted</span>
                ) : viewingInspection.acceptReject === "no" ? (
                  <span className="text-red-500">✗ Rejected</span>
                ) : (
                  <span className="text-zinc-500">Not answered</span>
                )}
              </div>
              {viewingInspection.rejectReason && (
                <div className="mt-2 text-sm text-zinc-400">
                  Reason: {viewingInspection.rejectReason}
                </div>
              )}
            </div>

            {/* Pre-Inspection Signature */}
            {viewingInspection.inspectorSignatures?.initial?.signatureDataUrl && (
              <div className="bg-zinc-800 p-5 rounded-xl">
                <h3 className="text-base font-bold mb-3">Pre-Inspection Signature</h3>
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={viewingInspection.inspectorSignatures.initial.signatureDataUrl}
                    alt="Pre-inspection signature"
                    className="w-full h-32 object-contain"
                  />
                </div>
                {viewingInspection.inspectorSignatures.initial.fullName && (
                  <p className="text-sm text-zinc-400 mt-2">
                    Signed by: {viewingInspection.inspectorSignatures.initial.fullName}
                  </p>
                )}
              </div>
            )}

            {/* Final Questions */}
            <div className="bg-zinc-800 p-5 rounded-xl">
              <h3 className="text-base font-bold mb-3">Final Inspection</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-zinc-400">Load Balanced: </span>
                  <span>
                    {viewingInspection.isLoadBalanced === "yes" ? "Yes" : viewingInspection.isLoadBalanced === "no" ? "No" : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Load Number: </span>
                  <span className="font-mono">{viewingInspection.loadNo || "—"}</span>
                </div>
              </div>
            </div>

            {/* Final Signature */}
            {viewingInspection.inspectorSignatures?.final?.signatureDataUrl && (
              <div className="bg-zinc-800 p-5 rounded-xl">
                <h3 className="text-base font-bold mb-3">Final Signature</h3>
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={viewingInspection.inspectorSignatures.final.signatureDataUrl}
                    alt="Final signature"
                    className="w-full h-32 object-contain"
                  />
                </div>
                {viewingInspection.inspectorSignatures.final.fullName && (
                  <p className="text-sm text-zinc-400 mt-2">
                    Signed by: {viewingInspection.inspectorSignatures.final.fullName}
                  </p>
                )}
              </div>
            )}

            {/* Manager Note (if rejected) */}
            {viewingInspection.managerNote && (
              <div className="bg-red-600/20 border border-red-600/50 p-5 rounded-xl">
                <h3 className="text-base font-bold mb-2 text-red-400">Manager Rejection Note</h3>
                <p className="text-sm">{viewingInspection.managerNote}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setShowRejectDialog(true)}
              className="flex-1 py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
            <button
              onClick={() => handleApprove(viewingInspection.id)}
              className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Approve
            </button>
          </div>
        </div>

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
              <h2 className="text-2xl font-bold mb-4">Reject Inspection</h2>
              <p className="text-zinc-400 text-base mb-4">
                Enter a reason for rejecting this inspection. It will be sent back to in-progress status.
              </p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-red-500 focus:outline-none resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectNote("");
                  }}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectNote.trim()}
                  className={`flex-1 py-4 rounded-lg text-lg font-medium transition-colors ${
                    rejectNote.trim()
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Review Queue List
  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold">Manager Review</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2 text-sm text-zinc-400"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Pending Review Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">
            Pending Review ({pendingReview.length})
          </h2>

          {pendingReview.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800 rounded-xl">
              <p className="text-zinc-400">No inspections pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReview.map(inspection => {
                const houseCode = inspection.houseCode || inspection.houseNumber || "—";
                const carNumber = inspection.carNumber || inspection.vehicleId || "—";
                const site = inspection.site || inspection.siteConducted || "—";
                const completedAt = inspection.completedAt || inspection.updatedAt;

                return (
                  <div key={inspection.id} className="bg-zinc-800 p-5 rounded-xl">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="text-lg font-bold mb-1 font-mono">
                          {houseCode} / {carNumber}
                        </div>
                        <div className="text-sm text-zinc-400 space-y-1">
                          <div>Site: {site}</div>
                          <div>Completed: {formatTimestamp(completedAt)}</div>
                        </div>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                        inspection.reviewStatus === "rejected"
                          ? "bg-red-600/20 text-red-400 border-red-600/50"
                          : "bg-yellow-600/20 text-yellow-500 border-yellow-600/50"
                      }`}>
                        {inspection.reviewStatus === "rejected" ? "Rejected" : "Pending"}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/inspections/review?viewId=${inspection.id}`)}
                      className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-base font-medium transition-colors"
                    >
                      View & Review
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Approved Archive Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            Approved Archive (Local) ({approved.length})
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            Approved inspections are stored locally. Real archiving will be implemented in production.
          </p>

          {approved.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800 rounded-xl">
              <p className="text-zinc-400">No approved inspections yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approved.map(inspection => {
                const houseCode = inspection.houseCode || inspection.houseNumber || "—";
                const carNumber = inspection.carNumber || inspection.vehicleId || "—";
                const site = inspection.site || inspection.siteConducted || "—";
                const updatedAt = inspection.updatedAt;

                return (
                  <div key={inspection.id} className="bg-zinc-800/50 p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-base font-bold mb-1 font-mono">
                          {houseCode} / {carNumber}
                        </div>
                        <div className="text-sm text-zinc-500 space-y-1">
                          <div>Site: {site}</div>
                          <div>Approved: {formatTimestamp(updatedAt)}</div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}