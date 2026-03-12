/**
 * Backend Configuration Storage
 * Handles file system paths, storage backends, and system settings
 */

export interface BackendConfig {
  // Storage Backend
  storageMode: "localStorage" | "fileSystem" | "hybrid";
  
  // File System Paths
  dataDirectory: string;           // Main data storage (inspections, tracks, etc.)
  mediaDirectory: string;          // Photos, videos, large files
  exportDirectory: string;         // PDF exports, JSON backups
  backupDirectory: string;         // Automatic backups
  tempDirectory: string;           // Temporary files
  
  // Backup Settings
  autoBackupEnabled: boolean;
  autoBackupFrequency: "daily" | "weekly" | "monthly";
  backupRetentionDays: number;     // Keep backups for N days
  lastBackupDate?: string;
  
  // Offline Mode
  offlineMode: boolean;            // Force offline operation
  syncOnReconnect: boolean;        // Auto-sync when online
  
  // System Settings
  maxMediaSize: number;            // MB - reject files larger than this
  autoCleanupEnabled: boolean;     // Clean temp files automatically
  debugLogsEnabled: boolean;       // Detailed logging
  
  // Performance
  compressionEnabled: boolean;     // Compress stored data
  mediaQuality: "original" | "high" | "medium" | "low";
  
  // Advanced
  customAPIEndpoint?: string;      // Override default API
  proxySettings?: {
    enabled: boolean;
    host: string;
    port: number;
  };
}

const DEFAULT_CONFIG: BackendConfig = {
  storageMode: "localStorage",
  dataDirectory: "",
  mediaDirectory: "",
  exportDirectory: "",
  backupDirectory: "",
  tempDirectory: "",
  autoBackupEnabled: false,
  autoBackupFrequency: "weekly",
  backupRetentionDays: 30,
  offlineMode: false,
  syncOnReconnect: true,
  maxMediaSize: 50,
  autoCleanupEnabled: true,
  debugLogsEnabled: false,
  compressionEnabled: true,
  mediaQuality: "high",
};

const CONFIG_KEY = "backend_config_v1";

export const backendConfigStorage = {
  getConfig: (): BackendConfig => {
    if (typeof window === "undefined") return DEFAULT_CONFIG;
    
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error("[BackendConfig] Failed to load config:", error);
    }
    
    return DEFAULT_CONFIG;
  },

  saveConfig: (config: BackendConfig) => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      console.log("[BackendConfig] Configuration saved");
    } catch (error) {
      console.error("[BackendConfig] Failed to save config:", error);
    }
  },

  resetToDefaults: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CONFIG_KEY);
    console.log("[BackendConfig] Reset to defaults");
  },
};

/**
 * Validate directory path
 */
export function validatePath(path: string): { valid: boolean; error?: string } {
  if (!path) return { valid: false, error: "Path cannot be empty" };
  
  // Basic validation (extend for production)
  const invalidChars = /[<>"|?*]/;
  if (invalidChars.test(path)) {
    return { valid: false, error: "Path contains invalid characters" };
  }
  
  return { valid: true };
}

/**
 * Get storage usage statistics
 */
export function getStorageStats() {
  if (typeof window === "undefined") return null;
  
  try {
    let totalSize = 0;
    const breakdown: Record<string, number> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key);
      const size = value ? new Blob([value]).size : 0;
      
      totalSize += size;
      
      // Categorize by key prefix
      const category = key.split("_")[0] || "other";
      breakdown[category] = (breakdown[category] || 0) + size;
    }
    
    return {
      totalSize,
      breakdown,
      itemCount: localStorage.length,
    };
  } catch (error) {
    console.error("[BackendConfig] Failed to calculate storage:", error);
    return null;
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Create backup of all data
 */
export async function createBackup(): Promise<{ success: boolean; size: number; filename: string }> {
  if (typeof window === "undefined") {
    return { success: false, size: 0, filename: "" };
  }
  
  try {
    // Collect all localStorage data
    const backup: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key);
      if (value) {
        try {
          backup[key] = JSON.parse(value);
        } catch {
          backup[key] = value; // Store as string if not JSON
        }
      }
    }
    
    // Add metadata
    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: backup,
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const filename = `backup_${new Date().toISOString().split("T")[0]}_${Date.now()}.json`;
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Update last backup date
    const config = backendConfigStorage.getConfig();
    config.lastBackupDate = new Date().toISOString();
    backendConfigStorage.saveConfig(config);
    
    return { success: true, size: blob.size, filename };
  } catch (error) {
    console.error("[BackendConfig] Backup failed:", error);
    return { success: false, size: 0, filename: "" };
  }
}

/**
 * Restore from backup file
 */
export async function restoreBackup(file: File): Promise<{ success: boolean; itemsRestored: number }> {
  if (typeof window === "undefined") {
    return { success: false, itemsRestored: 0 };
  }
  
  try {
    const text = await file.text();
    const backupData = JSON.parse(text);
    
    if (!backupData.data) {
      throw new Error("Invalid backup format");
    }
    
    let itemsRestored = 0;
    
    for (const [key, value] of Object.entries(backupData.data)) {
      try {
        const stringValue = typeof value === "string" ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        itemsRestored++;
      } catch (error) {
        console.warn(`[BackendConfig] Failed to restore item: ${key}`, error);
      }
    }
    
    return { success: true, itemsRestored };
  } catch (error) {
    console.error("[BackendConfig] Restore failed:", error);
    return { success: false, itemsRestored: 0 };
  }
}

/**
 * Clear temporary files/cache
 */
export function clearTempData(): number {
  if (typeof window === "undefined") return 0;
  
  let itemsCleared = 0;
  const tempKeys: string[] = [];
  
  // Find temporary keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes("temp_") || key.includes("cache_"))) {
      tempKeys.push(key);
    }
  }
  
  // Remove them
  tempKeys.forEach(key => {
    localStorage.removeItem(key);
    itemsCleared++;
  });
  
  console.log(`[BackendConfig] Cleared ${itemsCleared} temporary items`);
  return itemsCleared;
}