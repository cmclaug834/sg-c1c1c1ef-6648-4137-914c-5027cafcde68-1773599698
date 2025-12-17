import { useRouter } from "next/router";
import { ArrowLeft, Trash2, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { inspectionConfigStorage } from "@/lib/inspectionConfig";
import { Inspection, InspectionFormConfig } from "@/types/inspection";
import { useApp } from "@/contexts/AppContext";

export default function InspectionAdmin() {
  const router = useRouter();
  const { currentUser } = useApp();
  
  const [mounted, setMounted] = useState(false);
  const [drafts, setDrafts] = useState<Inspection[]>([]);
  const [config, setConfig] = useState<InspectionFormConfig | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"drafts" | "config">("drafts");

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
  };

  if (!mounted || !currentUser || !config) {
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
    
    // Swap orders
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
        </div>

        {/* Content */}
        {activeTab === "drafts" ? (
          <div className="space-y-6">
            {/* Clear All Button */}
            {drafts.length > 0 && (
              <button
                onClick={() => setShowClearAllDialog(true)}
                className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-base font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Clear ALL Drafts ({drafts.length})
              </button>
            )}

            {/* Draft List */}
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
        ) : (
          <div className="space-y-6">
            {/* Form Builder Controls */}
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
                        {/* Move buttons */}
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

                        {/* Section label */}
                        <div className="flex-1">
                          <div className="text-base font-medium">
                            {section.label}
                          </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex items-center gap-4">
                          {/* Required toggle */}
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

                          {/* Enabled toggle */}
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

            {/* Action Buttons */}
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
    </div>
  );
}