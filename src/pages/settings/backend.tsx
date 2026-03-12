import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { 
  ArrowLeft, HardDrive, Database, FolderOpen, Save, 
  AlertCircle, CheckCircle, Wifi, WifiOff, Download, 
  Upload, Trash2, RefreshCw, Zap, Shield, Activity, CloudOff
} from "lucide-react";
import {
  loadBackendConfig,
  saveBackendConfig,
  getStorageUsage,
  testFileSystemAccess,
  runSystemHealthCheck,
  clearTemporaryFiles,
  detectSystemEnvironment,
  canRunAutomatedSetup,
  runAutomatedSetup,
  type BackendConfig,
  type StorageUsageInfo,
  type HealthCheckResult,
  type SystemEnvironment,
  type SetupProgress,
} from "@/lib/backendConfig";

export default function BackendSettings() {
  const router = useRouter();
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [storageUsage, setStorageUsage] = useState<StorageUsageInfo | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Setup state
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupErrors, setSetupErrors] = useState<string[]>([]);
  const [systemEnv, setSystemEnv] = useState<SystemEnvironment | null>(null);
  const [setupCompatibility, setSetupCompatibility] = useState<{ canRun: boolean; reason: string } | null>(null);

  useEffect(() => {
    const loaded = loadBackendConfig();
    setConfig(loaded);
    setStorageUsage(getStorageUsage());

    // Detect system environment on mount
    const env = detectSystemEnvironment();
    setSystemEnv(env);

    const compatibility = canRunAutomatedSetup();
    setSetupCompatibility(compatibility);

    // Show Quick Setup if not completed
    if (!loaded.setupCompleted && compatibility.canRun) {
      setShowQuickSetup(true);
    }
  }, []);

  const handleSave = () => {
    if (!config) return;
    saveBackendConfig(config);
    setSaveMessage("Configuration saved successfully");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleRunHealthCheck = async () => {
    setIsTesting(true);
    const result = await runSystemHealthCheck();
    setHealthCheck(result);
    setIsTesting(false);
  };

  const handleClearTemp = () => {
    const cleared = clearTemporaryFiles();
    setSaveMessage(`Cleared ${cleared} temporary items`);
    setTimeout(() => setSaveMessage(""), 3000);
    setStorageUsage(getStorageUsage());
  };

  const handleExportData = () => {
    // Simulate export
    const data = JSON.stringify({ config, timestamp: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `railyard-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.config) {
          setConfig(imported.config);
          setSaveMessage("Data imported successfully - click Save to apply");
          setTimeout(() => setSaveMessage(""), 4000);
        }
      } catch (error) {
        setSaveMessage("Failed to import data - invalid file format");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleBrowseFolder = (field: "inspections" | "media" | "exports") => {
    // In a real desktop app, this would open native folder picker
    // For now, show alert
    alert(`In a desktop app, this would open a folder picker for: ${field}\n\nFor now, please enter the path manually.`);
  };

  // Quick Setup handlers
  const handleStartQuickSetup = async () => {
    setSetupComplete(false);
    setSetupErrors([]);
    setSetupProgress({ step: 0, totalSteps: 6, currentTask: "Starting...", status: "pending", message: "" });

    const result = await runAutomatedSetup((progress) => {
      setSetupProgress(progress);
    });

    if (result.success) {
      setConfig(result.config);
      setSetupComplete(true);
      setStorageUsage(getStorageUsage());
      setSaveMessage("Quick Setup completed successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } else {
      setSetupErrors(result.errors);
    }
  };

  const handleCloseQuickSetup = () => {
    setShowQuickSetup(false);
    setSetupProgress(null);
  };

  const handleSkipQuickSetup = () => {
    setShowQuickSetup(false);
    // Mark setup as completed (skipped) so it doesn't show again
    if (config) {
      const updatedConfig = { ...config, setupCompleted: true, setupDate: new Date().toISOString() };
      setConfig(updatedConfig);
      saveBackendConfig(updatedConfig);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 text-white">
      {/* Quick Setup Modal */}
      {showQuickSetup && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full p-8 border-2 border-zinc-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Quick Setup Wizard</h2>
                <p className="text-zinc-400">Automatically configure your Rail Yard Tracker</p>
              </div>
            </div>

            {/* System Info */}
            {systemEnv && (
              <div className="bg-zinc-800 rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-400" />
                  System Detected
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-zinc-500">Environment:</span>
                    <span className="ml-2 font-mono">
                      {systemEnv.isDesktopApp ? "Desktop App" : "Web Browser"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Platform:</span>
                    <span className="ml-2 font-mono capitalize">{systemEnv.platform}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-500">Base Directory:</span>
                    <span className="ml-2 font-mono text-xs">{systemEnv.homeDirectory}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Compatibility Check */}
            {setupCompatibility && (
              <div className={`rounded-xl p-4 mb-6 ${
                setupCompatibility.canRun 
                  ? "bg-green-900/20 border-2 border-green-600/50" 
                  : "bg-red-900/20 border-2 border-red-600/50"
              }`}>
                <div className="flex items-start gap-3">
                  {setupCompatibility.canRun ? (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={setupCompatibility.canRun ? "text-green-300" : "text-red-300"}>
                      {setupCompatibility.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What it will do */}
            {!setupProgress && setupCompatibility?.canRun && (
              <div className="bg-zinc-800 rounded-xl p-5 mb-6">
                <h3 className="font-semibold mb-4">This wizard will automatically:</h3>
                <ul className="space-y-3">
                  {[
                    "Detect your operating system and environment",
                    "Create recommended folder structure for data storage",
                    "Set up optimal paths for inspections, media, and exports",
                    "Configure offline mode and auto-sync settings",
                    "Enable automatic weekly backups",
                    "Optimize performance settings for your system",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Progress Display */}
            {setupProgress && (
              <div className="mb-6">
                <div className="bg-zinc-800 rounded-xl p-5">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-400">
                        Step {setupProgress.step} of {setupProgress.totalSteps}
                      </span>
                      <span className="text-sm font-mono text-zinc-500">
                        {Math.round((setupProgress.step / setupProgress.totalSteps) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(setupProgress.step / setupProgress.totalSteps) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-semibold text-lg">{setupProgress.currentTask}</div>
                    <div className="flex items-center gap-2">
                      {setupProgress.status === "running" && (
                        <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                      )}
                      {setupProgress.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {setupProgress.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-sm ${
                        setupProgress.status === "completed" ? "text-green-400" :
                        setupProgress.status === "error" ? "text-red-400" :
                        "text-zinc-400"
                      }`}>
                        {setupProgress.message}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Message */}
            {setupComplete && (
              <div className="bg-green-900/20 border-2 border-green-600/50 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-green-300 mb-2">Setup Complete!</h3>
                    <p className="text-zinc-300 text-sm">
                      Your Rail Yard Tracker is now configured and ready to use. All data will be stored in the configured locations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {setupErrors.length > 0 && (
              <div className="bg-red-900/20 border-2 border-red-600/50 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-red-300 mb-2">Setup Errors</h3>
                    <ul className="space-y-1">
                      {setupErrors.map((error, idx) => (
                        <li key={idx} className="text-sm text-zinc-300">• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!setupProgress && !setupComplete && (
                <>
                  <button
                    onClick={handleSkipQuickSetup}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                  >
                    Skip Setup
                  </button>
                  <button
                    onClick={handleStartQuickSetup}
                    disabled={!setupCompatibility?.canRun}
                    className={`flex-1 py-4 rounded-xl font-medium transition-colors ${
                      setupCompatibility?.canRun
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    Start Quick Setup
                  </button>
                </>
              )}

              {setupProgress && !setupComplete && (
                <button
                  disabled
                  className="flex-1 py-4 bg-zinc-700 rounded-xl font-medium text-zinc-500 cursor-not-allowed"
                >
                  Setup in progress...
                </button>
              )}

              {setupComplete && (
                <button
                  onClick={handleCloseQuickSetup}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-colors"
                >
                  Done
                </button>
              )}
            </div>

            {/* Manual Setup Option */}
            {!setupProgress && !setupComplete && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkipQuickSetup}
                  className="text-sm text-zinc-500 hover:text-zinc-300 underline"
                >
                  I'll configure manually instead
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/settings")}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Backend & System</h1>
                <p className="text-zinc-400 text-sm">Configure local storage, offline mode, and backups</p>
              </div>
            </div>
            
            {/* Save Status / Button */}
            <div className="flex items-center gap-4">
              {saveMessage && (
                <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {saveMessage}
                </span>
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Config
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Quick Setup Re-run Button */}
        {setupCompatibility?.canRun && (
          <button
            onClick={() => setShowQuickSetup(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 p-6 rounded-2xl flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-white mb-1">Quick Setup Wizard</h2>
                <p className="text-blue-100/80">Re-run automated configuration for desktop/server deployment</p>
              </div>
            </div>
            <div className="bg-white/10 p-3 rounded-full group-hover:scale-110 transition-transform">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
          </button>
        )}

        {/* 1. Storage Backend Selection */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Database className="w-6 h-6 text-purple-400" />
              Storage Backend
            </h2>
            <p className="text-zinc-400">Choose where and how the application stores its data.</p>
          </div>
          
          <div className="p-6 grid gap-4">
            {/* LocalStorage Option */}
            <label className={`relative flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-colors ${
              config.storageBackend === 'localStorage' 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
            }`}>
              <input 
                type="radio" 
                name="backend" 
                className="mt-1"
                checked={config.storageBackend === 'localStorage'}
                onChange={() => setConfig({ ...config, storageBackend: 'localStorage' })}
              />
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                  Browser Storage (LocalStorage)
                  <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-300">Default</span>
                </h3>
                <p className="text-zinc-400 text-sm">Data is stored directly in the web browser. Limited capacity (~10MB), perfect for quick deployments or testing. Cleared if browser cache is emptied.</p>
              </div>
            </label>

            {/* File System Option */}
            <label className={`relative flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-colors ${
              config.storageBackend === 'fileSystem' 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
            }`}>
              <input 
                type="radio" 
                name="backend" 
                className="mt-1"
                checked={config.storageBackend === 'fileSystem'}
                onChange={() => setConfig({ ...config, storageBackend: 'fileSystem' })}
              />
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                  File System (Local Drives)
                  {systemEnv?.isDesktopApp && <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Recommended for Desktop</span>}
                </h3>
                <p className="text-zinc-400 text-sm">Store data directly on your hard drive. Unlimited storage capacity, permanent persistence, and direct access to files. Requires desktop app or supported browser.</p>
              </div>
            </label>
          </div>
        </div>

        {/* 2. File System Paths (Only show if File System is selected) */}
        {config.storageBackend === 'fileSystem' && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-700">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                <FolderOpen className="w-6 h-6 text-blue-400" />
                Local Storage Paths
              </h2>
              <p className="text-zinc-400">Configure where files are saved on your local drives.</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Inspections Path */}
              <div>
                <label className="block font-medium mb-2">Inspection Data</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.fileSystemPaths.inspections}
                    onChange={(e) => setConfig({
                      ...config,
                      fileSystemPaths: { ...config.fileSystemPaths, inspections: e.target.value }
                    })}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., C:\RailYard\Inspections\"
                  />
                  <button onClick={() => handleBrowseFolder("inspections")} className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-medium transition-colors">
                    Browse
                  </button>
                </div>
                <p className="text-zinc-500 text-xs mt-2">Stores JSON records of all inspections.</p>
              </div>

              {/* Media Path */}
              <div>
                <label className="block font-medium mb-2">Media Storage (Photos & Signatures)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.fileSystemPaths.media}
                    onChange={(e) => setConfig({
                      ...config,
                      fileSystemPaths: { ...config.fileSystemPaths, media: e.target.value }
                    })}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., D:\RailYard\Media\"
                  />
                  <button onClick={() => handleBrowseFolder("media")} className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-medium transition-colors">
                    Browse
                  </button>
                </div>
                <p className="text-zinc-500 text-xs mt-2">Recommended: Use a separate or external drive for large media files.</p>
              </div>

              {/* Exports Path */}
              <div>
                <label className="block font-medium mb-2">Export & Report Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.fileSystemPaths.exports}
                    onChange={(e) => setConfig({
                      ...config,
                      fileSystemPaths: { ...config.fileSystemPaths, exports: e.target.value }
                    })}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 font-mono text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="e.g., C:\Users\Admin\Documents\Reports\"
                  />
                  <button onClick={() => handleBrowseFolder("exports")} className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-medium transition-colors">
                    Browse
                  </button>
                </div>
                <p className="text-zinc-500 text-xs mt-2">Where PDF reports and CSV exports are saved automatically.</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Offline Mode & Sync */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <CloudOff className="w-6 h-6 text-emerald-400" />
              Offline Mode & Sync
            </h2>
            <p className="text-zinc-400">Configure how the app behaves without internet connection.</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Master Toggle */}
            <label className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-zinc-700 cursor-pointer hover:bg-zinc-700/50 transition-colors">
              <div>
                <div className="font-bold text-lg">Enable Offline Mode</div>
                <div className="text-zinc-400 text-sm">App will continue working seamlessly without internet access</div>
              </div>
              <div className={`w-14 h-8 rounded-full transition-colors relative ${config.offlineMode.enabled ? 'bg-emerald-500' : 'bg-zinc-600'}`}>
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${config.offlineMode.enabled ? 'translate-x-6' : ''}`} />
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={config.offlineMode.enabled}
                onChange={(e) => setConfig({
                  ...config,
                  offlineMode: { ...config.offlineMode, enabled: e.target.checked }
                })}
              />
            </label>

            {config.offlineMode.enabled && (
              <div className="grid md:grid-cols-2 gap-6 pt-2">
                {/* Sync Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-zinc-300 border-b border-zinc-700 pb-2">Sync Behavior</h3>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 bg-zinc-800"
                      checked={config.offlineMode.autoSync}
                      onChange={(e) => setConfig({
                        ...config,
                        offlineMode: { ...config.offlineMode, autoSync: e.target.checked }
                      })}
                    />
                    <span>Auto-sync when reconnected</span>
                  </label>

                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Sync Interval (minutes)</label>
                    <input 
                      type="number" 
                      min="1" max="1440"
                      value={config.offlineMode.syncInterval}
                      onChange={(e) => setConfig({
                        ...config,
                        offlineMode: { ...config.offlineMode, syncInterval: parseInt(e.target.value) || 15 }
                      })}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 w-full focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Data to Sync */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-zinc-300 border-b border-zinc-700 pb-2">Data to Keep Offline</h3>
                  
                  {[
                    { id: 'inspectionsDrafts', label: 'Inspection Drafts' },
                    { id: 'inspectionsCompleted', label: 'Completed Inspections' },
                    { id: 'trackData', label: 'Track & Yard Data' },
                    { id: 'mediaFiles', label: 'Media Files (Photos)' },
                  ].map(item => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 bg-zinc-800"
                        checked={config.offlineMode.syncData[item.id as keyof typeof config.offlineMode.syncData]}
                        onChange={(e) => setConfig({
                          ...config,
                          offlineMode: {
                            ...config.offlineMode,
                            syncData: {
                              ...config.offlineMode.syncData,
                              [item.id]: e.target.checked
                            }
                          }
                        })}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Import / Export / Backup */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Download className="w-6 h-6 text-orange-400" />
              Backup & Recovery
            </h2>
            <p className="text-zinc-400">Safeguard your data and migrate between devices.</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Auto Backup */}
            <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-700/50">
              <label className="flex items-center justify-between cursor-pointer mb-4">
                <div className="font-bold text-lg">Enable Automated Backups</div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${config.backup.enabled ? 'bg-orange-500' : 'bg-zinc-600'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${config.backup.enabled ? 'translate-x-6' : ''}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={config.backup.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    backup: { ...config.backup, enabled: e.target.checked }
                  })}
                />
              </label>

              {config.backup.enabled && (
                <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-700/50">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Frequency</label>
                    <select 
                      value={config.backup.frequency}
                      onChange={(e) => setConfig({
                        ...config,
                        backup: { ...config.backup, frequency: e.target.value as any }
                      })}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 w-full focus:border-orange-500 focus:outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Retention (Keep last X)</label>
                    <input 
                      type="number" min="1" max="90"
                      value={config.backup.retention}
                      onChange={(e) => setConfig({
                        ...config,
                        backup: { ...config.backup, retention: parseInt(e.target.value) || 4 }
                      })}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 w-full focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-zinc-400 mb-1">Backup Location</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={config.backup.location}
                        onChange={(e) => setConfig({
                          ...config,
                          backup: { ...config.backup, location: e.target.value }
                        })}
                        placeholder="e.g., D:\Backups\RailYard\"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 font-mono text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <button onClick={() => handleBrowseFolder("exports")} className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg font-medium">Browse</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button 
                onClick={handleExportData}
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-4 rounded-xl font-medium transition-colors"
              >
                <Download className="w-5 h-5 text-orange-400" />
                Export Full Backup
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 p-4 rounded-xl font-medium transition-colors"
              >
                <Upload className="w-5 h-5 text-blue-400" />
                Import Backup
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleImportData}
              />
            </div>
          </div>
        </div>

        {/* 5. System Diagnostics */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-700">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Activity className="w-6 h-6 text-red-400" />
              System Diagnostics
            </h2>
            <p className="text-zinc-400">Monitor storage usage and system health.</p>
          </div>
          
          <div className="p-6 grid md:grid-cols-2 gap-6">
            {/* Storage Usage */}
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                Storage Usage
                <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                  {storageUsage ? `${(storageUsage.total / (1024*1024)).toFixed(1)} MB` : 'Calculating...'}
                </span>
              </h3>
              
              {storageUsage && (
                <div className="space-y-4">
                  <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="bg-blue-500 h-full" style={{ width: `${(storageUsage.inspections / storageUsage.limit) * 100}%` }} title="Inspections" />
                    <div className="bg-purple-500 h-full" style={{ width: `${(storageUsage.media / storageUsage.limit) * 100}%` }} title="Media" />
                    <div className="bg-green-500 h-full" style={{ width: `${(storageUsage.trackData / storageUsage.limit) * 100}%` }} title="Tracks" />
                    <div className="bg-zinc-500 h-full" style={{ width: `${(storageUsage.cached / storageUsage.limit) * 100}%` }} title="Cache" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"/> Inspections</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"/> Media Files</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"/> Track Data</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-zinc-500"/> Cache</div>
                  </div>
                </div>
              )}
            </div>

            {/* Health Check */}
            <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
              <h3 className="font-bold mb-4 flex items-center justify-between">
                Health Status
                <button 
                  onClick={handleRunHealthCheck}
                  disabled={isTesting}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  {isTesting ? "Testing..." : "Run Test"}
                </button>
              </h3>
              
              {healthCheck ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Storage Access</span>
                    {healthCheck.storageAccessible ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Write Permissions</span>
                    {healthCheck.writePermissions ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Network Connection</span>
                    {healthCheck.networkConnected ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Disk Space</span>
                    {healthCheck.diskSpaceOK ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-500 py-6 text-sm">
                  Click 'Run Test' to verify system health
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <button 
                onClick={handleClearTemp}
                className="w-full flex items-center justify-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 p-4 rounded-xl font-medium transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Clear Temporary Cache
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}