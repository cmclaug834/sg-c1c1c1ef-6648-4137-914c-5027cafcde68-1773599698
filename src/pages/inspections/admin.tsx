import { useRouter } from "next/router";
import { ArrowLeft, Trash2, AlertTriangle, ChevronUp, ChevronDown, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { inspectionConfigStorage } from "@/lib/inspectionConfig";
import { storage, ReferenceData } from "@/lib/storage";
import { Inspection, InspectionFormConfig } from "@/types/inspection";
import { useApp } from "@/contexts/AppContext";

export default function InspectionAdmin() {
  const router = useRouter();
  const { currentUser } = useApp();
  
  const [mounted, setMounted] = useState(false);
  const [drafts, setDrafts] = useState<Inspection[]>([]);
  const [config, setConfig] = useState<InspectionFormConfig | null>(null);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"drafts" | "config" | "reference">("drafts");
  
  // Reference data editing state
  const [newSite, setNewSite] = useState("");
  const [newHouseCode, setNewHouseCode] = useState("");
  const [siteError, setSiteError] = useState("");
  const [houseError, setHouseError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "site" | "house"; value: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (currentUser === null) {
      router.push("/");
      return;
    }
    
    loadData();
  }, [mounted, currentUser, router]);

  const loadData = () => {
    const inspections = inspectionStorage.getInspections();
    const inProgress = inspections.filter(
      i => i.status === "draft" || i.status === "in_progress"
    );
    setDrafts(inProgress);
    setConfig(inspectionConfigStorage.getConfig());
    setReferenceData(storage.getReferenceData());
  };

  if (!mounted || !currentUser || !config || !referenceData) {
    return null;
  }

  const handleDeleteDraft = (id: string) => {
    inspectionStorage.deleteInspection(id);
    loadData();
    setShowDeleteDialog(null);
  };

  const handleClearAll = () => {
    drafts.forEach(draft => {
      inspectionStorage.deleteInspection(draft.id);
    });
    loadData();
    setShowClearAllDialog(false);
  };

  const handleToggleSection = (sectionId: string) => {
    const updatedConfig = {
      ...config,
      sections: config.sections.map(s =>
        s.id === sectionId ? { ...s, enabled: !s.enabled } : s
      ),
    };
    setConfig(updatedConfig);
  };

  const handleToggleRequired = (sectionId: string) => {
    const updatedConfig = {
      ...config,
      sections: config.sections.map(s =>
        s.id === sectionId ? { ...s, required: !s.required } : s
      ),
    };
    setConfig(updatedConfig);
  };

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    const sortedSections = [...config.sections].sort((a, b) => a.order - b.order);
    const index = sortedSections.findIndex(s => s.id === sectionId);
    
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sortedSections.length - 1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    const temp = sortedSections[index].order;
    sortedSections[index].order = sortedSections[newIndex].order;
    sortedSections[newIndex].order = temp;
    
    setConfig({
      ...config,
      sections: sortedSections,
    });
  };

  const handleSaveConfig = () => {
    if (!config) return;
    inspectionConfigStorage.saveConfig(config);
    alert("Form configuration saved");
  };

  const handleResetConfig = () => {
    if (!confirm("Reset form configuration to defaults?")) return;
    const defaultConfig = inspectionConfigStorage.resetToDefault();
    setConfig(defaultConfig);
    alert("Form configuration reset to defaults");
  };

  // Reference data handlers
  const validateSite = (value: string): string | null => {
    const trimmed = value.trim().toUpperCase();
    
    if (!trimmed) {
      return "Site code cannot be empty";
    }
    
    if (!/^[A-Z0-9\s-]+$/.test(trimmed)) {
      return "Site code can only contain letters, numbers, spaces, and hyphens";
    }
    
    if (referenceData.sites.some(s => s.toUpperCase() === trimmed)) {
      return "Site code already exists";
    }
    
    return null;
  };

  const validateHouseCode = (value: string): string | null => {
    const trimmed = value.trim().toUpperCase();
    
    if (!trimmed) {
      return "House code cannot be empty";
    }
    
    if (!/^[A-Z0-9\s-]+$/.test(trimmed)) {
      return "House code can only contain letters, numbers, spaces, and hyphens";
    }
    
    if (referenceData.houseCodes.some(h => h.toUpperCase() === trimmed)) {
      return "House code already exists";
    }
    
    return null;
  };

  const handleAddSite = () => {
    const error = validateSite(newSite);
    if (error) {
      setSiteError(error);
      return;
    }
    
    const trimmed = newSite.trim().toUpperCase();
    const updated: ReferenceData = {
      ...referenceData,
      sites: [...referenceData.sites, trimmed].sort(),
      updatedAt: new Date().toISOString(),
    };
    
    storage.saveReferenceData(updated);
    setReferenceData(updated);
    setNewSite("");
    setSiteError("");
  };

  const handleAddHouseCode = () => {
    const error = validateHouseCode(newHouseCode);
    if (error) {
      setHouseError(error);
      return;
    }
    
    const trimmed = newHouseCode.trim().toUpperCase();
    const updated: ReferenceData = {
      ...referenceData,
      houseCodes: [...referenceData.houseCodes, trimmed].sort(),
      updatedAt: new Date().toISOString(),
    };
    
    storage.saveReferenceData(updated);
    setReferenceData(updated);
    setNewHouseCode("");
    setHouseError("");
  };

  const handleDeleteSite = (site: string) => {
    const updated: ReferenceData = {
      ...referenceData,
      sites: referenceData.sites.filter(s => s !== site),
      updatedAt: new Date().toISOString(),
    };
    
    storage.saveReferenceData(updated);
    setReferenceData(updated);
    setDeleteConfirm(null);
  };

  const handleDeleteHouseCode = (houseCode: string) => {
    const updated: ReferenceData = {
      ...referenceData,
      houseCodes: referenceData.houseCodes.filter(h => h !== houseCode),
      updatedAt: new Date().toISOString(),
    };
    
    storage.saveReferenceData(updated);
    setReferenceData(updated);
    setDeleteConfirm(null);
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

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Inspection Admin</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("drafts")}
            className={`flex-1 py-3 px-4 rounded-lg text-base font-medium transition-colors ${
              activeTab === "drafts"
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Drafts ({drafts.length})
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`flex-1 py-3 px-4 rounded-lg text-base font-medium transition-colors ${
              activeTab === "config"
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Form Config
          </button>
          <button
            onClick={() => setActiveTab("reference")}
            className={`flex-1 py-3 px-4 rounded-lg text-base font-medium transition-colors ${
              activeTab === "reference"
                ? "bg-green-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Reference Lists
          </button>
        </div>

        {/* Content */}
        {activeTab === "drafts" ? (
          <div className="space-y-6">
            {drafts.length > 0 && (
              <button
                onClick={() => setShowClearAllDialog(true)}
                className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Clear ALL Drafts ({drafts.length})
              </button>
            )}

            {drafts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-zinc-400">No drafts or in-progress forms</p>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map(draft => {
                  const houseCode = draft.houseCode || draft.houseNumber || "—";
                  const carNumber = draft.carNumber || draft.vehicleId || "—";
                  const startedAt = draft.startedAt || draft.createdAt;

                  return (
                    <div
                      key={draft.id}
                      className="bg-zinc-800 p-4 rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-lg font-bold mb-1 font-mono">
                            {houseCode} / {carNumber}
                          </div>
                          <div className="text-sm text-zinc-400">
                            Started: {formatTimestamp(startedAt)}
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDeleteDialog(draft.id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "config" ? (
          <div className="space-y-6">
            <div className="bg-zinc-800 p-5 rounded-xl">
              <h2 className="text-lg font-bold mb-4">Form Sections</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Enable/disable sections and mark as required. Disabled sections won't appear in the form.
              </p>

              <div className="space-y-2">
                {config.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <div
                      key={section.id}
                      className="bg-zinc-900 p-4 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveSection(section.id, "up")}
                            disabled={index === 0}
                            className={`p-1 rounded transition-colors ${
                              index === 0
                                ? "text-zinc-700 cursor-not-allowed"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            }`}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveSection(section.id, "down")}
                            disabled={index === config.sections.length - 1}
                            className={`p-1 rounded transition-colors ${
                              index === config.sections.length - 1
                                ? "text-zinc-700 cursor-not-allowed"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1">
                          <div className="text-base font-medium">
                            {section.label}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleToggleRequired(section.id)}
                            disabled={!section.enabled}
                            className={`text-xs px-3 py-1 rounded transition-colors ${
                              !section.enabled
                                ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                                : section.required
                                ? "bg-red-600/20 text-red-400 border border-red-600/50"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                          >
                            {section.required ? "Required" : "Optional"}
                          </button>

                          <button
                            onClick={() => handleToggleSection(section.id)}
                            className={`w-12 h-7 rounded-full transition-colors relative ${
                              section.enabled ? "bg-green-600" : "bg-zinc-700"
                            }`}
                          >
                            <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                              section.enabled ? "translate-x-5" : ""
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleResetConfig}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-base font-medium transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-base font-medium transition-colors"
              >
                Save Config
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Site IDs Card */}
            <div className="bg-zinc-800 p-5 rounded-xl">
              <h2 className="text-lg font-bold mb-4">Site IDs</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Manage the list of site codes available in inspection forms
              </p>

              {/* Add Site Input */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSite}
                    onChange={(e) => {
                      setNewSite(e.target.value);
                      setSiteError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddSite();
                      }
                    }}
                    placeholder="Enter site code..."
                    className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddSite}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Site
                  </button>
                </div>
                {siteError && (
                  <p className="text-red-400 text-sm mt-2">{siteError}</p>
                )}
              </div>

              {/* Site List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {referenceData.sites.length === 0 ? (
                  <p className="text-center text-zinc-500 py-4">No sites configured</p>
                ) : (
                  referenceData.sites.map(site => (
                    <div
                      key={site}
                      className="bg-zinc-900 p-3 rounded-lg flex items-center justify-between"
                    >
                      <span className="font-mono text-lg">{site}</span>
                      <button
                        onClick={() => setDeleteConfirm({ type: "site", value: site })}
                        className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* House Codes Card */}
            <div className="bg-zinc-800 p-5 rounded-xl">
              <h2 className="text-lg font-bold mb-4">House Codes</h2>
              <p className="text-sm text-zinc-400 mb-4">
                Manage the list of house codes available in inspection forms
              </p>

              {/* Add House Code Input */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHouseCode}
                    onChange={(e) => {
                      setNewHouseCode(e.target.value);
                      setHouseError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddHouseCode();
                      }
                    }}
                    placeholder="Enter house code..."
                    className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-lg border-2 border-zinc-700 focus:border-green-500 focus:outline-none"
                  />
                  <button
                    onClick={handleAddHouseCode}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Code
                  </button>
                </div>
                {houseError && (
                  <p className="text-red-400 text-sm mt-2">{houseError}</p>
                )}
              </div>

              {/* House Code List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {referenceData.houseCodes.length === 0 ? (
                  <p className="text-center text-zinc-500 py-4">No house codes configured</p>
                ) : (
                  referenceData.houseCodes.map(code => (
                    <div
                      key={code}
                      className="bg-zinc-900 p-3 rounded-lg flex items-center justify-between"
                    >
                      <span className="font-mono text-lg">{code}</span>
                      <button
                        onClick={() => setDeleteConfirm({ type: "house", value: code })}
                        className="p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Last Updated Info */}
            <div className="text-center text-sm text-zinc-500">
              Last updated: {formatTimestamp(referenceData.updatedAt)}
            </div>
          </div>
        )}
      </div>

      {/* Delete Single Draft Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-4">Delete Draft?</h2>
            <p className="text-zinc-400 text-lg mb-6">
              Are you sure you want to delete this draft inspection? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDraft(showDeleteDialog)}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Dialog */}
      {showClearAllDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold">Clear ALL Drafts?</h2>
            </div>
            <p className="text-zinc-400 text-lg mb-2">
              You are about to delete <span className="font-bold text-white">{drafts.length}</span> draft/in-progress inspections.
            </p>
            <p className="text-red-400 text-base mb-6 font-semibold">
              This action cannot be undone!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearAllDialog(false)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reference Data Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-800 p-6">
            <h2 className="text-2xl font-bold mb-4">
              Remove {deleteConfirm.type === "site" ? "Site" : "House Code"}?
            </h2>
            <p className="text-zinc-400 text-lg mb-2">
              Remove <span className="font-mono font-bold text-white">{deleteConfirm.value}</span> from the list?
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              This won't delete past inspections that used this value.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "site") {
                    handleDeleteSite(deleteConfirm.value);
                  } else {
                    handleDeleteHouseCode(deleteConfirm.value);
                  }
                }}
                className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-lg font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}