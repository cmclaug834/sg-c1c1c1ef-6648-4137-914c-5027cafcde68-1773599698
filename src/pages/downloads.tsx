import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Download, FileJson, FileText, Database, Activity, Bug, Archive, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { inspectionStorage } from "@/lib/inspectionStorage";
import { exportAsJSON, exportAsPDF, getCompressedInspections } from "@/lib/inspectionExport";
import { exportHealthReport, getHealthReports } from "@/lib/systemHealth";
import { getDebugLogs, copyLogsToClipboard } from "@/lib/diagnostics";
import { storage, archiveStorage } from "@/lib/storage";
import type { Inspection } from "@/types/inspection";

export default function Downloads() {
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspections, setSelectedInspections] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<"json" | "pdf">("json");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = () => {
    const allInspections = inspectionStorage.getInspections();
    setInspections(allInspections);
  };

  const toggleInspection = (id: string) => {
    const newSelected = new Set(selectedInspections);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInspections(newSelected);
  };

  const selectAll = () => {
    setSelectedInspections(new Set(inspections.map(i => i.id)));
  };

  const clearSelection = () => {
    setSelectedInspections(new Set());
  };

  const downloadSelected = () => {
    if (selectedInspections.size === 0) return;
    
    setDownloading(true);
    selectedInspections.forEach(id => {
      const inspection = inspections.find(i => i.id === id);
      if (inspection) {
        if (exportFormat === "json") {
          exportAsJSON(inspection);
        } else {
          exportAsPDF(inspection);
        }
      }
    });
    
    setTimeout(() => {
      setDownloading(false);
      clearSelection();
    }, 1000);
  };

  const downloadHealthReport = () => {
    const reports = getHealthReports();
    if (reports.length > 0) {
      const latest = reports[0];
      const reportText = exportHealthReport(latest);
      const blob = new Blob([reportText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `health-report-${new Date().toISOString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadDebugLogs = async () => {
    const success = await copyLogsToClipboard();
    if (success) {
      alert("Debug logs copied to clipboard!");
    }
  };

  const downloadFullBackup = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      inspections: inspectionStorage.getInspections(),
      tracks: storage.getTracks(),
      archive: archiveStorage.getAll(),
      settings: {
        crew: storage.getActiveCrew(),
        appSettings: localStorage.getItem("appSettings")
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `full-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete": return "text-green-400";
      case "in_progress": return "text-yellow-400";
      default: return "text-zinc-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete": return <CheckCircle2 className="w-4 h-4" />;
      case "in_progress": return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-safe-bottom-nav">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Downloads & Exports</h1>
            <p className="text-zinc-400 text-sm mt-1">Export your data and reports</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          >
            Back
          </Button>
        </div>

        {/* Quick Export Actions */}
        <div className="bg-zinc-800 rounded-xl p-6 mb-6 border border-zinc-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            Quick Exports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={downloadHealthReport}
              className="flex items-center gap-3 p-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">System Health Report</div>
                <div className="text-xs text-zinc-400">Latest diagnostics</div>
              </div>
            </button>

            <button
              onClick={downloadDebugLogs}
              className="flex items-center gap-3 p-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-600/10 flex items-center justify-center">
                <Bug className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Debug Logs</div>
                <div className="text-xs text-zinc-400">Copy to clipboard</div>
              </div>
            </button>

            <button
              onClick={downloadFullBackup}
              className="flex items-center gap-3 p-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Full Data Backup</div>
                <div className="text-xs text-zinc-400">Everything in JSON</div>
              </div>
            </button>

            <button
              onClick={() => {
                const compressed = getCompressedInspections();
                const blob = new Blob([JSON.stringify(compressed, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `compressed-inspections-${new Date().toISOString().split("T")[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-3 p-4 bg-zinc-700/50 hover:bg-zinc-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                <Archive className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Compressed Inspections</div>
                <div className="text-xs text-zinc-400">Optimized storage format</div>
              </div>
            </button>
          </div>
        </div>

        {/* Export Format Selection */}
        <div className="bg-zinc-800 rounded-xl p-6 mb-6 border border-zinc-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            Inspection Exports
          </h2>
          
          {/* Format Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setExportFormat("json")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                exportFormat === "json"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              <FileJson className="w-4 h-4 inline mr-2" />
              JSON
            </button>
            <button
              onClick={() => setExportFormat("pdf")}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                exportFormat === "pdf"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              PDF
            </button>
          </div>

          {/* Selection Actions */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAll}
              className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors text-sm"
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="flex-1 py-2 px-4 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors text-sm"
            >
              Clear
            </button>
            <button
              onClick={downloadSelected}
              disabled={selectedInspections.size === 0 || downloading}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Downloading..." : `Download (${selectedInspections.size})`}
            </button>
          </div>

          {/* Inspections List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {inspections.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No inspections available</p>
              </div>
            ) : (
              inspections.map(inspection => (
                <button
                  key={inspection.id}
                  onClick={() => toggleInspection(inspection.id)}
                  className={`w-full p-4 rounded-lg transition-colors text-left ${
                    selectedInspections.has(inspection.id)
                      ? "bg-blue-600/20 border-2 border-blue-600"
                      : "bg-zinc-700/50 hover:bg-zinc-700 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${getStatusColor(inspection.status)} flex items-center gap-1`}>
                          {getStatusIcon(inspection.status)}
                          <span className="text-xs font-medium capitalize">
                            {inspection.status.replace("_", " ")}
                          </span>
                        </span>
                      </div>
                      <div className="font-medium truncate">{inspection.site || "Unnamed Site"}</div>
                      <div className="text-sm text-zinc-400 mt-1">
                        {(inspection.houseCode || inspection.houseNumber) && <span className="mr-3">House: {inspection.houseCode || inspection.houseNumber}</span>}
                        {(inspection.carNumber || inspection.vehicleId) && <span>Vehicle: {inspection.carNumber || inspection.vehicleId}</span>}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(inspection.createdAt || inspection.dateTime || new Date().toISOString()).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedInspections.has(inspection.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-zinc-600"
                    }`}>
                      {selectedInspections.has(inspection.id) && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-zinc-300">
              <p className="font-medium mb-1">Export Tips</p>
              <ul className="text-xs text-zinc-400 space-y-1">
                <li>• <strong>JSON</strong> - Raw data format, great for backups and data transfer</li>
                <li>• <strong>PDF</strong> - Printable reports with signatures and photos</li>
                <li>• <strong>Full Backup</strong> - Includes all inspections, tracks, and settings</li>
                <li>• Downloads are saved to your browser's default download folder</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}