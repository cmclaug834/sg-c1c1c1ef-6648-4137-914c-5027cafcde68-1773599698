import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { 
  ArrowLeft, 
  FolderOpen, 
  Save, 
  HardDrive,
  Database,
  CloudOff,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Zap,
  Shield,
  Activity
} from "lucide-react";
import { 
  backendConfigStorage, 
  BackendConfig,
  validatePath,
  getStorageStats,
  formatBytes,
  createBackup,
  restoreBackup,
  clearTempData
} from "@/lib/backendConfig";

export default function BackendSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [activeSection, setActiveSection] = useState<"storage" | "backup" | "offline" | "system" | "advanced">("storage");
  const [storageStats, setStorageStats] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadConfig();
    loadStorageStats();
  }, []);

  const loadConfig = () => {
    const loaded = backendConfigStorage.getConfig();
    setConfig(loaded);
  };

  const loadStorageStats = () => {
    const stats = getStorageStats();
    setStorageStats(stats);
  };

  const handleSave = () => {
    if (!config) return;
    
    setIsSaving(true);
    setSaveStatus("idle");
    
    try {
      backendConfigStorage.saveConfig(config);
      setSaveStatus("success");
      
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      setSaveStatus("error");
      console.error("Failed to save backend config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const result = await createBackup();
      if (result.success) {
        alert(`Backup created successfully!\nFile: ${result.filename}\nSize: ${formatBytes(result.size)}`);
        loadConfig(); // Reload to show updated last backup date
      } else {
        alert("Backup failed. Please check console for details.");
      }
    } catch (error) {
      alert("Backup failed. Please try again.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreClick = () => {
    if (!confirm("Restore from backup? This will overwrite all current data!")) return;
    fileInputRef.current?.click();
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsRestoring(true);
    try {
      const result = await restoreBackup(file);
      if (result.success) {
        alert(`Restore successful!\n${result.itemsRestored} items restored.`);
        window.location.reload(); // Reload to reflect restored data
      } else {
        alert("Restore failed. Please check the backup file.");
      }
    } catch (error) {
      alert("Restore failed. Please try again.");
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearTemp = () => {
    if (!confirm("Clear temporary data and cache?")) return;
    const cleared = clearTempData();
    alert(`Cleared ${cleared} temporary items.`);
    loadStorageStats();
  };

  const handleResetDefaults = () => {
    if (!confirm("Reset all backend settings to defaults? This cannot be undone!")) return;
    backendConfigStorage.resetToDefaults();
    loadConfig();
    alert("Backend settings reset to defaults.");
  };

  const handleBrowseFolder = (field: keyof BackendConfig) => {
    // In a real Electron/Tauri app, this would open native folder picker
    const path = prompt(`Enter path for ${field}:`, config?.[field] as string || "");
    if (path !== null && config) {
      const validation = validatePath(path);
      if (validation.valid) {
        setConfig({ ...config, [field]: path });
      } else {
        alert(`Invalid path: ${validation.error}`);
      }
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => router.push('/settings')}
              className="p-2 -ml-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Backend & System Settings</h1>
              <p className="text-sm text-zinc-400">Configure local storage, backups, and system behavior</p>
            </div>
          </div>
          
          {/* Save Status Bar */}
          {saveStatus !== "idle" && (
            <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
              saveStatus === "success" 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}>
              {saveStatus === "success" ? (
                <><CheckCircle className="w-4 h-4" /> Settings saved successfully</>
              ) : (
                <><AlertCircle className="w-4 h-4" /> Failed to save settings</>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Navigation */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden sticky top-24">
            <nav className="flex flex-col">
              <button 
                onClick={() => setActiveSection("storage")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${
                  activeSection === "storage" 
                    ? "bg-blue-600/20 text-blue-400 border-l-4 border-blue-500" 
                    : "hover:bg-zinc-800 border-l-4 border-transparent"
                }`}
              >
                <HardDrive className="w-5 h-5" />
                <div>
                  <div className="font-medium">Storage Paths</div>
                  <div className="text-xs text-zinc-500">File system locations</div>
                </div>
              </button>
              
              <button 
                onClick={() => setActiveSection("backup")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${
                  activeSection === "backup" 
                    ? "bg-green-600/20 text-green-400 border-l-4 border-green-500" 
                    : "hover:bg-zinc-800 border-l-4 border-transparent"
                }`}
              >
                <Database className="w-5 h-5" />
                <div>
                  <div className="font-medium">Backup & Restore</div>
                  <div className="text-xs text-zinc-500">Data protection</div>
                </div>
              </button>
              
              <button 
                onClick={() => setActiveSection("offline")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${
                  activeSection === "offline" 
                    ? "bg-orange-600/20 text-orange-400 border-l-4 border-orange-500" 
                    : "hover:bg-zinc-800 border-l-4 border-transparent"
                }`}
              >
                <CloudOff className="w-5 h-5" />
                <div>
                  <div className="font-medium">Offline Mode</div>
                  <div className="text-xs text-zinc-500">Network settings</div>
                </div>
              </button>
              
              <button 
                onClick={() => setActiveSection("system")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${
                  activeSection === "system" 
                    ? "bg-purple-600/20 text-purple-400 border-l-4 border-purple-500" 
                    : "hover:bg-zinc-800 border-l-4 border-transparent"
                }`}
              >
                <Activity className="w-5 h-5" />
                <div>
                  <div className="font-medium">System Health</div>
                  <div className="text-xs text-zinc-500">Performance & diagnostics</div>
                </div>
              </button>
              
              <button 
                onClick={() => setActiveSection("advanced")}
                className={`flex items-center gap-3 p-4 text-left transition-colors ${
                  activeSection === "advanced" 
                    ? "bg-red-600/20 text-red-400 border-l-4 border-red-500" 
                    : "hover:bg-zinc-800 border-l-4 border-transparent"
                }`}
              >
                <Settings className="w-5 h-5" />
                <div>
                  <div className="font-medium">Advanced</div>
                  <div className="text-xs text-zinc-500">Power user options</div>
                </div>
              </button>
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          
          {/* SECTION: Storage Paths */}
          {activeSection === "storage" && (
            <div className="space-y-6">
              {/* Storage Mode */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-400" />
                  Storage Backend
                </h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg cursor-pointer hover:bg-zinc-900 transition-colors">
                    <input
                      type="radio"
                      checked={config.storageMode === "localStorage"}
                      onChange={() => setConfig({ ...config, storageMode: "localStorage" })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-white">Browser Storage (Default)</div>
                      <div className="text-sm text-zinc-500">Store data in browser's localStorage. Works everywhere.</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg cursor-pointer hover:bg-zinc-900 transition-colors">
                    <input
                      type="radio"
                      checked={config.storageMode === "fileSystem"}
                      onChange={() => setConfig({ ...config, storageMode: "fileSystem" })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-white">File System</div>
                      <div className="text-sm text-zinc-500">Store data on local drives. Requires desktop app.</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 bg-zinc-950 rounded-lg cursor-pointer hover:bg-zinc-900 transition-colors">
                    <input
                      type="radio"
                      checked={config.storageMode === "hybrid"}
                      onChange={() => setConfig({ ...config, storageMode: "hybrid" })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-white">Hybrid Mode</div>
                      <div className="text-sm text-zinc-500">Use localStorage + file system for large files.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Directory Paths */}
              {(config.storageMode === "fileSystem" || config.storageMode === "hybrid") && (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Directory Paths</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: "dataDirectory", label: "Data Directory", desc: "Main storage for inspections, tracks, settings" },
                      { key: "mediaDirectory", label: "Media Directory", desc: "Photos, videos, and large files" },
                      { key: "exportDirectory", label: "Export Directory", desc: "PDF reports and JSON exports" },
                      { key: "backupDirectory", label: "Backup Directory", desc: "Automatic backup location" },
                      { key: "tempDirectory", label: "Temp Directory", desc: "Temporary files and cache" },
                    ].map(({ key, label, desc }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={config[key as keyof BackendConfig] as string}
                            onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                            placeholder={`e.g., C:\\RailYard\\${key.replace("Directory", "")}`}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleBrowseFolder(key as keyof BackendConfig)}
                            className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                          >
                            <FolderOpen className="w-4 h-4" />
                            Browse
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION: Backup & Restore */}
          {activeSection === "backup" && (
            <div className="space-y-6">
              {/* Manual Backup/Restore */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-400" />
                  Manual Backup & Restore
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="p-6 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-green-500/50 transition-colors text-left disabled:opacity-50"
                  >
                    <Download className={`w-8 h-8 text-green-400 mb-3 ${isBackingUp ? 'animate-pulse' : ''}`} />
                    <h3 className="font-bold text-white mb-1">Create Backup</h3>
                    <p className="text-sm text-zinc-400">Download complete data backup as JSON file</p>
                    {config.lastBackupDate && (
                      <p className="text-xs text-zinc-600 mt-2">
                        Last: {new Date(config.lastBackupDate).toLocaleString()}
                      </p>
                    )}
                  </button>
                  
                  <button
                    onClick={handleRestoreClick}
                    disabled={isRestoring}
                    className="p-6 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-blue-500/50 transition-colors text-left disabled:opacity-50"
                  >
                    <Upload className={`w-8 h-8 text-blue-400 mb-3 ${isRestoring ? 'animate-pulse' : ''}`} />
                    <h3 className="font-bold text-white mb-1">Restore Backup</h3>
                    <p className="text-sm text-zinc-400">Load data from backup file</p>
                    <p className="text-xs text-orange-400 mt-2">⚠️ Overwrites current data</p>
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </div>

              {/* Auto-Backup Settings */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Automatic Backup</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Enable Auto-Backup</h3>
                      <p className="text-sm text-zinc-500">Create backups automatically on schedule</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={config.autoBackupEnabled}
                        onChange={(e) => setConfig({ ...config, autoBackupEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  
                  {config.autoBackupEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">Backup Frequency</label>
                        <select
                          value={config.autoBackupFrequency}
                          onChange={(e) => setConfig({ ...config, autoBackupFrequency: e.target.value as any })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Retention Period (days)
                        </label>
                        <input
                          type="number"
                          value={config.backupRetentionDays}
                          onChange={(e) => setConfig({ ...config, backupRetentionDays: parseInt(e.target.value) || 30 })}
                          min="1"
                          max="365"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Old backups deleted automatically after this period</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Offline Mode */}
          {activeSection === "offline" && (
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CloudOff className="w-5 h-5 text-orange-400" />
                  Offline Operation
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Force Offline Mode</h3>
                      <p className="text-sm text-zinc-500">Disable all network requests</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={config.offlineMode}
                        onChange={(e) => setConfig({ ...config, offlineMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Auto-Sync on Reconnect</h3>
                      <p className="text-sm text-zinc-500">Upload changes when back online</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={config.syncOnReconnect}
                        onChange={(e) => setConfig({ ...config, syncOnReconnect: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <h4 className="flex items-center gap-2 text-orange-400 font-medium mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Offline Mode Information
                  </h4>
                  <ul className="text-sm text-zinc-400 space-y-1 ml-6 list-disc">
                    <li>All data stored locally only</li>
                    <li>No cloud sync or external API calls</li>
                    <li>Ideal for remote/secure locations</li>
                    <li>Email features require manual export</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: System Health */}
          {activeSection === "system" && (
            <div className="space-y-6">
              {/* Storage Stats */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Storage Statistics
                </h2>
                
                {storageStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-950 rounded-lg">
                        <div className="text-3xl font-bold text-white">{formatBytes(storageStats.totalSize)}</div>
                        <div className="text-sm text-zinc-500">Total Used</div>
                      </div>
                      <div className="p-4 bg-zinc-950 rounded-lg">
                        <div className="text-3xl font-bold text-white">{storageStats.itemCount}</div>
                        <div className="text-sm text-zinc-500">Storage Items</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-white mb-3">Breakdown by Category</h3>
                      <div className="space-y-2">
                        {Object.entries(storageStats.breakdown).map(([category, size]) => (
                          <div key={category} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                            <span className="text-zinc-300 capitalize">{category}</span>
                            <span className="text-zinc-500">{formatBytes(size as number)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-500">Loading statistics...</p>
                )}
              </div>

              {/* Cleanup Tools */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Maintenance</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Auto-Cleanup Temp Files</h3>
                      <p className="text-sm text-zinc-500">Remove temporary data on app close</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={config.autoCleanupEnabled}
                        onChange={(e) => setConfig({ ...config, autoCleanupEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  
                  <button
                    onClick={handleClearTemp}
                    className="w-full p-4 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-red-500/50 transition-colors text-left flex items-center justify-between group"
                  >
                    <div>
                      <h3 className="font-medium text-white group-hover:text-red-400 transition-colors">Clear Temp Data Now</h3>
                      <p className="text-sm text-zinc-500">Remove cache and temporary files</p>
                    </div>
                    <Trash2 className="w-5 h-5 text-zinc-600 group-hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Performance Settings */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Performance
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Enable Data Compression</h3>
                      <p className="text-sm text-zinc-500">Reduce storage size (slower writes)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={config.compressionEnabled}
                        onChange={(e) => setConfig({ ...config, compressionEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Media Quality</label>
                    <select
                      value={config.mediaQuality}
                      onChange={(e) => setConfig({ ...config, mediaQuality: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="original">Original (Best quality)</option>
                      <option value="high">High (Recommended)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="low">Low (Smaller files)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Max Media Size (MB)
                    </label>
                    <input
                      type="number"
                      value={config.maxMediaSize}
                      onChange={(e) => setConfig({ ...config, maxMediaSize: parseInt(e.target.value) || 50 })}
                      min="1"
                      max="500"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Reject files larger than this limit</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: Advanced */}
          {activeSection === "advanced" && (
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Advanced Settings
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Enable Debug Logs</h3>
                      <p className="text-sm text-zinc-500">Detailed logging for troubleshooting</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={config.debugLogsEnabled}
                        onChange={(e) => setConfig({ ...config, debugLogsEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Custom API Endpoint</label>
                    <input
                      type="text"
                      value={config.customAPIEndpoint || ""}
                      onChange={(e) => setConfig({ ...config, customAPIEndpoint: e.target.value })}
                      placeholder="https://api.example.com/v1"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Override default API endpoint (leave empty for default)</p>
                  </div>
                  
                  <div className="border-t border-zinc-800 pt-4">
                    <button
                      onClick={handleResetDefaults}
                      className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-left"
                    >
                      <h3 className="font-medium text-red-400 mb-1">Reset to Defaults</h3>
                      <p className="text-sm text-zinc-500">Restore all backend settings to factory defaults</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="flex items-center gap-2 text-yellow-400 font-medium mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Advanced Settings Warning
                </h4>
                <p className="text-sm text-zinc-400">
                  Changes to advanced settings may affect app stability. Only modify these if you understand the implications.
                </p>
              </div>
            </div>
          )}

          {/* Save Button (Always Visible) */}
          <div className="sticky bottom-4 bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              {saveStatus === "success" && "✓ Saved"}
              {saveStatus === "error" && "✗ Error"}
              {saveStatus === "idle" && "Unsaved changes"}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/settings')}
                className="px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}