import { useRouter } from "next/router";
import { Search, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { Inspection } from "@/types/inspection";
import { useApp } from "@/contexts/AppContext";

type Tab = "templates" | "inspections";

export default function InspectionsHome() {
  const router = useRouter();
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (currentUser === null) {
      router.push("/");
    }
  }, [mounted, currentUser, router]);

  useEffect(() => {
    if (mounted) {
      const loadedInspections = inspectionStorage.getInspections();
      setInspections(loadedInspections);
    }
  }, [mounted]);

  if (!mounted || !currentUser) {
    return null;
  }

  const inProgressInspections = inspections.filter(
    i => i.status === "draft" || i.status === "in_progress"
  );
  const completeInspections = inspections.filter(i => i.status === "complete");

  const handleStartInspection = () => {
    setShowTemplateSheet(false);
    router.push("/inspection/new");
  };

  const handleInspectionClick = (inspection: Inspection) => {
    if (inspection.status === "complete") {
      // View completed inspection (for now, just go to page 1)
      router.push(`/inspection/${inspection.id}/page/1`);
    } else {
      // Continue draft/in-progress inspection
      router.push(`/inspection/${inspection.id}/page/1`);
    }
  };

  const getStatusIcon = (status: InspectionStatus) => {
    if (status === "complete") {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusText = (status: InspectionStatus) => {
    if (status === "complete") return "Complete";
    if (status === "in_progress") return "In Progress";
    return "Draft";
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Inspections
          </h1>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inspections..."
              className="w-full bg-zinc-800 text-white pl-12 pr-4 py-4 rounded-lg border-2 border-zinc-700 focus:border-zinc-600 focus:outline-none text-base md:text-lg"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 py-3 px-4 rounded-lg text-base font-medium transition-colors ${
              activeTab === "templates"
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab("inspections")}
            className={`flex-1 py-3 px-4 rounded-lg text-base font-medium transition-colors ${
              activeTab === "inspections"
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            In Progress & Complete
          </button>
        </div>

        {/* Content */}
        {activeTab === "templates" ? (
          <div className="space-y-4">
            {/* Bookmarked Template Card */}
            <button
              onClick={() => setShowTemplateSheet(true)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 p-6 rounded-xl text-left transition-colors border-2 border-zinc-700"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">
                    GRANDE PRAIRIE RAIL CAR INSPECTION
                  </h2>
                  <p className="text-zinc-400 text-base mb-2">
                    RAIL CAR INSPECTION FORM
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      Bookmarked Template
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {inProgressInspections.length === 0 && completeInspections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-zinc-400">No inspections yet</p>
                <p className="text-sm text-zinc-500 mt-2">
                  Start an inspection from the Templates tab
                </p>
              </div>
            ) : (
              <>
                {/* In Progress Section */}
                {inProgressInspections.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-400 mb-3">
                      In Progress ({inProgressInspections.length})
                    </h3>
                    <div className="space-y-3">
                      {inProgressInspections.map((inspection) => (
                        <button
                          key={inspection.id}
                          onClick={() => handleInspectionClick(inspection)}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {getStatusIcon(inspection.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-lg font-bold mb-1">
                                Rail Car Inspection
                              </div>
                              <div className="text-zinc-400 text-sm space-y-1">
                                {inspection.vehicleId && (
                                  <div>Vehicle: {inspection.vehicleId}</div>
                                )}
                                {inspection.siteConducted && (
                                  <div>Site: {inspection.siteConducted}</div>
                                )}
                                <div className="text-zinc-500">
                                  Started: {new Date(inspection.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="text-sm text-yellow-500 font-medium">
                                {getStatusText(inspection.status)}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete Section */}
                {completeInspections.length > 0 && (
                  <div className={inProgressInspections.length > 0 ? "mt-8" : ""}>
                    <h3 className="text-lg font-semibold text-zinc-400 mb-3">
                      Complete ({completeInspections.length})
                    </h3>
                    <div className="space-y-3">
                      {completeInspections.map((inspection) => (
                        <button
                          key={inspection.id}
                          onClick={() => handleInspectionClick(inspection)}
                          className="w-full bg-zinc-800 hover:bg-zinc-700 p-5 rounded-xl text-left transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {getStatusIcon(inspection.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-lg font-bold mb-1">
                                Rail Car Inspection
                              </div>
                              <div className="text-zinc-400 text-sm space-y-1">
                                {inspection.vehicleId && (
                                  <div>Vehicle: {inspection.vehicleId}</div>
                                )}
                                {inspection.siteConducted && (
                                  <div>Site: {inspection.siteConducted}</div>
                                )}
                                <div className="text-zinc-500">
                                  Completed: {new Date(inspection.updatedAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <span className="text-sm text-green-500 font-medium">
                                {getStatusText(inspection.status)}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Template Bottom Sheet */}
      {showTemplateSheet && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">
          <div className="bg-zinc-900 rounded-t-3xl w-full max-w-2xl border-t-2 border-zinc-800 p-6 animate-slide-up">
            <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
            
            <h2 className="text-2xl font-bold mb-6">
              GRANDE PRAIRIE RAIL CAR INSPECTION
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleStartInspection}
                className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors"
              >
                Start Inspection
              </button>

              <button
                onClick={() => setShowTemplateSheet(false)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Details
              </button>

              <button
                onClick={() => setShowTemplateSheet(false)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Unbookmark
              </button>

              <button
                onClick={() => setShowTemplateSheet(false)}
                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
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